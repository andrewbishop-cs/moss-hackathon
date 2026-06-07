/** Spend tiers and offers — monthly bands from docs/AGENT_SCRIPT.md. */

export type SpendTier =
  | 'not_qualified'
  | 'smb'
  | 'core'
  | 'mid_market'
  | 'enterprise'
  | 'whale';

export type TierInfo = {
  tier: SpendTier;
  label: string;
  offer: string | null;
};

const MONTHLY_MIN = 5_000;
const BANDS: { minMonthly: number; tier: SpendTier; label: string; offer: string }[] = [
  { minMonthly: 150_000, tier: 'whale', label: 'Whale', offer: 'Mac Mini + senior AE' },
  { minMonthly: 60_000, tier: 'enterprise', label: 'Enterprise', offer: 'Custom pullover' },
  { minMonthly: 30_000, tier: 'mid_market', label: 'Mid-Market', offer: 'World Cup jersey' },
  { minMonthly: 15_000, tier: 'core', label: 'Core', offer: '$50 AWS credits' },
  { minMonthly: MONTHLY_MIN, tier: 'smb', label: 'SMB', offer: '$20 DoorDash credit' },
];

export function spendToTier(monthlySpend: number | null | undefined): TierInfo | null {
  if (monthlySpend == null || monthlySpend <= 0) return null;

  if (monthlySpend < MONTHLY_MIN) {
    return { tier: 'not_qualified', label: 'Not qualified', offer: null };
  }

  for (const band of BANDS) {
    if (monthlySpend >= band.minMonthly) {
      return { tier: band.tier, label: band.label, offer: band.offer };
    }
  }

  return { tier: 'smb', label: 'SMB', offer: '$20 DoorDash credit' };
}

/** Short badge text for the queue table. */
export function tierBadgeText(info: TierInfo): string {
  if (info.offer) return `${info.label} · ${shortOffer(info.offer)}`;
  return info.label;
}

function shortOffer(offer: string): string {
  if (offer.includes('DoorDash')) return 'DoorDash';
  if (offer.includes('AWS')) return 'AWS credits';
  if (offer.includes('jersey')) return 'Jersey';
  if (offer.includes('pullover')) return 'Pullover';
  if (offer.includes('Mac Mini')) return 'Mac Mini';
  return offer;
}
