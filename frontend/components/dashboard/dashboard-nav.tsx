'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/shadcn/utils';

const LINKS = [
  { href: '/dashboard', label: 'Lead Queue' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/pump', label: 'Pump site ↗' },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex items-center gap-1">
      <span className="mr-4 text-sm font-semibold tracking-tight">Pump · SDR</span>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-foreground/10 text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
