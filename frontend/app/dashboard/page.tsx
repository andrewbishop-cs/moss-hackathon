'use client';

import { useCallback, useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type Company = {
  id: string;
  name: string;
  company_size: string;
  cloud_provider: string;
  spend_total: number;
  savings_total: number;
};

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  use_case: 'uc1_new_signup' | 'uc2_estimate_completed';
  status: string;
  room_name: string | null;
  company: Company;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-neutral-500/15 text-neutral-500',
  calling: 'bg-amber-500/15 text-amber-500 animate-pulse',
  called: 'bg-blue-500/15 text-blue-500',
  booked: 'bg-green-500/15 text-green-500',
  no_answer: 'bg-neutral-500/15 text-neutral-500',
  declined: 'bg-red-500/15 text-red-500',
};

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calling, setCalling] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`GET /leads ${res.status}`);
      setLeads(await res.json());
      setError(null);
    } catch (e) {
      setError(
        `Can't reach the backend at ${BACKEND_URL}. Is it running? (pnpm dev:backend)`
      );
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    const id = setInterval(fetchLeads, 3000);
    return () => clearInterval(id);
  }, [fetchLeads]);

  const callNow = useCallback(
    async (leadId: string) => {
      setCalling(leadId);
      try {
        const res = await fetch(`${BACKEND_URL}/calls/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: leadId }),
        });
        if (!res.ok) throw new Error(`POST /calls/trigger ${res.status}`);
        await fetchLeads();
      } catch (e) {
        setError(`Call failed: ${e instanceof Error ? e.message : 'unknown'}`);
      } finally {
        setCalling(null);
      }
    },
    [fetchLeads]
  );

  return (
    <main className="text-foreground mx-auto min-h-screen w-full max-w-6xl px-6 pt-24 pb-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Queue</h1>
          <p className="text-muted-foreground text-sm">
            Pump outbound SDR — {leads.length} leads · auto-refreshing
          </p>
        </div>
        <code className="text-muted-foreground text-xs">{BACKEND_URL}</code>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Use case</th>
              <th className="px-4 py-3 font-medium">Cloud spend</th>
              <th className="px-4 py-3 font-medium">Est. savings</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div className="text-muted-foreground text-xs">{lead.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{lead.company.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {lead.company.company_size} · {lead.company.cloud_provider}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (lead.use_case === 'uc2_estimate_completed'
                        ? 'bg-purple-500/15 text-purple-500'
                        : 'bg-sky-500/15 text-sky-500')
                    }
                  >
                    {lead.use_case === 'uc2_estimate_completed' ? 'UC2 estimate' : 'UC1 signup'}
                  </span>
                </td>
                <td className="px-4 py-3">{money(lead.company.spend_total)}</td>
                <td className="px-4 py-3">{money(lead.company.savings_total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (STATUS_STYLES[lead.status] ?? STATUS_STYLES.pending)
                    }
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => callNow(lead.id)}
                    disabled={calling === lead.id || lead.status === 'calling'}
                    className="bg-foreground text-background rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  >
                    {calling === lead.id ? 'Calling…' : 'Call Now'}
                  </button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                  Loading leads…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
