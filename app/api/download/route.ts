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

    // Fetch the remote media stream
    const mediaRes = await fetch(mediaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!mediaRes.ok || !mediaRes.body) {
      return NextResponse.redirect(mediaUrl);
    }

    const contentType =
      type === 'audio'
        ? 'audio/mpeg'
        : mediaRes.headers.get('content-type') || 'video/mp4';

    const safeFilename = filename.replace(/[^\w\.-]/g, '_');

    return new NextResponse(mediaRes.body as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const mediaUrl = new URL(req.url).searchParams.get('url');
    if (mediaUrl) {
      return NextResponse.redirect(mediaUrl);
    }
    const message = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
