import React from 'react';
import { getGlobalSettings } from '@/lib/cms-store';
import { GlobalSettingsClient } from '@/components/admin/GlobalSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getGlobalSettings();
  return <GlobalSettingsClient initialSettings={settings} />;
}
