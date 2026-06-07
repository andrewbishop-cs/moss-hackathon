'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClockIcon, PhoneCallIcon, SpinnerGapIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useCallQueue } from '@/hooks/useCallQueue';
import { getLeads, triggerCall } from '@/lib/api';
import {
  BTN_OUTLINE,
  LINK_GHOST,
  PANEL_OUTLINE,
  PAGE_SUBTITLE,
  PAGE_TITLE,
  ROW_INTERACTIVE,
  TEXT_SECONDARY,
} from '@/lib/dashboard-ui';
import { type LeadWithCompany, formatMonthly, fullName } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

interface LeadDashboardProps {
  initialLeads: LeadWithCompany[];
  initialIsDemo: boolean;
}

const POLL_INTERVAL_MS = 3000;

const CALLABLE_STATUSES = new Set(['pending', 'no_answer']);

function defaultScheduleValue() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export function LeadDashboard({ initialLeads, initialIsDemo }: LeadDashboardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithCompany[]>(initialLeads);
  const [isDemo, setIsDemo] = useState(initialIsDemo);
  const [callingIds, setCallingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleValue);
  const callingRef = useRef(callingIds);
  callingRef.current = callingIds;

  const { queue, startNow, schedule, cancelSchedule, stop, reset, isBusy } =
    useCallQueue(isDemo);

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

  const callableLeads = useMemo(
    () => leads.filter((l) => CALLABLE_STATUSES.has(l.status)),
    [leads]
  );

  const pendingCount = useMemo(
    () => leads.filter((lead) => lead.status === 'pending').length,
    [leads]
  );

  const selectedCallable = useMemo(
    () => leads.filter((l) => selectedIds.has(l.id) && CALLABLE_STATUSES.has(l.status)),
    [leads, selectedIds]
  );

  const allCallableSelected =
    callableLeads.length > 0 && callableLeads.every((l) => selectedIds.has(l.id));
  const someCallableSelected = callableLeads.some((l) => selectedIds.has(l.id));

  const toggleSelect = useCallback((leadId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const toggleSelectAllCallable = useCallback(() => {
    setSelectedIds((prev) => {
      if (allCallableSelected) {
        const next = new Set(prev);
        for (const l of callableLeads) next.delete(l.id);
        return next;
      }
      const next = new Set(prev);
      for (const l of callableLeads) next.add(l.id);
      return next;
    });
  }, [allCallableSelected, callableLeads]);

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

  const handleCallSelected = useCallback(() => {
    const ids = selectedCallable.map((l) => l.id);
    if (ids.length === 0) return;
    setError(null);
    setShowSchedule(false);
    startNow(ids);
  }, [selectedCallable, startNow]);

  const handleSchedule = useCallback(() => {
    const ids = selectedCallable.map((l) => l.id);
    if (ids.length === 0 || !scheduleAt) return;
    const at = new Date(scheduleAt);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      setError('Pick a future date and time');
      return;
    }
    setError(null);
    schedule(ids, at);
    setShowSchedule(false);
  }, [selectedCallable, scheduleAt, schedule]);

  const activeLead = queue.activeLeadId
    ? leads.find((l) => l.id === queue.activeLeadId)
    : null;

  const queueLabel = useMemo(() => {
    if (queue.phase === 'scheduled' && queue.scheduledAt) {
      return `Scheduled ${queue.leadIds.length} call${queue.leadIds.length === 1 ? '' : 's'} for ${queue.scheduledAt.toLocaleString()}`;
    }
    if (queue.phase === 'running' && queue.leadIds.length > 0) {
      const n = queue.currentIndex + 1;
      const name = activeLead ? fullName(activeLead) : '…';
      return `Auto-dialer: ${name} (${n}/${queue.leadIds.length})`;
    }
    if (queue.phase === 'done' && queue.leadIds.length > 0) {
      return `Finished ${queue.leadIds.length} call${queue.leadIds.length === 1 ? '' : 's'}`;
    }
    return null;
  }, [queue, activeLead]);

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-5xl flex-1 px-10 py-12 md:px-16 md:py-14">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={PAGE_TITLE}>Lead queue</h1>
            <p className={PAGE_SUBTITLE}>
              {leads.length} leads · {pendingCount} pending
              {isDemo && ' · Demo data'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedCallable.length === 0 || isBusy}
              onClick={handleCallSelected}
              className={cn(BTN_OUTLINE, 'px-3 py-1.5')}
            >
              <PhoneCallIcon className="size-3.5" weight="bold" />
              Call selected ({selectedCallable.length})
            </button>
            <button
              type="button"
              disabled={selectedCallable.length === 0 || isBusy}
              onClick={() => setShowSchedule((v) => !v)}
              className={cn(BTN_OUTLINE, 'px-3 py-1.5')}
            >
              <ClockIcon className="size-3.5" />
              Schedule
            </button>
          </div>
        </div>

        {showSchedule && selectedCallable.length > 0 && (
          <div className={cn(PANEL_OUTLINE, 'mb-6 flex flex-wrap items-end gap-3 px-4 py-3')}>
            <label className="flex flex-col gap-1 text-[13px]">
              <span className={TEXT_SECONDARY}>Start auto-dialer at</span>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="border-foreground bg-background rounded-md border px-2 py-1.5 text-[14px]"
              />
            </label>
            <button
              type="button"
              onClick={handleSchedule}
              className={cn(BTN_OUTLINE, 'px-3 py-1.5')}
            >
              Schedule {selectedCallable.length} call{selectedCallable.length === 1 ? '' : 's'}
            </button>
            <button
              type="button"
              onClick={() => setShowSchedule(false)}
              className={cn(LINK_GHOST, 'text-[13px]')}
            >
              Cancel
            </button>
          </div>
        )}

        {queueLabel && (
          <div className={cn(PANEL_OUTLINE, 'mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13px]')}>
            <div className="flex items-center gap-2">
              {queue.phase === 'running' && (
                <SpinnerGapIcon className="size-3.5 animate-spin" />
              )}
              {queue.phase === 'scheduled' && <ClockIcon className="size-3.5" />}
              <span>{queueLabel}</span>
              {queue.error && (
                <span className="text-destructive text-[12px]">· {queue.error}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {queue.activeLeadId && (
                <Link
                  href={`/dashboard/calls/${queue.activeLeadId}`}
                  className="text-foreground hover:underline font-medium"
                >
                  View live
                </Link>
              )}
              {queue.phase === 'scheduled' && (
                <button
                  type="button"
                  onClick={cancelSchedule}
                  className={cn(LINK_GHOST, 'inline-flex items-center gap-1')}
                >
                  <XIcon className="size-3.5" />
                  Cancel
                </button>
              )}
              {queue.phase === 'running' && (
                <button
                  type="button"
                  onClick={stop}
                  className={cn(LINK_GHOST, 'inline-flex items-center gap-1')}
                >
                  <XIcon className="size-3.5" />
                  Stop
                </button>
              )}
              {queue.phase === 'done' && (
                <button type="button" onClick={reset} className={LINK_GHOST}>
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-destructive mb-6 rounded-md bg-red-50 px-3 py-2 text-[14px]">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="text-foreground border-foreground border-b text-[12px]">
                <th className="w-8 pb-2 pr-2 font-normal">
                  <input
                    type="checkbox"
                    checked={allCallableSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someCallableSelected && !allCallableSelected;
                    }}
                    onChange={toggleSelectAllCallable}
                    disabled={callableLeads.length === 0}
                    className="size-3.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Select all callable leads"
                  />
                </th>
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
                const isCallable = CALLABLE_STATUSES.has(lead.status);
                const isSelected = selectedIds.has(lead.id);
                const isQueueActive = queue.activeLeadId === lead.id;

                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      ROW_INTERACTIVE,
                      'group cursor-pointer',
                      (isCalling || isQueueActive) && 'border-l-2 border-l-sky-500 bg-sky-50/60',
                      isSelected &&
                        !isCalling &&
                        !isQueueActive &&
                        'ring-1 ring-foreground/20 ring-inset'
                    )}
                    onClick={() => router.push(`/dashboard/calls/${lead.id}`)}
                  >
                    <td className="py-2 pr-2 align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isCallable || isBusy}
                        onChange={() => toggleSelect(lead.id)}
                        className="size-3.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Select ${fullName(lead)}`}
                      />
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <div className="font-normal">{fullName(lead)}</div>
                      <div className={cn(TEXT_SECONDARY, 'text-[12px]')}>{lead.email}</div>
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <div>{lead.company?.name ?? '—'}</div>
                      <div className={cn(TEXT_SECONDARY, 'text-[12px]')}>
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
                        disabled={isCalling || isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(lead.id);
                        }}
                        className={cn(BTN_OUTLINE, 'px-2 py-1')}
                      >
                        {isCalling || isQueueActive ? (
                          <>
                            <SpinnerGapIcon className="size-3.5 animate-spin" />
                            Calling
                          </>
                        ) : (
                          <>
                            <PhoneCallIcon className="size-3.5" />
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
