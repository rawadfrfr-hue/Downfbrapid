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

    try {
      const res = await fetch(mediaUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        redirect: 'follow',
      });

      if (res.ok) {
        const headers = new Headers();
        // Force octet-stream so browser MUST trigger direct download dialog instead of playing in a tab
        headers.set('Content-Type', 'application/octet-stream');
        headers.set(
          'Content-Disposition',
          `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
        );
        headers.set('Cache-Control', 'public, max-age=3600');

        const contentLength = res.headers.get('content-length');
        if (contentLength) {
          headers.set('Content-Length', contentLength);
        }

        return new NextResponse(res.body as any, {
          status: 200,
          headers,
        });
      }
    } catch (streamErr) {
      console.error('Server proxy stream error:', streamErr);
    }

    // Fallback streaming fetch
    try {
      const fallbackRes = await fetch(mediaUrl, { redirect: 'follow' });
      if (fallbackRes.ok) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set(
          'Content-Disposition',
          `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
        );
        return new NextResponse(fallbackRes.body as any, {
          status: 200,
          headers,
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({ error: 'Failed to download media stream' }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
