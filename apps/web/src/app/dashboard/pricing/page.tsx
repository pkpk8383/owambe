'use client';

import toast from 'react-hot-toast';
import { Check, X, Zap, ArrowRight } from 'lucide-react';
import { useAuthStore, getPlanTier } from '@/store/auth.store';

const PLANS = [
  {
    key: 'STARTER' as const,
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    color: '#9A9080',
    description: 'For your first few events. No card required.',
    featured: false,
    cta: 'Current Plan',
  },
  {
    key: 'GROWTH' as const,
    name: 'Growth',
    price: '₦150,000',
    period: '/month',
    color: '#2D6A4F',
    description: 'Everything growing event businesses need.',
    featured: true,
    cta: 'Upgrade to Growth',
  },
  {
    key: 'SCALE' as const,
    name: 'Scale',
    price: '₦450,000',
    period: '/month',
    color: '#E76F2A',
    description: 'For agencies running high-volume programs.',
    featured: false,
    cta: 'Get Scale',
  },
];

const FEATURES: Array<{
  category: string;
  rows: Array<{ label: string; starter: true | false | string; growth: true | false | string; scale: true | false | string }>;
}> = [
  {
    category: 'Events & Ticketing',
    rows: [
      { label: 'Events per year',             starter: '3 events',      growth: 'Unlimited',      scale: 'Unlimited' },
      { label: 'Attendees per event',          starter: '100',           growth: '1,000',          scale: '5,000' },
      { label: 'Ticket types & promo codes',   starter: true,            growth: true,             scale: true },
      { label: 'QR code check-in',             starter: true,            growth: true,             scale: true },
      { label: 'Waitlist management',           starter: true,            growth: true,             scale: true },
      { label: 'Speaker & sponsor management', starter: false,           growth: true,             scale: true },
      { label: 'Full analytics dashboard',     starter: false,           growth: true,             scale: true },
    ],
  },
  {
    category: 'AI & Planning',
    rows: [
      { label: 'AI Event Builder (GPT-4o)',    starter: false,           growth: true,             scale: true },
      { label: 'AI event copy generator',      starter: false,           growth: true,             scale: true },
      { label: 'Vendor search & booking',      starter: true,            growth: true,             scale: true },
    ],
  },
  {
    category: 'Payments & Billing',
    rows: [
      { label: 'Paystack ticket payments',     starter: true,            growth: true,             scale: true },
      { label: 'Vendor booking escrow',        starter: true,            growth: true,             scale: true },
      { label: 'Instalment plans',             starter: '3 months only', growth: '3 or 6 months', scale: '3 or 6 months' },
    ],
  },
  {
    category: 'Distribution & Reach',
    rows: [
      { label: 'Embedded widget (card/button)',starter: true,            growth: true,             scale: true },
      { label: 'Embedded widget (full form)',  starter: false,           growth: true,             scale: true },
      { label: 'Google Events syndication',    starter: true,            growth: true,             scale: true },
      { label: 'Eventbrite distribution',      starter: false,           growth: true,             scale: true },
      { label: 'Facebook Events distribution', starter: false,           growth: true,             scale: true },
    ],
  },
  {
    category: 'Communications',
    rows: [
      { label: 'Email confirmations',          starter: true,            growth: true,             scale: true },
      { label: 'Email campaigns',              starter: false,           growth: true,             scale: true },
      { label: 'Automated email sequences',    starter: false,           growth: true,             scale: true },
    ],
  },
  {
    category: 'Contracts & Intelligence',
    rows: [
      { label: 'E-signature contracts',        starter: false,           growth: true,             scale: true },
      { label: 'PDF contract download',        starter: false,           growth: true,             scale: true },
      { label: 'Market intelligence dashboard',starter: false,           growth: true,             scale: true },
    ],
  },
  {
    category: 'Scale Features',
    rows: [
      { label: 'White-label portal',           starter: false,           growth: false,            scale: true },
      { label: 'Custom domain',                starter: false,           growth: false,            scale: true },
      { label: 'Salesforce sync',              starter: false,           growth: false,            scale: true },
      { label: 'HubSpot sync',                 starter: false,           growth: false,            scale: true },
      { label: 'Team accounts (10 seats)',     starter: false,           growth: false,            scale: true },
      { label: 'Dedicated account manager',    starter: false,           growth: false,            scale: true },
    ],
  },
  {
    category: 'Support',
    rows: [
      { label: 'Community & docs',             starter: true,            growth: true,             scale: true },
      { label: 'Email support',                starter: false,           growth: true,             scale: true },
      { label: '24/7 live chat',               starter: false,           growth: true,             scale: true },
      { label: 'Same-day onboarding',          starter: false,           growth: false,            scale: true },
    ],
  },
];

