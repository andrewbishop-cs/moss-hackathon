'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { getLeads } from '@/lib/api';
import { type LeadStatus, type LeadWithCompany, STATUS_LABEL } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

interface AnalyticsViewProps {
  initialLeads: LeadWithCompany[];
  initialIsDemo: boolean;
}

const POLL_INTERVAL_MS = 5000;

// A call has happened once the lead has left the pre-call states.
const CALLED_STATUSES: LeadStatus[] = ['called', 'booked', 'no_answer', 'declined'];

const STATUS_ORDER: LeadStatus[] = [
  'pending',
  'calling',
  'called',
  'no_answer',
  'declined',
  'booked',
];

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={cn('mt-2 text-3xl font-bold tabular-nums', accent && 'text-primary')}>
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export function AnalyticsView({ initialLeads, initialIsDemo }: AnalyticsViewProps) {
  const [leads, setLeads] = useState<LeadWithCompany[]>(initialLeads);
  const [isDemo, setIsDemo] = useState(initialIsDemo);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const { leads: next, isDemo: demo } = await getLeads();
      if (!active) return;
      setLeads(next);
      setIsDemo(demo);
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const funnel = useMemo(() => {
    const triggered = leads.length;
    const called = leads.filter((l) => CALLED_STATUSES.includes(l.status)).length;
    const booked = leads.filter((l) => l.status === 'booked').length;
    return { triggered, called, booked };
  }, [leads]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<LeadStatus, number>;
    for (const status of STATUS_ORDER) counts[status] = 0;
    for (const lead of leads) counts[lead.status] = (counts[lead.status] ?? 0) + 1;
    return counts;
  }, [leads]);

  const pct = (n: number) =>
    funnel.triggered === 0 ? 0 : Math.round((n / funnel.triggered) * 100);

  const stages: { label: string; value: number }[] = [
    { label: 'Triggered', value: funnel.triggered },
    { label: 'Called', value: funnel.called },
    { label: 'Booked', value: funnel.booked },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <DashboardNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Conversion funnel across all leads</p>
        </div>
        {isDemo && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            Demo data · backend offline
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Triggered" value={funnel.triggered} hint="All leads in the system" />
        <StatCard
          label="Called"
          value={funnel.called}
          hint={`${pct(funnel.called)}% of triggered`}
        />
        <StatCard
          label="Booked"
          value={funnel.booked}
          hint={`${pct(funnel.booked)}% of triggered`}
          accent
        />
      </div>

      <div className="border-border bg-background mt-6 rounded-xl border p-6">
        <h2 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
          Funnel
        </h2>
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="w-24 text-sm">{stage.label}</span>
              <div className="bg-muted/40 relative h-7 flex-1 overflow-hidden rounded-md">
                <div
                  className="bg-primary/80 flex h-full items-center justify-end rounded-md px-2 transition-all"
                  style={{ width: `${Math.max(pct(stage.value), stage.value > 0 ? 6 : 0)}%` }}
                >
                  <span className="text-primary-foreground text-xs font-medium tabular-nums">
                    {stage.value}
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                {pct(stage.value)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border bg-background mt-6 rounded-xl border p-6">
        <h2 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
          By status
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STATUS_ORDER.map((status) => (
            <div
              key={status}
              className={cn(
                'border-border flex items-center justify-between rounded-lg border px-3 py-2 text-sm'
              )}
            >
              <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
              <span className="font-semibold tabular-nums">{statusCounts[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
