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
import { PAGE_SUBTITLE, PAGE_TITLE } from '@/lib/dashboard-ui';
import { type LeadWithCompany, formatMonthly, fullName } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

interface LiveCallViewProps {
  lead: LeadWithCompany;
  roomName: string | null;
  isDemo: boolean;
}

function ContextPanel({ lead }: { lead: LeadWithCompany }) {
  const company = lead.company;
  return (
    <div className="space-y-6 text-[14px] font-normal">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        Lead context
      </p>
      <div>
        <p className="text-muted-foreground text-[12px]">Estimated savings</p>
        <p className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.01em]">
          {formatMonthly(company?.savings_total)}
          <span className="text-muted-foreground text-[13px] font-normal"> /mo</span>
        </p>
      </div>
      <dl className="divide-border divide-y">
        {[
          ['Company', company?.name ?? '—'],
          ['Spend', formatMonthly(company?.spend_total)],
          ['Cloud', (company?.cloud_provider ?? '—').toUpperCase()],
          ['Phone', lead.phone],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={cn(label !== 'Company' && 'tabular-nums')}>{value}</dd>
          </div>
        ))}
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
    <div className="border-border grid flex-1 gap-0 overflow-hidden border-t lg:grid-cols-[1fr_280px]">
      <div className="relative flex min-h-[55vh] flex-col bg-background">
        {!isConnected && (
          <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-[14px]">
            Connecting…
          </div>
        )}
        <AgentChatTranscript
          agentState={agentState}
          messages={messages}
          className="h-full px-10 py-8 md:px-16"
        />
        {isConnected && messages.length === 0 && (
          <div className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/2 text-center text-[14px]">
            Waiting for conversation…
          </div>
        )}
      </div>
      <aside className="border-border bg-[var(--beep-sidebar)] overflow-y-auto border-l px-6 py-8">
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
        <div className="px-10 py-8 md:px-16 md:py-10">
          <Link
            href="/dashboard"
            className="border-border bg-background text-foreground hover:bg-accent mb-5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-normal transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            Lead queue
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className={PAGE_TITLE}>{fullName(lead)}</h1>
              <p className={PAGE_SUBTITLE}>
                {company?.name} · {formatMonthly(company?.spend_total)} spend ·{' '}
                {formatMonthly(company?.savings_total)} savings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UseCaseBadge useCase={lead.use_case} />
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>

        {isDemo && (
          <p className="text-muted-foreground border-border border-t px-10 py-2 text-[13px] md:px-16">
            Demo data · backend offline
          </p>
        )}

        {tokenSource ? (
          <SessionBoundary tokenSource={tokenSource} lead={lead} />
        ) : (
          <div className="border-border grid flex-1 gap-0 overflow-hidden border-t lg:grid-cols-[1fr_280px]">
            <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center px-10 text-center text-[14px] md:px-16">
              No active call yet. Select leads on the queue and hit Call selected.
            </div>
            <aside className="border-border bg-[var(--beep-sidebar)] border-l px-6 py-8">
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
