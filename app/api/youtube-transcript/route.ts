import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import { Innertube, ClientType } from 'youtubei.js';
import { YoutubeTranscript } from 'youtube-transcript';
import {
  extractYouTubeVideoId,
  type CaptionLanguageOption,
  type TranscriptSegment,
} from '@/lib/youtube-transcript';

export const dynamic = 'force-dynamic';

const ANDROID_TIMEDTEXT_UA =
  'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip';

interface ParsedProxy {
  host: string;
  port: number;
  authHeader?: string;
}

function parseProxyLine(raw: string): ParsedProxy | null {
  const entry = raw.trim();
  if (!entry || entry.startsWith('#')) return null;

  if (/^https?:\/\//i.test(entry)) {
    try {
      const u = new URL(entry);
      const authHeader =
        u.username || u.password
          ? `Basic ${Buffer.from(
              `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`
            ).toString('base64')}`
          : undefined;
      return {
        host: u.hostname,
        port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80),
        authHeader,
      };
    } catch {
      return null;
    }
  }

  const parts = entry.split(':');
  if (parts.length === 4) {
    const [host, portStr, user, pass] = parts;
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) return null;
    return {
      host,
      port,
      authHeader: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
    };
  }

  if (parts.length === 2) {
    const [host, portStr] = parts;
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) return null;
    return { host, port };
  }

  return null;
}

function loadProxyPool(): ParsedProxy[] {
  const pool: ParsedProxy[] = [];
  const envProxy = process.env.YOUTUBE_PROXY_URL?.trim();
  if (envProxy) {
    const parsed = parseProxyLine(envProxy);
    if (parsed) pool.push(parsed);
  }

  const candidatePaths = [
    process.env.YTDLP_YOUTUBE_PROXY_FILE?.trim(),
    path.join(process.cwd(), 'ytdlp-backend', 'youtube_proxies.txt'),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const parsed = parseProxyLine(line);
          if (parsed) pool.push(parsed);
        }
        if (pool.length > 0) break;
      }
    } catch {
      // Ignore unreadable proxy files
    }
  }

  return pool;
}

function createProxiedFetch(proxy: ParsedProxy): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
    const u = new URL(urlStr);

    const method =
      init?.method ||
      (typeof input !== 'string' && !(input instanceof URL) && input.method) ||
      'GET';

    const headers: Record<string, string> = {};
    const mergeHeaders = (src?: HeadersInit) => {
      if (!src) return;
      if (src instanceof Headers) {
        src.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(src)) {
        for (const [k, v] of src) headers[k] = v;
      } else {
        Object.assign(headers, src);
      }
    };

    if (typeof input !== 'string' && !(input instanceof URL)) {
      mergeHeaders(input.headers);
    }
    mergeHeaders(init?.headers);

    let bodyBuf: Buffer | null = null;
    if (init?.body != null) {
      if (typeof init.body === 'string') {
        bodyBuf = Buffer.from(init.body, 'utf8');
      } else if (init.body instanceof Uint8Array || Buffer.isBuffer(init.body)) {
        bodyBuf = Buffer.from(init.body);
      } else if (init.body instanceof ArrayBuffer) {
        bodyBuf = Buffer.from(init.body);
      } else {
        bodyBuf = Buffer.from(String(init.body), 'utf8');
      }
      headers['Content-Length'] = String(bodyBuf.length);
    }

    return new Promise<Response>((resolve, reject) => {
      const targetPort = u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80;
      const connectHeaders: Record<string, string> = {
        Host: `${u.hostname}:${targetPort}`,
      };
      if (proxy.authHeader) {
        connectHeaders['Proxy-Authorization'] = proxy.authHeader;
      }

      const connectReq = http.request({
        host: proxy.host,
        port: proxy.port,
        method: 'CONNECT',
        path: `${u.hostname}:${targetPort}`,
        headers: connectHeaders,
        timeout: 9000,
      });

      connectReq.on('timeout', () => {
        connectReq.destroy(new Error('Proxy CONNECT timeout'));
      });

      connectReq.on('connect', (res, socket) => {
        if (res.statusCode !== 200) {
          socket.destroy();
          reject(new Error(`Proxy CONNECT failed with HTTP ${res.statusCode}`));
          return;
        }

        const reqOptions: https.RequestOptions = {
          hostname: u.hostname,
          port: targetPort,
          path: `${u.pathname}${u.search}`,
          method,
          headers,
          timeout: 10000,
        };

        if (u.protocol === 'https:') {
          reqOptions.createConnection = () =>
            tls.connect({ socket, servername: u.hostname });
        } else {
          reqOptions.createConnection = () => socket;
        }

        const transport = u.protocol === 'https:' ? https : http;
        const req = transport.request(reqOptions, (resp) => {
          const chunks: Buffer[] = [];
          resp.on('data', (chunk: Buffer) => chunks.push(chunk));
          resp.on('end', () => {
            const buf = Buffer.concat(chunks);
            const respHeaders = new Headers();
            for (const [k, v] of Object.entries(resp.headers)) {
              if (typeof v === 'string') respHeaders.set(k, v);
              else if (Array.isArray(v)) respHeaders.set(k, v.join(', '));
            }
            resolve(
              new Response(buf, {
                status: resp.statusCode || 200,
                headers: respHeaders,
              })
            );
          });
        });

        req.on('timeout', () => req.destroy(new Error('Proxied request timeout')));
        req.on('error', reject);
        if (bodyBuf) req.write(bodyBuf);
        req.end();
      });

      connectReq.on('error', reject);
      connectReq.end();
    });
  };
}

