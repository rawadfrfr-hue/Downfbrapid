import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  getSupabaseEnv,
  isEmailAllowedAdmin,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

const ADMIN_SESSION_COOKIE = 'savevibe_admin_session';

async function verifyEdgeHmacToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [body, sig] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    if (sig !== expected) return false;
    const jsonStr = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(jsonStr) as { exp?: number };
    return Boolean(parsed.exp && parsed.exp > Date.now());
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // Allow login page and auth endpoint without prior session
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
    if (isSupabaseConfigured() && pathname === '/admin/login') {
      const res = NextResponse.next({ request: req });
      const { url, anonKey } = getSupabaseEnv();
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isEmailAllowedAdmin(user.email)) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return res;
    }
    return NextResponse.next();
  }

  // Protected /admin/* and /api/admin/* routes
  if (isSupabaseConfigured()) {
    const res = NextResponse.next({ request: req });
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !isEmailAllowedAdmin(user.email)) {
      if (isAdminApi) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return res;
  }

  // Preview / fallback signed cookie check (full HMAC verification runs in Node Server Layout + API routes)
  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const edgeSecret =
    process.env.ADMIN_SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let hasCookie = Boolean(sessionCookie && sessionCookie.includes('.'));
  if (hasCookie && edgeSecret && sessionCookie) {
    hasCookie = await verifyEdgeHmacToken(sessionCookie, edgeSecret);
  }

  if (!hasCookie) {
    if (isAdminApi) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
