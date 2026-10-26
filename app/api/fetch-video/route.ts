import { NextRequest, NextResponse } from 'next/server';

// Sample demo videos ONLY used when explicitly testing sample links
const DEMO_SAMPLE_VIDEOS = [
  {
    title: 'Mind-Blowing Nature 4K Timelapse - Cinematic Sunset & Ocean Waves',
    author: 'Nature & Wildlife Official',
    views: '2.4M views',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    hdUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    hdSize: '24.2 MB',
    sdUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    sdSize: '10.8 MB',
    audioUrl: 'https://www.w3schools.com/html/horse.mp3',
    audioSize: '3.1 MB',
  },
  {
    title: 'Future of AI Tech & Robotics Demo 2026 - Official Reel',
    author: 'Tech Insider',
    views: '890K views',
    duration: '00:45',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    hdUrl: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    hdSize: '32.6 MB',
    sdUrl: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
    sdSize: '12.4 MB',
    audioUrl: 'https://www.w3schools.com/html/horse.mp3',
    audioSize: '4.2 MB',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { url, isDemo } = await req.json();

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid Facebook video URL.' },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();

    // Explicit demo request handling
    if (isDemo || cleanUrl.includes('sample-demo-test')) {
      const sample = DEMO_SAMPLE_VIDEOS[0];
      return NextResponse.json({
        success: true,
        data: {
          id: 'fb_demo_' + Date.now(),
          originalUrl: cleanUrl,
          title: sample.title,
          author: sample.author,
          views: sample.views,
          duration: sample.duration,
          thumbnail: sample.thumbnail,
          qualities: {
            hd: {
              quality: '1080p HD',
              url: sample.hdUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.hdUrl)}&filename=Demo_Video_1080p.mp4&type=video`,
              size: sample.hdSize,
              format: 'MP4',
            },
            sd: {
              quality: '720p Normal',
              url: sample.sdUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.sdUrl)}&filename=Demo_Video_720p.mp4&type=video`,
              size: sample.sdSize,
              format: 'MP4',
            },
            audio: {
              quality: '320kbps Audio',
              url: sample.audioUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.audioUrl)}&filename=Demo_Audio.mp3&type=audio`,
              size: sample.audioSize,
              format: 'MP3',
            },
          },
        },
      });
    }

    let title = '';
    let thumbnail = '';
    let hdUrl = '';
    let sdUrl = '';
    let audioUrl = '';
    let duration = '';
    let author = '';
    let rapidApiError = '';

    // RapidAPI integration with credentials
    const rapidApiKey = process.env.RAPIDAPI_KEY || '983cbe1c92msh03e9da1dbd81833p152e20jsnc068e9bcdfc9';
    const rapidApiHost = 'facebook-reel-and-video-downloader.p.rapidapi.com';
    const rapidApiEndpoint = `https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php?url=${encodeURIComponent(cleanUrl)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(rapidApiEndpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const rawText = await res.text();
        try {
          const result = JSON.parse(rawText);

          if (result.error) {
            rapidApiError = typeof result.error === 'string' ? result.error : 'Video is private or unavailable right now.';
          }

          // Extract title/caption from RapidAPI json
          if (result.title) title = result.title;
          else if (result.caption) title = result.caption;
          else if (result.description) title = result.description;

          // Extract thumbnail
          if (result.thumbnail) thumbnail = result.thumbnail;
          else if (result.picture) thumbnail = result.picture;
          else if (result.cover) thumbnail = result.cover;

          // Extract exact links (Download High Quality, Download Low Quality, High Quality, Low Quality, media array)
          if (result.links && typeof result.links === 'object') {
            hdUrl = result.links['Download High Quality'] || result.links['High Quality'] || result.links['HD'] || result.links.hd || result.links['720p'] || result.links['1080p'] || '';
            sdUrl = result.links['Download Low Quality'] || result.links['Low Quality'] || result.links['SD'] || result.links.sd || result.links['360p'] || '';
            audioUrl = result.links['Download Audio'] || result.links['Audio'] || result.links.mp3 || result.links.audio || '';
          }

          // Extract media array from RapidAPI
          if (result.media && Array.isArray(result.media) && result.media.length > 0) {
            const firstMedia = result.media[0];
            if (firstMedia.hd_url) hdUrl = hdUrl || firstMedia.hd_url;
            if (firstMedia.sd_url) sdUrl = sdUrl || firstMedia.sd_url;
          }

          if (result.hd || result.hd_url) hdUrl = hdUrl || result.hd || result.hd_url;
          if (result.sd || result.sd_url) sdUrl = sdUrl || result.sd || result.sd_url;
          if (result.audio || result.mp3 || result.audio_url) audioUrl = audioUrl || result.audio || result.mp3 || result.audio_url;

          if (result.author || result.owner) author = result.author || result.owner;
          if (result.duration || result.time) duration = result.duration || result.time;
        } catch (jsonErr) {
          console.error('RapidAPI JSON parse error:', jsonErr);
        }
      }
    } catch (apiErr) {
      console.error('RapidAPI Fetch error:', apiErr);
    }

    // Secondary fallback: Scrape Facebook public OpenGraph tags if RapidAPI returned no video links
    if (!hdUrl && !sdUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const htmlRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (htmlRes.ok) {
          const html = await htmlRes.text();

          if (!title) {
            const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                               html.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            }
          }

          if (!thumbnail) {
            const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (imgMatch && imgMatch[1]) {
              thumbnail = imgMatch[1].replace(/&amp;/g, '&');
            }
          }

          const videoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                             html.match(/<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/i) ||
                             html.match(/"browser_native_hd_url":"([^"]+)"/i) ||
                             html.match(/"playable_url_quality_hd":"([^"]+)"/i);
          if (videoMatch && videoMatch[1]) {
            hdUrl = videoMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&');
          }

          const sdMatch = html.match(/"browser_native_sd_url":"([^"]+)"/i) ||
                          html.match(/"playable_url":"([^"]+)"/i);
          if (sdMatch && sdMatch[1]) {
            sdUrl = sdMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&');
          }
        }
      } catch {
        // Fallback
      }
    }

    // STRICT CHECK: If RapidAPI and direct scraping both failed to find a real video stream URL, return explicit error
    if (!hdUrl && !sdUrl) {
      const userErr = rapidApiError || 'Could not download this Facebook video. The video may be private, restricted to logged-in users, deleted, or invalid.';
      return NextResponse.json(
        { success: false, error: userErr },
        { status: 422 }
      );
    }

    const finalTitle = title.trim() || 'Facebook Video';
    const finalThumbnail = thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
    const finalHdUrl = hdUrl || sdUrl;
    const finalSdUrl = sdUrl || finalHdUrl;
    const finalAudioUrl = audioUrl || finalHdUrl;
    const finalAuthor = author || 'Facebook Creator';
    const finalDuration = duration || 'Original Video';

    const safeTitleSlug = finalTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);

    return NextResponse.json({
      success: true,
      data: {
        id: 'fb_' + Date.now(),
        originalUrl: cleanUrl,
        title: finalTitle,
        author: finalAuthor,
        views: 'Public Video',
        duration: finalDuration,
        thumbnail: finalThumbnail,
        qualities: {
          hd: {
            quality: '1080p HD',
            url: finalHdUrl,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalHdUrl)}&filename=${encodeURIComponent(safeTitleSlug)}_1080p.mp4&type=video`,
            size: 'Original HD',
            format: 'MP4',
          },
          sd: {
            quality: '720p Normal',
            url: finalSdUrl,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalSdUrl)}&filename=${encodeURIComponent(safeTitleSlug)}_720p.mp4&type=video`,
            size: 'Original SD',
            format: 'MP4',
          },
          audio: {
            quality: 'Audio Stream',
            url: finalAudioUrl,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalAudioUrl)}&filename=${encodeURIComponent(safeTitleSlug)}_audio.mp3&type=audio`,
            size: 'Audio MP3',
            format: 'MP3',
          },
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process Facebook video link.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
