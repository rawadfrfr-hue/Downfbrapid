export type Locale = 'en' | 'bn';

export const ROUTE_PAIRS: ReadonlyArray<{ en: string; bn: string }> = [
  { en: '/', bn: '/bn' },
  { en: '/facebook', bn: '/bn/facebook' },
  { en: '/youtube', bn: '/bn/youtube' },
  { en: '/instagram', bn: '/bn/instagram' },
  { en: '/tiktok', bn: '/bn/tiktok' },
  { en: '/youtube-transcript', bn: '/bn/youtube-transcript' },
  { en: '/privacy-policy', bn: '/bn/privacy-policy' },
  { en: '/terms-of-service', bn: '/bn/terms-of-service' },
  { en: '/dmca', bn: '/bn/dmca' },
];

export function normalizePathname(pathname?: string | null): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getLocaleFromPathname(pathname?: string | null): Locale {
  const clean = normalizePathname(pathname);
  return clean === '/bn' || clean.startsWith('/bn/') ? 'bn' : 'en';
}

export function getLocalizedPath(enPath: string, locale: Locale): string {
  const clean = normalizePathname(enPath);
  const found = ROUTE_PAIRS.find((pair) => pair.en === clean || pair.bn === clean);
  if (found) {
    return locale === 'bn' ? found.bn : found.en;
  }
  if (locale === 'bn') {
    return clean === '/' ? '/bn' : `/bn${clean}`;
  }
  return clean.startsWith('/bn/') ? clean.slice(3) : clean === '/bn' ? '/' : clean;
}

export function getMatchingLanguagePath(currentPathname: string | null | undefined, targetLocale: Locale): string {
  const clean = normalizePathname(currentPathname);
  const found = ROUTE_PAIRS.find((pair) => pair.en === clean || pair.bn === clean);
  if (found) {
    return targetLocale === 'bn' ? found.bn : found.en;
  }
  return targetLocale === 'bn' ? '/bn' : '/';
}
