import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isSameOriginMutation } from '@/lib/admin-auth';
import {
  createLanguage,
  deleteLanguage,
  listLanguages,
  updateLanguage,
} from '@/lib/cms-store';
import { languageCreateSchema, languageUpdateSchema } from '@/lib/cms-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const languages = await listLanguages();
  return NextResponse.json({ success: true, data: languages });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const parsed = languageCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid language input.' },
        { status: 400 }
      );
    }

    const created = await createLanguage(parsed.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create language.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const parsed = languageUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid update input.' },
        { status: 400 }
      );
    }

    const updated = await updateLanguage(parsed.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update language.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
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
    const code = req.nextUrl.searchParams.get('code')?.trim();
    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing language code.' }, { status: 400 });
    }
    await deleteLanguage(code);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete language.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
