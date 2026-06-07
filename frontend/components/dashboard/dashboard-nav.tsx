'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PumpLogoMark } from '@/components/pump/pump-shell';
import { cn } from '@/lib/shadcn/utils';

const LINKS = [
  { href: '/dashboard', label: 'Lead Queue' },
  { href: '/dashboard/analytics', label: 'Analytics' },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="border-border/60 bg-background/80 sticky top-0 z-40 -mx-4 mb-8 border-b px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-2 py-3">
        <Link
          href="/dashboard"
          className="mr-3 flex items-center gap-2 font-extrabold tracking-tight"
        >
          <PumpLogoMark className="size-7 rounded-lg text-sm" />
          <span>
            pump <span className="text-muted-foreground font-medium">SDR</span>
          </span>
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/pump"
          className="text-muted-foreground hover:text-foreground ml-auto text-sm font-medium"
        >
          Pump site ↗
        </Link>
      </div>
    </nav>
  );
}
