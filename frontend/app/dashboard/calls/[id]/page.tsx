import Link from 'next/link';
import { LiveCallView } from '@/components/dashboard/live-call-view';
import { getLead } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead, isDemo } = await getLead(id);

  if (!lead) {
    return (
      <main className="beep-brand bg-background text-foreground mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">Lead not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          No lead with id <code>{id}</code>.
        </p>
        <Link href="/dashboard" className="text-primary mt-4 text-sm underline">
          Back to the queue
        </Link>
      </main>
    );
  }

  return (
    <div className="beep-brand bg-background text-foreground min-h-svh">
      <LiveCallView lead={lead} roomName={lead.room_name ?? null} isDemo={isDemo} />
    </div>
  );
}
