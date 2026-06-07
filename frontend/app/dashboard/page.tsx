import { LeadDashboard } from '@/components/dashboard/lead-dashboard';
import { getLeads } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { leads, isDemo } = await getLeads();
  return (
    <main className="pump-brand bg-background text-foreground min-h-svh">
      <LeadDashboard initialLeads={leads} initialIsDemo={isDemo} />
    </main>
  );
}
