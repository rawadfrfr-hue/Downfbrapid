import React from 'react';
import type { Metadata } from 'next';
import { generatePageMetadata, generateJsonLdSchema } from '@/lib/seo-data';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export const metadata: Metadata = generatePageMetadata('tiktok', 'en');

export default function TiktokDownloaderPage() {
  const schemas = generateJsonLdSchema('tiktok', 'en');

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PlatformPageClient platform="tiktok" locale="en" />
    </>
  );
}
