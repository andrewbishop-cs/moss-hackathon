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
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { StatusBadge, UseCaseBadge } from '@/components/dashboard/badges';
import { MossResultsPanel } from '@/components/app/moss-results-panel';
import { useMossContextEvents } from '@/hooks/useMossContextEvents';
import { fullName, formatMonthly, type LeadWithCompany } from '@/lib/leads';

interface LiveCallViewProps {
  lead: LeadWithCompany;
  roomName: string | null;
  isDemo: boolean;
}

function CallHeader({ lead }: { lead: LeadWithCompany }) {
  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon weight="bold" />
          Queue
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{fullName(lead)}</h1>
          <p className="text-muted-foreground text-xs">
            {lead.company?.name} · {lead.email} · {lead.phone}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UseCaseBadge useCase={lead.use_case} />
        <StatusBadge status={lead.status} />
      </div>
    </div>
  );
}

function ContextPanel({ lead }: { lead: LeadWithCompany }) {
  const company = lead.company;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Lead context
        </h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">{company?.name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Size</dt>
            <dd>{company?.company_size ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Cloud</dt>
            <dd className="uppercase">{company?.cloud_provider ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Monthly spend</dt>
            <dd className="tabular-nums">{formatMonthly(company?.spend_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Monthly savings</dt>
            <dd className="font-semibold tabular-nums text-green-600 dark:text-green-400">
              {formatMonthly(company?.savings_total)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Inner view rendered inside the LiveKit session context. */
function CallSession({ lead }: { lead: LeadWithCompany }) {
  const session = useSessionContext();
  const { isConnected, start } = session;
  const { messages } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  const mossEvents = useMossContextEvents();

  // Auto-join the room read-only as soon as the view mounts.
  useEffect(() => {
    if (!isConnected) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
      <div className="relative flex min-h-[60vh] flex-col">
        {!isConnected && (
          <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-sm">
            Connecting to the live call…
          </div>
        )}
        <AgentChatTranscript
          agentState={agentState}
          messages={messages}
          className="h-full px-6 py-6"
        />
        {isConnected && messages.length === 0 && (
          <div className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/2 text-center text-sm">
            Connected. Waiting for the conversation to start…
          </div>
        )}
      </div>
      <aside className="border-border bg-muted/20 overflow-y-auto border-l px-5 py-6">
        <ContextPanel lead={lead} />
        <div className="mt-6">
          <MossResultsPanel events={mossEvents} />
        </div>
      </aside>
    </div>
  );
}

export function LiveCallView({ lead, roomName, isDemo }: LiveCallViewProps) {
  const tokenSource = useMemo(() => {
    if (!roomName) return null;
    return TokenSource.custom(async () => {
      const res = await fetch('/api/viewer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    });
  }, [roomName]);

  return (
    <main className="flex min-h-svh flex-col">
      <CallHeader lead={lead} />
      {isDemo && (
        <div className="bg-amber-500/15 px-6 py-2 text-xs text-amber-600 dark:text-amber-400">
          Demo data · backend offline — start FastAPI and trigger a call to see a live transcript.
        </div>
      )}
      {tokenSource ? (
        <SessionBoundary tokenSource={tokenSource} lead={lead} />
      ) : (
        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
          <div className="text-muted-foreground flex min-h-[60vh] items-center justify-center px-6 text-center text-sm">
            No active call room for this lead yet. Hit “Call Now” from the queue to start one.
          </div>
          <aside className="border-border bg-muted/20 overflow-y-auto border-l px-5 py-6">
            <ContextPanel lead={lead} />
          </aside>
        </div>
      )}
    </main>
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
