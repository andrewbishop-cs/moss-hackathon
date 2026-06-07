'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  CloudIcon,
  DatabaseIcon,
  PlugsConnectedIcon,
  SparkleIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PumpShell } from '@/components/pump/pump-shell';
import { Button } from '@/components/ui/button';
import { ApiError, USE_FIXTURES, triggerEstimateCompleted } from '@/lib/api';
import { FIXTURE_LEADS, fixtureLeadById } from '@/lib/fixtures';
import { formatUsd } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const SAVINGS_RATE = 0.23;
// Stand-in monthly cloud + AI spend used when we can't resolve real data for the
// lead (e.g. a brand-new signup). The whole "connect" step is a demo trigger.
const SAMPLE_SPEND = 42000;
const SERVICES = ['Compute', 'Storage', 'AI inference'] as const;

type DataMode = 'none' | 'sample';

function EstimateCalculator() {
  const searchParams = useSearchParams();
  // UC2 requires an existing lead. Only fall back to a demo lead when fixtures
  // are enabled; otherwise we must have a real lead_id from the query string.
  const leadIdFromQuery = searchParams.get('lead_id');
  const leadId = leadIdFromQuery ?? (USE_FIXTURES ? FIXTURE_LEADS[0].id : null);

  // Source a realistic spend from the lead's company when we know it; otherwise
  // fall back to a sample number. This is what the "Estimate data" trigger pulls.
  const sampleSpend = useMemo(() => {
    const company = leadId ? fixtureLeadById(leadId)?.company : undefined;
    return company?.spend_total && company.spend_total > 0 ? company.spend_total : SAMPLE_SPEND;
  }, [leadId]);

  const [dataMode, setDataMode] = useState<DataMode>('none');
  const [connecting, setConnecting] = useState(false);
  const [spend, setSpend] = useState<number>(sampleSpend);
  const [services] = useState<string[]>(['Compute', 'AI inference']);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savings = useMemo(() => Math.round(spend * SAVINGS_RATE), [spend]);
  const connected = dataMode === 'sample';

  // The demo stand-in for "connect your cloud / upload your bill": simulate a
  // brief pull, then reveal the spend + savings.
  const connectData = () => {
    if (connecting) return;
    setError(null);
    setConnecting(true);
    setTimeout(() => {
      setSpend(sampleSpend);
      setDataMode('sample');
      setConnecting(false);
    }, 900);
  };

  const clearData = () => {
    setConnecting(false);
    setDataMode('none');
  };

  const onGetPlan = async () => {
    setError(null);
    setDemoNote(false);
    if (!leadId) {
      setError('Missing lead_id. Open this page from a lead, e.g. /pump/estimate?lead_id=…');
      return;
    }
    setSubmitting(true);
    try {
      await triggerEstimateCompleted({ lead_id: leadId, savings_total: savings });
      setDone(true);
    } catch (err) {
      if (!(err instanceof ApiError) && USE_FIXTURES) {
        setDemoNote(true);
        setDone(true);
      } else {
        setError(err instanceof Error ? err.message : 'Could not submit your estimate.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
        <SparkleIcon weight="fill" className="size-3.5" />
        Cloud + AI savings estimate
      </span>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
        See what you&apos;re leaving on the table
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Connect your cloud and we&apos;ll estimate your savings in seconds.
      </p>

      <div className="border-border bg-card text-card-foreground shadow-primary/5 mt-8 rounded-3xl border p-6 shadow-xl">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircleIcon weight="fill" className="text-primary size-12" />
            <h2 className="mt-4 text-xl font-bold">Your estimate is ready.</h2>
            <p className="text-muted-foreground mt-1">
              You could save{' '}
              <span className="text-foreground font-semibold">{formatUsd(savings)}</span>/month.
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
            {/* Demo trigger: simulate connecting cloud data instead of uploading it. */}
            <span className="mb-2 block text-xs font-medium">Cloud data</span>
            <div className="bg-muted/50 grid grid-cols-2 gap-1 rounded-full p-1">
              <button
                type="button"
                onClick={connectData}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  connected
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <DatabaseIcon weight="bold" className="size-4" />
                Estimate data
              </button>
              <button
                type="button"
                onClick={clearData}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  !connected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                No data
              </button>
            </div>

            {connecting ? (
              <div className="text-muted-foreground mt-6 flex flex-col items-center gap-2 py-10 text-sm">
                <SpinnerGapIcon className="text-primary size-6 animate-spin" weight="bold" />
                Analyzing your cloud + AI spend…
              </div>
            ) : connected ? (
              <>
                <div className="border-border mt-4 flex items-center justify-between rounded-xl border px-4 py-3">
                  <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                    <PlugsConnectedIcon weight="bold" className="text-primary size-4" />
                    Connected · monthly spend
                  </span>
                  <span className="font-semibold tabular-nums">{formatUsd(spend)}/mo</span>
                </div>

                <div className="mt-4">
                  <span className="mb-2 block text-xs font-medium">Detected services</span>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((service) => {
                      const active = services.includes(service);
                      return (
                        <span
                          key={service}
                          className={cn(
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs',
                            active
                              ? 'border-primary/30 bg-primary/10 text-primary font-medium'
                              : 'border-border text-muted-foreground'
                          )}
                        >
                          {service}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="border-primary/30 bg-primary/5 mt-6 rounded-2xl border p-6 text-center">
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">
                    Estimated monthly savings
                  </p>
                  <p className="text-primary mt-1 text-5xl font-extrabold tabular-nums">
                    {formatUsd(savings)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatUsd(savings * 12)} per year
                  </p>
                </div>

                {!leadId && (
                  <p className="text-muted-foreground mt-4 text-xs">
                    No <code>lead_id</code> in the URL. Open this page from a lead, e.g.{' '}
                    <code>/pump/estimate?lead_id=…</code>.
                  </p>
                )}

                {error && (
                  <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-lg border px-3 py-2 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  className="mt-6 w-full rounded-full"
                  disabled={submitting}
                  onClick={onGetPlan}
                >
                  {submitting ? (
                    <>
                      <SpinnerGapIcon className="animate-spin" weight="bold" />
                      Getting your plan…
                    </>
                  ) : (
                    'Run estimate'
                  )}
                </Button>
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  No contracts, no credit cards. You only pay a percentage of what you save.
                </p>
              </>
            ) : (
              <div className="border-border mt-4 flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center">
                <CloudIcon weight="duotone" className="text-muted-foreground size-10" />
                <p className="mt-3 font-medium">No cloud data connected</p>
                <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                  Connect your cloud account to see your savings. No upload needed for the demo.
                </p>
                <Button className="mt-5 rounded-full" onClick={connectData}>
                  <DatabaseIcon weight="bold" />
                  Connect cloud data
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function EstimatePage() {
  return (
    <PumpShell>
      <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-14">Loading…</div>}>
        <EstimateCalculator />
      </Suspense>
    </PumpShell>
  );
}
