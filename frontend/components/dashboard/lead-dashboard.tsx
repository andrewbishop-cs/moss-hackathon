'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCallIcon, SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { fullName, formatMonthly, type LeadWithCompany } from '@/lib/leads';
import { getLeads, triggerCall } from '@/lib/api';
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

  // Live updates: poll GET /leads from the hub. (Supabase realtime is the
  // backend's concern; the frontend only reads the REST endpoint.)
  useEffect(() => {
    let active = true;
    const tick = async () => {
      const { leads: next, isDemo: demo } = await getLeads();
      if (!active) return;
      setIsDemo(demo);
      // Don't clobber the optimistic "calling" state for rows we just triggered.
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
          // Backend not running — still open the live view so the demo flows.
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
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <DashboardNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lead Queue</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {leads.length} leads · {pendingCount} pending
          </p>
        </div>
        {isDemo && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            Demo data · backend offline
          </span>
        )}
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="border-border bg-background overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground border-border bg-muted/30 border-b text-xs tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Use case</th>
                <th className="px-4 py-3 text-right font-medium">Spend</th>
                <th className="px-4 py-3 text-right font-medium">Savings</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {leads.map((lead) => {
                const isCalling =
                  callingIds.has(lead.id) || lead.status === 'calling';
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${lead.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{fullName(lead)}</div>
                      <div className="text-muted-foreground text-xs">{lead.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{lead.company?.name ?? '—'}</div>
                      <div className="text-muted-foreground text-xs uppercase">
                        {lead.company?.cloud_provider} · {lead.company?.company_size}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UseCaseBadge useCase={lead.use_case} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMonthly(lead.company?.spend_total)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-green-600 dark:text-green-400">
                      {formatMonthly(lead.company?.savings_total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCalling}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(lead.id);
                        }}
                        className={cn(isCalling && 'opacity-70')}
                      >
                        {isCalling ? (
                          <>
                            <SpinnerGapIcon className="animate-spin" weight="bold" />
                            Calling
                          </>
                        ) : (
                          <>
                            <PhoneCallIcon weight="bold" />
                            Call Now
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
    </div>
  );
}
