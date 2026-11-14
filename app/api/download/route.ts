import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // Block private IPv4 ranges & link-local metadata endpoints
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true;
    }
  }

  if (host.startsWith('fe80:') || host.startsWith('fc00:') || host.startsWith('fd00:')) {
    return true;
  }

  return false;
}

function sanitizeFilename(rawName: string): string {
  const cleaned = rawName
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  if (!cleaned) return 'SaveVibe_Video.mp4';
  if (/\.(mp4|m4a|mp3|webm)$/i.test(cleaned)) return cleaned;
  return `${cleaned}.mp4`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawUrl = searchParams.get('url')?.trim();
  const rawFilename = searchParams.get('filename')?.trim() || 'SaveVibe_Video.mp4';
  const dl = searchParams.get('dl') ?? '1';

  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'Missing url parameter.' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid media URL.' }, { status: 400 });
  }

  const backendBaseUrl = process.env.YTDLP_BACKEND_URL?.trim().replace(/\/+$/, '');
  const isAllowedHttpBackend =
    parsedUrl.protocol === 'http:' && backendBaseUrl && rawUrl.startsWith(backendBaseUrl);

  if (parsedUrl.protocol !== 'https:' && !isAllowedHttpBackend) {
    return NextResponse.json({ success: false, error: 'Unsupported URL protocol.' }, { status: 400 });
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    return NextResponse.json({ success: false, error: 'Access to host is blocked.' }, { status: 403 });
  }

  const headers: Record<string, string> = {
    'User-Agent': DEFAULT_USER_AGENT,
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const lowerHost = parsedUrl.hostname.toLowerCase();
  if (lowerHost.includes('youtube') || lowerHost.includes('youtu.be') || lowerHost.includes('googlevideo')) {
    headers['Referer'] = 'https://www.youtube.com/';
  } else if (lowerHost.includes('tiktok') || lowerHost.includes('tikwm') || lowerHost.includes('byteoversea')) {
    headers['Referer'] = 'https://www.tiktok.com/';
  } else if (lowerHost.includes('fbcdn') || lowerHost.includes('facebook')) {
    headers['Referer'] = 'https://www.facebook.com/';
  } else if (lowerHost.includes('instagram') || lowerHost.includes('cdninstagram')) {
    headers['Referer'] = 'https://www.instagram.com/';
  }

  const rangeHeader = req.headers.get('range');
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  const controller = new AbortController();
  const connectTimeout = setTimeout(() => controller.abort(), 25000);

  try {
    const upstreamRes = await fetch(parsedUrl.toString(), {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(connectTimeout);

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        {
          success: false,
          error: `Media source returned HTTP ${upstreamRes.status}. Please fetch the link again.`,
        },
        { status: upstreamRes.status === 403 || upstreamRes.status === 404 ? 410 : 502 }
      );
    }

    const upstreamType = upstreamRes.headers.get('content-type') || 'video/mp4';
    if (upstreamType.toLowerCase().includes('text/html')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upstream media link expired or returned an invalid response. Please fetch again.',
        },
        { status: 502 }
      );
    }

    const safeFilename = sanitizeFilename(rawFilename);
    const disposition = dl === '0' ? 'inline' : 'attachment';

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      upstreamType.includes('octet-stream') ? 'video/mp4' : upstreamType
    );
    responseHeaders.set(
      'Content-Disposition',
      `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    responseHeaders.set('Cache-Control', 'private, max-age=300');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    } else {
      responseHeaders.set('Accept-Ranges', 'bytes');
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    clearTimeout(connectTimeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timed out while connecting to media server.' },
        { status: 504 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to stream video download.';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
