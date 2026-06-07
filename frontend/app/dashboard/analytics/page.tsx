import { AnalyticsView } from '@/components/dashboard/analytics-view';
import { getLeads } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { leads, isDemo } = await getLeads();
  return (
    <main className="beep-brand bg-background text-foreground min-h-svh">
      <AnalyticsView initialLeads={leads} initialIsDemo={isDemo} />
    </main>
  );
}
