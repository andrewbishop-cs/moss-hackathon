import { type LeadStatus, statusLabel, USE_CASE_LABEL, type UseCase } from '@/lib/leads';
import { cn } from '@/lib/shadcn/utils';

const STATUS_STYLES: Record<LeadStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  calling: 'bg-sky-50 text-sky-700',
  called: 'bg-neutral-100 text-neutral-600',
  booked: 'bg-emerald-50 text-emerald-700',
  interested: 'bg-blue-50 text-blue-700',
  callback: 'bg-blue-50 text-blue-700',
  declined: 'bg-red-50 text-red-700',
  no_answer: 'bg-amber-50 text-amber-800',
  disqualified: 'bg-orange-50 text-orange-800',
  bad_data: 'bg-rose-50 text-rose-700',
  reengage_90d: 'bg-violet-50 text-violet-700',
};

const DEFAULT_STATUS_STYLE = 'bg-neutral-100 text-neutral-600';

export function StatusBadge({ status }: { status: LeadStatus | string }) {
  const style = STATUS_STYLES[status as LeadStatus] ?? DEFAULT_STATUS_STYLE;
  return (
    <span
      className={cn(
        'inline-flex rounded px-1.5 py-0.5 text-[12px] font-normal leading-none',
        style
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function UseCaseBadge({ useCase }: { useCase: UseCase }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-1.5 py-0.5 text-[12px] font-normal leading-none',
        useCase === 'uc1_new_signup'
          ? 'bg-violet-50 text-violet-700'
          : 'bg-blue-50 text-blue-700'
      )}
    >
      {USE_CASE_LABEL[useCase]}
    </span>
  );
}
