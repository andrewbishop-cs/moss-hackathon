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
    <main className="pump-brand bg-background text-foreground mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <WarningCircleIcon weight="fill" className="text-destructive size-12" />
      <h1 className="mt-4 text-xl font-semibold">Couldn&apos;t reach the backend</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The dashboard talks to the API at <code>{API_BASE_URL}</code>. Make sure it&apos;s running
        (and CORS allows this origin). Set <code>NEXT_PUBLIC_USE_FIXTURES=true</code> to render demo
        data offline.
      </p>
      {error.message && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mt-4 max-w-md rounded-lg border px-3 py-2 text-left font-mono text-xs break-words">
          {error.message}
        </p>
      )}
      <Button className="mt-6 rounded-full" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
