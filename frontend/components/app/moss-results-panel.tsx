import * as React from 'react';
import type { MossContextEvent } from '@/hooks/useMossContextEvents';
import { PANEL_OUTLINE, TEXT_SECONDARY } from '@/lib/dashboard-ui';
import { cn } from '@/lib/shadcn/utils';

interface MossResultsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  events: MossContextEvent[];
  hidden?: boolean;
}

export function MossResultsPanel({
  events,
  hidden = false,
  className,
  ...props
}: MossResultsPanelProps) {
  if (hidden || events.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)} {...props}>
      <h3 className={cn(TEXT_SECONDARY, 'text-[11px] font-medium tracking-wide uppercase')}>
        Knowledge matches
      </h3>
      <div className="space-y-2">
        {events.map(({ id, query, matches, timeTakenMs }) => (
          <details key={id} className={cn(PANEL_OUTLINE, 'px-3 py-2.5')} open>
            <summary className="text-foreground cursor-pointer text-[13px] font-semibold">
              {query}
              {typeof timeTakenMs === 'number' && (
                <span className={cn(TEXT_SECONDARY, 'ml-2 text-[11px] font-normal')}>
                  {timeTakenMs.toFixed(0)} ms
                </span>
              )}
            </summary>
            <ol className={cn(TEXT_SECONDARY, 'mt-2 space-y-2 text-[13px]')}>
              {matches.length === 0 ? (
                <li className="italic">No knowledge matches found.</li>
              ) : (
                matches.map((match, index) => (
                  <li key={`${id}-${index}`} className="space-y-1">
                    <p className="text-foreground leading-snug">{match.text}</p>
                    {typeof match.score === 'number' && (
                      <p className={cn(TEXT_SECONDARY, 'text-[11px]')}>
                        Relevance: {match.score.toFixed(2)}
                      </p>
                    )}
                  </li>
                ))
              )}
            </ol>
          </details>
        ))}
      </div>
    </div>
  );
}
