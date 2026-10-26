import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }

    // Direct HTTP 307 Redirect to Facebook or RapidAPI CDN server
    // Uses 0% site bandwidth
    return NextResponse.redirect(mediaUrl, { status: 307 });
  } catch {
    const mediaUrl = new URL(req.url).searchParams.get('url');
    if (mediaUrl) {
      return NextResponse.redirect(mediaUrl, { status: 307 });
    }
    return NextResponse.json({ error: 'Media URL unavailable' }, { status: 400 });
  }
}
