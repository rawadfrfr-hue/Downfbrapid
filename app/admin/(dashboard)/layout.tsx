import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
