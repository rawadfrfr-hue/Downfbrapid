import { PagePlatform, PlatformConfig, PLATFORMS, HOME_PLATFORM_CONFIG } from './platforms';

export interface LocalizedPlatformCopy {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  placeholder: string;
}

export const BN_PLATFORM_COPY: Record<PagePlatform, LocalizedPlatformCopy> = {
  home: {
    name: 'সোশ্যাল মিডিয়া',
    heroTitle: 'যেকোনো সোশ্যাল মিডিয়া ভিডিও ডাউনলোড করুন HD কোয়ালিটিতে',
    heroSubtitle:
      'Save Vibe হলো ফেসবুক, ইউটিউব, ইনস্টাগ্রাম এবং টিকটক ভিডিও ডাউনলোডের দ্রুত ও নিরাপদ অনলাইন টুল। যেকোনো পাবলিক ভিডিও লিংক নিচে পেস্ট করে মুহূর্তেই ওয়াটারমার্ক-মুক্ত HD MP4 বা MP3 সেভ করুন।',
    placeholder: 'এখানে ফেসবুক, ইউটিউব, ইনস্টাগ্রাম বা টিকটক ভিডিওর লিংক পেস্ট করুন...',
  },
  facebook: {
    name: 'ফেসবুক',
    heroTitle: 'ফেসবুক ভিডিও ও রিলস ডাউনলোড করুন Full HD-তে',
    heroSubtitle:
      'পাবলিক ফেসবুক ভিডিও, রিলস (Reels) এবং Watch ক্লিপ সহজেই 1080p Full HD বা 720p কোয়ালিটিতে ডাউনলোড করুন। নিচে লিংক পেস্ট করে MP4 ভিডিও বা MP3 অডিও সেভ করুন সম্পূর্ণ ফ্রিতে।',
    placeholder: 'ফেসবুক ভিডিও, রিলস বা fb.watch লিংক এখানে পেস্ট করুন...',
  },
  youtube: {
    name: 'ইউটিউব',
    heroTitle: 'ইউটিউব ভিডিও ও শর্টস ডাউনলোড করুন 4K ও HD-তে',
    heroSubtitle:
      'পাবলিক ইউটিউব ভিডিও, ইউটিউব শর্টস এবং অডিও ট্র্যাক 4K, 1080p Full HD MP4 কিংবা MP3 ফরম্যাটে সেভ করুন। শুরু করতে নিচে যেকোনো ইউটিউব লিংক পেস্ট করুন।',
    placeholder: 'ইউটিউব ভিডিও বা শর্টস (Shorts) লিংক এখানে পেস্ট করুন...',
  },
  instagram: {
    name: 'ইনস্টাগ্রাম',
    heroTitle: 'ইনস্টাগ্রাম রিলস ও ভিডিও ডাউনলোড করুন অরিজিনাল HD-তে',
    heroSubtitle:
      'কোনো লগইন বা অ্যাপ ছাড়াই পাবলিক ইনস্টাগ্রাম রিলস, IGTV এবং ভিডিও পোস্ট মূল HD MP4 কোয়ালিটিতে সেভ করুন। সরাসরি ব্রাউজারে ডাউনলোড করতে নিচে লিংক দিন।',
    placeholder: 'ইনস্টাগ্রাম রিলস, IGTV বা পোস্টের লিংক এখানে পেস্ট করুন...',
  },
  tiktok: {
    name: 'টিকটক',
    heroTitle: 'ওয়াটারমার্ক ছাড়া টিকটক ভিডিও ডাউনলোড করুন',
    heroSubtitle:
      'লোগো বা ওয়াটারমার্ক ছাড়াই পরিষ্কার HD MP4 ফরম্যাটে পাবলিক টিকটক ভিডিও ডাউনলোড করুন। ফোনে বা কম্পিউটারে সরাসরি সেভ করতে নিচে টিকটক লিংক পেস্ট করুন।',
    placeholder: 'টিকটক ভিডিওর লিংক পেস্ট করুন (যেমন: https://vm.tiktok.com/...)...',
  },
};

export function getLocalizedPlatformConfig(
  platform: PagePlatform,
  locale: 'en' | 'bn' = 'en'
): PlatformConfig {
  const base = platform === 'home' ? HOME_PLATFORM_CONFIG : PLATFORMS[platform] || HOME_PLATFORM_CONFIG;
  if (locale !== 'bn') return base;

  const bnCopy = BN_PLATFORM_COPY[platform] || BN_PLATFORM_COPY.home;
  return {
    ...base,
    name: bnCopy.name,
    path: base.path === '/' ? '/bn' : `/bn${base.path}`,
    heroTitle: bnCopy.heroTitle,
    heroSubtitle: bnCopy.heroSubtitle,
    placeholder: bnCopy.placeholder,
  };
}
