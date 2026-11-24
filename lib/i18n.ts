export type Locale = string;

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

const KNOWN_SUBPATHS = [
  '/facebook',
  '/youtube',
  '/instagram',
  '/tiktok',
  '/youtube-transcript',
  '/privacy-policy',
  '/terms-of-service',
  '/dmca',
];

export function normalizePathname(pathname?: string | null): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function stripLocalePrefix(pathname?: string | null): {
  locale: string;
  basePath: string;
} {
  const clean = normalizePathname(pathname);
  if (clean === '/') return { locale: 'en', basePath: '/' };
  if (KNOWN_SUBPATHS.includes(clean)) {
    return { locale: 'en', basePath: clean };
  }
  const segments = clean.split('/').filter(Boolean);
  if (segments.length >= 1) {
    const maybeLang = segments[0].toLowerCase();
    const rest = segments.length > 1 ? `/${segments.slice(1).join('/')}` : '/';
    if (/^[a-z]{2}(-[a-z]{2,4})?$/.test(maybeLang) && maybeLang !== 'en') {
      return { locale: maybeLang, basePath: rest };
    }
  }
  return { locale: 'en', basePath: clean };
}

export function getLocaleFromPathname(pathname?: string | null): Locale {
  return stripLocalePrefix(pathname).locale;
}

export function getLocalizedPath(enPath: string, locale: Locale): string {
  const clean = normalizePathname(enPath);
  const base = stripLocalePrefix(clean).basePath;
  const target = (locale || 'en').toLowerCase();

  if (target === 'en') {
    return base;
  }
  return base === '/' ? `/${target}` : `/${target}${base}`;
}

export function getMatchingLanguagePath(
  currentPathname: string | null | undefined,
  targetLocale: Locale
): string {
  const { basePath } = stripLocalePrefix(currentPathname);
  const target = (targetLocale || 'en').toLowerCase();
  if (target === 'en') return basePath;
  return basePath === '/' ? `/${target}` : `/${target}${basePath}`;
}
