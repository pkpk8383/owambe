'use client';

import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { formatTimeAgo, formatNGN } from '@/lib/utils';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

export default function SavedPlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-plans'],
    queryFn: () => aiApi.getPlans().then(r => r.data),
  });

  const plans = data?.plans || [];

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Link href="/plan" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--dark)] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to AI Planner
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--pill)] flex items-center justify-center">
          <Sparkles size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="font-bold text-xl">Saved Plans</h1>
          <p className="text-sm text-[var(--muted)]">Your AI-generated event plans</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="card text-center py-14">
          <Sparkles size={32} className="mx-auto mb-3 text-[var(--border)]" />
          <div className="font-bold text-[var(--dark)] mb-1">No saved plans yet</div>
          <p className="text-sm text-[var(--muted)] mb-5">
            Use the AI Planner to generate event plans. They'll be saved here automatically.
          </p>
          <Link href="/plan" className="btn-primary inline-flex items-center gap-1.5 text-sm">
            <Sparkles size={14} /> Start Planning
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: any) => (
            <div key={plan.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-sm">{plan.eventType || 'Event Plan'}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {plan.city} · {formatTimeAgo(plan.createdAt)}
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Budget: <span className="font-semibold text-[var(--dark)]">{formatNGN(plan.budget || 0, true)}</span>
                </div>
              </div>

              {plan.plans && (
                <div className="grid grid-cols-3 gap-2">
                  {plan.plans.map((tier: any, i: number) => (
                    <div key={i} className="bg-[var(--bg)] rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">
                        {tier.tier}
                      </div>
                      <div className="font-bold text-sm text-[var(--accent)]">
                        {formatNGN(tier.totalBudget || 0, true)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Link href="/plan" className="btn-secondary text-xs">
                  Edit in Planner
                </Link>
                <Link href="/dashboard" className="btn-primary text-xs">
                  Create Event →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
