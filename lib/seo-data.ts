import type { Metadata } from 'next';
import { PlatformType } from './platforms';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://savevibe.com';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PlatformSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  faqs: FAQItem[];
  howToSteps: string[];
}

export const SEO_DATA: Record<PlatformType, PlatformSeoConfig> = {
  facebook: {
    title: 'Facebook Video Downloader - Save FB Videos HD Free',
    description:
      'Download Facebook videos, reels, and watch clips in 1080p Full HD & MP3. Free, fast, and secure online FB downloader with no login required.',
    canonicalUrl: `${SITE_URL}/facebook`,
    keywords: [
      'Facebook video downloader',
      'Download FB videos HD',
      'Facebook reels downloader',
      'Free Facebook video saver',
      'FB video to MP4',
      'Facebook video downloader 1080p',
    ],
    ogTitle: 'Facebook Video Downloader - Save FB Videos & Reels HD',
    ogDescription:
      'Effortlessly download public Facebook videos and reels in high definition with SaveVibe. Free, fast, and zero software installation.',
    faqs: [
      {
        question: 'How do I download Facebook videos in HD quality?',
        answer:
          'To download Facebook videos in HD, copy the video link from Facebook, paste it into the SaveVibe search bar, click Download, and select 1080p or 720p HD MP4 quality.',
      },
      {
        question: 'Can I download Facebook Reels and Watch clips on mobile?',
        answer:
          'Yes! SaveVibe is fully optimized for iOS, Android, PC, and Mac web browsers. You can save public Facebook reels and watch videos directly to your device gallery.',
      },
      {
        question: 'Is SaveVibe Facebook Video Downloader free to use?',
        answer:
          '100% free with unlimited downloads. You do not need to register, install browser extensions, or provide any personal information.',
      },
    ],
    howToSteps: [
      'Copy the link of the Facebook video or reel you want to save.',
      'Paste the copied URL into the SaveVibe Facebook Downloader input field.',
      'Click the "Download" button and choose your preferred MP4 quality (1080p HD, 720p, or MP3).',
    ],
  },
  youtube: {
    title: 'YouTube Video Downloader - Download YT Videos & Shorts HD',
    description:
      'Download YouTube videos, shorts, and audio tracks in 4K, 1080p HD MP4 and 320kbps MP3. Fast, free YouTube video downloader with high-speed CDN.',
    canonicalUrl: `${SITE_URL}/youtube`,
    keywords: [
      'YouTube video downloader',
      'Download YouTube shorts',
      'YouTube to MP4 HD',
      'YouTube video saver free',
      'YouTube audio extractor 320kbps',
      'Fast YT downloader',
    ],
    ogTitle: 'YouTube Video Downloader - Download YT Shorts & Videos HD',
    ogDescription:
      'Save public YouTube videos, shorts, and audio clips instantly in 4K, 1080p HD, or high-bitrate MP3 format using SaveVibe.',
    faqs: [
      {
        question: 'How to download YouTube Shorts and videos for free?',
        answer:
          'Copy the YouTube video or Shorts link, paste it into SaveVibe YouTube Downloader, choose your preferred video resolution, and hit Download.',
      },
      {
        question: 'Can I extract high-quality MP3 audio from YouTube videos?',
        answer:
          'Yes, SaveVibe allows instant extraction of clear MP3 audio tracks directly from public YouTube videos with high audio bitrate options.',
      },
      {
        question: 'Does SaveVibe require installing any software or app?',
        answer:
          'No installation required. SaveVibe operates entirely online via your web browser on mobile phones, tablets, and desktop computers.',
      },
    ],
    howToSteps: [
      'Open YouTube and copy the URL of the video or Short.',
      'Paste the URL into the SaveVibe YouTube Downloader box.',
      'Select video quality (4K, 1080p, 720p, or MP3) and click Download.',
    ],
  },
  instagram: {
    title: 'Instagram Video Downloader - Save IG Reels & Stories HD',
    description:
      'Download Instagram reels, IGTV, post videos, and carousel clips in original High Definition. Fast online Instagram downloader with zero quality loss.',
    canonicalUrl: `${SITE_URL}/instagram`,
    keywords: [
      'Instagram video downloader',
      'Download Instagram reels',
      'IG reel saver HD',
      'Instagram story downloader',
      'Save IGTV videos',
      'Instagram video to MP4',
    ],
    ogTitle: 'Instagram Video Downloader - Save IG Reels & Post Videos HD',
    ogDescription:
      'Download public Instagram reels, posts, and IGTV clips in crisp HD quality with SaveVibe. Free and secure with instant browser download.',
    faqs: [
      {
        question: 'How to download Instagram Reels without any app?',
        answer:
          'Copy the share link of the Instagram reel, paste it into the SaveVibe input box, and press Download to save the video directly to your photo gallery.',
      },
      {
        question: 'Is it legal and safe to download Instagram videos?',
        answer:
          'Downloading public Instagram videos for personal offline viewing is safe and secure. SaveVibe encrypts your connection and never stores personal data.',
      },
      {
        question: 'Do I need to log into my Instagram account?',
        answer:
          'No login or password required. You can download public Instagram media completely anonymously without linking your account.',
      },
    ],
    howToSteps: [
      'Open Instagram and tap "Copy Link" on the reel or video post.',
      'Paste the Instagram link into the SaveVibe search bar.',
      'Click Download and save the high-definition MP4 file to your device.',
    ],
  },
  tiktok: {
    title: 'TikTok Video Downloader Without Watermark - Save TikTok HD',
    description:
      'Download TikTok videos without watermark in HD MP4 or MP3 audio. Free, fast TikTok saver for mobile & desktop with direct download links.',
    canonicalUrl: `${SITE_URL}/tiktok`,
    keywords: [
      'TikTok video downloader',
      'Download TikTok without watermark',
      'TikTok video saver HD',
      'TikTok MP3 converter',
      'Free TikTok downloader no watermark',
      'Save TikTok videos mobile',
    ],
    ogTitle: 'TikTok Video Downloader Without Watermark - Save TikTok HD',
    ogDescription:
      'Download TikTok videos in maximum quality without watermark using SaveVibe. Direct high-speed download for mobile and desktop.',
    faqs: [
      {
        question: 'How to download TikTok videos without watermark?',
        answer:
          'Copy the video link from the TikTok app, paste it into SaveVibe TikTok Downloader, and choose the "No Watermark HD" option to save clean MP4 video.',
      },
      {
        question: 'Where are saved TikTok videos stored on my phone?',
        answer:
          'Downloaded videos are automatically saved in your browser default "Downloads" folder or your iPhone/Android photo gallery.',
      },
      {
        question: 'Can I convert and download TikTok video sound to MP3?',
        answer:
          'Yes! SaveVibe provides a direct MP3 extraction option so you can download background music and viral audio clips from TikTok.',
      },
    ],
    howToSteps: [
      'Open TikTok and click "Share" -> "Copy Link" on the video.',
      'Paste the URL into SaveVibe TikTok Downloader.',
      'Click Download and select "No Watermark MP4" or "MP3 Audio".',
    ],
  },
};

