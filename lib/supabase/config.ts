export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',
  };
}

export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = getAllowedAdminEmails();
  // If ADMIN_EMAILS is omitted, any authenticated Supabase user in the project is checked against AdminUser table (or allowed if table is empty).
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.trim().toLowerCase());
}
