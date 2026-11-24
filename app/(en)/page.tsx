import React from 'react';
import type { Metadata } from 'next';
import { generatePageMetadata, generateJsonLdSchema } from '@/lib/seo-data';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export const metadata: Metadata = generatePageMetadata('home', 'en');

export default function HomePage() {
  const schemas = generateJsonLdSchema('home', 'en');

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PlatformPageClient platform="home" locale="en" />
    </>
  );
}
