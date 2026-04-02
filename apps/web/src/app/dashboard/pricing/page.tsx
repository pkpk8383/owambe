'use client';

import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    color: '#9A9080',
    description: 'For your first few events. No card required.',
    featured: false,
    features: [
      { text: '3 events per year', included: true },
      { text: '100 attendees per event', included: true },
      { text: 'Basic registration forms', included: true },
      { text: 'QR code check-in', included: true },
      { text: 'Email confirmations', included: true },
      { text: 'AI Event Builder', included: false },
      { text: 'Speaker management', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
    cta: 'Current Plan',
    ctaAction: null,
  },
  {
    name: 'Growth',
    price: '₦150,000',
    period: '/month',
    color: '#2D6A4F',
    description: 'Everything growing teams need. Flat monthly fee.',
    featured: true,
    features: [
      { text: 'Unlimited events', included: true },
      { text: '1,000 attendees per event', included: true },
      { text: '✨ AI Event Builder', included: true },
      { text: '🎤 Speaker management', included: true },
      { text: 'Custom branding & domain', included: true },
      { text: 'Full analytics dashboard', included: true },
      { text: 'Promo codes & waitlist', included: true },
      { text: '24/7 live chat support', included: true },
    ],
    cta: 'Upgrade to Growth',
    ctaAction: () => toast.success('Redirecting to billing...'),
  },
  {
    name: 'Scale',
    price: '₦450,000',
    period: '/month',
    color: '#E76F2A',
    description: 'For agencies running high-volume programs.',
    featured: false,
    features: [
      { text: 'Everything in Growth', included: true },
      { text: '5,000 attendees per event', included: true },
      { text: '10-seat team accounts', included: true },
      { text: 'White-label platform', included: true },
      { text: 'Sponsor management', included: true },
      { text: 'Salesforce & HubSpot sync', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Same-day onboarding', included: true },
    ],
    cta: 'Get Scale',
    ctaAction: () => toast.success('Our team will contact you shortly.'),
  },
];

export default function PricingPage() {
  return (
    <div className="p-6 animate-fade-up">
      <div className="text-center mb-8">
        <div className="text-[10px] uppercase tracking-[3px] text-[var(--muted)] mb-2">Transparent Pricing</div>
        <h1 className="text-2xl font-bold text-[var(--dark)] mb-2 text-balance">
          No surprises. No sales calls.<br />No per-attendee gotchas.
        </h1>
        <p className="text-sm text-[var(--muted)]">Everything listed here. Cancel anytime on Starter & Growth.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card p-6 relative transition-all hover:shadow-lg ${plan.featured ? 'border-[var(--accent)] border-2' : ''}`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
            )}

            <div className="text-[11px] font-bold uppercase tracking-[2px] mb-2" style={{ color: plan.color }}>
              {plan.name}
            </div>
            <div className="font-bold text-[34px] text-[var(--dark)] leading-none mb-1">{plan.price}</div>
            <div className="text-sm text-[var(--muted)] mb-4">{plan.period}</div>
            <div className="text-xs text-[var(--muted)] mb-5 leading-relaxed">{plan.description}</div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-xs">
                  {f.included
                    ? <Check size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    : <X size={13} className="text-[#CBD5E1] shrink-0 mt-0.5" />
                  }
                  <span className={f.included ? 'text-[var(--dark)]' : 'text-[#CBD5E1]'}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={plan.ctaAction || undefined}
              disabled={!plan.ctaAction}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                plan.featured
                  ? 'btn-primary'
                  : plan.ctaAction
                  ? 'btn-accent'
                  : 'btn-secondary opacity-60 cursor-default'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Comparison callout */}
      <div className="card px-5 py-4 text-center">
        <p className="text-sm text-[var(--muted)]">
          💡 <strong className="text-[var(--dark)]">vs. Cvent:</strong>{' '}
          Median Cvent contract = $52,000/year. Owambe Scale = ₦5.4M/year (~$3,600).{' '}
          That's <strong className="text-[var(--accent)]">93% cheaper</strong> — no auto-uplift clauses,
          no 90-day cancellation notice, no sales call needed. Pricing is right here.
        </p>
      </div>
    </div>
  );
}
