import { type LeadStatus, STATUS_LABEL, USE_CASE_LABEL, type UseCase } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const STATUS_STYLES: Record<LeadStatus, string> = {
  pending: 'text-muted-foreground',
  calling: 'text-foreground animate-pulse',
  called: 'text-muted-foreground',
  booked: 'text-foreground font-medium',
  no_answer: 'text-muted-foreground',
  declined: 'text-muted-foreground',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn('text-[12px] font-normal', STATUS_STYLES[status])}>{STATUS_LABEL[status]}</span>
  );
}

export function UseCaseBadge({ useCase }: { useCase: UseCase }) {
  return (
    <span className="text-muted-foreground text-[12px] font-normal">{USE_CASE_LABEL[useCase]}</span>
  );
}
