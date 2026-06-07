import Link from 'next/link';
import { cn } from '@/lib/shadcn/utils';

export const BEEP_MASCOT = '/beep/beep-mascot.png';

/** Halle — Notion-style workspace icon (22px rounded square). */
export function BeepLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'border-border inline-flex size-[22px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border bg-white',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BEEP_MASCOT}
        alt="Halle"
        className="size-full scale-125 object-cover object-[60%_40%]"
      />
    </span>
  );
}

export function BeepWordmark({ href = '/dashboard', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
        className
      )}
    >
      <BeepLogoMark />
      <span className="text-foreground min-w-0 flex-1 truncate text-[14px] font-medium leading-none">
        Beep
      </span>
    </Link>
  );
}
