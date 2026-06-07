'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/shadcn/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getLeads } from '@/lib/api';
import { BORDER_DEFAULT, PAGE_SUBTITLE, PAGE_TITLE, TEXT_SECONDARY } from '@/lib/dashboard-ui';
import {
  DISPOSITION_STATUS_ORDER,
  type LeadStatus,
  type LeadWithCompany,
  STATUS_LABEL,
} from '@/lib/leads';

interface AnalyticsViewProps {
  initialLeads: LeadWithCompany[];
  initialIsDemo: boolean;
}

const POLL_INTERVAL_MS = 5000;
const CALLED_STATUSES: LeadStatus[] = [
  'called',
  'booked',
  'interested',
  'callback',
  'declined',
  'no_answer',
  'disqualified',
  'bad_data',
  'reengage_90d',
];
const STATUS_ORDER = DISPOSITION_STATUS_ORDER;

function StatRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className={cn(BORDER_DEFAULT, 'flex items-baseline justify-between border-b py-3 last:border-0')}>
      <div>
        <p className="text-[14px] font-normal">{label}</p>
        {hint && <p className={cn(TEXT_SECONDARY, 'mt-0.5 text-[12px] font-normal')}>{hint}</p>}
      </div>
      <p className="text-xl leading-none font-semibold tabular-nums tracking-[-0.01em]">{value}</p>
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

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-3xl flex-1 px-10 py-12 md:px-16 md:py-14">
        <div className="mb-8">
          <h1 className={PAGE_TITLE}>Analytics</h1>
          <p className={PAGE_SUBTITLE}>
            Conversion funnel{isDemo && ' · Demo data'}
          </p>
        </div>

        <section className="mb-12">
          <StatRow label="Triggered" value={funnel.triggered} hint="All leads" />
          <StatRow
            label="Called"
            value={funnel.called}
            hint={`${pct(funnel.called)}% of triggered`}
          />
          <StatRow
            label="Booked"
            value={funnel.booked}
            hint={`${pct(funnel.booked)}% of triggered`}
          />
        </section>

        <section>
          <h2 className={cn(TEXT_SECONDARY, 'mb-3 text-[12px] font-normal')}>By status</h2>
          <div className="divide-foreground divide-y">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                className="hover:bg-background flex items-center justify-between py-2.5 text-[14px] transition-colors"
              >
                <span className={TEXT_SECONDARY}>{STATUS_LABEL[status]}</span>
                <span className="text-foreground tabular-nums">{statusCounts[status]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
