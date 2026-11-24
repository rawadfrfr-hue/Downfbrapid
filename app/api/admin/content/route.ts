import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import { getPageContent, savePageContent } from '@/lib/cms-store';
import { CmsPageSlug, PAGE_SLUGS, pageContentSaveSchema } from '@/lib/cms-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const lang = req.nextUrl.searchParams.get('lang')?.trim().toLowerCase() || 'en';
  const rawSlug = req.nextUrl.searchParams.get('slug')?.trim().toLowerCase() || 'home';
  const pageSlug = PAGE_SLUGS.includes(rawSlug as CmsPageSlug)
    ? (rawSlug as CmsPageSlug)
    : 'home';

  const content = await getPageContent(lang, pageSlug);
  return NextResponse.json({ success: true, data: content });
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
    const parsed = pageContentSaveSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid page content input.' },
        { status: 400 }
      );
    }

    const saved = await savePageContent(parsed.data);
    return NextResponse.json({ success: true, data: saved, revalidated: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save page content.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
