export type PlatformType = 'facebook' | 'youtube' | 'instagram';

export interface PlatformConfig {
  id: PlatformType;
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
}

export const PLATFORMS: Record<PlatformType, PlatformConfig> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    path: '/',
    heroTitle: 'Download Facebook Videos & Reels',
    heroSubtitle:
      'Effortlessly download public Facebook videos, reels, and watch clips in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
    placeholder: 'Paste Facebook video or reel URL here...',
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
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    path: '/youtube',
    heroTitle: 'Download YouTube Videos & Shorts',
    heroSubtitle:
      'Effortlessly download public YouTube videos, shorts, and audio tracks in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
    placeholder: 'Paste YouTube video or shorts URL here...',
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
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    path: '/instagram',
    heroTitle: 'Download Instagram Videos & Reels',
    heroSubtitle:
      'Effortlessly download public Instagram reels, IGTV, and video posts in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
    placeholder: 'Paste Instagram video, reel, or post URL here...',
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
  },
};
