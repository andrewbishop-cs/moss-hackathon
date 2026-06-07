'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CloudIcon,
  PlugsConnectedIcon,
  SparkleIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PumpShell } from '@/components/pump/pump-shell';
import { Button } from '@/components/ui/button';
import { ApiError, getLead, triggerEstimateCompleted } from '@/lib/api';
import { fixtureLeadById } from '@/lib/fixtures';
import { formatUsd } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const SAVINGS_RATE = 0.23;
const SAMPLE_SPEND = 42000;
// Simulates Pump pulling cloud billing data after signup — a few seconds for the demo.
const COLLECT_DELAY_MS = 4_000;
const COLLECT_SECONDS = COLLECT_DELAY_MS / 1000;
const SERVICES = ['Compute', 'Storage', 'AI inference'] as const;

type DataMode = 'collecting' | 'ready' | 'none';

function SignupPrompt() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
        <SparkleIcon weight="fill" className="size-3.5" />
        Cloud + AI savings estimate
      </span>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Start with a free account</h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Create your Pump account first so we can connect to your cloud and calculate savings.
      </p>
      <div className="border-border bg-card shadow-primary/5 mt-8 rounded-3xl border p-8 text-center shadow-xl">
        <CloudIcon weight="duotone" className="text-primary mx-auto size-12" />
        <p className="mt-4 font-medium">Sign up takes under a minute</p>
        <p className="text-muted-foreground mt-2 text-sm">
          After signup you&apos;ll connect your cloud accounts and see your personalized estimate.
        </p>
        <Button asChild className="mt-6 w-full rounded-full">
          <Link href="/pump">
            Create free account
            <ArrowRightIcon weight="bold" />
          </Link>
        </Button>
      </div>
    </main>
  );
}

function EstimateCalculator() {
  const searchParams = useSearchParams();
  const leadIdFromQuery = searchParams.get('lead_id');

  if (!leadIdFromQuery) {
    return <SignupPrompt />;
  }

  return <EstimateWithLead leadId={leadIdFromQuery} />;
}

function EstimateWithLead({ leadId }: { leadId: string }) {
  const [resolvedSpend, setResolvedSpend] = useState<number | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('collecting');
  const [spend, setSpend] = useState<number>(SAMPLE_SPEND);
  const [services] = useState<string[]>(['Compute', 'AI inference']);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [agreedTos, setAgreedTos] = useState(false);

  const sampleSpend = useMemo(() => {
    if (resolvedSpend && resolvedSpend > 0) return resolvedSpend;
    const fixture = fixtureLeadById(leadId)?.company?.spend_total;
    return fixture && fixture > 0 ? fixture : SAMPLE_SPEND;
  }, [leadId, resolvedSpend]);

  const savings = useMemo(() => Math.round(spend * SAVINGS_RATE), [spend]);
  const ready = dataMode === 'ready';

  useEffect(() => {
    let active = true;
    getLead(leadId).then(({ lead }) => {
      if (!active || !lead?.company?.spend_total) return;
      if (lead.company.spend_total > 0) {
        setResolvedSpend(lead.company.spend_total);
      }
    });
    return () => {
      active = false;
    };
  }, [leadId]);

  useEffect(() => {
    setDataMode('collecting');
    setElapsedSec(0);

    const tick = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    const finish = setTimeout(() => {
      setSpend(sampleSpend);
      setDataMode('ready');
    }, COLLECT_DELAY_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
  }, [sampleSpend]);

  const onGetPlan = async () => {
    setError(null);
    setDemoNote(false);
    setSubmitting(true);
    try {
      await triggerEstimateCompleted({ lead_id: leadId, savings_total: savings });
      setDone(true);
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setDemoNote(true);
        setDone(true);
      } else {
        setError(err.message || 'Could not submit your estimate.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const collectMessage =
    elapsedSec < 2
      ? 'Connecting to your cloud accounts…'
      : 'Pulling your monthly cloud + AI spend…';

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
        {ready
          ? 'Your cloud data is in — here is what Pump found.'
          : 'We are pulling your cloud spend now. This takes a few seconds.'}
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
        ) : ready ? (
          <>
            <div className="border-border flex items-center justify-between rounded-xl border px-4 py-3">
              <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                <PlugsConnectedIcon weight="bold" className="text-primary size-4" />
                Estimate data collected · monthly spend
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

            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-lg border px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <label className="mt-6 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreedTos}
                onChange={(e) => setAgreedTos(e.target.checked)}
                className="accent-primary mt-0.5 size-4 shrink-0 rounded"
              />
              <span className="text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary underline underline-offset-2">
                  Terms of Service
                </a>
                .
              </span>
            </label>

            <Button
              className="mt-3 w-full rounded-full"
              disabled={submitting || !agreedTos}
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
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center">
            <CloudIcon weight="duotone" className="text-muted-foreground size-10" />
            <p className="mt-3 font-medium">Collecting your cloud data</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">{collectMessage}</p>
            <SpinnerGapIcon
              className="text-primary mt-5 size-8 animate-spin"
              weight="bold"
            />
            <p className="text-muted-foreground mt-4 text-xs tabular-nums">
              {Math.min(elapsedSec, COLLECT_SECONDS)}s / ~{COLLECT_SECONDS}s
            </p>
          </div>
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
