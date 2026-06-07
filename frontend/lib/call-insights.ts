import type { MossContextEvent } from '@/hooks/useMossContextEvents';
import { type LeadStatus, type LeadWithCompany, statusLabel } from '@/lib/leads';

export type CallInsight = {
  label: string;
  value: string;
};

export type TranscriptHighlight = {
  role: 'agent' | 'lead';
  text: string;
  time?: string;
};

export type CallInsights = {
  outcome: CallInsight[];
  mossTopics: string[];
  highlights: TranscriptHighlight[];
};

/** Minimal transcript message shape (LiveKit ReceivedMessage). */
export type TranscriptMessage = {
  id: string;
  timestamp: number;
  from?: { isLocal?: boolean };
  message: string;
};

const HIGHLIGHT_KEYWORDS = [
  'book',
  'interested',
  'savings',
  'demo',
  'callback',
  'meeting',
  'pump',
  '$',
];

const NEXT_STEP: Partial<Record<LeadStatus, string>> = {
  booked: 'AE notified — deal created',
  interested: 'Re-queue in 2 business days',
  callback: 'Follow up at requested callback time',
  declined: 'Archive contact — hard no',
  no_answer: 'Back in dial queue (9–11 AM or 4–6 PM local)',
  disqualified: 'Remove from all sequences',
  bad_data: 'Route to GTM for re-enrich',
  reengage_90d: 'Park — auto re-queue in 90 days',
  calling: 'Call in progress',
  called: 'Review outcome and update disposition',
};

const MAX_HIGHLIGHTS = 4;
const MAX_HIGHLIGHT_CHARS = 120;
const MAX_MOSS_TOPICS = 5;

function truncate(text: string, max = MAX_HIGHLIGHT_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function formatMessageTime(timestamp: number): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return new Date(timestamp).toLocaleTimeString(locale, { timeStyle: 'short' });
}

function buildOutcomeInsights(lead: LeadWithCompany): CallInsight[] {
  const insights: CallInsight[] = [
    { label: 'Disposition', value: statusLabel(lead.status) },
  ];

  const next = NEXT_STEP[lead.status as LeadStatus];
  if (next) {
    insights.push({ label: 'Next step', value: next });
  }

  if (lead.outcome_notes?.trim()) {
    insights.push({ label: 'Notes', value: lead.outcome_notes.trim() });
  }

  return insights;
}

function extractMossTopics(events: MossContextEvent[]): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const event of events) {
    const q = event.query.trim();
    if (!q || seen.has(q)) continue;
    seen.add(q);
    topics.push(q);
    if (topics.length >= MAX_MOSS_TOPICS) break;
  }
  return topics;
}

function messageToHighlight(msg: TranscriptMessage): TranscriptHighlight {
  return {
    role: msg.from?.isLocal ? 'lead' : 'agent',
    text: truncate(msg.message),
    time: formatMessageTime(msg.timestamp),
  };
}

function extractHighlights(messages: TranscriptMessage[]): TranscriptHighlight[] {
  if (messages.length === 0) return [];

  const withText = messages.filter((m) => m.message?.trim());
  const keywordHits = withText.filter((m) =>
    HIGHLIGHT_KEYWORDS.some((kw) => m.message.toLowerCase().includes(kw))
  );

  const pool = keywordHits.length > 0 ? keywordHits : withText;
  const selected = pool.slice(-MAX_HIGHLIGHTS);
  return selected.map(messageToHighlight);
}

export const DEMO_HIGHLIGHTS_BY_LEAD_ID: Record<string, TranscriptHighlight[]> = {
  'b1000000-0001-0000-0000-000000000001': [
    {
      role: 'agent',
      text: "Hi Michael — I'm Alex from Pump. You ran a savings estimate on Cursor's cloud spend.",
      time: '2:04 PM',
    },
    {
      role: 'lead',
      text: "Yeah, we found about $1.5M in annual savings — that's significant for us.",
      time: '2:05 PM',
    },
    {
      role: 'agent',
      text: "Would you be open to a quick demo with our team to walk through how you'd claim those savings?",
      time: '2:06 PM',
    },
  ],
  'b1000000-0010-0000-0000-000000000010': [
    {
      role: 'agent',
      text: "I'm calling because we found over $14K a month in savings for Perplexity — completely free to check.",
      time: '5:05 PM',
    },
    {
      role: 'lead',
      text: "That sounds interesting — let's book something for next week.",
      time: '5:07 PM',
    },
    {
      role: 'agent',
      text: "Great — I've got you down for a 20-minute walkthrough. You'll get a calendar invite shortly.",
      time: '5:08 PM',
    },
  ],
};

export function buildCallInsights(
  lead: LeadWithCompany,
  messages: TranscriptMessage[] = [],
  mossEvents: MossContextEvent[] = [],
  options?: { useDemoHighlights?: boolean }
): CallInsights {
  let highlights = extractHighlights(messages);

  if (highlights.length === 0 && options?.useDemoHighlights) {
    highlights = DEMO_HIGHLIGHTS_BY_LEAD_ID[lead.id] ?? [];
  }

  return {
    outcome: buildOutcomeInsights(lead),
    mossTopics: extractMossTopics(mossEvents),
    highlights,
  };
}
