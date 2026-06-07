'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';
import { PumpShell } from '@/components/pump/pump-shell';
import { Button } from '@/components/ui/button';
import { ApiError, triggerEstimateCompleted } from '@/lib/api';
import { FIXTURE_LEADS } from '@/lib/fixtures';
import { formatUsd } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const SAVINGS_RATE = 0.23;
const SERVICES = ['EC2', 'S3', 'RDS'] as const;
const FIELD =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30';

function EstimateCalculator() {
  const searchParams = useSearchParams();
  // UC2 requires an existing lead; fall back to a demo lead if none provided.
  const leadIdFromQuery = searchParams.get('lead_id');
  const leadId = leadIdFromQuery ?? FIXTURE_LEADS[0].id;

  const [spend, setSpend] = useState<number>(42000);
  const [services, setServices] = useState<string[]>(['EC2', 'S3']);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savings = useMemo(() => Math.round(spend * SAVINGS_RATE), [spend]);

  const toggleService = (service: string) =>
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );

  const onGetPlan = async () => {
    setSubmitting(true);
    setError(null);
    setDemoNote(false);
    try {
      await triggerEstimateCompleted({ lead_id: leadId, savings_total: savings });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setDemoNote(true);
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <span className="text-primary text-sm font-semibold tracking-wider uppercase">
        AWS savings estimate
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        See what you&apos;re leaving on the table
      </h1>
      <p className="text-muted-foreground mt-2">
        Enter your monthly AWS spend and we&apos;ll estimate your savings.
      </p>

      <div className="border-border bg-background mt-8 rounded-2xl border p-6 shadow-sm">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircleIcon weight="fill" className="text-primary size-12" />
            <h2 className="mt-4 text-xl font-semibold">Your estimate is ready.</h2>
            <p className="text-muted-foreground mt-1">
              You could save <span className="text-foreground font-semibold">{formatUsd(savings)}</span>/month.
            </p>
            <p className="mt-3 text-sm">We&apos;ll call you shortly.</p>
            {demoNote && (
              <p className="mt-4 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
                Demo mode: backend offline, estimate not actually sent.
              </p>
            )}
          </div>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium">Monthly AWS spend (USD)</label>
            <input
              type="number"
              min={0}
              className={FIELD}
              value={spend}
              onChange={(e) => setSpend(Number(e.target.value) || 0)}
            />

            <div className="mt-4">
              <span className="mb-2 block text-xs font-medium">Services you use</span>
              <div className="flex gap-2">
                {SERVICES.map((service) => {
                  const active = services.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-border mt-6 rounded-xl border border-dashed p-5 text-center">
              <p className="text-muted-foreground text-xs tracking-wider uppercase">
                Estimated monthly savings
              </p>
              <p className="text-primary mt-1 text-4xl font-bold tabular-nums">
                {formatUsd(savings)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatUsd(savings * 12)} per year
              </p>
            </div>

            {!leadIdFromQuery && (
              <p className="text-muted-foreground mt-4 text-xs">
                No <code>lead_id</code> in the URL — using a demo lead. Real flow: link from a
                lead, e.g. <code>/pump/estimate?lead_id=…</code>.
              </p>
            )}

            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-lg border px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <Button className="mt-6 w-full" disabled={submitting} onClick={onGetPlan}>
              {submitting ? (
                <>
                  <SpinnerGapIcon className="animate-spin" weight="bold" />
                  Getting your plan…
                </>
              ) : (
                'Get my plan'
              )}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

export default function EstimatePage() {
  return (
    <PumpShell>
      <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-10">Loading…</div>}>
        <EstimateCalculator />
      </Suspense>
    </PumpShell>
  );
}
