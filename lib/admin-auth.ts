import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from './supabase/server';
import { isEmailAllowedAdmin, isSupabaseConfigured } from './supabase/config';
import { getPrismaClient } from './prisma';

export const ADMIN_SESSION_COOKIE = 'savevibe_admin_session';

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), '.savevibe-data');
const BUNDLED_AUTH_FILE = path.resolve(BUNDLED_DATA_DIR, 'admin-auth.json');
const TMP_DATA_DIR = path.resolve(os.tmpdir(), '.savevibe-data');
const TMP_AUTH_FILE = path.resolve(TMP_DATA_DIR, 'admin-auth.json');
const IS_SERVERLESS_READONLY = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NOW_REGION
);

interface StoredAdminCredential {
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

declare global {
  var __savevibeEphemeralSessionKey: string | undefined;
}

function getSigningKey(): string {
  const configured =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (!globalThis.__savevibeEphemeralSessionKey) {
    globalThis.__savevibeEphemeralSessionKey = crypto.randomBytes(32).toString('hex');
  }
  return globalThis.__savevibeEphemeralSessionKey;
}

export function getClaimedLocalAdmin(): StoredAdminCredential | null {
  const candidateFiles = IS_SERVERLESS_READONLY
    ? [TMP_AUTH_FILE, BUNDLED_AUTH_FILE]
    : [BUNDLED_AUTH_FILE, TMP_AUTH_FILE];

  for (const filePath of candidateFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as StoredAdminCredential;
      if (parsed?.email && parsed?.passwordHash && parsed?.salt) {
        return parsed;
      }
    } catch {
      // Try next file path
    }
  }
  return null;
}

export function getAuthSetupState(): {
  mode: 'supabase' | 'passcode' | 'local-claimed' | 'needs-claim';
  supabaseConfigured: boolean;
  claimedEmail: string | null;
} {
  if (isSupabaseConfigured()) {
    return {
      mode: 'supabase',
      supabaseConfigured: true,
      claimedEmail: null,
    };
  }
  if (process.env.ADMIN_PASSCODE?.trim()) {
    return {
      mode: 'passcode',
      supabaseConfigured: false,
      claimedEmail: null,
    };
  }
  const claimed = getClaimedLocalAdmin();
  if (claimed) {
    return {
      mode: 'local-claimed',
      supabaseConfigured: false,
      claimedEmail: claimed.email,
    };
  }
  return {
    mode: 'needs-claim',
    supabaseConfigured: false,
    claimedEmail: null,
  };
}

export function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function claimFirstLocalAdmin(email: string, name: string, password: string): StoredAdminCredential {
  if (isSupabaseConfigured()) {
    throw new Error('Supabase Auth is active; local bootstrap is disabled.');
  }
  if (process.env.ADMIN_PASSCODE?.trim()) {
    throw new Error('ADMIN_PASSCODE is configured; local bootstrap is disabled.');
  }
  const existing = getClaimedLocalAdmin();
  if (existing) {
    throw new Error('Admin account has already been claimed.');
  }

  const { salt, hash } = hashPassword(password);
  const record: StoredAdminCredential = {
    email: email.trim().toLowerCase(),
    name: name.trim() || 'Administrator',
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(record, null, 2);

  if (!IS_SERVERLESS_READONLY) {
    try {
      if (!fs.existsSync(BUNDLED_DATA_DIR)) {
        fs.mkdirSync(BUNDLED_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(BUNDLED_AUTH_FILE, serialized, { mode: 0o600 });
      return record;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | null)?.code;
      if (code !== 'EROFS' && code !== 'EACCES' && code !== 'EPERM') {
        throw err;
      }
    }
  }

  if (!fs.existsSync(TMP_DATA_DIR)) {
    fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(TMP_AUTH_FILE, serialized, { mode: 0o600 });
  return record;
}

export function signSessionToken(payload: { email: string; name: string; role: string }): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined | null
): { email: string; name: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSigningKey()).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as {
      email: string;
      name: string;
      role: string;
      exp: number;
    };
    if (!parsed.email || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return {
      email: parsed.email,
      name: parsed.name || 'Admin',
      role: parsed.role || 'ADMIN',
    };
  } catch {
    return null;
  }
}

export interface AdminSessionUser {
  email: string;
  name: string;
  role: string;
  authProvider: 'supabase' | 'local';
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    if (!isEmailAllowedAdmin(user.email)) {
      return null;
    }

    // If Prisma AdminUser table has rows, enforce active admin membership
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const count = await prisma.adminUser.count();
        if (count > 0) {
          const dbAdmin = await prisma.adminUser.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          if (!dbAdmin || !dbAdmin.isActive) {
            return null;
          }
          return {
            email: dbAdmin.email,
            name: dbAdmin.name || user.user_metadata?.full_name || dbAdmin.email,
            role: dbAdmin.role,
            authProvider: 'supabase',
          };
        }
      } catch {
        // Table may not be migrated yet; fall back to ADMIN_EMAILS allowlist check above
      }
    }

    return {
      email: user.email,
      name: (user.user_metadata?.full_name as string) || user.email.split('@')[0],
      role: 'SUPER_ADMIN',
      authProvider: 'supabase',
    };
  }

  // Preview / Passcode / Claimed-Admin cookie verification
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const verified = verifySessionToken(rawToken);
  if (!verified) return null;

  return {
    email: verified.email,
    name: verified.name,
    role: verified.role,
    authProvider: 'local',
  };
}

export function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function isSameOriginMutation(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin) {
    // Allow explicit X-Requested-With header when Origin is absent
    return req.headers.get('x-requested-with') === 'XMLHttpRequest';
  }
  try {
    const parsedOrigin = new URL(origin);
    if (!forwardedHost) return true;
    const allowedHosts = forwardedHost.split(',').map((h) => h.trim().toLowerCase());
    return allowedHosts.includes(parsedOrigin.host.toLowerCase());
  } catch {
    return false;
  }
}
