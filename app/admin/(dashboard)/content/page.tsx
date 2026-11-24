import React from 'react';
import { getPageContent, listLanguages } from '@/lib/cms-store';
import { CmsPageSlug, PAGE_SLUGS } from '@/lib/cms-types';
import { ContentSeoEditorClient } from '@/components/admin/ContentSeoEditorClient';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; slug?: string }>;
}) {
  const params = await searchParams;
  const languages = await listLanguages();
  const requestedLang = params?.lang?.trim().toLowerCase() || 'en';
  const validLang = languages.some((l) => l.code === requestedLang)
    ? requestedLang
    : languages[0]?.code || 'en';

  const requestedSlug = params?.slug?.trim().toLowerCase() || 'home';
  const validSlug: CmsPageSlug = PAGE_SLUGS.includes(requestedSlug as CmsPageSlug)
    ? (requestedSlug as CmsPageSlug)
    : 'home';

  const initialContent = await getPageContent(validLang, validSlug);

  return (
    <ContentSeoEditorClient
      key={`${validLang}-${validSlug}`}
      languages={languages}
      initialLanguageCode={validLang}
      initialSlug={validSlug}
      initialContent={initialContent}
    />
  );
}
