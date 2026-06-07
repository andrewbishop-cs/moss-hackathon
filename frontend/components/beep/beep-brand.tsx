import Link from 'next/link';
import { cn } from '@/lib/shadcn/utils';

export const BEEP_MASCOT = '/beep/beep-mascot.png';

/** Halle — Vanta-inspired flat mascot for Beep. */
export function BeepLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-700 p-0.5',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BEEP_MASCOT}
        alt="Halle"
        className="size-full object-contain object-center"
      />
    </span>
  );
}

export function BeepWordmark({ href = '/dashboard', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 px-2 py-1', className)}
    >
      <BeepLogoMark className="size-7" />
      <span className="text-[0.9375rem] font-medium leading-none tracking-[-0.01em]">
        Beep
      </span>
    </Link>
  );
}
