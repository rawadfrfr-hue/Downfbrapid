import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ANDROID_CLIENT_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface ScrapedTranslationBatch {
  translatedText: string;
  detectedSourceLang?: string;
}

function normalizeLine(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Endpoint 1 & 2: Unofficial Google Translate Scraper (`translate_a/single?client=at`).
 * Uses POST form-urlencoded so large transcript batches work reliably without URL length truncation.
 */
async function scrapeTranslateSingle(
  endpointHost: 'translate.googleapis.com' | 'translate.google.com',
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<ScrapedTranslationBatch | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://${endpointHost}/translate_a/single?client=at&dt=t&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}`;
    const body = new URLSearchParams({ q: text });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': ANDROID_CLIENT_UA,
      },
      body: body.toString(),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || !Array.isArray(json[0])) return null;

    const parts: string[] = [];
    for (const item of json[0] as unknown[]) {
      if (Array.isArray(item) && typeof item[0] === 'string') {
        parts.push(item[0]);
      }
    }

    const translatedText = parts.join('');
    if (!translatedText) return null;

    const detectedSourceLang = typeof json[2] === 'string' ? json[2] : undefined;
    return { translatedText, detectedSourceLang };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Endpoint 3: Unofficial Google Translate Web Scraper (`batchexecute` RPC `MkEWBc`).
 */
