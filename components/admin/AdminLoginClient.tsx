'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface AdminLoginClientProps {
  mode: 'supabase' | 'passcode' | 'local-claimed' | 'needs-claim';
  claimedEmail: string | null;
  nextPath: string;
}

export function AdminLoginClient({ mode, claimedEmail, nextPath }: AdminLoginClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState(claimedEmail || '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isClaimMode = mode === 'needs-claim';
  const isPasscodeMode = mode === 'passcode';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'supabase') {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          throw new Error('Supabase client is not configured.');
        }
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          throw new Error(authError.message);
        }
        router.push(nextPath);
        router.refresh();
        return;
      }

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          action: isClaimMode ? 'claim' : 'login',
          email: isPasscodeMode ? undefined : email.trim(),
          name: isClaimMode ? name.trim() : undefined,
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Authentication failed.');
      }

      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Save Vibe</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            {isClaimMode ? 'Set up admin access' : 'Sign in to Admin Console'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {mode === 'supabase'
              ? 'Sign in with your authorized Supabase administrator account.'
              : isClaimMode
              ? 'Create the initial administrator credentials for this workspace. Once claimed, registration locks automatically.'
              : isPasscodeMode
              ? 'Enter your server-configured administrator passcode.'
              : 'Sign in with your administrator email and password.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          {!isPasscodeMode && (
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@savevibe.bond"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
            </div>
          )}

          {isClaimMode && (
            <div className="space-y-1.5">
              <label htmlFor="admin-name" className="block text-xs font-semibold text-slate-700">
                Display Name
              </label>
              <input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Site Administrator"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700">
              {isPasscodeMode ? 'Admin Passcode' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={isClaimMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isClaimMode ? 'Minimum 6 characters' : 'Enter password'}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {loading
                ? 'Verifying...'
                : isClaimMode
                ? 'Create Admin Account'
                : 'Sign In'}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {mode !== 'supabase' && (
          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            To switch to Supabase Auth in production, set{' '}
            <code className="font-mono text-slate-700">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
            <code className="font-mono text-slate-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{' '}
            <code className="font-mono text-slate-700">ADMIN_EMAILS</code> in your environment.
          </p>
        )}
      </div>

      <footer className="max-w-md w-full mx-auto pt-6 text-xs text-slate-500 flex items-center justify-between">
        <span>savevibe.bond</span>
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Back to Public Site
        </Link>
      </footer>
    </main>
  );
}
