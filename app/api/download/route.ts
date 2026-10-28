import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');
    const rawFilename = searchParams.get('filename') || 'SaveVibe_Download.mp4';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_\.-]/g, '_');

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }

    // Real-time passthrough fetch (zero disk storage, zero file saving on server)
    const res = await fetch(mediaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Media server returned status ${res.status}` },
        { status: res.status }
      );
    }

    const headers = new Headers();
    // Force application/octet-stream and attachment header so browser MUST trigger direct download dialog
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

    // Stream chunks directly to client response without buffering or saving
    return new NextResponse(res.body as any, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
