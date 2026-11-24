'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Languages,
  FileEdit,
  SlidersHorizontal,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  Menu,
  X,
  Check,
} from 'lucide-react';
import type { AdminSessionUser } from '@/lib/admin-auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface AdminShellProps {
  user: AdminSessionUser;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/languages', label: 'Languages & SEO', icon: Languages, exact: false },
  { href: '/admin/content', label: 'Content & FAQ', icon: FileEdit, exact: false },
  { href: '/admin/downloader', label: 'Downloader & API', icon: SlidersHorizontal, exact: false },
  { href: '/admin/settings', label: 'Global Settings', icon: Settings, exact: false },
];

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgedOk, setPurgedOk] = useState(false);

  const currentNav =
    NAV_ITEMS.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    ) || NAV_ITEMS[0];

  const handlePurgeCache = async () => {
    setPurging(true);
    setPurgedOk(false);
    try {
      const res = await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        setPurgedOk(true);
        setTimeout(() => setPurgedOk(false), 2500);
      }
    } finally {
      setPurging(false);
    }
  };

  const handleSignOut = async () => {
    if (user.authProvider === 'supabase') {
      const supabase = createSupabaseBrowserClient();
      await supabase?.auth.signOut();
    }
    await fetch('/api/admin/auth', {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    router.push('/admin/login');
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <span className="w-7 h-7 rounded-md bg-[#1877F2] text-white font-bold text-xs flex items-center justify-center">
            SV
          </span>
          <span className="font-bold text-base tracking-tight text-slate-900">
            Save Vibe Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3 shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="text-xs text-slate-500 truncate font-mono">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="text-slate-400 hidden sm:inline">savevibe.bond</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handlePurgeCache}
              disabled={purging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {purgedOk ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cache Purged</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
                  <span>{purging ? 'Purging...' : 'Revalidate Cache'}</span>
                </>
              )}
            </button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#166fe5] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
