'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/entry', label: 'Entry' },
  { href: '/exit', label: 'Exit' },
  { href: '/spots', label: 'Spots' },
  { href: '/floors', label: 'Floors' },
  { href: '/reports', label: 'Reports' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-mesh px-4 py-4 text-slate-900 dark:text-slate-100 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row">
        <aside className="w-full rounded-2xl border border-slate-200/70 bg-white/65 p-4 shadow-soft backdrop-blur md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-60 dark:border-slate-800/70 dark:bg-slate-900/60">
          <div className="mb-6">
            <div className="text-xl font-bold tracking-tight">ParkIQ Ops</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              Enterprise Console
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 md:flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition',
                  pathname === link.href
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-100/70 hover:bg-slate-200/90 dark:bg-slate-800/60 dark:hover:bg-slate-700/70',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-200/70 px-3 py-2 text-sm dark:bg-slate-800/70"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </aside>

        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
