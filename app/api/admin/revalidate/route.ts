import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import { listLanguages, revalidateCmsCache } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  const langs = await listLanguages();
  const paths = langs.map((l) => (l.code === 'en' ? '/' : `/${l.code}`));
  revalidateCmsCache(paths);

  return NextResponse.json({
    success: true,
    revalidatedAt: new Date().toISOString(),
    paths,
  });
}
