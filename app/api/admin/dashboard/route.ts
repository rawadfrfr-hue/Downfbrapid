import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import {
  clearFailedDownloadLogs,
  deleteDownloadLogById,
  getDashboardMetrics,
} from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json({ success: true, data: metrics });
  } catch (err: unknown) {
    console.error('Dashboard metrics error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard metrics.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id')?.trim();
    if (id) {
      await deleteDownloadLogById(id);
    } else {
      await clearFailedDownloadLogs();
    }
    const metrics = await getDashboardMetrics();
    return NextResponse.json({ success: true, data: metrics });
  } catch (err: unknown) {
    console.error('Failed to clear logs:', err);
    return NextResponse.json({ success: false, error: 'Failed to clear logs.' }, { status: 500 });
  }
}
