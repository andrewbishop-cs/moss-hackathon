'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLead, triggerCall } from '@/lib/api';
import type { LeadStatus } from '@/lib/leads';

const POLL_MS = 3000;
const BETWEEN_CALLS_MS = 2000;
const MAX_CALL_WAIT_MS = 15 * 60 * 1000;

const TERMINAL_STATUSES: LeadStatus[] = [
  'called',
  'booked',
  'interested',
  'callback',
  'no_answer',
  'declined',
  'disqualified',
  'bad_data',
  'reengage_90d',
];

export type CallQueuePhase = 'idle' | 'scheduled' | 'running' | 'done';

export interface CallQueueState {
  phase: CallQueuePhase;
  leadIds: string[];
  scheduledAt: Date | null;
  currentIndex: number;
  activeLeadId: string | null;
  error: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCallToFinish(leadId: string, cancelled: () => boolean) {
  const started = Date.now();
  while (Date.now() - started < MAX_CALL_WAIT_MS) {
    if (cancelled()) return;
    const { lead } = await getLead(leadId);
    if (lead && lead.status !== 'calling' && TERMINAL_STATUSES.includes(lead.status)) {
      return;
    }
    if (lead && lead.status === 'pending') {
      // Trigger failed or was reset
      return;
    }
    await sleep(POLL_MS);
  }
}

export function useCallQueue(isDemo: boolean) {
  const [state, setState] = useState<CallQueueState>({
    phase: 'idle',
    leadIds: [],
    scheduledAt: null,
    currentIndex: 0,
    activeLeadId: null,
    error: null,
  });

  const cancelledRef = useRef(false);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    setState((prev) => ({
      ...prev,
      phase: 'done',
      activeLeadId: null,
      scheduledAt: null,
    }));
  }, []);

  const runQueue = useCallback(
    async (leadIds: string[]) => {
      if (runningRef.current || leadIds.length === 0) return;
      cancelledRef.current = false;
      runningRef.current = true;

      setState({
        phase: 'running',
        leadIds,
        scheduledAt: null,
        currentIndex: 0,
        activeLeadId: null,
        error: null,
      });

      for (let i = 0; i < leadIds.length; i++) {
        if (cancelledRef.current) break;

        const leadId = leadIds[i];
        setState((prev) => ({
          ...prev,
          currentIndex: i,
          activeLeadId: leadId,
          error: null,
        }));

        try {
          if (!isDemo) {
            await triggerCall(leadId);
            await waitForCallToFinish(leadId, () => cancelledRef.current);
          } else {
            await sleep(1500);
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Call failed';
          setState((prev) => ({ ...prev, error: message }));
          if (!isDemo) break;
        }

        if (cancelledRef.current) break;
        if (i < leadIds.length - 1) {
          await sleep(BETWEEN_CALLS_MS);
        }
      }

      runningRef.current = false;
      setState((prev) => ({
        ...prev,
        phase: cancelledRef.current ? 'done' : 'done',
        activeLeadId: null,
      }));
    },
    [isDemo]
  );

  const startNow = useCallback(
    (leadIds: string[]) => {
      cancelledRef.current = false;
      void runQueue(leadIds);
    },
    [runQueue]
  );

  const schedule = useCallback(
    (leadIds: string[], at: Date) => {
      if (leadIds.length === 0) return;
      cancelledRef.current = false;
      setState({
        phase: 'scheduled',
        leadIds,
        scheduledAt: at,
        currentIndex: 0,
        activeLeadId: null,
        error: null,
      });
    },
    []
  );

  const cancelSchedule = useCallback(() => {
    cancelledRef.current = true;
    setState({
      phase: 'idle',
      leadIds: [],
      scheduledAt: null,
      currentIndex: 0,
      activeLeadId: null,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (state.phase !== 'scheduled' || !state.scheduledAt) return;

    const tick = () => {
      if (cancelledRef.current) return;
      if (Date.now() >= state.scheduledAt!.getTime()) {
        const ids = state.leadIds;
        setState((prev) => ({ ...prev, phase: 'running', scheduledAt: null }));
        void runQueue(ids);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.phase, state.scheduledAt, state.leadIds, runQueue]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    runningRef.current = false;
    setState({
      phase: 'idle',
      leadIds: [],
      scheduledAt: null,
      currentIndex: 0,
      activeLeadId: null,
      error: null,
    });
  }, []);

  return {
    queue: state,
    startNow,
    schedule,
    cancelSchedule,
    stop,
    reset,
    isBusy: state.phase === 'running' || state.phase === 'scheduled',
  };
}
