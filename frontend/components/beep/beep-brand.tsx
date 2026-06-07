import Link from 'next/link';
import { cn } from '@/lib/shadcn/utils';

export const BEEP_MASCOT = '/beep/beep-mascot.png';

/** Halle — floating head, transparent bg. */
export function BeepLogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center', className)}>
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
      className={cn(
        'hover:bg-accent flex h-9 w-full items-center gap-2 rounded-md px-2 transition-colors',
        className
      )}
    >
      <BeepLogoMark className="size-9 shrink-0" />
      <span className="text-foreground shrink-0 text-[1.625rem] font-bold leading-9 tracking-[-0.02em]">
        Beep
      </span>
    </Link>
  );
}
