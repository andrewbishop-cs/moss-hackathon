'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartBarIcon, SquaresFourIcon } from '@phosphor-icons/react/dist/ssr';
import { BeepWordmark } from '@/components/beep/beep-brand';
import { cn } from '@/lib/shadcn/utils';

const NAV = [
  { href: '/dashboard', label: 'Lead queue', icon: SquaresFourIcon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBarIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col bg-[var(--beep-sidebar)] md:flex">
        <div className="px-2 py-2">
          <BeepWordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-4">
          <p className="text-foreground/70 px-2 py-1.5 text-[11px] font-medium tracking-wide uppercase">
            Workspace
          </p>
          {NAV.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/calls/')
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[14px] transition-colors',
                  active
                    ? 'border-foreground bg-background text-foreground font-medium'
                    : 'text-foreground/80 hover:border-foreground/30 hover:bg-background border-transparent font-normal'
                )}
              >
                <Icon className="size-4 shrink-0 opacity-70" weight={active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-4">
          <Link
            href="/pump"
            className="text-foreground/70 hover:border-foreground/30 hover:bg-background hover:text-foreground flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-[13px] font-normal transition-colors"
          >
            Pump site
            <span className="opacity-50">↗</span>
          </Link>
        </div>
      </aside>

      <div className="bg-background flex min-w-0 flex-1 flex-col">
        <header className="border-foreground flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <BeepWordmark />
          <nav className="ml-auto flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md border px-2 py-1 text-[12px] transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'border-foreground bg-background text-foreground font-medium'
                    : 'text-foreground/70 hover:border-foreground/30 hover:bg-background border-transparent font-normal'
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
