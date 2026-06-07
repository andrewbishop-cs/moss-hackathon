import {
  type LeadWithCompany,
  type TriggerEstimateCompleted,
  type TriggerNewSignup,
} from '@/lib/leads';
import { FIXTURE_LEADS, fixtureLeadById } from '@/lib/fixtures';

// The FastAPI backend is the hub. The frontend only talks to these REST
// endpoints — never to LiveKit / Moss / Supabase directly. Base URL is
// overridable so we can point at a deployed backend later.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');

export interface TriggerResponse {
  lead: LeadWithCompany;
  room_name: string;
}

export interface CallTriggerResponse {
  lead_id: string;
  room_name: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(body || `Request failed (${res.status})`, res.status);
  }
  // Some endpoints may return empty bodies.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * GET /leads — all leads with company + status.
 * Falls back to demo fixtures when the backend is unreachable so the UI still
 * renders during development (Phase 1).
 */
export async function getLeads(): Promise<{ leads: LeadWithCompany[]; isDemo: boolean }> {
  try {
    const leads = await request<LeadWithCompany[]>('/leads');
    return { leads, isDemo: false };
  } catch {
    return { leads: FIXTURE_LEADS, isDemo: true };
  }
}

/** GET /leads/:id — single lead detail (+ room_name for the live call view). */
export async function getLead(
  id: string
): Promise<{ lead: LeadWithCompany | null; isDemo: boolean }> {
  try {
    const lead = await request<LeadWithCompany>(`/leads/${id}`);
    return { lead, isDemo: false };
  } catch {
    return { lead: fixtureLeadById(id) ?? null, isDemo: true };
  }
}

/** POST /calls/trigger — manual "Call Now" from the dashboard. */
export async function triggerCall(leadId: string): Promise<CallTriggerResponse> {
  return request<CallTriggerResponse>('/calls/trigger', {
    method: 'POST',
    body: JSON.stringify({ lead_id: leadId }),
  });
}

/** POST /triggers/new-signup — UC1 website flow. */
export async function triggerNewSignup(body: TriggerNewSignup): Promise<TriggerResponse> {
  return request<TriggerResponse>('/triggers/new-signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** POST /triggers/estimate-completed — UC2 website flow. */
export async function triggerEstimateCompleted(
  body: TriggerEstimateCompleted
): Promise<TriggerResponse> {
  return request<TriggerResponse>('/triggers/estimate-completed', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
