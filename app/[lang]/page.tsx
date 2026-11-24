import React from 'react';
import type { Metadata } from 'next';
import {
  buildCmsJsonLdSchemas,
  generateCmsPageMetadata,
  getPublicPageBootstrap,
} from '@/lib/cms-seo';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return generateCmsPageMetadata('home', lang.toLowerCase());
}

export default async function DynamicLangHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const code = lang.toLowerCase();
  const { content, activeLanguages, siteName } = await getPublicPageBootstrap(code, 'home');
  const schemas = buildCmsJsonLdSchemas(content, siteName);

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PlatformPageClient
        platform="home"
        locale={code}
        cmsContent={content}
        activeLanguages={activeLanguages}
        siteName={siteName}
      />
    </>
  );
}
