import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const resourceUrl = requestUrl.searchParams.get('url');
    const outputFilename = requestUrl.searchParams.get('filename') || 'media_file.mp4';
    const mediaType = requestUrl.searchParams.get('type') || 'video';

    if (!resourceUrl) {
      return NextResponse.json({ error: 'Missing resource URL' }, { status: 400 });
    }

    const streamResponse = await fetch(resourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Sec-Fetch-Dest': 'video',
      },
    });

    if (!streamResponse.ok || !streamResponse.body) {
      return NextResponse.redirect(resourceUrl);
    }

    const detectedContentType =
      mediaType === 'audio'
        ? 'audio/mpeg'
        : streamResponse.headers.get('content-type') || 'video/mp4';

    if (detectedContentType.includes('xml') || detectedContentType.includes('html')) {
      return NextResponse.redirect(resourceUrl);
    }

    const sanitizedFilename = outputFilename.replace(/[^\w\.-]/g, '_');

    return new NextResponse(streamResponse.body as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': detectedContentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    const targetUrl = new URL(req.url).searchParams.get('url');
    if (targetUrl) {
      return NextResponse.redirect(targetUrl);
    }
    return NextResponse.json({ error: 'Stream transfer failed' }, { status: 500 });
  }
}
