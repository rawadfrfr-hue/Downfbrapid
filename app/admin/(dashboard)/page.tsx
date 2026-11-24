import React from 'react';
import { getDashboardMetrics } from '@/lib/cms-store';
import { DashboardOverviewClient } from '@/components/admin/DashboardOverviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
  return <DashboardOverviewClient initialMetrics={metrics} />;
}
