'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TokenSource } from 'livekit-client';
import {
  useAgent,
  useSession,
  useSessionContext,
  useSessionMessages,
} from '@livekit/components-react';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { MossResultsPanel } from '@/components/app/moss-results-panel';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useMossContextEvents } from '@/hooks/useMossContextEvents';
import { type LeadWithCompany, formatMonthly, fullName } from '@/lib/leads';

interface LiveCallViewProps {
  lead: LeadWithCompany;
  roomName: string | null;
  isDemo: boolean;
}

function ContextPanel({ lead }: { lead: LeadWithCompany }) {
  const company = lead.company;
  return (
    <div className="space-y-6 text-[13px] font-normal">
      <div>
        <p className="text-muted-foreground text-[12px]">Estimated savings</p>
        <p className="mt-1 text-xl font-normal tabular-nums tracking-[-0.01em]">
          {formatMonthly(company?.savings_total)}
          <span className="text-muted-foreground text-[13px] font-normal"> /mo</span>
        </p>
      </div>
      <dl className="space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Company</dt>
          <dd>{company?.name ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Spend</dt>
          <dd className="tabular-nums">{formatMonthly(company?.spend_total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Cloud</dt>
          <dd className="uppercase">{company?.cloud_provider ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="tabular-nums">{lead.phone}</dd>
        </div>
      </dl>
    </div>
  );
}

function CallSession({ lead }: { lead: LeadWithCompany }) {
  const session = useSessionContext();
  const { isConnected, start } = session;
  const { messages } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  const mossEvents = useMossContextEvents();

  useEffect(() => {
    if (!isConnected) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_300px]">
      <div className="relative flex min-h-[60vh] flex-col">
        {!isConnected && (
          <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-[13px]">
            Connecting…
          </div>
        )}
        <AgentChatTranscript
          agentState={agentState}
          messages={messages}
          className="h-full px-8 py-6"
        />
        {isConnected && messages.length === 0 && (
          <div className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/2 text-center text-[13px]">
            Waiting for conversation…
          </div>
        )}
      </div>
      <aside className="border-border overflow-y-auto border-l px-5 py-6">
        <ContextPanel lead={lead} />
        <div className="mt-8">
          <MossResultsPanel events={mossEvents} />
        </div>
      </aside>
    </div>
  );
}

export function LiveCallView({ lead, roomName, isDemo }: LiveCallViewProps) {
  const company = lead.company;
  const tokenSource = useMemo(() => {
    if (!roomName) return null;
    return TokenSource.custom(async () => {
      const res = await fetch('/api/viewer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    });
  }, [roomName]);

  return (
    <DashboardShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-border border-b px-6 py-4 md:px-8">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-[12px] font-normal"
          >
            <ArrowLeftIcon weight="bold" />
            Lead queue
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[15px] font-medium tracking-[-0.01em]">{fullName(lead)}</h1>
              <p className="text-muted-foreground mt-1 text-[13px] font-normal">
                {company?.name} · {formatMonthly(company?.spend_total)} spend ·{' '}
                {formatMonthly(company?.savings_total)} savings
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <UseCaseBadge useCase={lead.use_case} />
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>

        {isDemo && (
          <p className="text-muted-foreground border-border border-b px-6 py-2 text-[12px] font-normal md:px-8">
            Demo data · backend offline
          </p>
        )}

        {tokenSource ? (
          <SessionBoundary tokenSource={tokenSource} lead={lead} />
        ) : (
          <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_300px]">
            <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center px-8 text-center text-[13px]">
              No active call yet. Hit Call from the queue to start one.
            </div>
            <aside className="border-border border-l px-5 py-6">
              <ContextPanel lead={lead} />
            </aside>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function SessionBoundary({
  tokenSource,
  lead,
}: {
  tokenSource: TokenSource;
  lead: LeadWithCompany;
}) {
  const session = useSession(tokenSource);
  return (
    <AgentSessionProvider session={session}>
      <CallSession lead={lead} />
    </AgentSessionProvider>
  );
}
