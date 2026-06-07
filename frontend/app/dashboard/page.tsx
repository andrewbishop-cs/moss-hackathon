import { LeadDashboard } from '@/components/dashboard/lead-dashboard';
import { getLeads } from '@/lib/api';

// Always render fresh; the dashboard then keeps itself live by polling GET /leads.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { leads, isDemo } = await getLeads();
  return (
    <main className="min-h-svh">
      <LeadDashboard initialLeads={leads} initialIsDemo={isDemo} />
    </main>
  );
}
