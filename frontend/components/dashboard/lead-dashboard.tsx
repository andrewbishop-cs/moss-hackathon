'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCallIcon, SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getLeads, triggerCall } from '@/lib/api';
import { type LeadWithCompany, formatMonthly, fullName } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

interface LeadDashboardProps {
  initialLeads: LeadWithCompany[];
  initialIsDemo: boolean;
}

const POLL_INTERVAL_MS = 3000;

export function LeadDashboard({ initialLeads, initialIsDemo }: LeadDashboardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithCompany[]>(initialLeads);
  const [isDemo, setIsDemo] = useState(initialIsDemo);
  const [callingIds, setCallingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const callingRef = useRef(callingIds);
  callingRef.current = callingIds;

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const { leads: next, isDemo: demo } = await getLeads();
      if (!active) return;
      setIsDemo(demo);
      setLeads(
        next.map((lead) =>
          callingRef.current.has(lead.id) && lead.status === 'pending'
            ? { ...lead, status: 'calling' }
            : lead
        )
      );
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const handleCall = useCallback(
    async (leadId: string) => {
      setError(null);
      setCallingIds((prev) => new Set(prev).add(leadId));
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, status: 'calling' } : lead))
      );
      try {
        await triggerCall(leadId);
        router.push(`/dashboard/calls/${leadId}`);
      } catch (e) {
        if (isDemo) {
          router.push(`/dashboard/calls/${leadId}`);
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to trigger call');
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: 'pending' } : lead))
        );
        setCallingIds((prev) => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
      }
    },
    [isDemo, router]
  );

  const pendingCount = useMemo(
    () => leads.filter((lead) => lead.status === 'pending').length,
    [leads]
  );

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-5xl flex-1 px-10 py-12 md:px-16 md:py-14">
        <div className="mb-10">
          <h1 className="text-foreground text-[2.5rem] leading-[1.2] font-bold tracking-[-0.02em]">
            Lead queue
          </h1>
          <p className="text-muted-foreground mt-2 text-[14px] font-normal">
            {leads.length} leads · {pendingCount} pending
            {isDemo && ' · Demo data'}
          </p>
        </div>

        {error && (
          <div className="text-destructive mb-6 rounded-md bg-red-50 px-3 py-2 text-[14px]">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-[12px]">
                <th className="pb-2 pr-3 font-normal">Lead</th>
                <th className="pb-2 pr-3 font-normal">Company</th>
                <th className="pb-2 pr-3 font-normal">Use case</th>
                <th className="pb-2 pr-3 text-right font-normal">Spend</th>
                <th className="pb-2 pr-3 text-right font-normal">Savings</th>
                <th className="pb-2 pr-3 font-normal">Status</th>
                <th className="pb-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isCalling = callingIds.has(lead.id) || lead.status === 'calling';
                return (
                  <tr
                    key={lead.id}
                    className="border-border hover:bg-accent group cursor-pointer border-b transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${lead.id}`)}
                  >
                    <td className="py-2 pr-3 align-middle">
                      <div className="font-normal">{fullName(lead)}</div>
                      <div className="text-muted-foreground text-[12px]">{lead.email}</div>
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <div>{lead.company?.name ?? '—'}</div>
                      <div className="text-muted-foreground text-[12px]">
                        {lead.company?.cloud_provider} · {lead.company?.company_size}
                      </div>
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <UseCaseBadge useCase={lead.use_case} />
                    </td>
                    <td className="py-2 pr-3 text-right align-middle tabular-nums">
                      {formatMonthly(lead.company?.spend_total)}
                    </td>
                    <td className="py-2 pr-3 text-right align-middle tabular-nums">
                      {formatMonthly(lead.company?.savings_total)}
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-2 text-right align-middle">
                      <button
                        type="button"
                        disabled={isCalling}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(lead.id);
                        }}
                        className={cn(
                          'text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] transition-colors',
                          isCalling && 'opacity-50'
                        )}
                      >
                        {isCalling ? (
                          <>
                            <SpinnerGapIcon className="size-3.5 animate-spin" />
                            Calling
                          </>
                        ) : (
                          <>
                            <PhoneCallIcon className="size-3.5 opacity-0 group-hover:opacity-70" />
                            Call
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
