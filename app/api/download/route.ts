import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'fb_video.mp4';
    const type = searchParams.get('type') || 'video';

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }

    // Try fetching media stream with proper headers
    const mediaRes = await fetch(mediaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Sec-Fetch-Dest': 'video',
      },
    });

    if (!mediaRes.ok || !mediaRes.body) {
      // If direct proxy fetch fails (e.g. 403 AccessDenied or CORS), redirect to mediaUrl
      return NextResponse.redirect(mediaUrl);
    }

    const contentType =
      type === 'audio'
        ? 'audio/mpeg'
        : mediaRes.headers.get('content-type') || 'video/mp4';

    // If the response is XML or HTML (e.g., AccessDenied error page), redirect instead of outputting XML
    if (contentType.includes('xml') || contentType.includes('html')) {
      return NextResponse.redirect(mediaUrl);
    }

    const safeFilename = filename.replace(/[^\w\.-]/g, '_');

    return new NextResponse(mediaRes.body as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    const mediaUrl = new URL(req.url).searchParams.get('url');
    if (mediaUrl) {
      return NextResponse.redirect(mediaUrl);
    }
    return NextResponse.json({ error: 'Download stream unavailable' }, { status: 500 });
  }
}
