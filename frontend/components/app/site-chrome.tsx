'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/app/theme-toggle';

interface SiteChromeProps {
  logo: string;
  logoDark?: string;
  companyName: string;
}

// The LiveKit-branded header + theme toggle belong to the voice starter at /.
// Hide them on the Pump marketing site and SDR dashboard so those routes keep
// their own (Pump) branding.
export function SiteChrome({ logo, logoDark, companyName }: SiteChromeProps) {
  const pathname = usePathname();
  const isBranded = pathname.startsWith('/pump') || pathname.startsWith('/dashboard');
  if (isBranded) return null;

  return (
    <>
      <header className="fixed top-0 left-0 z-50 hidden w-full flex-row justify-between p-6 md:flex">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://livekit.io"
          className="scale-100 transition-transform duration-300 hover:scale-110"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={`${companyName} Logo`} className="block size-6 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDark ?? logo}
            alt={`${companyName} Logo`}
            className="hidden size-6 dark:block"
          />
        </a>
        <span className="text-foreground font-mono text-xs font-bold tracking-wider uppercase">
          Built with{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://docs.livekit.io/agents"
            className="underline underline-offset-4"
          >
            LiveKit Agents
          </a>
        </span>
      </header>
      <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
        <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
      </div>
    </>
  );
}
