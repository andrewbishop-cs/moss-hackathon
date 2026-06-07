'use client';

import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="beep-brand bg-background text-foreground mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <WarningCircleIcon weight="fill" className="text-destructive size-12" />
      <h1 className="mt-4 text-[15px] font-medium tracking-[-0.01em]">Couldn&apos;t reach the backend</h1>
      <p className="text-foreground/70 mt-2 max-w-md text-[13px] font-normal">
        The dashboard talks to the API at <code className="text-[12px]">{API_BASE_URL}</code>. Make
        sure it&apos;s running. Set <code className="text-[12px]">NEXT_PUBLIC_USE_FIXTURES=true</code>{' '}
        for offline demo data.
      </p>
      {error.message && (
        <p className="border-foreground text-foreground/70 mt-4 max-w-md border bg-background px-3 py-2 text-left font-mono text-[12px] break-words">
          {error.message}
        </p>
      )}
      <Button className="mt-6" variant="outline" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
