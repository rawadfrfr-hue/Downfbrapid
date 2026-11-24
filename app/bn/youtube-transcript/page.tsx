import React from 'react';
import type { Metadata } from 'next';
import { generateTranscriptMetadata, generateTranscriptJsonLd } from '@/lib/seo-data';
import { TranscriptPageClient } from '@/components/TranscriptPageClient';

export const metadata: Metadata = generateTranscriptMetadata('bn');

export default function BnYouTubeTranscriptPage() {
  const schemas = generateTranscriptJsonLd('bn');

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <TranscriptPageClient locale="bn" />
    </>
  );
}
