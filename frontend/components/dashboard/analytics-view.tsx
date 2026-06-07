'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getLeads } from '@/lib/api';
import { type LeadStatus, type LeadWithCompany, STATUS_LABEL } from '@/lib/leads';

interface AnalyticsViewProps {
  initialLeads: LeadWithCompany[];
  initialIsDemo: boolean;
}

const POLL_INTERVAL_MS = 5000;
const CALLED_STATUSES: LeadStatus[] = ['called', 'booked', 'no_answer', 'declined'];
const STATUS_ORDER: LeadStatus[] = [
  'pending',
  'calling',
  'called',
  'no_answer',
  'declined',
  'booked',
];

function StatRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="border-border flex items-baseline justify-between border-b py-3 last:border-0">
      <div>
      <p className="text-[13px] font-normal">{label}</p>
      {hint && <p className="text-muted-foreground text-[12px] font-normal">{hint}</p>}
      </div>
      <p className="text-2xl font-normal tabular-nums tracking-[-0.01em]">{value}</p>
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
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8 md:px-10">
        <div className="mb-8">
          <h1 className="text-[15px] font-medium tracking-[-0.01em]">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-[13px] font-normal">Conversion funnel</p>
          {isDemo && (
            <p className="text-muted-foreground mt-2 text-[12px] font-normal">Demo data · backend offline</p>
          )}
        </div>

        <section className="mb-10">
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
          <h2 className="text-muted-foreground mb-3 text-[12px] font-normal">By status</h2>
          <div className="divide-border divide-y">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="flex items-center justify-between py-2 text-[13px]">
                <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
                <span className="tabular-nums">{statusCounts[status]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