async function scrapeTranslateBatchExecute(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<ScrapedTranslationBatch | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const innerPayload = JSON.stringify([[text, sourceLang, targetLang, true], [null]]);
    const fReq = JSON.stringify([[['MkEWBc', innerPayload, null, 'generic']]]);
    const body = new URLSearchParams({ 'f.req': fReq });

    const res = await fetch(
      'https://translate.google.com/_/TranslateWebserverUi/data/batchexecute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': DESKTOP_UA,
          Referer: 'https://translate.google.com/',
        },
        body: body.toString(),
        cache: 'no-store',
        signal: controller.signal,
      }
    );

    if (!res.ok) return null;
    const raw = await res.text();
    const cleaned = raw.replace(/^\)\]\}'\s*\n?/, '');

    // Locate the wrb.fr MkEWBc envelope line
    for (const line of cleaned.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('[')) continue;
      try {
        const outer = JSON.parse(trimmed) as unknown[];
        for (const entry of outer) {
          if (
            Array.isArray(entry) &&
            entry[0] === 'wrb.fr' &&
            entry[1] === 'MkEWBc' &&
            typeof entry[2] === 'string'
          ) {
            const payload = JSON.parse(entry[2]) as unknown[];
            const targetBlock = Array.isArray(payload[1]) ? payload[1] : null;
            const sentenceList =
              targetBlock &&
              Array.isArray(targetBlock[0]) &&
              Array.isArray(targetBlock[0][0]) &&
              Array.isArray(targetBlock[0][0][5])
                ? (targetBlock[0][0][5] as unknown[])
                : null;

            if (!sentenceList) continue;
            const translatedParts: string[] = [];
            for (const s of sentenceList) {
              if (Array.isArray(s) && typeof s[0] === 'string') {
                translatedParts.push(s[0]);
              }
            }
            const translatedText = translatedParts.join('');
            if (!translatedText) continue;

            const detectedSourceLang =
              typeof payload[2] === 'string' ? payload[2] : undefined;
            return { translatedText, detectedSourceLang };
          }
        }
      } catch {
        // Continue scanning lines
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeTranslateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<ScrapedTranslationBatch> {
  const r1 = await scrapeTranslateSingle('translate.googleapis.com', text, sourceLang, targetLang);
  if (r1) return r1;

  const r2 = await scrapeTranslateSingle('translate.google.com', text, sourceLang, targetLang);
  if (r2) return r2;

  const r3 = await scrapeTranslateBatchExecute(text, sourceLang, targetLang);
  if (r3) return r3;

  throw new Error(
    'Google Translate web scraper temporarily declined the request. Please try again in a moment.'
  );
}

/**
 * Translates an array of segment strings while guaranteeing 1-to-1 timestamp alignment.
 * If a newline-joined batch ever returns a mismatched line count, recursively splits it.
 */
async function translateSegmentChunk(
  lines: string[],
  sourceLang: string,
  targetLang: string
): Promise<{ lines: string[]; detectedSourceLang?: string }> {
  if (lines.length === 0) return { lines: [] };

  const joined = lines.join('\n');
  const res = await scrapeTranslateText(joined, sourceLang, targetLang);
  const splitLines = res.translatedText.split(/\r?\n/).map((s) => s.trim());

  if (splitLines.length === lines.length) {
    return {
      lines: splitLines.map((line, i) => line || lines[i]),
      detectedSourceLang: res.detectedSourceLang,
    };
  }

  // Fallback 1: explicit segment separator marker if newline count shifted
  if (lines.length > 1 && lines.length <= 15) {
    const markerJoined = lines.join('\n§§\n');
    const markerRes = await scrapeTranslateText(markerJoined, sourceLang, targetLang);
    const markerSplit = markerRes.translatedText
      .split(/\r?\n?\s*§§\s*\r?\n?/)
      .map((s) => s.trim());
    if (markerSplit.length === lines.length) {
      return {
        lines: markerSplit.map((line, i) => line || lines[i]),
        detectedSourceLang: markerRes.detectedSourceLang || res.detectedSourceLang,
      };
    }
  }

  // Fallback 2: binary split for exact 1-to-1 line correspondence
  if (lines.length > 1) {
    const mid = Math.ceil(lines.length / 2);
    const [left, right] = await Promise.all([
      translateSegmentChunk(lines.slice(0, mid), sourceLang, targetLang),
      translateSegmentChunk(lines.slice(mid), sourceLang, targetLang),
    ]);
    return {
      lines: [...left.lines, ...right.lines],
      detectedSourceLang: left.detectedSourceLang || right.detectedSourceLang,
    };
  }

  return {
    lines: [res.translatedText.trim() || lines[0]],
    detectedSourceLang: res.detectedSourceLang,
  };
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();

  try {
    const body = await req.json().catch(() => null);
    const rawSegments = Array.isArray(body?.segments) ? body.segments : [];
    const targetLang = typeof body?.targetLang === 'string' ? body.targetLang.trim() : '';
    const sourceLang =
      typeof body?.sourceLang === 'string' && body.sourceLang.trim()
        ? body.sourceLang.trim()
        : 'auto';

    if (!rawSegments.length) {
      return NextResponse.json(
        { success: false, error: 'No transcript segments provided to translate.' },
        { status: 400 }
      );
    }

    if (!targetLang) {
      return NextResponse.json(
        { success: false, error: 'Please select a target language.' },
        { status: 400 }
      );
    }

    const cleanSegments = rawSegments.map((s: unknown) =>
      normalizeLine(typeof s === 'string' ? s : String(s ?? ''))
    );

    // Group into ~2200-char chunks (max 35 lines per chunk)
    const chunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentCharLen = 0;

    for (const seg of cleanSegments) {
      if (
        currentChunk.length >= 35 ||
        (currentCharLen + seg.length > 2200 && currentChunk.length > 0)
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentCharLen = 0;
      }
      currentChunk.push(seg);
      currentCharLen += seg.length + 1;
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // Translate chunks with bounded concurrency (up to 3 in parallel)
    const translatedResults: Array<{ lines: string[]; detectedSourceLang?: string }> = new Array(
      chunks.length
    );
    const CONCURRENCY = 3;

    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const slice = chunks.slice(i, i + CONCURRENCY);
      const batchOutputs = await Promise.all(
        slice.map((chunk) => translateSegmentChunk(chunk, sourceLang, targetLang))
      );
      batchOutputs.forEach((out, offset) => {
        translatedResults[i + offset] = out;
      });
    }

    const translatedSegments = translatedResults.flatMap((r) => r.lines);
    const detectedSourceLang =
      translatedResults.find((r) => r.detectedSourceLang)?.detectedSourceLang || sourceLang;

    const processingTimeMs = Math.max(1, Math.round(performance.now() - startedAt));

    return NextResponse.json({
      success: true,
      data: {
        targetLang,
        detectedSourceLang,
        translatedSegments,
        processingTimeMs,
        engine: 'Unofficial Google Translate Web Scraper API',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to translate transcript.';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
