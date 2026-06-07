'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SpinnerGapIcon,
  TrendDownIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PumpShell } from '@/components/pump/pump-shell';
import { Button } from '@/components/ui/button';
import { CLOUD_PROVIDERS, COMPANY_SIZES, type TriggerNewSignup } from '@/lib/leads';

const FIELD =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30';

// Demo: the Beehiiv lead (Tyler Denk, UC2) is already seeded in Supabase
// (see backend/seed/setup_beehive.sql). The signup form is pre-filled with his
// details and "creating an account" reuses this existing lead instead of
// inserting a new row, so the estimate → call flow runs against real data.
const BEEHIIV_LEAD_ID = 'b1000000-0018-0000-0000-000000000018';

const DEFAULTS: TriggerNewSignup = {
  first_name: 'Tyler',
  last_name: 'Denk',
  email: 'tyler@beehiiv.com',
  phone: '+19145598426',
  company_name: 'Beehiiv',
  company_size: '51-200',
  cloud_provider: 'aws',
  timezone: 'America/Los_Angeles',
};

const PILLARS = [
  {
    icon: TrendDownIcon,
    name: 'Pump Save',
    copy: 'Cut your cloud bill automatically. Pump finds the best pricing as your usage spikes, dips, or grows.',
  },
  {
    icon: ChartLineUpIcon,
    name: 'Pump View',
    copy: "Break down and forecast cloud + AI costs so you always know where your money's going.",
  },
  {
    icon: ShieldCheckIcon,
    name: 'Pump Secure',
    copy: 'Scan your cloud against industry compliance frameworks with step-by-step fixes and 24/7 monitoring.',
  },
];

const PRICING_INCLUDES = [
  'AWS, GCP & Azure',
  'OpenAI & Anthropic spend',
  'Autopilot savings plans',
  'Full spend visibility',
  'Unlimited accounts & users',
  '24x7 Slack support',
];

function SignupForm() {
  const [form, setForm] = useState<TriggerNewSignup>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const update = (key: keyof TriggerNewSignup, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // The Beehiiv lead already exists in Supabase — do NOT create a new lead.
    // We just simulate the "creating account" beat and hand the existing
    // lead_id to the estimate flow.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLeadId(BEEHIIV_LEAD_ID);
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="border-border bg-card text-card-foreground shadow-primary/5 rounded-3xl border p-6 shadow-xl">
      {done ? (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircleIcon weight="fill" className="text-primary size-12" />
          <h2 className="mt-4 text-xl font-bold">Account created!</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Next, connect your cloud to see how much you could save.
          </p>
          <Button asChild className="mt-6 w-full rounded-full">
            <Link href={leadId ? `/pump/estimate?lead_id=${leadId}` : '/pump/estimate'}>
              Run your estimate
              <ArrowRightIcon weight="bold" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => {
              setForm(DEFAULTS);
              setLeadId(null);
              setDone(false);
            }}
          >
            Sign up another
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Get your free savings estimate</h2>
            <p className="text-muted-foreground text-sm">
              Two minutes to see exactly what you could save.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">First name</label>
              <input
                required
                className={FIELD}
                value={form.first_name}
                onChange={(e) => update('first_name', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Last name</label>
              <input
                required
                className={FIELD}
                value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Work email</label>
            <input
              required
              type="email"
              className={FIELD}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Phone (E.164, e.g. +14155550123)
            </label>
            <input
              required
              pattern="\+[1-9]\d{7,14}"
              className={FIELD}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Company</label>
            <input
              required
              className={FIELD}
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Company size</label>
              <select
                className={FIELD}
                value={form.company_size}
                onChange={(e) => update('company_size', e.target.value)}
              >
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Cloud provider</label>
              <select
                className={FIELD}
                value={form.cloud_provider}
                onChange={(e) => update('cloud_provider', e.target.value)}
              >
                {CLOUD_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting ? (
              <>
                <SpinnerGapIcon className="animate-spin" weight="bold" />
                Creating account…
              </>
            ) : (
              'Get started — it\u2019s free'
            )}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            No contracts, no credit cards, no cancellation fees.
          </p>
        </form>
      )}
    </div>
  );
}

export default function PumpSignupPage() {
  return (
    <PumpShell>
      {/* Hero */}
      <section
        id="top"
        className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20"
      >
        <div>
          <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <SparkleIcon weight="fill" className="size-3.5" />
            The intelligent cloud platform
          </span>
          <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl">
            Save up to <span className="text-primary">60%</span> on cloud &amp; AI{' '}
            <span className="text-primary">for free</span>.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-lg">
            Through group buying and AI, Pump automates cost savings on AWS, GCP, Azure, OpenAI and
            Anthropic — no infrastructure changes, no engineering lift.
          </p>
          <ul className="mt-7 grid max-w-md gap-2.5 text-sm">
            {[
              'Big-tech cloud pricing for startups',
              'Live in under a day with read-only access',
              'You only pay a percentage of what you save',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircleIcon weight="fill" className="text-primary size-5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-8 text-xs font-semibold tracking-wider uppercase">
            Voted #1 for startups · Product Hunt #1 Product of the Day
          </p>
        </div>
        <SignupForm />
      </section>

      {/* Product pillars */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Cloud operations, simplified</h2>
          <p className="text-muted-foreground mt-3">
            Big cloud savings once reserved for big tech. Pump optimizes your spend, automates your
            savings, and gives you the visibility to stay in control.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, name, copy }) => (
            <div key={name} className="border-border bg-card rounded-2xl border p-6">
              <span className="bg-primary/10 text-primary grid size-11 place-content-center rounded-xl">
                <Icon weight="bold" className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{name}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing — Pump is free */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="border-primary/30 bg-primary/5 mx-auto max-w-3xl rounded-3xl border p-8 text-center">
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">
            Speaking about price
          </span>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Pump is free</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
            Our customers think we should charge — we disagree. Having delivered value from day one,
            Pump stays free with a money-back guarantee.
          </p>
          <ul className="mx-auto mt-6 grid max-w-lg grid-cols-1 gap-2 text-left text-sm sm:grid-cols-2">
            {PRICING_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircleIcon weight="fill" className="text-primary size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 rounded-full px-8" size="lg">
            <a href="#top">Start saving today</a>
          </Button>
          <p className="text-muted-foreground mt-3 text-xs">
            No contracts, no credit cards, no cancellation fees. It&apos;s a no-brainer.
          </p>
        </div>
      </section>
    </PumpShell>
  );
}
