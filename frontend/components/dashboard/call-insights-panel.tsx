'use client';

import type { CallInsights } from '@/lib/call-insights';
import { PANEL_OUTLINE, TEXT_SECONDARY } from '@/lib/dashboard-ui';
import { cn } from '@/lib/shadcn/utils';

interface CallInsightsPanelProps {
  insights: CallInsights;
  className?: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={cn(TEXT_SECONDARY, 'text-[11px] font-medium tracking-wide uppercase')}>
      {children}
    </p>
  );
}

export function CallInsightsPanel({ insights, className }: CallInsightsPanelProps) {
  const hasMoss = insights.mossTopics.length > 0;
  const hasHighlights = insights.highlights.length > 0;
  const isEmpty = insights.outcome.length === 0 && !hasMoss && !hasHighlights;

  return (
    <div className={cn('space-y-4', className)}>
      <p className={cn(TEXT_SECONDARY, 'text-[11px] font-medium tracking-wide uppercase')}>
        Call insights
      </p>

      {insights.outcome.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Outcome</SectionLabel>
          <ul className={cn(PANEL_OUTLINE, 'space-y-2 px-3 py-2.5 text-[13px]')}>
            {insights.outcome.map((item) => (
              <li key={item.label}>
                <span className={TEXT_SECONDARY}>{item.label}: </span>
                <span className="text-foreground">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasMoss && (
        <div className="space-y-2">
          <SectionLabel>Topics discussed</SectionLabel>
          <ul className="flex flex-wrap gap-1.5">
            {insights.mossTopics.map((topic) => (
              <li
                key={topic}
                className="border-foreground bg-background text-foreground rounded-md border px-2 py-0.5 text-[12px]"
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasHighlights && (
        <div className="space-y-2">
          <SectionLabel>Key moments</SectionLabel>
          <ul className="space-y-2">
            {insights.highlights.map((h, i) => (
              <li
                key={`${h.role}-${i}`}
                className={cn(PANEL_OUTLINE, 'px-3 py-2 text-[13px] leading-snug')}
              >
                <span className="text-foreground font-medium">
                  {h.role === 'agent' ? 'Agent' : 'Lead'}
                  {h.time && (
                    <span className={cn(TEXT_SECONDARY, 'font-normal')}> · {h.time}</span>
                  )}
                </span>
                <p className="text-foreground mt-1">{h.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isEmpty && (
        <p className={cn(TEXT_SECONDARY, 'text-[13px]')}>
          Insights appear as the call progresses…
        </p>
      )}

      {!hasHighlights && !isEmpty && insights.outcome.length > 0 && (
        <p className={cn(TEXT_SECONDARY, 'text-[12px]')}>
          Transcript highlights will appear as the conversation unfolds.
        </p>
      )}
    </div>
  );
}
