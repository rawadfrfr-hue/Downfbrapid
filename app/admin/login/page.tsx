import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession, getAuthSetupState } from '@/lib/admin-auth';
import { AdminLoginClient } from '@/components/admin/AdminLoginClient';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;
  const nextPath = params?.next && params.next.startsWith('/admin') ? params.next : '/admin';

  if (session) {
    redirect(nextPath);
  }

  const setupState = getAuthSetupState();

  return (
    <AdminLoginClient
      mode={setupState.mode}
      claimedEmail={setupState.claimedEmail}
      nextPath={nextPath}
    />
  );
}
