import { type LeadStatus, STATUS_LABEL, USE_CASE_LABEL, type UseCase } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const STATUS_STYLES: Record<LeadStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  calling: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse',
  called: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  booked: 'bg-green-500/15 text-green-600 dark:text-green-400',
  no_answer: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  declined: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function UseCaseBadge({ useCase }: { useCase: UseCase }) {
  const isUc2 = useCase === 'uc2_estimate_completed';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        isUc2
          ? 'bg-primary/10 text-primary ring-primary/20'
          : 'bg-foreground/5 text-foreground/70 ring-foreground/10'
      )}
    >
      {USE_CASE_LABEL[useCase]}
    </span>
  );
}
