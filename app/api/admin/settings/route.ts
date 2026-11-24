import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import { getGlobalSettings, updateGlobalSettings } from '@/lib/cms-store';
import { globalSettingsUpdateSchema } from '@/lib/cms-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getGlobalSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const parsed = globalSettingsUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid global settings.' },
        { status: 400 }
      );
    }

    const updated = await updateGlobalSettings(parsed.data);
    return NextResponse.json({ success: true, data: updated, revalidated: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update global settings.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
