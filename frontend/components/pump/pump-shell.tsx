import Link from 'next/link';
import { cn } from '@/lib/shadcn/utils';

/** Pump wordmark — a rounded green chip + lowercase wordmark, echoing pump.co. */
export function PumpLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground grid size-8 place-content-center rounded-xl text-base font-extrabold shadow-sm',
        className
      )}
    >
      P
    </span>
  );
}

export function PumpWordmark() {
  return (
    <Link href="/pump" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <PumpLogoMark />
      <span>pump</span>
    </Link>
  );
}

const NAV_LINKS = [
  { href: '/pump', label: 'Product' },
  { href: '/pump/estimate', label: 'Savings estimate' },
  { href: '/dashboard', label: 'Dashboard' },
];

function PumpHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <PumpWordmark />
        <nav className="text-muted-foreground hidden items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/pump/estimate"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/pump"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function PumpFooter() {
  return (
    <footer className="border-border/60 mt-20 border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <PumpLogoMark className="size-6 rounded-lg text-sm" />
          pump
        </div>
        <nav className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/pump" className="hover:text-foreground transition-colors">
            Product
          </Link>
          <Link href="/pump/estimate" className="hover:text-foreground transition-colors">
            Savings estimate
          </Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </nav>
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Pump Billing, Inc.
        </p>
      </div>
    </footer>
  );
}

/** Shared chrome for the fake "Pump" marketing site (UC1 + UC2 flows). */
export function PumpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pump-brand bg-background text-foreground flex min-h-svh flex-col">
      <PumpHeader />
      <div className="flex-1">{children}</div>
      <PumpFooter />
    </div>
  );
}
