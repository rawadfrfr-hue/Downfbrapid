import React from 'react';
import { listPlatformConfigs } from '@/lib/cms-store';
import { DownloaderSettingsClient } from '@/components/admin/DownloaderSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminDownloaderPage() {
  const configs = await listPlatformConfigs({ maskSecrets: true });
  return <DownloaderSettingsClient initialConfigs={configs} />;
}
