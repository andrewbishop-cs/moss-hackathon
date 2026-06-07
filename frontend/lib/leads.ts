// Shared types mirroring backend/src/models.py — the REST contract the frontend
// codes against. The FastAPI backend (the hub) returns exactly these shapes.

export type UseCase = 'uc1_new_signup' | 'uc2_estimate_completed';

// API values from backend/src/models.py plus disposition-framework categories
// Andrew has not added yet (5–7). Display labels follow the Pump disposition framework.
export type LeadStatus =
  | 'pending'
  | 'calling'
  | 'called'
  | 'booked'
  | 'interested'
  | 'callback'
  | 'no_answer'
  | 'declined'
  | 'disqualified'
  | 'bad_data'
  | 'reengage_90d';

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface Company {
  id: string;
  name: string;
  company_size: string;
  cloud_provider: string;
  spend_aws: number;
  spend_gcp: number;
  spend_azure: number;
  spend_openai: number;
  spend_anthropic: number;
  spend_total: number;
  savings_aws: number;
  savings_gcp: number;
  savings_azure: number;
  savings_openai: number;
  savings_anthropic: number;
  savings_total: number;
  created_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  timezone: string;
  use_case: UseCase;
  status: LeadStatus;
  created_at: string;
  called_at: string | null;
  outcome_notes: string | null;
}

export interface LeadWithCompany extends Lead {
  company: Company | null;
  // Backend stamps the LiveKit room on the lead when a call is live so the
  // dashboard can join it read-only.
  room_name?: string | null;
}

// ---- Request bodies (mirror models.py) ----

export interface TriggerNewSignup {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_size: string;
  cloud_provider: string;
  timezone: string;
}

export interface TriggerEstimateCompleted {
  lead_id: string;
  savings_total: number;
}

// ---- Display helpers ----

export function fullName(lead: Pick<Lead, 'first_name' | 'last_name'>): string {
  return `${lead.first_name} ${lead.last_name}`.trim();
}

/** Format a monthly USD amount compactly, e.g. 8500000 -> "$8.5M/mo". */
export function formatMonthly(amount: number | null | undefined): string {
  if (!amount) return '$0/mo';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  return `${formatter.format(amount)}/mo`;
}

/** Full USD formatting, e.g. 13240 -> "$13,240". */
export function formatUsd(amount: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export const USE_CASE_LABEL: Record<UseCase, string> = {
  uc1_new_signup: 'UC1 · New signup',
  uc2_estimate_completed: 'UC2 · Estimate',
};

/** Pump Lead Disposition Framework — display labels for dashboard badges. */
export const STATUS_LABEL: Record<LeadStatus, string> = {
  pending: 'Pending',
  calling: 'Calling',
  called: 'Called',
  booked: 'Meeting booked',
  interested: 'Spends on cloud – interested',
  callback: 'Interested / Not ready',
  declined: 'Not interested',
  no_answer: 'No connect',
  disqualified: 'Disqualified',
  bad_data: 'Bad data',
  reengage_90d: 'Re-engage in 90 days',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as LeadStatus] ?? status;
}

/** Disposition order for analytics breakdown (framework categories 1–7 + in-call states). */
export const DISPOSITION_STATUS_ORDER: LeadStatus[] = [
  'pending',
  'calling',
  'called',
  'booked',
  'interested',
  'callback',
  'declined',
  'no_answer',
  'disqualified',
  'bad_data',
  'reengage_90d',
];

export const COMPANY_SIZES: CompanySize[] = ['1-10', '11-50', '51-200', '201-500', '500+'];
export const CLOUD_PROVIDERS: CloudProvider[] = ['aws', 'gcp', 'azure'];
