import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const cleanUrl = rawUrl.trim();
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
      const fallbackThumb =
        detectedPlatform === 'tiktok'
          ? 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          thumbnail: data.thumbnail || fallbackThumb,
        },
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
