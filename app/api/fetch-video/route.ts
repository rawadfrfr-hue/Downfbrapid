import { NextRequest, NextResponse } from 'next/server';

const MOCK_MEDIA_ITEMS = [
  {
    title: '4K Nature Timelapse - Sunset & Ocean Waves',
    author: 'Media Channel',
    views: '1.2M views',
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
    title: 'Technology & Automation Showcase',
    author: 'Tech Media',
    views: '500K views',
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
    const payload = await req.json();
    const rawTargetUrl = payload?.url;
    const isDemoMode = Boolean(payload?.isDemo);

    if (!rawTargetUrl || typeof rawTargetUrl !== 'string' || !rawTargetUrl.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid video link.' },
        { status: 400 }
      );
    }

    const sanitizedUrl = rawTargetUrl.trim();

    if (isDemoMode || sanitizedUrl.includes('demo-sample-test')) {
      const sample = MOCK_MEDIA_ITEMS[0];
      return NextResponse.json({
        success: true,
        data: {
          id: 'v_' + Date.now(),
          originalUrl: sanitizedUrl,
          title: sample.title,
          author: sample.author,
          views: sample.views,
          duration: sample.duration,
          thumbnail: sample.thumbnail,
          qualities: {
            hd: {
              quality: '1080p HD',
              url: sample.hdUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.hdUrl)}&filename=Video_1080p.mp4&type=video`,
              size: sample.hdSize,
              format: 'MP4',
            },
            sd: {
              quality: '720p Normal',
              url: sample.sdUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.sdUrl)}&filename=Video_720p.mp4&type=video`,
              size: sample.sdSize,
              format: 'MP4',
            },
            audio: {
              quality: 'Audio MP3',
              url: sample.audioUrl,
              downloadUrl: `/api/download?url=${encodeURIComponent(sample.audioUrl)}&filename=Audio.mp3&type=audio`,
              size: sample.audioSize,
              format: 'MP3',
            },
          },
        },
      });
    }

    let parsedTitle = '';
    let parsedThumbnail = '';
    let highDefUrl = '';
    let standardDefUrl = '';
    let audioStreamUrl = '';
    let videoLength = '';
    let uploaderName = '';
    let serviceErr = '';

    const apiAuthToken = process.env.RAPIDAPI_KEY || '';
    const apiHostDomain = 'facebook-reel-and-video-downloader.p.rapidapi.com';
    const serviceRequestEndpoint = `https://${apiHostDomain}/app/main.php?url=${encodeURIComponent(sanitizedUrl)}`;

    if (apiAuthToken) {
      try {
        const abortCtrl = new AbortController();
        const timeoutId = setTimeout(() => abortCtrl.abort(), 8000);

        const httpRes = await fetch(serviceRequestEndpoint, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiAuthToken,
            'x-rapidapi-host': apiHostDomain,
          },
          signal: abortCtrl.signal,
        });

        clearTimeout(timeoutId);

        if (httpRes.ok) {
          const resBody = await httpRes.text();
          try {
            const dataObj = JSON.parse(resBody);

            if (dataObj.error) {
              serviceErr = typeof dataObj.error === 'string' ? dataObj.error : 'Video is unavailable or private.';
            }

            if (dataObj.title) parsedTitle = dataObj.title;
            else if (dataObj.caption) parsedTitle = dataObj.caption;
            else if (dataObj.description) parsedTitle = dataObj.description;

            if (dataObj.thumbnail) parsedThumbnail = dataObj.thumbnail;
            else if (dataObj.picture) parsedThumbnail = dataObj.picture;
            else if (dataObj.cover) parsedThumbnail = dataObj.cover;

            if (dataObj.links && typeof dataObj.links === 'object') {
              highDefUrl = dataObj.links['Download High Quality'] || dataObj.links['High Quality'] || dataObj.links['HD'] || dataObj.links.hd || dataObj.links['720p'] || dataObj.links['1080p'] || '';
              standardDefUrl = dataObj.links['Download Low Quality'] || dataObj.links['Low Quality'] || dataObj.links['SD'] || dataObj.links.sd || dataObj.links['360p'] || '';
              audioStreamUrl = dataObj.links['Download Audio'] || dataObj.links['Audio'] || dataObj.links.mp3 || dataObj.links.audio || '';
            }

            if (dataObj.media && Array.isArray(dataObj.media) && dataObj.media.length > 0) {
              const item = dataObj.media[0];
              if (item.hd_url) highDefUrl = highDefUrl || item.hd_url;
              if (item.sd_url) standardDefUrl = standardDefUrl || item.sd_url;
            }

            if (dataObj.hd || dataObj.hd_url) highDefUrl = highDefUrl || dataObj.hd || dataObj.hd_url;
            if (dataObj.sd || dataObj.sd_url) standardDefUrl = standardDefUrl || dataObj.sd || dataObj.sd_url;
            if (dataObj.audio || dataObj.mp3 || dataObj.audio_url) audioStreamUrl = audioStreamUrl || dataObj.audio || dataObj.mp3 || dataObj.audio_url;

            if (dataObj.author || dataObj.owner) uploaderName = dataObj.author || dataObj.owner;
            if (dataObj.duration || dataObj.time) videoLength = dataObj.duration || dataObj.time;
          } catch {
            // Json parse fail
          }
        }
      } catch (e) {
        console.error('Provider fetch failed:', e);
      }
    }

    if (!highDefUrl && !standardDefUrl) {
      try {
        const abortCtrl = new AbortController();
        const timeoutId = setTimeout(() => abortCtrl.abort(), 4000);

        const pageRes = await fetch(sanitizedUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          signal: abortCtrl.signal,
        });

        clearTimeout(timeoutId);

        if (pageRes.ok) {
          const htmlContent = await pageRes.text();

          if (!parsedTitle) {
            const matchedTitle = htmlContent.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                                 htmlContent.match(/<title>([^<]+)<\/title>/i);
            if (matchedTitle && matchedTitle[1]) {
              parsedTitle = matchedTitle[1].replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            }
          }

          if (!parsedThumbnail) {
            const matchedImg = htmlContent.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (matchedImg && matchedImg[1]) {
              parsedThumbnail = matchedImg[1].replace(/&amp;/g, '&');
            }
          }

          const matchedHd = htmlContent.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                            htmlContent.match(/<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/i) ||
                            htmlContent.match(/"browser_native_hd_url":"([^"]+)"/i) ||
                            htmlContent.match(/"playable_url_quality_hd":"([^"]+)"/i);
          if (matchedHd && matchedHd[1]) {
            highDefUrl = matchedHd[1].replace(/\\/g, '').replace(/&amp;/g, '&');
          }

          const matchedSd = htmlContent.match(/"browser_native_sd_url":"([^"]+)"/i) ||
                            htmlContent.match(/"playable_url":"([^"]+)"/i);
          if (matchedSd && matchedSd[1]) {
            standardDefUrl = matchedSd[1].replace(/\\/g, '').replace(/&amp;/g, '&');
          }
        }
      } catch {
        // Fallback fail
      }
    }

    if (!highDefUrl && !standardDefUrl) {
      const displayErrMsg = serviceErr || 'Could not process this video link. The video may be private, restricted, or unavailable.';
      return NextResponse.json(
        { success: false, error: displayErrMsg },
        { status: 422 }
      );
    }

    const finalTitle = parsedTitle.trim() || 'Facebook Video';
    const finalThumb = parsedThumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
    const finalHd = highDefUrl || standardDefUrl;
    const finalSd = standardDefUrl || finalHd;
    const finalAudio = audioStreamUrl || finalHd;
    const finalAuthor = uploaderName || 'Content Creator';
    const finalDuration = videoLength || 'Original Video';

    const cleanSlug = finalTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);

    return NextResponse.json({
      success: true,
      data: {
        id: 'v_' + Date.now(),
        originalUrl: sanitizedUrl,
        title: finalTitle,
        author: finalAuthor,
        views: 'Public Video',
        duration: finalDuration,
        thumbnail: finalThumb,
        qualities: {
          hd: {
            quality: '1080p HD',
            url: finalHd,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalHd)}&filename=${encodeURIComponent(cleanSlug)}_1080p.mp4&type=video`,
            size: 'Original HD',
            format: 'MP4',
          },
          sd: {
            quality: '720p Normal',
            url: finalSd,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalSd)}&filename=${encodeURIComponent(cleanSlug)}_720p.mp4&type=video`,
            size: 'Original SD',
            format: 'MP4',
          },
          audio: {
            quality: 'Audio Stream',
            url: finalAudio,
            downloadUrl: `/api/download?url=${encodeURIComponent(finalAudio)}&filename=${encodeURIComponent(cleanSlug)}_audio.mp3&type=audio`,
            size: 'Audio MP3',
            format: 'MP3',
          },
        },
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server processing error.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
