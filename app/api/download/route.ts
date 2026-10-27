import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');
    const rawFilename = searchParams.get('filename') || 'TikTok_Video.mp4';
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
      });

      if (res.ok) {
        const isAudio = cleanFilename.endsWith('.mp3') || cleanFilename.endsWith('.m4a');
        const defaultContentType = isAudio ? 'audio/mpeg' : 'video/mp4';
        const contentType = res.headers.get('content-type') || defaultContentType;

        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set(
            'Content-Disposition',
            `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
          );
          headers.set('Cache-Control', 'public, max-age=3600');
          const contentLengthStr = res.headers.get('content-length');
          if (contentLengthStr) {
            headers.set('Content-Length', contentLengthStr);
          }

          return new NextResponse(res.body as any, {
            status: 200,
            headers,
          });
        }
      }
    } catch (streamErr) {
      console.error('Server proxy stream error, falling back to redirect:', streamErr);
    }

    // Direct HTTP 302 Redirect as fallback
    return NextResponse.redirect(mediaUrl, { status: 302 });
  } catch {
    const mediaUrl = new URL(req.url).searchParams.get('url');
    if (mediaUrl) {
      return NextResponse.redirect(mediaUrl, { status: 302 });
    }
    return NextResponse.json({ error: 'Media URL unavailable' }, { status: 400 });
  }
}
