'use client';

import { useState } from 'react';
import { CheckCircleIcon, SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';
import { PumpShell } from '@/components/pump/pump-shell';
import { Button } from '@/components/ui/button';
import { ApiError, triggerNewSignup } from '@/lib/api';
import { CLOUD_PROVIDERS, COMPANY_SIZES, type TriggerNewSignup } from '@/lib/leads';

const FIELD =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30';

const DEFAULTS: TriggerNewSignup = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '+1',
  company_name: '',
  company_size: '51-200',
  cloud_provider: 'aws',
  timezone: 'America/New_York',
};

export default function PumpSignupPage() {
  const [form, setForm] = useState<TriggerNewSignup>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof TriggerNewSignup, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setDemoNote(false);
    try {
      await triggerNewSignup(form);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend responded with an error — surface it.
        setError(err.message);
      } else {
        // Network error (backend offline) — let the demo proceed.
        setDemoNote(true);
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PumpShell>
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center">
        <section>
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">
            Cloud cost optimization
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Stop overpaying for cloud.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Pump automatically optimizes your AWS, GCP, and Azure spend. Connect your account
            and we find the savings in minutes — no commitment, no engineering lift.
          </p>
          <ul className="text-muted-foreground mt-6 space-y-2 text-sm">
            {[
              'Average 23% reduction in monthly cloud spend',
              'Live in under a day — read-only access',
              'You only pay a percentage of what you save',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircleIcon weight="fill" className="text-primary size-5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-border bg-background rounded-2xl border p-6 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircleIcon weight="fill" className="text-primary size-12" />
              <h2 className="mt-4 text-xl font-semibold">Account created!</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                You&apos;ll hear from us shortly.
              </p>
              {demoNote && (
                <p className="mt-4 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
                  Demo mode: backend offline, signup not actually sent.
                </p>
              )}
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setForm(DEFAULTS);
                  setDone(false);
                }}
              >
                Sign up another
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold">Create your account</h2>
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

              {error && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <SpinnerGapIcon className="animate-spin" weight="bold" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                By signing up you agree to a friendly call from our team.
              </p>
            </form>
          )}
        </section>
      </main>
    </PumpShell>
  );
}