export function generatePageMetadata(platform: PlatformType): Metadata {
  const data = SEO_DATA[platform];
  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: data.canonicalUrl,
    },
    openGraph: {
      title: data.ogTitle,
      description: data.ogDescription,
      url: data.canonicalUrl,
      siteName: 'SaveVibe',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/assets/aistudio/bnrsavevibe_b7be51c6.svg`,
          width: 1200,
          height: 630,
          alt: `SaveVibe ${platform} Video Downloader`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle,
      description: data.ogDescription,
      images: [`${SITE_URL}/assets/aistudio/bnrsavevibe_b7be51c6.svg`],
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

export function generateJsonLdSchema(platform: PlatformType) {
  const data = SEO_DATA[platform];

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `SaveVibe ${platform.charAt(0).toUpperCase() + platform.slice(1)} Downloader`,
    operatingSystem: 'All',
    applicationCategory: 'MultimediaApplication',
    url: data.canonicalUrl,
    description: data.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '12850',
      bestRating: '5',
      worstRating: '1',
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
    name: `How to Download ${platform.charAt(0).toUpperCase() + platform.slice(1)} Videos`,
    description: `Step by step guide to download high quality ${platform} videos using SaveVibe online tool.`,
    step: data.howToSteps.map((stepText, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: `Step ${idx + 1}`,
      text: stepText,
    })),
  };

  return [softwareAppSchema, faqSchema, howToSchema];
}