function Cell({ value }: { value: true | false | string }) {
  if (value === true) return <Check size={15} className="text-[var(--accent)] mx-auto" />;
  if (value === false) return <X size={13} className="text-[var(--border)] mx-auto" />;
  return <span className="text-xs font-semibold text-[var(--dark)] block text-center">{value}</span>;
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const currentPlan = getPlanTier(user);

  return (
    <div className="p-6 animate-fade-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[10px] uppercase tracking-[3px] text-[var(--muted)] mb-2">Transparent Pricing</div>
        <h1 className="text-2xl font-bold text-[var(--dark)] mb-2">
          No surprises. No sales calls.<br />No per-attendee gotchas.
        </h1>
        <p className="text-sm text-[var(--muted)]">Everything included. Cancel anytime on Starter & Growth.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isLower = (plan.key === 'STARTER' && currentPlan !== 'STARTER') ||
                          (plan.key === 'GROWTH' && currentPlan === 'SCALE');

          return (
            <div key={plan.key}
              className="card p-6 relative transition-all hover:shadow-md"
              style={{
                borderColor: plan.featured ? plan.color : undefined,
                borderWidth: plan.featured ? 2 : undefined,
              }}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ background: plan.color }}>
                  Most Popular
                </div>
              )}
              {isCurrent && !plan.featured && (
                <div className="absolute -top-3 right-4 bg-[var(--dark)] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Your Plan
                </div>
              )}

              <div className="text-[11px] font-bold uppercase tracking-[2px] mb-2" style={{ color: plan.color }}>
                {plan.name} {isCurrent && '✓'}
              </div>
              <div className="font-bold text-[34px] text-[var(--dark)] leading-none mb-1">{plan.price}</div>
              <div className="text-sm text-[var(--muted)] mb-4">{plan.period}</div>
              <div className="text-xs text-[var(--muted)] mb-5 leading-relaxed">{plan.description}</div>

              {isCurrent ? (
                <div className="w-full py-2 rounded-lg text-sm font-semibold text-center btn-secondary opacity-60 cursor-default">
                  Current Plan ✓
                </div>
              ) : isLower ? (
                <div className="w-full py-2 rounded-lg text-sm text-center text-[var(--muted)] opacity-40 cursor-default">
                  Already included
                </div>
              ) : (
                <button
                  onClick={() => toast.success(
                    plan.key === 'GROWTH'
                      ? 'Upgrading to Growth — our team will send a payment link within 2 hours.'
                      : 'Our enterprise team will contact you within 24 hours to set up Scale.'
                  )}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all text-white"
                  style={{ background: plan.color }}>
                  {plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="card overflow-hidden mb-5">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="px-5 py-3 text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Feature</div>
          {PLANS.map(p => (
            <div key={p.key} className="px-3 py-3 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: p.color }}>{p.name}</div>
              {currentPlan === p.key && <div className="text-[9px] text-[var(--muted)] mt-0.5">Your plan</div>}
            </div>
          ))}
        </div>

        {FEATURES.map((section, si) => (
          <div key={section.category}>
            <div className="bg-[var(--pill)] border-b border-[var(--border)]">
              <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-[2px] text-[var(--muted)]">
                {section.category}
              </div>
            </div>
            {section.rows.map((row, ri) => (
              <div key={row.label}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${
                  si === FEATURES.length - 1 && ri === section.rows.length - 1 ? 'border-0' : ''
                }`}>
                <div className="px-5 py-2.5 text-xs text-[var(--mid)] flex items-center">{row.label}</div>
                <div className="px-3 py-2.5 flex items-center justify-center"><Cell value={row.starter} /></div>
                <div className="px-3 py-2.5 flex items-center justify-center bg-[var(--accent)]/[0.025]"><Cell value={row.growth} /></div>
                <div className="px-3 py-2.5 flex items-center justify-center"><Cell value={row.scale} /></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Plan-specific upgrade nudges */}
      {currentPlan === 'STARTER' && (
        <div className="card p-5 mb-5 border-[var(--accent)] border">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-[var(--accent)]" />
            <span className="text-sm font-bold">Unlock with Growth — ₦150,000/month</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'AI Event Builder', desc: 'GPT-4o plans from a single prompt' },
              { label: '6-month instalments', desc: 'Longer payment plans for bigger events' },
              { label: 'Eventbrite & Facebook', desc: 'One-click channel distribution' },
              { label: 'Full inline widget', desc: 'Register without leaving the embed site' },
              { label: 'Email campaigns', desc: 'Branded sends to your attendee list' },
              { label: 'Contracts & e-sign', desc: 'Digital vendor agreements in-platform' },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-2 p-2.5 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <Check size={11} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[var(--dark)]">{f.label}</div>
                  <div className="text-[11px] text-[var(--muted)]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.success('Upgrading to Growth — our team will send a payment link within 2 hours.')}
            className="btn-primary w-full justify-center py-3 text-sm">
            Upgrade to Growth — ₦150,000/month →
          </button>
        </div>
      )}

      {currentPlan === 'GROWTH' && (
        <div className="card p-5 mb-5 border-[var(--accent2)] border">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-[var(--accent2)]" />
            <span className="text-sm font-bold">Unlock with Scale — ₦450,000/month</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'White-label portal', desc: 'Your brand, your subdomain' },
              { label: 'Salesforce & HubSpot', desc: 'Two-way CRM sync' },
              { label: '10-seat team accounts', desc: 'Invite your full team' },
              { label: 'Dedicated account manager', desc: 'Named Owambe contact for your account' },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-2 p-2.5 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <Check size={11} className="text-[var(--accent2)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[var(--dark)]">{f.label}</div>
                  <div className="text-[11px] text-[var(--muted)]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.success('Our enterprise team will contact you within 24 hours to set up Scale.')}
            className="btn-accent w-full justify-center py-3 text-sm">
            Get Scale — ₦450,000/month →
          </button>
        </div>
      )}

      {/* Competitor callout */}
      <div className="card px-5 py-4 text-center mb-4">
        <p className="text-sm text-[var(--muted)]">
          💡 <strong className="text-[var(--dark)]">vs. Cvent:</strong>{' '}
          Median Cvent contract = $52,000/year. Owambe Scale = ₦5.4M/year (~$3,600).{' '}
          That's <strong className="text-[var(--accent)]">93% cheaper</strong> — no auto-uplift clauses,
          no 90-day cancellation notice, no sales call needed.
        </p>
      </div>

      {/* Fee footnote */}
      <div className="card px-5 py-4 bg-[var(--pill)]">
        <p className="text-xs text-[var(--muted)] text-center leading-relaxed">
          <strong className="text-[var(--dark)]">Vendor commission:</strong>{' '}
          8–12% deducted from vendor payouts at payout time. New vendors pay 0% for the first 90 days.{' '}
          <strong className="text-[var(--dark)]">Instalment fee:</strong>{' '}
          3.5% flat on 3-month plans · 5.0% flat on 6-month plans — charged to the booker.
        </p>
      </div>
    </div>
  );
}
