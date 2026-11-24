import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ADMIN_SESSION_COOKIE,
  buildCookieOptions,
  claimFirstLocalAdmin,
  getAdminSession,
  getAuthSetupState,
  getClaimedLocalAdmin,
  isSameOriginMutation,
  signSessionToken,
  verifyPassword,
} from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  action: z.enum(['login', 'claim']).default('login'),
  email: z.string().trim().email().optional(),
  name: z.string().trim().max(80).optional(),
  password: z.string().min(6).max(128),
});

export async function GET() {
  const state = getAuthSetupState();
  const session = await getAdminSession();
  return NextResponse.json({
    success: true,
    ...state,
    authenticated: Boolean(session),
    user: session,
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  if (isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Use Supabase Auth client login when Supabase is configured.' },
      { status: 400 }
    );
  }

  try {
    const raw = await req.json();
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid credentials format.' },
        { status: 400 }
      );
    }

    const { action, email, name, password } = parsed.data;
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();

    if (envPasscode) {
      const a = Buffer.from(password);
      const b = Buffer.from(envPasscode);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json({ success: false, error: 'Invalid admin passcode.' }, { status: 401 });
      }
      const token = signSessionToken({
        email: email || 'admin@savevibe.bond',
        name: 'Administrator',
        role: 'SUPER_ADMIN',
      });
      const res = NextResponse.json({ success: true });
      res.cookies.set(ADMIN_SESSION_COOKIE, token, buildCookieOptions(60 * 60 * 24 * 7));
      return res;
    }

    if (action === 'claim') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Admin email is required to claim workspace.' },
          { status: 400 }
        );
      }
      const created = claimFirstLocalAdmin(email, name || 'Admin', password);
      const token = signSessionToken({
        email: created.email,
        name: created.name,
        role: 'SUPER_ADMIN',
      });
      const res = NextResponse.json({ success: true });
      res.cookies.set(ADMIN_SESSION_COOKIE, token, buildCookieOptions(60 * 60 * 24 * 7));
      return res;
    }

    const claimed = getClaimedLocalAdmin();
    if (!claimed) {
      return NextResponse.json(
        { success: false, error: 'Admin account has not been set up yet.' },
        { status: 400 }
      );
    }

    if (email && email.toLowerCase() !== claimed.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!verifyPassword(password, claimed.salt, claimed.passwordHash)) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signSessionToken({
      email: claimed.email,
      name: claimed.name,
      role: 'SUPER_ADMIN',
    });
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, buildCookieOptions(60 * 60 * 24 * 7));
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', buildCookieOptions(0));
  return res;
}
