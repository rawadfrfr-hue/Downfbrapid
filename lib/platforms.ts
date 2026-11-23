export type PlatformType = 'facebook' | 'youtube' | 'instagram' | 'tiktok';
export type PagePlatform = 'home' | PlatformType;

export interface PlatformConfig {
  id: PagePlatform;
  name: string;
  path: string;
  heroTitle: string;
  heroSubtitle: string;
  placeholder: string;
  primaryColor: string;
  gradientBg: string;
  buttonBg: string;
  focusBorder: string;
  iconColor: string;
  badgeBg: string;
  featureIconBg: string;
  selectionClass: string;
  accentGlow: string;
  themeClass: string;
  faviconPath: string;
}

export const PLATFORMS: Record<PlatformType, PlatformConfig> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    path: '/facebook',
    heroTitle: 'Download Facebook Videos & Reels',
    heroSubtitle:
      'Effortlessly download public Facebook videos, Reels, and Watch clips in Full HD 1080p or 720p with Save Vibe. Paste your link below to save in MP4 or MP3 format.',
    placeholder: 'Paste Facebook video, Reel, or Watch URL here...',
    primaryColor: '#1877F2',
    gradientBg: 'from-[#1877F2]/10 via-[#1877F2]/5 to-transparent',
    buttonBg:
      'bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1565d8] focus-visible:ring-[#1877F2] shadow-blue-500/20',
    focusBorder: 'focus-within:border-[#1877F2] focus-within:ring-[#1877F2]',
    iconColor: 'text-[#1877F2]',
    badgeBg: 'bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20',
    featureIconBg: 'bg-[#1877F2]/10 text-[#1877F2]',
    selectionClass: 'selection:bg-[#1877F2]/20 selection:text-[#1877F2]',
    accentGlow: 'rgba(24, 119, 242, 0.15)',
    themeClass: 'theme-facebook',
    faviconPath: '/favicons/facebook.svg',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    path: '/youtube',
    heroTitle: 'Download YouTube Videos & Shorts',
    heroSubtitle:
      'Download public YouTube videos, Shorts, and audio tracks in 4K, 1080p Full HD MP4, or MP3 with Save Vibe. Paste any YouTube link below to get started.',
    placeholder: 'Paste YouTube video or Shorts URL here...',
    primaryColor: '#FF0000',
    gradientBg: 'from-red-500/10 via-rose-500/5 to-transparent',
    buttonBg:
      'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 focus-visible:ring-red-600 shadow-red-500/20',
    focusBorder: 'focus-within:border-red-600 focus-within:ring-red-600',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-50 text-red-600 border border-red-200/80',
    featureIconBg: 'bg-red-100 text-red-600',
    selectionClass: 'selection:bg-red-500/20 selection:text-red-600',
    accentGlow: 'rgba(255, 0, 0, 0.15)',
    themeClass: 'theme-youtube',
    faviconPath: '/favicons/youtube.svg',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    path: '/instagram',
    heroTitle: 'Download Instagram Videos & Reels',
    heroSubtitle:
      'Save public Instagram Reels, IGTV clips, and video posts in original HD MP4 quality with Save Vibe. Paste your Instagram link below for an instant browser download.',
    placeholder: 'Paste Instagram Reel, IGTV, or post URL here...',
    primaryColor: '#E1306C',
    gradientBg: 'from-[#833AB4]/10 via-[#FD1D1D]/5 to-[#F77737]/10',
    buttonBg:
      'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 active:opacity-90 focus-visible:ring-[#E1306C] shadow-pink-500/20',
    focusBorder: 'focus-within:border-[#E1306C] focus-within:ring-[#E1306C]',
    iconColor: 'text-[#E1306C]',
    badgeBg: 'bg-pink-50 text-[#E1306C] border border-pink-200/80',
    featureIconBg: 'bg-pink-100 text-[#E1306C]',
    selectionClass: 'selection:bg-pink-500/20 selection:text-[#E1306C]',
    accentGlow: 'rgba(225, 48, 108, 0.15)',
    themeClass: 'theme-instagram',
    faviconPath: '/favicons/instagram.svg',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    path: '/tiktok',
    heroTitle: 'Download TikTok Videos Without Watermark',
    heroSubtitle:
      'Download public TikTok videos without watermark in crisp HD MP4 or extract clean MP3 audio using Save Vibe. Paste your TikTok link below to save directly to your device.',
    placeholder: 'Paste TikTok video URL here (e.g., https://vm.tiktok.com/...)...',
    primaryColor: '#000000',
    gradientBg: 'from-cyan-500/10 via-slate-900/10 to-rose-500/10',
    buttonBg:
      'bg-gradient-to-r from-slate-900 via-zinc-900 to-black hover:from-black hover:to-zinc-800 active:from-slate-950 active:to-slate-950 focus-visible:ring-slate-900 shadow-slate-900/20',
    focusBorder: 'focus-within:border-slate-900 focus-within:ring-slate-900',
    iconColor: 'text-slate-900',
    badgeBg: 'bg-slate-100 text-slate-900 border border-slate-200/80',
    featureIconBg: 'bg-slate-100 text-slate-900',
    selectionClass: 'selection:bg-slate-900/20 selection:text-slate-900',
    accentGlow: 'rgba(0, 0, 0, 0.15)',
    themeClass: 'theme-tiktok',
    faviconPath: '/favicons/tiktok.svg',
  },
};

export const HOME_PLATFORM_CONFIG: PlatformConfig = {
  id: 'home',
  name: 'Social Media',
  path: '/',
  heroTitle: 'Download Social Media Videos Free in HD',
  heroSubtitle:
    'Save Vibe is an all-in-one online video downloader for Facebook, YouTube, Instagram, and TikTok. Paste any public video link below to save watermark-free HD MP4 or MP3 in seconds.',
  placeholder: 'Paste Facebook, YouTube, Instagram, or TikTok URL here...',
  primaryColor: '#1877F2',
  gradientBg: 'from-[#1877F2]/10 via-indigo-500/5 to-transparent',
  buttonBg:
    'bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1565d8] focus-visible:ring-[#1877F2] shadow-blue-500/20',
  focusBorder: 'focus-within:border-[#1877F2] focus-within:ring-[#1877F2]',
  iconColor: 'text-[#1877F2]',
  badgeBg: 'bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20',
  featureIconBg: 'bg-[#1877F2]/10 text-[#1877F2]',
  selectionClass: 'selection:bg-[#1877F2]/20 selection:text-[#1877F2]',
  accentGlow: 'rgba(24, 119, 242, 0.15)',
  themeClass: 'theme-default',
  faviconPath: '/favicons/search-logo-96.png',
};

export function getPlatformConfig(platform: PagePlatform): PlatformConfig {
  if (platform === 'home') return HOME_PLATFORM_CONFIG;
  return PLATFORMS[platform] || HOME_PLATFORM_CONFIG;
}
