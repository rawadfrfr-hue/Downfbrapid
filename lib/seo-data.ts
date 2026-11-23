import type { Metadata } from 'next';
import { PLATFORMS, PagePlatform } from './platforms';

const DEFAULT_SITE_URL = 'https://savevibe.bond';

function normalizeSiteUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '').trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '/') {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const SITE_URL =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeSiteUrl(process.env.VERCEL_URL) ||
  normalizeSiteUrl(process.env.APP_URL) ||
  DEFAULT_SITE_URL;

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

export function getMetadataBase(): URL {
  try {
    return new URL(SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface HowToStepItem {
  title: string;
  description: string;
}

export interface PlatformSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  featuresSubtitle: string;
  features: [FeatureItem, FeatureItem, FeatureItem];
  guideBadge: string;
  guideTitle: string;
  guideParagraphs: string[];
  supportedFormats: string[];
  howToSteps: [HowToStepItem, HowToStepItem, HowToStepItem];
  faqs: FAQItem[];
}

export const SEO_DATA: Record<PagePlatform, PlatformSeoConfig> = {
  home: {
    title: 'Save Vibe - Free Social Media Video Downloader Online',
    description:
      'Download Facebook, YouTube, Instagram, and TikTok videos free in HD MP4 or MP3 with Save Vibe. Fast, secure, ad-free, and no login required.',
    canonicalUrl: `${SITE_URL}/`,
    keywords: [
      'Save Vibe',
      'social media video downloader',
      'online video downloader',
      'download Facebook videos HD',
      'YouTube video downloader',
      'Instagram Reels downloader',
      'TikTok downloader no watermark',
    ],
    ogTitle: 'Save Vibe - Free Social Media Video Downloader Online',
    ogDescription:
      'Download public Facebook, YouTube, Instagram, and TikTok videos in Full HD MP4 or MP3 with Save Vibe. Zero ads, fast processing, and works on any device.',
    featuresSubtitle:
      'One unified platform built to detect links automatically and deliver fast, clean media downloads',
    features: [
      {
        title: 'Smart Auto-Detection',
        description:
          'Paste any public link from Facebook, YouTube, Instagram, or TikTok and Save Vibe automatically recognizes the source and prepares downloadable streams.',
      },
      {
        title: 'Full HD MP4 & MP3',
        description:
          'Choose from crisp 1080p Full HD, 720p HD, standard MP4, watermark-free TikTok downloads, or extracted MP3 audio tracks in a single click.',
      },
      {
        title: 'Private & Ad-Free Utility',
        description:
          'Save Vibe runs directly in your web browser over encrypted HTTPS connections with zero pop-up ads, zero software installs, and zero URL logging.',
      },
    ],
    guideBadge: 'All-in-One Media Saver',
    guideTitle: 'Why Creators and Everyday Users Choose Save Vibe',
    guideParagraphs: [
      'Save Vibe brings four dedicated social video downloaders and a live YouTube transcript extractor together inside one fast, clutter-free web application. Instead of jumping between sketchy pop-up sites for each network, you can paste any public video URL right here or switch to a specialized platform tool from the top menu.',
      'Our server-side extraction pipeline parses public video metadata and streams directly from content delivery networks, preserving original resolution, frame rate, and clear stereo audio. For high-definition YouTube videos that separate video and audio tracks, Save Vibe safely merges them right inside your browser so your final MP4 plays smoothly on iPhone, Android, Windows, and macOS.',
      'Everything works 100% online without browser extensions, desktop software, or account logins. Whether you are archiving educational clips, saving viral Reels for offline viewing, backing up your own content, or extracting clean MP3 audio, Save Vibe keeps your downloads fast, reliable, and strictly private.',
    ],
    supportedFormats: [
      'MP4 Video (4K, 1080p Full HD, 720p HD, 480p SD)',
      'TikTok Watermark-Free HD & Standard MP4',
      'MP3 & M4A Audio Extraction',
      'YouTube Shorts, Instagram Reels & Facebook Watch Clips',
      'YouTube Time-Synced Captions (TXT, SRT, VTT, PDF, CSV)',
    ],
    howToSteps: [
      {
        title: 'Copy Any Public Video Link',
        description:
          'Open Facebook, YouTube, Instagram, or TikTok and copy the share link of the public video, Reel, or Short you want to save.',
      },
      {
        title: 'Paste URL Into Save Vibe',
        description:
          'Paste the copied link into the Save Vibe search bar above and click Download. Our system automatically detects the platform.',
      },
      {
        title: 'Pick Format & Save File',
        description:
          'Preview the video details, choose your preferred HD MP4 resolution or MP3 audio option, and save the file directly to your device.',
      },
    ],
    faqs: [
      {
        question: 'Which platforms does Save Vibe support?',
        answer:
          'Save Vibe supports public videos from Facebook (Reels, Watch, and feed posts), YouTube (standard videos, Shorts, and transcripts), Instagram (Reels, IGTV, and video posts), and TikTok (watermark-free HD and Standard MP4).',
      },
      {
        question: 'Is Save Vibe completely free and safe to use?',
        answer:
          'Yes. Save Vibe is 100% free with unlimited downloads, no registration, no pop-up ads, and HTTPS-encrypted connections. We never store the links you paste or track personal accounts.',
      },
      {
        question: 'Does Save Vibe work on iPhone, Android, and desktop?',
        answer:
          'Yes! Save Vibe works natively in Safari, Chrome, Edge, and Firefox across iOS, Android, Windows, and macOS without installing any app or browser extension.',
      },
      {
        question: 'Can I download private or copyrighted content?',
        answer:
          'No. Save Vibe only accesses publicly available video streams and is intended strictly for personal offline archiving of content you own or have permission to save.',
      },
    ],
  },
  facebook: {
    title: 'Facebook Video Downloader - Save FB Reels & Videos HD',
    description:
      'Download Facebook videos, reels, and watch clips in 1080p Full HD & MP3. Free, fast, and secure online FB downloader with no login required.',
    canonicalUrl: `${SITE_URL}/facebook`,
    keywords: [
      'Facebook video downloader',
      'Download FB videos HD',
      'Facebook reels downloader',
      'Free Facebook video saver',
      'FB video to MP4',
      'Facebook Watch downloader 1080p',
    ],
    ogTitle: 'Facebook Video Downloader - Save FB Reels & Videos HD | Save Vibe',
    ogDescription:
      'Effortlessly download public Facebook videos, Reels, and Watch clips in Full HD MP4 or MP3 with Save Vibe. Free, fast, and zero software installation.',
    featuresSubtitle:
      'Built for fast, reliable Facebook Watch, Reels, and public feed video downloads in full clarity',
    features: [
      {
        title: '1080p Full HD & SD',
        description:
          'Save public Facebook Watch videos, Reels, and live replay clips in crisp 1080p Full HD or lightweight 720p/480p MP4 depending on your storage needs.',
      },
      {
        title: 'Fast CDN Proxy Streaming',
        description:
          'Save Vibe streams Facebook media directly through a secure download proxy with proper filenames so files save cleanly instead of opening in a dead tab.',
      },
      {
        title: 'No Facebook Login Needed',
        description:
          'Keep your Facebook account completely separate. Paste any public fb.watch or facebook.com link anonymously without cookies or third-party permissions.',
      },
    ],
    guideBadge: 'Facebook Media Guide',
    guideTitle: 'Save Facebook Videos, Reels & Watch Clips Effortlessly',
    guideParagraphs: [
      'The Save Vibe Facebook Video Downloader is built to handle every public Facebook video format, including standard timeline uploads, Facebook Reels, Facebook Watch episodes, and short fb.watch share links. Whether you are saving a cooking tutorial, an educational talk, or your own archived page clip, our parser extracts both high-definition MP4 streams and audio-only tracks cleanly.',
      'Unlike desktop extensions that slow down your browser or mobile apps packed with intrusive ads, Save Vibe works straight inside Chrome, Safari, or Firefox. Once you click Download, our server proxy attaches clean download headers so iOS, Android, Windows, and Mac browsers save the MP4 file directly into your Downloads folder or gallery.',
      'Because we strictly respect user privacy and platform rules, Save Vibe only works with publicly accessible Facebook posts. Private group videos or friends-only uploads are intentionally blocked to protect creator privacy.',
    ],
    supportedFormats: [
      'facebook.com/watch & fb.watch short links',
      'Facebook Reels (facebook.com/reel/...)',
      'Public Facebook Page & Profile video posts',
      '1080p Full HD, 720p HD, and Standard MP4',
      'Audio-only MP3/M4A extraction',
    ],
    howToSteps: [
      {
        title: 'Copy Facebook Video Link',
        description:
          'Open the Facebook app or website, tap Share on the public video or Reel, and select Copy Link.',
      },
      {
        title: 'Paste Link in Save Vibe',
        description:
          'Paste the copied Facebook URL into the input box above and press the Download button.',
      },
      {
        title: 'Choose HD or MP3 Quality',
        description:
          'Select 1080p Full HD MP4, Standard MP4, or MP3 Audio to save the Facebook clip straight to your device.',
      },
    ],
    faqs: [
      {
        question: 'How do I download Facebook videos in 1080p HD quality?',
        answer:
          'Copy the public video link from Facebook, paste it into the Save Vibe Facebook Downloader search bar, click Download, and pick the 1080p Full HD or 720p HD MP4 option when the quality card appears.',
      },
      {
        question: 'Can I download Facebook Reels and Watch clips on mobile?',
        answer:
          'Yes. Save Vibe is fully responsive for iPhone (Safari), Android (Chrome), PC, and Mac browsers so you can save public Facebook Reels and Watch videos directly to your phone.',
      },
      {
        question: 'Why did a private Facebook video link fail to download?',
        answer:
          'Save Vibe only processes public Facebook videos that do not require logging in. Videos set to "Friends Only" or inside private groups cannot be accessed without authentication.',
      },
      {
        question: 'Is Save Vibe Facebook Video Downloader free to use?',
        answer:
          'Yes, it is 100% free with unlimited downloads. You never need to sign up, install browser extensions, or share your Facebook credentials.',
      },
    ],
  },
  youtube: {
    title: 'YouTube Video Downloader - Save YT Shorts & MP4 in HD',
    description:
      'Download YouTube videos, Shorts, and audio tracks in 4K, 1080p HD MP4 or 320kbps MP3. Fast, free Save Vibe YouTube downloader with no login.',
    canonicalUrl: `${SITE_URL}/youtube`,
    keywords: [
      'YouTube video downloader',
      'Download YouTube Shorts',
      'YouTube to MP4 HD',
      'YouTube video saver free',
      'YouTube MP3 audio extractor',
      'Fast YT downloader online',
    ],
    ogTitle: 'YouTube Video Downloader - Save YT Shorts & MP4 in HD | Save Vibe',
    ogDescription:
      'Save public YouTube videos, Shorts, and audio clips in 4K, 1080p Full HD MP4, or MP3 using Save Vibe. Free, fast, and works right in your browser.',
    featuresSubtitle:
      'Engineered for high-definition YouTube videos, vertical Shorts, and crisp MP3 audio extraction',
    features: [
      {
        title: '4K, 1080p & Shorts Support',
        description:
          'Download crisp 4K, 1080p Full HD, and 720p YouTube videos or vertical YouTube Shorts with smooth in-browser video and audio merging.',
      },
      {
        title: 'Clear Audio Extraction',
        description:
          'Extract clean MP3 and M4A audio tracks from lectures, podcasts, and music clips for effortless offline listening on any device.',
      },
      {
        title: 'Transcripts Included',
        description:
          'Need text instead of video? Switch to our dedicated YouTube Transcript Downloader to export time-synced TXT, SRT, VTT, PDF, or CSV captions.',
      },
    ],
    guideBadge: 'YouTube Downloader Guide',
    guideTitle: 'Download YouTube Videos, Shorts & Audio Without Software',
    guideParagraphs: [
      'Save Vibe makes saving public YouTube videos and vertical YouTube Shorts simple across desktop and mobile browsers. Whether you use a standard youtube.com/watch URL, a shortened youtu.be link, or a youtube.com/shorts link, our extractor retrieves all available video resolutions alongside clean audio-only streams.',
      'Modern YouTube 1080p and 4K streams split video and audio into separate high-bitrate tracks. Save Vibe handles this automatically with built-in client-side FFmpeg merging, combining crisp video with synchronized audio right inside your browser before saving a single compatible MP4 file.',
      'If you are studying a lecture, researching an interview, or creating subtitles, you can also open the integrated Save Vibe YouTube Transcript Downloader to search spoken keywords, translate captions into 40+ languages, and download clean subtitle files.',
    ],
    supportedFormats: [
      'Standard youtube.com/watch?v=... & youtu.be/... links',
      'YouTube Shorts (youtube.com/shorts/...)',
      '1080p Full HD, 720p HD, and 360p/480p MP4',
      'High-bitrate MP3 & M4A audio tracks',
      'Built-in link to YouTube Transcript & Subtitle Extractor',
    ],
    howToSteps: [
      {
        title: 'Copy YouTube Video or Shorts URL',
        description:
          'Open YouTube, tap Share on any public video or Short, and copy the URL to your clipboard.',
      },
      {
        title: 'Paste Into Save Vibe Downloader',
        description:
          'Paste the YouTube URL in the field above and click Download to fetch available video and audio qualities.',
      },
      {
        title: 'Select Resolution & Save',
        description:
          'Pick 1080p HD MP4, 720p MP4, or MP3 Audio. High-definition streams merge cleanly and download straight to your device.',
      },
    ],
    faqs: [
      {
        question: 'How do I download YouTube Shorts and videos for free?',
        answer:
          'Copy the YouTube video or Shorts link, paste it into the Save Vibe YouTube Downloader input box, choose your preferred MP4 resolution, and click Download.',
      },
      {
        question: 'Why does 1080p YouTube video show a brief merge progress?',
        answer:
          'YouTube serves 1080p and higher resolutions as separate video and audio streams. Save Vibe automatically merges both streams cleanly in your browser so your saved MP4 has full sound.',
      },
      {
        question: 'Can I extract MP3 audio from YouTube videos?',
        answer:
          'Yes. Every compatible YouTube link displays an audio extraction option so you can save lectures, podcasts, and soundtracks for offline playback.',
      },
      {
        question: 'Can I also download YouTube captions or transcripts?',
        answer:
          'Yes! Click "Open YouTube Transcript Downloader" right below the input box to extract, translate, search, and export captions in TXT, SRT, VTT, PDF, or CSV formats.',
      },
    ],
  },
  instagram: {
    title: 'Instagram Video Downloader - Save IG Reels & Video HD',
    description:
      'Download Instagram Reels, IGTV, and video posts in original Full HD MP4 quality. Fast, free, and private Save Vibe Instagram downloader online.',
    canonicalUrl: `${SITE_URL}/instagram`,
    keywords: [
      'Instagram video downloader',
      'Download Instagram Reels',
      'IG Reel saver HD',
      'Instagram IGTV downloader',
      'Instagram video to MP4',
      'Save IG videos online',
    ],
    ogTitle: 'Instagram Video Downloader - Save IG Reels & Video HD | Save Vibe',
    ogDescription:
      'Download public Instagram Reels, video posts, and IGTV clips in crisp HD MP4 quality with Save Vibe. Free, anonymous, and instant browser download.',
    featuresSubtitle:
      'Designed for crisp Instagram Reels, IGTV, and public video post downloads with zero quality loss',
    features: [
      {
        title: 'Original HD Reels Quality',
        description:
          'Save public Instagram Reels and feed videos in their original aspect ratio and sharp HD MP4 clarity without re-encoding blur.',
      },
      {
        title: 'Anonymous & Login-Free',
        description:
          'Download public Instagram clips without signing into your IG account, sharing passwords, or leaving any trace.',
      },
      {
        title: 'Direct Mobile Gallery Save',
        description:
          'Works smoothly in mobile Safari and Android Chrome so saved Reels and tutorials land straight in your device Downloads or Camera Roll.',
      },
    ],
    guideBadge: 'Instagram Reels Guide',
    guideTitle: 'Save Instagram Reels, IGTV & Public Video Posts in HD',
    guideParagraphs: [
      'Save Vibe gives creators, social media managers, and everyday viewers a fast, reliable way to download public Instagram Reels, IGTV clips, and feed video posts directly in their web browser. Simply copy the share link from Instagram and paste it above—no risky third-party mobile apps or Instagram login credentials required.',
      'Unlike screen-recording methods that capture UI buttons, lower frame rates, or introduce audio sync issues, Save Vibe fetches the original CDN MP4 stream directly. That preserves crisp vertical 9:16 framing and clear sound for offline inspiration boards or personal archiving.',
      'Please note that Save Vibe strictly respects user privacy settings on Instagram. Only public posts and Reels can be fetched; private Instagram accounts cannot be accessed.',
    ],
    supportedFormats: [
      'Instagram Reels (instagram.com/reel/...)',
      'Instagram Video Posts (instagram.com/p/...)',
      'IGTV & Long-Form Public Clips (instagram.com/tv/...)',
      'Original HD MP4 Video + Stereo Audio',
      'Mobile & Desktop Browser Compatibility (iOS, Android, PC, Mac)',
    ],
    howToSteps: [
      {
        title: 'Copy Instagram Reel or Post Link',
        description:
          'Open Instagram, tap the Share or three-dot icon on a public Reel or video post, and choose Copy Link.',
      },
      {
        title: 'Paste Link Into Save Vibe',
        description:
          'Paste the Instagram link into the Save Vibe search bar above and click Download.',
      },
      {
        title: 'Save Original HD MP4',
        description:
          'Choose the HD MP4 option from the result card to download the Instagram video straight to your phone or computer.',
      },
    ],
    faqs: [
      {
        question: 'How do I download Instagram Reels without installing an app?',
        answer:
          'Copy the share link of the public Instagram Reel, paste it into the Save Vibe Instagram Downloader box, and click Download to save the MP4 file directly in your browser.',
      },
      {
        question: 'Do I need to log into my Instagram account?',
        answer:
          'No login or password is required. Save Vibe fetches publicly accessible Instagram Reels and video posts completely anonymously.',
      },
      {
        question: 'Can I download videos from a private Instagram profile?',
        answer:
          'No. For privacy and security reasons, Save Vibe only downloads content from public Instagram accounts and cannot access private posts.',
      },
      {
        question: 'Are downloaded Instagram videos saved in original quality?',
        answer:
          'Yes. Save Vibe delivers the original high-definition MP4 stream provided by Instagram CDN servers without adding any watermark or reducing resolution.',
      },
    ],
  },
  tiktok: {
    title: 'TikTok Video Downloader Without Watermark - Save Vibe',
    description:
      'Download TikTok videos without watermark in HD MP4 or MP3 audio with Save Vibe. Free, ultra-fast online TikTok video saver for mobile & desktop.',
    canonicalUrl: `${SITE_URL}/tiktok`,
    keywords: [
      'TikTok video downloader',
      'Download TikTok without watermark',
      'TikTok video saver HD',
      'TikTok no watermark MP4',
      'Free TikTok downloader online',
      'Save TikTok videos mobile',
    ],
    ogTitle: 'TikTok Video Downloader Without Watermark - Save Vibe',
    ogDescription:
      'Download TikTok videos in HD MP4 without watermark using Save Vibe. Free, fast, direct browser downloads for iPhone, Android, and desktop.',
    featuresSubtitle:
      'Built to deliver clean, watermark-free TikTok videos in HD and Standard MP4 on any device',
    features: [
      {
        title: 'Zero TikTok Watermark',
        description:
          'Remove the bouncing TikTok logo and username overlay automatically so your saved TikTok clips look clean and unobstructed.',
      },
      {
        title: 'HD & Standard MP4 Options',
        description:
          'Pick High Quality (without watermark) for maximum sharpness or Standard Quality for smaller file sizes and quick mobile sharing.',
      },
      {
        title: 'Works With Short Links',
        description:
          'Paste full tiktok.com/@user/video/... URLs or shortened vm.tiktok.com and vt.tiktok.com share links copied directly from the TikTok app.',
      },
    ],
    guideBadge: 'TikTok Watermark-Free Guide',
    guideTitle: 'Download Clean TikTok Videos Without Watermark on Any Device',
    guideParagraphs: [
      'Save Vibe makes it effortless to save public TikTok videos without the distracting floating TikTok watermark or end-card tag. Just tap Share and Copy Link inside the TikTok mobile app or desktop browser, paste the URL above, and get clean MP4 streams in seconds.',
      'Whether you use a full tiktok.com video address or a short vm.tiktok.com / vt.tiktok.com link, Save Vibe resolves the original video feed and gives you both High Quality (without watermark) and Standard Quality (without watermark) MP4 choices. You can preview the video metadata, creator handle, and estimated file size before saving.',
      'All downloads route cleanly through our secure download proxy so iOS Safari, Android Chrome, and desktop browsers save the MP4 directly without pop-ups or redirects. Use saved clips responsibly for personal offline viewing or your own creator backups.',
    ],
    supportedFormats: [
      'tiktok.com/@username/video/... full URLs',
      'Short vm.tiktok.com/... and vt.tiktok.com/... mobile links',
      'High Quality HD MP4 (No Watermark)',
      'Standard Quality MP4 (No Watermark)',
      'Direct iPhone, Android, Windows & macOS browser downloads',
    ],
    howToSteps: [
      {
        title: 'Copy TikTok Video Link',
        description:
          'Open the TikTok app or website, tap the Share arrow on the video you want, and select Copy Link.',
      },
      {
        title: 'Paste Link Into Save Vibe',
        description:
          'Paste your tiktok.com or vm.tiktok.com link into the input bar above and click Download.',
      },
      {
        title: 'Download Watermark-Free MP4',
        description:
          'Choose High Quality or Standard Quality (without watermark) to save the clean MP4 video directly to your device.',
      },
    ],
    faqs: [
      {
        question: 'How do I download TikTok videos without watermark?',
        answer:
          'Tap Share and Copy Link on any public TikTok video, paste the URL into Save Vibe TikTok Downloader, and click High Quality (without watermark) to save a clean MP4.',
      },
      {
        question: 'Does Save Vibe work with vm.tiktok.com and vt.tiktok.com links?',
        answer:
          'Yes! Save Vibe automatically resolves shortened mobile share links (vm.tiktok.com and vt.tiktok.com) as well as full desktop TikTok URLs.',
      },
      {
        question: 'Where are saved TikTok videos stored on my phone?',
        answer:
          'Downloaded MP4 files are saved to your browser Downloads folder on Android, Windows, and Mac, or inside the Files / Downloads manager on iPhone Safari where you can save them to Photos.',
      },
      {
        question: 'Is there any limit on how many TikTok videos I can save?',
        answer:
          'No. Save Vibe is free to use with unlimited watermark-free TikTok downloads and no account registration required.',
      },
    ],
  },
};

export const TRANSCRIPT_SEO = {
  title: 'YouTube Transcript Downloader - Save Vibe TXT & SRT',
  description:
    'Extract time-synced YouTube video transcripts in seconds. Search keywords, translate to 40+ languages, and export TXT, SRT, VTT, PDF, or CSV.',
  canonicalUrl: `${SITE_URL}/youtube-transcript`,
  ogTitle: 'YouTube Transcript Downloader - Save Vibe TXT & SRT',
  ogDescription:
    'Extract YouTube captions in seconds, translate into 40+ languages, transliterate scripts, and download as TXT, SRT, VTT, PDF, or CSV with Save Vibe.',
  faqs: [
    {
      question: 'How does transcript translation work in Save Vibe?',
      answer:
        'You can translate extracted YouTube captions into 40+ languages directly inside the workspace while keeping every single line aligned with its original video timestamp.',
    },
    {
      question: 'What does Transliterate (A–Z) do?',
      answer:
        'Transliteration keeps the transcript in the same spoken language (such as Bengali, Hindi, Arabic, Urdu, Japanese, or Korean) while converting the script into readable English letters right in your browser.',
    },
    {
      question: 'Which transcript export formats are supported?',
      answer:
        'Original, translated, and transliterated transcripts can be copied to your clipboard or downloaded as Plain Text (.txt), SubRip (.srt), WebVTT (.vtt), PDF (.pdf), or CSV (.csv) with or without timestamps.',
    },
    {
      question: 'Do PDF and CSV exports support non-Latin scripts?',
      answer:
        'Yes. Both CSV and PDF exports support Unicode scripts including Bengali, Hindi, Arabic, Japanese, Korean, and European languages cleanly.',
    },
  ],
  howToSteps: [
    {
      title: 'Paste YouTube Video or Shorts URL',
      description:
        'Copy any public YouTube video or Shorts link that has captions or auto-generated subtitles and paste it into the extractor.',
    },
    {
      title: 'Search, Translate, or Transliterate',
      description:
        'Use live keyword search to jump to exact moments, translate captions into 40+ languages, or toggle A–Z transliteration.',
    },
    {
      title: 'Copy or Export Subtitles & Text',
      description:
        'Click Copy All or export your transcript in TXT, SRT, VTT, PDF, or CSV format with optional timestamps.',
    },
  ],
};

export function generatePageMetadata(platform: PagePlatform): Metadata {
  const data = SEO_DATA[platform];
  const platformConfig =
    platform === 'home' ? null : PLATFORMS[platform];

  return {
    title: {
      absolute: data.title,
    },
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: data.canonicalUrl,
    },
    icons:
      platform === 'home' || !platformConfig
        ? {
            icon: [
              { url: '/favicons/search-logo-96.png', sizes: '96x96', type: 'image/png' },
              { url: '/favicons/search-logo-192.png', sizes: '192x192', type: 'image/png' },
            ],
            shortcut: '/favicon.ico',
            apple: '/favicons/apple-touch-icon.png',
          }
        : {
            icon: [
              { url: platformConfig.faviconPath, type: 'image/svg+xml' },
              { url: '/favicons/search-logo-96.png', sizes: '96x96', type: 'image/png' },
              { url: '/favicons/search-logo-192.png', sizes: '192x192', type: 'image/png' },
            ],
            shortcut: '/favicon.ico',
            apple: '/favicons/apple-touch-icon.png',
          },
    openGraph: {
      title: data.ogTitle,
      description: data.ogDescription,
      url: data.canonicalUrl,
      siteName: 'Save Vibe',
      type: 'website',
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: `${data.ogTitle}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle,
      description: data.ogDescription,
      images: [OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateTranscriptMetadata(): Metadata {
  return {
    title: {
      absolute: TRANSCRIPT_SEO.title,
    },
    description: TRANSCRIPT_SEO.description,
    keywords: [
      'YouTube transcript downloader',
      'YouTube subtitle extractor',
      'YouTube captions to TXT SRT VTT',
      'translate YouTube transcript',
      'Save Vibe transcript tool',
    ],
    alternates: {
      canonical: TRANSCRIPT_SEO.canonicalUrl,
    },
    icons: {
      icon: [
        { url: '/favicons/youtube.svg', type: 'image/svg+xml' },
        { url: '/favicons/search-logo-96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicons/search-logo-192.png', sizes: '192x192', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/favicons/apple-touch-icon.png',
    },
    openGraph: {
      title: TRANSCRIPT_SEO.ogTitle,
      description: TRANSCRIPT_SEO.ogDescription,
      url: TRANSCRIPT_SEO.canonicalUrl,
      siteName: 'Save Vibe',
      type: 'website',
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: TRANSCRIPT_SEO.ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: TRANSCRIPT_SEO.ogTitle,
      description: TRANSCRIPT_SEO.ogDescription,
      images: [OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateLegalMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: {
      absolute: opts.title,
    },
    description: opts.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: 'Save Vibe',
      type: 'website',
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: opts.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateJsonLdSchema(platform: PagePlatform) {
  const data = SEO_DATA[platform];
  const isHome = platform === 'home';
  const pageUrl = data.canonicalUrl;
  const platformName = isHome
    ? 'Social Media Video'
    : platform.charAt(0).toUpperCase() + platform.slice(1);

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Save Vibe',
    description: 'Fast & Free Social Media Video Downloader',
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: data.title,
    description: data.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: isHome
      ? [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
        ]
      : [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${platformName} Downloader`,
            item: pageUrl,
          },
        ],
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: isHome ? 'Save Vibe Video Downloader' : `Save Vibe ${platformName} Downloader`,
    operatingSystem: 'All',
    applicationCategory: 'MultimediaApplication',
    url: pageUrl,
    description: data.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isHome
      ? 'How to Download Social Media Videos Online with Save Vibe'
      : `How to Download ${platformName} Videos Online`,
    description: data.description,
    step: data.howToSteps.map((stepItem, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: stepItem.title,
      text: stepItem.description,
    })),
  };

  return [websiteSchema, webPageSchema, breadcrumbSchema, softwareAppSchema, faqSchema, howToSchema];
}

export function generateTranscriptJsonLd() {
  const pageUrl = TRANSCRIPT_SEO.canonicalUrl;

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Save Vibe',
    description: 'Fast & Free Social Media Video Downloader',
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: TRANSCRIPT_SEO.title,
    description: TRANSCRIPT_SEO.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'YouTube Transcript Downloader',
        item: pageUrl,
      },
    ],
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Save Vibe YouTube Transcript Downloader',
    operatingSystem: 'All',
    applicationCategory: 'UtilitiesApplication',
    url: pageUrl,
    description: TRANSCRIPT_SEO.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: TRANSCRIPT_SEO.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Extract and Export YouTube Video Transcripts',
    description: TRANSCRIPT_SEO.description,
    step: TRANSCRIPT_SEO.howToSteps.map((stepItem, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: stepItem.title,
      text: stepItem.description,
    })),
  };

  return [websiteSchema, webPageSchema, breadcrumbSchema, softwareAppSchema, faqSchema, howToSchema];
}
