import React from 'react';
import type { Metadata } from 'next';
import { generatePageMetadata, generateJsonLdSchema } from '@/lib/seo-data';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export const metadata: Metadata = generatePageMetadata('facebook', 'en');

export default function FacebookDownloaderPage() {
  const schemas = generateJsonLdSchema('facebook', 'en');

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PlatformPageClient platform="facebook" locale="en" />
    </>
  );
}