const globalCache = globalThis as typeof globalThis & {
  __ytDirectAndroid?: Innertube;
  __ytProxyAndroid?: { key: string; client: Innertube };
  __ytProxyCursor?: number;
  __ytSkipDirectUntil?: number;
};

async function getDirectAndroidInnertube(): Promise<Innertube> {
  if (!globalCache.__ytDirectAndroid) {
    globalCache.__ytDirectAndroid = await Innertube.create({
      client_type: ClientType.ANDROID,
      generate_session_locally: true,
      retrieve_player: false,
    });
  }
  return globalCache.__ytDirectAndroid;
}

async function getProxiedAndroidInnertube(
  proxy: ParsedProxy,
  customFetch: typeof fetch
): Promise<Innertube> {
  const key = `${proxy.host}:${proxy.port}`;
  if (globalCache.__ytProxyAndroid?.key === key) {
    return globalCache.__ytProxyAndroid.client;
  }
  const client = await Innertube.create({
    client_type: ClientType.ANDROID,
    generate_session_locally: true,
    retrieve_player: false,
    fetch: customFetch,
  });
  globalCache.__ytProxyAndroid = { key, client };
  return client;
}

interface RawJson3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseJson3Transcript(payload: { events?: RawJson3Event[] }): TranscriptSegment[] {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const rawSegments: TranscriptSegment[] = [];

  for (const ev of events) {
    if (!Array.isArray(ev.segs) || ev.segs.length === 0) continue;
    const rawText = ev.segs.map((s) => s.utf8 || '').join('');
    const cleaned = decodeHtmlEntities(rawText)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;
    const startMs = Math.max(0, Number(ev.tStartMs) || 0);
    const durationMs = Math.max(400, Number(ev.dDurationMs) || 2500);
    rawSegments.push({
      index: rawSegments.length + 1,
      startMs,
      durationMs,
      endMs: startMs + durationMs,
      text: cleaned,
    });
  }

  return rawSegments;
}

function parseXmlTranscript(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const regex = /<text\s+start="([^"]+)"(?:\s+dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const startMs = Math.max(0, Math.round(parseFloat(match[1]) * 1000));
    const durationMs = Math.max(400, Math.round((parseFloat(match[2] || '2.5') || 2.5) * 1000));
    const cleaned = decodeHtmlEntities(match[3].replace(/<[^>]+>/g, ''))
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) continue;
    segments.push({
      index: segments.length + 1,
      startMs,
      durationMs,
      endMs: startMs + durationMs,
      text: cleaned,
    });
  }

  return segments;
}

async function fetchOembedMetadata(videoId: string): Promise<{
  title?: string;
  author?: string;
  thumbnail?: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
    };
  } catch {
    return {};
  }
}

interface CaptionTrackLike {
  base_url?: string;
  language_code?: string;
  kind?: string;
  name?: { text?: string; toString?: () => string };
}

