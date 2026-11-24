import React from 'react';
import { listLanguages } from '@/lib/cms-store';
import { LanguagesManagerClient } from '@/components/admin/LanguagesManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminLanguagesPage() {
  const languages = await listLanguages();
  return <LanguagesManagerClient initialLanguages={languages} />;
}
