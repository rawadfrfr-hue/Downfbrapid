import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  let mediaUrl: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    mediaUrl = searchParams.get('url');
    const rawFilename = searchParams.get('filename') || 'SaveVibe_Download.mp4';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_\.-]/g, '_');

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }

    const lowerMediaUrl = mediaUrl.toLowerCase();
    const isYouTube =
      lowerMediaUrl.includes('googlevideo.com') ||
      lowerMediaUrl.includes('youtube.com') ||
      lowerMediaUrl.includes('youtu.be') ||
      lowerMediaUrl.includes('ytimg.com');

    const reqHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    if (isYouTube) {
      reqHeaders['Referer'] = 'https://www.youtube.com/';
      reqHeaders['Origin'] = 'https://www.youtube.com';
      reqHeaders['Sec-Fetch-Dest'] = 'video';
      reqHeaders['Sec-Fetch-Mode'] = 'cors';
      reqHeaders['Sec-Fetch-Site'] = 'cross-site';
    }

    // Real-time passthrough fetch (zero disk storage, zero file saving on server)
    const res = await fetch(mediaUrl, {
      headers: reqHeaders,
      redirect: 'follow',
    });

    if (!res.ok) {
      // If server fetch gets 403 Forbidden or any failure, redirect client browser directly to mediaUrl
      // so browser fetches directly with client's own IP and headers
      return NextResponse.redirect(mediaUrl, { status: 307 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
    );
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    const contentLength = res.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(res.body as any, {
      status: 200,
      headers,
    });
  } catch {
    if (mediaUrl) {
      return NextResponse.redirect(mediaUrl, { status: 307 });
    }
    return NextResponse.json({ error: 'Download failed.' }, { status: 500 });
  }
}

