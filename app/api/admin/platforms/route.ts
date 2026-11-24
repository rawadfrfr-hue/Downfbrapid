import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import { listPlatformConfigs, updatePlatformConfig } from '@/lib/cms-store';
import { platformConfigUpdateSchema } from '@/lib/cms-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const configs = await listPlatformConfigs({ maskSecrets: true });
  return NextResponse.json({ success: true, data: configs });
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
    const parsed = platformConfigUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid platform configuration.' },
        { status: 400 }
      );
    }

    if (parsed.data.proxyUrl) {
      try {
        const u = new URL(parsed.data.proxyUrl);
        if (!['http:', 'https:', 'socks5:', 'socks5h:'].includes(u.protocol)) {
          throw new Error('Unsupported proxy protocol');
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Proxy URL must be a valid http://, https://, or socks5:// URL.' },
          { status: 400 }
        );
      }
    }

    const updated = await updatePlatformConfig(parsed.data);
    return NextResponse.json({ success: true, data: updated, revalidated: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update platform settings.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
