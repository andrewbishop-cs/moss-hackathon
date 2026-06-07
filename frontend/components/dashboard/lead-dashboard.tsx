'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCallIcon, SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
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
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 md:px-10">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-medium tracking-[-0.01em]">Lead queue</h1>
            <p className="text-muted-foreground mt-1 text-[13px] font-normal">
              {leads.length} leads · {pendingCount} pending
            </p>
          </div>
          {isDemo && (
            <span className="text-muted-foreground text-[12px] font-normal">Demo data · backend offline</span>
          )}
        </div>

        {error && (
          <div className="border-border text-destructive mb-4 border px-3 py-2 text-[13px]">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-[12px]">
                <th className="pb-2 pr-4 font-normal">Lead</th>
                <th className="pb-2 pr-4 font-normal">Company</th>
                <th className="pb-2 pr-4 font-normal">Use case</th>
                <th className="pb-2 pr-4 text-right font-normal">Spend</th>
                <th className="pb-2 pr-4 text-right font-normal">Savings</th>
                <th className="pb-2 pr-4 font-normal">Status</th>
                <th className="pb-2 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isCalling = callingIds.has(lead.id) || lead.status === 'calling';
                return (
                  <tr
                    key={lead.id}
                    className="border-border hover:bg-muted/40 cursor-pointer border-b transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${lead.id}`)}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{fullName(lead)}</div>
                      <div className="text-muted-foreground text-[12px] font-normal">{lead.email}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div>{lead.company?.name ?? '—'}</div>
                      <div className="text-muted-foreground text-[12px] font-normal">
                        {lead.company?.cloud_provider} · {lead.company?.company_size}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <UseCaseBadge useCase={lead.use_case} />
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatMonthly(lead.company?.spend_total)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatMonthly(lead.company?.savings_total)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isCalling}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(lead.id);
                        }}
                        className={cn('h-7 text-[12px] font-medium', isCalling && 'opacity-60')}
                      >
                        {isCalling ? (
                          <>
                            <SpinnerGapIcon className="animate-spin" weight="bold" />
                            Calling
                          </>
                        ) : (
                          <>
                            <PhoneCallIcon weight="bold" />
                            Call
                          </>
                        )}
                      </Button>
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