function pickCaptionTrack(
  tracks: CaptionTrackLike[],
  requestedLang?: string
): CaptionTrackLike | undefined {
  if (!tracks.length) return undefined;
  if (requestedLang) {
    const exactManual = tracks.find(
      (t) => t.language_code === requestedLang && t.kind !== 'asr'
    );
    if (exactManual) return exactManual;
    const exactAny = tracks.find((t) => t.language_code === requestedLang);
    if (exactAny) return exactAny;
  }
  return (
    tracks.find((t) => t.language_code === 'en' && t.kind !== 'asr') ||
    tracks.find((t) => t.language_code === 'en') ||
    tracks.find((t) => t.language_code?.startsWith('en')) ||
    tracks.find((t) => t.kind !== 'asr') ||
    tracks[0]
  );
}

async function extractWithInnertubeClient(
  yt: Innertube,
  videoId: string,
  requestedLang?: string,
  transportFetch: typeof fetch = fetch
) {
  const info = await yt.getBasicInfo(videoId);
  const tracks = (info.captions?.caption_tracks || []) as CaptionTrackLike[];

  if (!tracks.length) {
    return {
      title: info.basic_info?.title,
      author: info.basic_info?.author,
      durationSeconds: Number(info.basic_info?.duration) || 0,
      thumbnail: info.basic_info?.thumbnail?.[0]?.url,
      tracks: [] as CaptionTrackLike[],
      segments: [] as TranscriptSegment[],
      selectedTrack: undefined,
    };
  }

  const selectedTrack = pickCaptionTrack(tracks, requestedLang);
  if (!selectedTrack?.base_url) {
    throw new Error('Selected caption track has no timedtext URL.');
  }

  const timedtextUrl = new URL(selectedTrack.base_url);
  timedtextUrl.searchParams.set('fmt', 'json3');

  const ttRes = await transportFetch(timedtextUrl.toString(), {
    headers: {
      'User-Agent': ANDROID_TIMEDTEXT_UA,
    },
    cache: 'no-store',
  });

  const bodyText = await ttRes.text();
  let segments: TranscriptSegment[] = [];

  if (bodyText.trim().startsWith('{')) {
    segments = parseJson3Transcript(JSON.parse(bodyText));
  } else if (bodyText.includes('<text')) {
    segments = parseXmlTranscript(bodyText);
  }

  return {
    title: info.basic_info?.title,
    author: info.basic_info?.author,
    durationSeconds: Number(info.basic_info?.duration) || 0,
    thumbnail: info.basic_info?.thumbnail?.[0]?.url,
    tracks,
    segments,
    selectedTrack,
  };
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();

  try {
    const body = await req.json().catch(() => null);
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const requestedLang =
      typeof body?.lang === 'string' && body.lang.trim() ? body.lang.trim() : undefined;

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'Please paste a valid YouTube video URL.' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid YouTube URL. Please enter a valid youtube.com/watch, youtu.be, or Shorts link.',
        },
        { status: 400 }
      );
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let extracted: Awaited<ReturnType<typeof extractWithInnertubeClient>> | null = null;
    let engineUsed = 'youtubei.js (InnerTube API)';

    const proxies = loadProxyPool();
    const shouldTryDirect =
      proxies.length === 0 ||
      !globalCache.__ytSkipDirectUntil ||
      Date.now() > globalCache.__ytSkipDirectUntil;

    // 1. Fast direct InnerTube attempt (instant when IP is not datacenter-throttled)
    if (shouldTryDirect) {
      try {
        const directYt = await getDirectAndroidInnertube();
        const res = await extractWithInnertubeClient(directYt, videoId, requestedLang, fetch);
        if (res.segments.length > 0) {
          extracted = res;
        }
      } catch {
        // Proceed to fallbacks
      }
    }

    // 2. Fallback to open-source youtube-transcript direct scraper if InnerTube direct returned empty
    if (!extracted && shouldTryDirect) {
      try {
        const ytItems = await YoutubeTranscript.fetchTranscript(
          videoId,
          requestedLang ? { lang: requestedLang } : undefined
        );
        if (Array.isArray(ytItems) && ytItems.length > 0) {
          const segments: TranscriptSegment[] = ytItems.map((item, idx) => {
            const startMs = Math.max(0, Math.round(item.offset * 1000));
            const durationMs = Math.max(400, Math.round((item.duration || 2.5) * 1000));
            return {
              index: idx + 1,
              startMs,
              durationMs,
              endMs: startMs + durationMs,
              text: decodeHtmlEntities(item.text)
                .replace(/\r?\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
            };
          });
          if (segments.length > 0) {
            const oembed = await fetchOembedMetadata(videoId);
            engineUsed = 'youtube-transcript (TimedText API)';
            extracted = {
              title: oembed.title,
              author: oembed.author,
              durationSeconds: Math.ceil(
                (segments[segments.length - 1]?.endMs || 0) / 1000
              ),
              thumbnail: oembed.thumbnail,
              tracks: [
                {
                  language_code: requestedLang || ytItems[0]?.lang || 'en',
                  name: { text: requestedLang || ytItems[0]?.lang || 'English' },
                },
              ],
              segments,
              selectedTrack: {
                language_code: requestedLang || ytItems[0]?.lang || 'en',
                name: { text: requestedLang || ytItems[0]?.lang || 'English' },
              },
            };
          }
        }
      } catch {
        // Proceed to proxy-routed InnerTube fallback
      }
    }

    // 3. Proxy-routed InnerTube Android API (bypasses cloud datacenter IP bot-checks)
    if (!extracted && proxies.length > 0) {
      const startIdx = globalCache.__ytProxyCursor ?? 0;
      const maxAttempts = Math.min(3, proxies.length);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const idx = (startIdx + attempt) % proxies.length;
        const proxy = proxies[idx];
        try {
          const pFetch = createProxiedFetch(proxy);
          const proxiedYt = await getProxiedAndroidInnertube(proxy, pFetch);
          const res = await extractWithInnertubeClient(
            proxiedYt,
            videoId,
            requestedLang,
            pFetch
          );
          if (res.segments.length > 0 || res.tracks.length === 0) {
            extracted = res;
            globalCache.__ytProxyCursor = idx;
            if (shouldTryDirect && res.segments.length > 0) {
              globalCache.__ytSkipDirectUntil = Date.now() + 5 * 60 * 1000;
            }
            engineUsed = 'youtubei.js (InnerTube API)';
            break;
          }
        } catch {
          globalCache.__ytProxyAndroid = undefined;
        }
      }
    }

    if (!extracted || extracted.segments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No captions or transcript were found for this video. The creator may have disabled subtitles, or the video may be private/unavailable.',
        },
        { status: 404 }
      );
    }

    let finalTitle = extracted.title?.trim();
    let finalAuthor = extracted.author?.trim();
    let finalThumbnail = extracted.thumbnail;

    if (!finalTitle || !finalAuthor) {
      const oembed = await fetchOembedMetadata(videoId);
      finalTitle = finalTitle || oembed.title || `YouTube Video (${videoId})`;
      finalAuthor = finalAuthor || oembed.author || 'YouTube Creator';
      finalThumbnail = finalThumbnail || oembed.thumbnail;
    }

    const availableLanguages: CaptionLanguageOption[] = [];
    const seenCodes = new Set<string>();
    for (const track of extracted.tracks) {
      const code = track.language_code || '';
      if (!code || seenCodes.has(code)) continue;
      seenCodes.add(code);
      const label =
        track.name?.text ||
        (typeof track.name?.toString === 'function' ? track.name.toString() : '') ||
        code.toUpperCase();
      availableLanguages.push({
        code,
        name: label,
        isAutoGenerated: track.kind === 'asr',
      });
    }

    const selectedCode = extracted.selectedTrack?.language_code || requestedLang || 'en';
    const selectedName =
      availableLanguages.find((l) => l.code === selectedCode)?.name ||
      selectedCode.toUpperCase();

    const wordCount = extracted.segments.reduce((acc, seg) => {
      const words = seg.text.split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);

    const processingTimeMs = Math.max(1, Math.round(performance.now() - startedAt));

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        originalUrl: canonicalUrl,
        title: finalTitle,
        author: finalAuthor,
        thumbnail:
          finalThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        durationSeconds: extracted.durationSeconds,
        language: selectedCode,
        languageName: selectedName,
        availableLanguages,
        segments: extracted.segments,
        wordCount,
        processingTimeMs,
        engine: engineUsed,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to extract YouTube transcript.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
