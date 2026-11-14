import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TIKTOK_FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80';
const DEFAULT_FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

function extractHttpUrl(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : trimmed;
}

function detectPlatform(url: string, fallbackPlatform: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('youtube-nocookie.com')) {
    return 'youtube';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('tiktok.com') || lower.includes('vt.tiktok.com') || lower.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.gg') || lower.includes('fb.com')) {
    return 'facebook';
  }
  return fallbackPlatform;
}

function formatDuration(seconds: unknown): string {
  const num = typeof seconds === 'number' ? seconds : Number(seconds);
  if (!Number.isFinite(num) || num <= 0) return 'Public Video';
  const total = Math.floor(num);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatBytes(bytes: unknown): string | null {
  const num = typeof bytes === 'number' ? bytes : Number(bytes);
  if (!Number.isFinite(num) || num <= 0) return null;
  const mb = num / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = num / 1024;
  return `${Math.round(kb)} KB`;
}

function sanitizeFileBase(title: string, fallbackId: string): string {
  const cleaned = title
    .replace(/[^\w.\-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return cleaned || `TikTok_${fallbackId}`;
}

function buildDownloadProxyUrl(mediaUrl: string, filename: string, inline: boolean = false): string {
  const params = new URLSearchParams({
    url: mediaUrl,
    filename,
    dl: inline ? '0' : '1',
  });
  return `/api/download?${params.toString()}`;
}

interface TikwmAuthor {
  unique_id?: string;
  nickname?: string;
}

interface TikwmData {
  id?: string;
  title?: string;
  play?: string;
  hdplay?: string;
  wmplay?: string;
  size?: number;
  hd_size?: number;
  duration?: number;
  play_count?: number;
  cover?: string;
  origin_cover?: string;
  author?: TikwmAuthor;
}

interface TikwmResponse {
  code?: number;
  msg?: string;
  data?: TikwmData;
}

function resolveTikwmMediaUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  if (raw.startsWith('/')) return `https://www.tikwm.com${raw}`;
  return raw;
}

async function fetchTikwmOnce(cleanUrl: string, signal: AbortSignal): Promise<TikwmResponse> {
  const body = new URLSearchParams({
    url: cleanUrl,
    hd: '1',
  });

  const res = await fetch('https://www.tikwm.com/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    },
    body: body.toString(),
    signal,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`TikTok extractor returned HTTP ${res.status}.`);
  }

  return (await res.json()) as TikwmResponse;
}

async function extractTikTokVideo(cleanUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    let payload = await fetchTikwmOnce(cleanUrl, controller.signal);

    // tikwm free tier occasionally asks for 1 req/sec spacing
    if (payload?.code === -1 && String(payload?.msg || '').toLowerCase().includes('limit')) {
      await new Promise((resolve) => setTimeout(resolve, 1150));
      payload = await fetchTikwmOnce(cleanUrl, controller.signal);
    }

    if (payload?.code !== 0 || !payload?.data) {
      throw new Error(
        payload?.msg || 'Unable to extract TikTok video. Please verify the link is public and valid.'
      );
    }

    const d = payload.data;
    const videoId = String(d.id || Date.now());
    const standardRawUrl = resolveTikwmMediaUrl(d.play);
    const highRawUrl = resolveTikwmMediaUrl(d.hdplay) || standardRawUrl;

    if (!standardRawUrl && !highRawUrl) {
      throw new Error('No watermark-free MP4 stream was found for this TikTok link.');
    }

    const finalStandardUrl = standardRawUrl || highRawUrl;
    const finalHighUrl = highRawUrl || standardRawUrl;

    const title = (d.title || 'TikTok Video').replace(/\s+/g, ' ').trim().slice(0, 160);
    const author = d.author?.unique_id
      ? `@${d.author.unique_id}`
      : d.author?.nickname || '@tiktok';
    const thumbnail =
      resolveTikwmMediaUrl(d.origin_cover || d.cover) || TIKTOK_FALLBACK_THUMB;
    const duration = formatDuration(d.duration);
    const views =
      typeof d.play_count === 'number' && d.play_count > 0
        ? `${d.play_count.toLocaleString()} views`
        : 'Public Video';

    const standardSize = formatBytes(d.size) || 'Standard MP4';
    const highSize = formatBytes(d.hd_size || d.size) || 'HD MP4';
    const fileBase = sanitizeFileBase(title, videoId);

    const standardDownloadUrl = buildDownloadProxyUrl(
      finalStandardUrl,
      `${fileBase}_standard_no_watermark.mp4`,
      false
    );
    const standardPreviewUrl = buildDownloadProxyUrl(
      finalStandardUrl,
      `${fileBase}_standard_no_watermark.mp4`,
      true
    );

    const highDownloadUrl = buildDownloadProxyUrl(
      finalHighUrl,
      `${fileBase}_high_no_watermark.mp4`,
      false
    );
    const highPreviewUrl = buildDownloadProxyUrl(
      finalHighUrl,
      `${fileBase}_high_no_watermark.mp4`,
      true
    );

    return {
      id: `tiktok_${videoId}`,
      originalUrl: cleanUrl,
      title,
      author,
      views,
      duration,
      thumbnail,
      platform: 'TikTok',
      isSingleQuality: false,
      qualityList: [
        {
          id: 'sd',
          quality: 'Standard quality (without watermark)',
          label: 'Standard quality (without watermark)',
          sublabel: `Watermark-Free • ${standardSize}`,
          url: standardPreviewUrl,
          downloadUrl: standardDownloadUrl,
          qualityLabel: 'Standard quality (without watermark)',
          format: 'MP4',
          badge: 'NO WATERMARK',
        },
        {
          id: 'hd',
          quality: 'High quality (without watermark)',
          label: 'High quality (without watermark)',
          sublabel: `Watermark-Free • ${highSize}`,
          url: highPreviewUrl,
          downloadUrl: highDownloadUrl,
          qualityLabel: 'High quality (without watermark)',
          format: 'MP4',
          badge: 'HD • NO WATERMARK',
        },
      ],
      qualities: {
        hd: {
          quality: 'High quality (without watermark)',
          url: highPreviewUrl,
          downloadUrl: highDownloadUrl,
          size: highSize,
          format: 'MP4',
        },
        sd: {
          quality: 'Standard quality (without watermark)',
          url: standardPreviewUrl,
          downloadUrl: standardDownloadUrl,
          size: standardSize,
          format: 'MP4',
        },
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTikTokBackendData(
  data: Record<string, unknown>,
  cleanUrl: string
): Record<string, unknown> {
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'TikTok Video';
  const fileBase = sanitizeFileBase(title, String(data.id || Date.now()));
  const existingList = Array.isArray(data.qualityList)
    ? (data.qualityList as Array<Record<string, unknown>>)
    : [];
  const qualities = (data.qualities || {}) as Record<string, Record<string, unknown>>;

  const wrapIfExternal = (rawUrl: unknown, suffix: string, inline: boolean) => {
    if (typeof rawUrl !== 'string' || !rawUrl) return '';
    if (rawUrl.startsWith('/api/') || rawUrl.includes('/api/proxy') || rawUrl.includes('/api/merge')) {
      return rawUrl;
    }
    return buildDownloadProxyUrl(rawUrl, `${fileBase}_${suffix}.mp4`, inline);
  };

  const hdSource =
    (qualities.hd?.downloadUrl as string) ||
    (qualities.hd?.url as string) ||
    (existingList[0]?.downloadUrl as string) ||
    (existingList[0]?.url as string) ||
    '';

  const sdSource =
    (qualities.sd?.downloadUrl as string) ||
    (qualities.sd?.url as string) ||
    (existingList[1]?.downloadUrl as string) ||
    (existingList[1]?.url as string) ||
    hdSource;

  const standardDownloadUrl = wrapIfExternal(sdSource, 'standard_no_watermark', false);
  const standardPreviewUrl = wrapIfExternal(sdSource, 'standard_no_watermark', true);
  const highDownloadUrl = wrapIfExternal(hdSource, 'high_no_watermark', false);
  const highPreviewUrl = wrapIfExternal(hdSource, 'high_no_watermark', true);

  const sdSize = (qualities.sd?.size as string) || 'Standard MP4';
  const hdSize = (qualities.hd?.size as string) || 'HD MP4';

  return {
    ...data,
    originalUrl: cleanUrl,
    platform: 'TikTok',
    isSingleQuality: false,
    thumbnail: data.thumbnail || TIKTOK_FALLBACK_THUMB,
    qualityList: [
      {
        id: 'sd',
        quality: 'Standard quality (without watermark)',
        label: 'Standard quality (without watermark)',
        sublabel: `Watermark-Free • ${sdSize}`,
        url: standardPreviewUrl,
        downloadUrl: standardDownloadUrl,
        qualityLabel: 'Standard quality (without watermark)',
        format: 'MP4',
        badge: 'NO WATERMARK',
      },
      {
        id: 'hd',
        quality: 'High quality (without watermark)',
        label: 'High quality (without watermark)',
        sublabel: `Watermark-Free • ${hdSize}`,
        url: highPreviewUrl,
        downloadUrl: highDownloadUrl,
        qualityLabel: 'High quality (without watermark)',
        format: 'MP4',
        badge: 'HD • NO WATERMARK',
      },
    ],
    qualities: {
      hd: {
        quality: 'High quality (without watermark)',
        url: highPreviewUrl,
        downloadUrl: highDownloadUrl,
        size: hdSize,
        format: 'MP4',
      },
      sd: {
        quality: 'Standard quality (without watermark)',
        url: standardPreviewUrl,
        downloadUrl: standardDownloadUrl,
        size: sdSize,
        format: 'MP4',
      },
    },
  };
}

function parseFacebookResolution(item: Record<string, unknown>): number | 'audio' {
  const id = String(item.id || '').toLowerCase();
  const quality = String(item.quality || '').toLowerCase();
  const label = String(item.label || '').toLowerCase();
  const qualityLabel = String(item.qualityLabel || '').toLowerCase();
  const combined = `${id} ${quality} ${label} ${qualityLabel}`;

  if (id === 'audio' || combined.includes('audio only') || quality === 'audio' || label === 'audio') {
    return 'audio';
  }
  if (id === '2k' || combined.includes('highest 2k')) {
    return 1440;
  }
  const match = combined.match(/(\d{3,4})p/);
  if (match) {
    return Number(match[1]);
  }
  if (id === 'hd') return 1080;
  if (id === 'sd') return 720;
  return 0;
}

function normalizeFacebookBackendData(data: Record<string, unknown>): Record<string, unknown> {
  const rawList = Array.isArray(data.qualityList)
    ? (data.qualityList as Array<Record<string, unknown>>)
    : [];
  const qualities = (data.qualities || {}) as Record<string, Record<string, unknown> | undefined>;

  const candidates: Array<Record<string, unknown>> = [...rawList];
  if (candidates.length === 0) {
    if (qualities.hd) {
      candidates.push({
        id: '1080p',
        ...qualities.hd,
        label: qualities.hd.quality || 'HD 1080p',
        sublabel: qualities.hd.size || 'MP4',
        qualityLabel: qualities.hd.quality || 'HD 1080p',
      });
    }
    if (qualities.sd) {
      candidates.push({
        id: '720p',
        ...qualities.sd,
        label: qualities.sd.quality || 'SD 720p',
        sublabel: qualities.sd.size || 'MP4',
        qualityLabel: qualities.sd.quality || 'SD 720p',
      });
    }
    if (qualities.audio) {
      candidates.push({
        id: 'audio',
        ...qualities.audio,
        label: 'Audio',
        sublabel: qualities.audio.size || 'Audio Track',
        qualityLabel: 'Audio',
      });
    }
  }

  let highest2k: { res: number; item: Record<string, unknown> } | null = null;
  let hd1080: { res: number; item: Record<string, unknown> } | null = null;
  let sd720: { res: number; item: Record<string, unknown> } | null = null;
  let audioItem: Record<string, unknown> | null = null;
  let unknownVideoItem: Record<string, unknown> | null = null;

  for (const item of candidates) {
    const parsed = parseFacebookResolution(item);
    if (parsed === 'audio') {
      if (!audioItem) audioItem = item;
      continue;
    }

    if (parsed >= 1440) {
      if (!highest2k || parsed > highest2k.res) {
        highest2k = { res: parsed, item };
      }
    } else if (parsed >= 900) {
      if (
        !hd1080 ||
        (parsed === 1080 && hd1080.res !== 1080) ||
        (hd1080.res !== 1080 && parsed > hd1080.res)
      ) {
        hd1080 = { res: parsed, item };
      }
    } else if (parsed > 0) {
      if (!sd720 || parsed > sd720.res) {
        sd720 = { res: parsed, item };
      }
    } else if (!unknownVideoItem) {
      unknownVideoItem = item;
    }
  }

  if (!highest2k && !hd1080 && !sd720 && unknownVideoItem) {
    sd720 = { res: 720, item: unknownVideoItem };
  }

  if (!audioItem && qualities.audio) {
    audioItem = {
      id: 'audio',
      quality: 'Audio',
      label: 'Audio',
      sublabel: `${qualities.audio.size || 'Direct Audio'} • High Quality Audio`,
      url: qualities.audio.url,
      downloadUrl: qualities.audio.downloadUrl,
      qualityLabel: 'Audio',
      format: qualities.audio.format || 'M4A',
      badge: 'AUDIO',
      requiresClientMerge: false,
    };
  }

  const normalizedList: Array<Record<string, unknown>> = [];

  if (highest2k) {
    normalizedList.push({
      ...highest2k.item,
      id: '2k',
      quality: 'Highest 2K',
      label: 'Highest 2K',
      qualityLabel: 'Highest 2K',
      badge: 'Highest 2K',
    });
  }

  if (hd1080) {
    normalizedList.push({
      ...hd1080.item,
      id: '1080p',
      quality: 'HD 1080p',
      label: 'HD 1080p',
      qualityLabel: 'HD 1080p',
      badge: 'HD 1080p',
    });
  }

  if (sd720) {
    normalizedList.push({
      ...sd720.item,
      id: '720p',
      quality: 'SD 720p',
      label: 'SD 720p',
      qualityLabel: 'SD 720p',
      badge: 'SD 720p',
    });
  }

  if (audioItem) {
    normalizedList.push({
      ...audioItem,
      id: 'audio',
      quality: 'Audio',
      label: 'Audio',
      qualityLabel: 'Audio',
      badge: 'AUDIO',
    });
  }

  const bestHdItem = highest2k?.item || hd1080?.item || sd720?.item;
  const bestSdItem = sd720?.item || hd1080?.item;

  return {
    ...data,
    platform: 'Facebook',
    qualityList: normalizedList,
    qualities: {
      ...qualities,
      ...(bestHdItem
        ? {
            hd: {
              ...(qualities.hd || {}),
              quality: highest2k ? 'Highest 2K' : hd1080 ? 'HD 1080p' : 'SD 720p',
              url: bestHdItem.url || qualities.hd?.url,
              downloadUrl: bestHdItem.downloadUrl || qualities.hd?.downloadUrl,
              format: bestHdItem.format || qualities.hd?.format || 'MP4',
              size:
                qualities.hd?.size ||
                (highest2k ? 'Highest 2K' : hd1080 ? 'HD 1080p' : 'SD 720p'),
              requiresClientMerge: bestHdItem.requiresClientMerge ?? qualities.hd?.requiresClientMerge,
              videoUrl: bestHdItem.videoUrl ?? qualities.hd?.videoUrl,
              audioUrl: bestHdItem.audioUrl ?? qualities.hd?.audioUrl,
              vcodec: bestHdItem.vcodec ?? qualities.hd?.vcodec,
              acodec: bestHdItem.acodec ?? qualities.hd?.acodec,
              videoExt: bestHdItem.videoExt ?? qualities.hd?.videoExt,
              audioExt: bestHdItem.audioExt ?? qualities.hd?.audioExt,
            },
          }
        : {}),
      ...(bestSdItem
        ? {
            sd: {
              ...(qualities.sd || {}),
              quality: sd720 ? 'SD 720p' : 'HD 1080p',
              url: bestSdItem.url || qualities.sd?.url,
              downloadUrl: bestSdItem.downloadUrl || qualities.sd?.downloadUrl,
              format: bestSdItem.format || qualities.sd?.format || 'MP4',
              size: qualities.sd?.size || (sd720 ? 'SD 720p' : 'HD 1080p'),
              requiresClientMerge: bestSdItem.requiresClientMerge ?? qualities.sd?.requiresClientMerge,
              videoUrl: bestSdItem.videoUrl ?? qualities.sd?.videoUrl,
              audioUrl: bestSdItem.audioUrl ?? qualities.sd?.audioUrl,
              vcodec: bestSdItem.vcodec ?? qualities.sd?.vcodec,
              acodec: bestSdItem.acodec ?? qualities.sd?.acodec,
              videoExt: bestSdItem.videoExt ?? qualities.sd?.videoExt,
              audioExt: bestSdItem.audioExt ?? qualities.sd?.audioExt,
            },
          }
        : {}),
      ...(audioItem
        ? {
            audio: {
              ...(qualities.audio || {}),
              quality: 'Audio',
              url: audioItem.url || qualities.audio?.url,
              downloadUrl: audioItem.downloadUrl || qualities.audio?.downloadUrl,
              format: audioItem.format || qualities.audio?.format || 'M4A',
              size: qualities.audio?.size || 'Audio',
              requiresClientMerge: false,
            },
          }
        : {}),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;
    const requestedPlatform = typeof body?.platform === 'string' ? body.platform : 'facebook';

    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid video URL.' },
        { status: 400 }
      );
    }

    const cleanUrl = extractHttpUrl(rawUrl);
    try {
      const parsed = new URL(cleanUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid http:// or https:// video URL.' },
        { status: 400 }
      );
    }

    const detectedPlatform = detectPlatform(cleanUrl, requestedPlatform);

    // Keep YouTube UI intact, but disable YouTube processing for now
    if (detectedPlatform === 'youtube' || requestedPlatform === 'youtube') {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube downloads are currently unavailable. Please use Facebook, Instagram, or TikTok.',
        },
        { status: 400 }
      );
    }

    if (!['facebook', 'instagram', 'tiktok'].includes(detectedPlatform)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported link. Please paste a valid Facebook, Instagram, or TikTok video URL.',
        },
        { status: 400 }
      );
    }

    const backendBaseUrl = process.env.YTDLP_BACKEND_URL?.trim().replace(/\/+$/, '');

    // For TikTok: extract watermark-free Standard & High quality streams directly first,
    // falling back to YTDLP_BACKEND_URL if configured.
    if (detectedPlatform === 'tiktok') {
      try {
        const tiktokData = await extractTikTokVideo(cleanUrl);
        return NextResponse.json({ success: true, data: tiktokData });
      } catch (tiktokErr: unknown) {
        if (!backendBaseUrl) {
          const msg =
            tiktokErr instanceof Error
              ? tiktokErr.message
              : 'Unable to download this TikTok video. Please verify the link is public.';
          return NextResponse.json({ success: false, error: msg }, { status: 422 });
        }
        // Otherwise continue to YTDLP_BACKEND_URL fallback below
      }
    }

    if (!backendBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video extractor backend is not configured (missing YTDLP_BACKEND_URL).',
        },
        { status: 500 }
      );
    }

    const apiSecret = process.env.YTDLP_API_SECRET?.trim() || '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiSecret) {
        headers['X-API-Key'] = apiSecret;
      }

      const backendRes = await fetch(`${backendBaseUrl}/api/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: cleanUrl,
          platform: detectedPlatform,
        }),
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);

      const payload = await backendRes.json().catch(() => null);

      if (!backendRes.ok || !payload?.success || !payload?.data) {
        const errMessage =
          payload?.detail ||
          payload?.error ||
          'Unable to extract a direct download link for this video. Please verify the link is public.';
        return NextResponse.json(
          { success: false, error: errMessage },
          { status: backendRes.status >= 400 && backendRes.status < 500 ? backendRes.status : 502 }
        );
      }

      const data = payload.data;
      const resolveBackendUrl = (maybeRelative: unknown) => {
        if (typeof maybeRelative === 'string' && maybeRelative.startsWith('/api/')) {
          return `${backendBaseUrl}${maybeRelative}`;
        }
        return maybeRelative;
      };

      const normalizedQualityList = Array.isArray(data.qualityList)
        ? data.qualityList.map((item: Record<string, unknown>) => ({
            ...item,
            url: resolveBackendUrl(item.url),
            downloadUrl: resolveBackendUrl(item.downloadUrl),
          }))
        : data.qualityList;

      const normalizedQualities = data.qualities
        ? Object.fromEntries(
            Object.entries(data.qualities as Record<string, Record<string, unknown>>).map(
              ([key, val]) => [
                key,
                val
                  ? {
                      ...val,
                      url: resolveBackendUrl(val.url),
                      downloadUrl: resolveBackendUrl(val.downloadUrl),
                    }
                  : val,
              ]
            )
          )
        : data.qualities;

      const fallbackThumb =
        detectedPlatform === 'tiktok' ? TIKTOK_FALLBACK_THUMB : DEFAULT_FALLBACK_THUMB;

      const preparedData = {
        ...data,
        previewUrl: data.previewUrl ? resolveBackendUrl(data.previewUrl) : undefined,
        qualityList: normalizedQualityList,
        qualities: normalizedQualities,
        thumbnail: data.thumbnail || fallbackThumb,
      };

      return NextResponse.json({
        success: true,
        data:
          detectedPlatform === 'tiktok'
            ? normalizeTikTokBackendData(preparedData, cleanUrl)
            : detectedPlatform === 'facebook'
            ? normalizeFacebookBackendData(preparedData)
            : preparedData,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'The extraction request timed out. Please try again.' },
          { status: 504 }
        );
      }
      const msg =
        fetchErr instanceof Error ? fetchErr.message : 'Failed to connect to the extractor backend.';
      return NextResponse.json({ success: false, error: msg }, { status: 502 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process video link.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
