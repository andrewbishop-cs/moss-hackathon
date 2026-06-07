'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BeepWordmark } from '@/components/beep/beep-brand';
import { cn } from '@/lib/shadcn/utils';

const NAV = [
  { href: '/dashboard', label: 'Lead queue' },
  { href: '/dashboard/analytics', label: 'Analytics' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh">
      <aside className="border-border bg-background hidden w-52 shrink-0 flex-col border-r md:flex">
        <div className="px-1 py-4">
          <BeepWordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/calls/')
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-2 py-1.5 text-[13px] transition-colors',
                  active
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-border border-t px-2 py-3">
          <Link
            href="/pump"
            className="text-muted-foreground hover:text-foreground block rounded px-2 py-1.5 text-[12px] font-normal"
          >
            Pump site ↗
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <BeepWordmark />
          <nav className="ml-auto flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-2 py-1 text-[12px]',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground font-normal'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
