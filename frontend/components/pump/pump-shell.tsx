import Link from 'next/link';

/** Shared chrome for the fake "Pump" marketing site (UC1 + UC2 flows). */
export function PumpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/pump" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-content-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            P
          </span>
          Pump
        </Link>
        <nav className="text-muted-foreground flex items-center gap-6 text-sm">
          <Link href="/pump/estimate" className="hover:text-foreground transition-colors">
            Savings estimate
          </Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

export function PumpLogoMark() {
  return (
    <span className="bg-primary text-primary-foreground grid size-9 place-content-center rounded-xl text-lg font-bold">
      P
    </span>
  );
}
