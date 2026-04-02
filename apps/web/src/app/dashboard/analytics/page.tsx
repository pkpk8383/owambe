'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatNGN } from '@/lib/utils';
import { BarChart2, TrendingUp, Mail, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['planner-overview'],
    queryFn: () => analyticsApi.plannerOverview().then(r => r.data),
  });

  const regByDay: any[] = overview?.registrationsByDay || MOCK_REG_DATA;
  const stats = overview?.stats || {};

  const METRIC_CARDS = [
    { label: 'Conversion Rate', value: '68%', sub: 'Page visits → registrations', color: '#2D6A4F', icon: <TrendingUp size={16} /> },
    { label: 'Check-in Rate', value: '83%', sub: 'Of registrants checked in', color: '#E76F2A', icon: <BarChart2 size={16} /> },
    { label: 'Email Open Rate', value: '47%', sub: '↑ 12% vs industry avg', color: '#7B61FF', icon: <Mail size={16} /> },
    { label: 'App Adoption', value: '61%', sub: 'Attendees using mobile app', color: '#0EA5E9', icon: <Smartphone size={16} /> },
  ];

  const TRAFFIC = [
    { src: 'Direct link', pct: 38, color: '#2D6A4F' },
    { src: 'Email campaign', pct: 29, color: '#E76F2A' },
    { src: 'Social media', pct: 19, color: '#7B61FF' },
    { src: 'Partner sites', pct: 14, color: '#0EA5E9' },
  ];

  return (
    <div className="p-6 animate-fade-up">
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className="stat-card">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: m.color }} />
            <div className="flex items-start justify-between mb-2">
              <div className="stat-label">{m.label}</div>
              <div style={{ color: m.color }}>{m.icon}</div>
            </div>
            <div className="stat-number">{m.value}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        {/* Chart */}
        <div className="card p-5">
          <div className="text-sm font-bold text-[var(--dark)] mb-1">Registrations — Last 30 Days</div>
          <div className="text-xs text-[var(--muted)] mb-4">Daily registration count across all events</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={regByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A9080' }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#9A9080' }} />
              <Tooltip
                contentStyle={{ background: '#1A1612', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v: any) => [v, 'Registrations']}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {regByDay.map((_: any, i: number) => (
                  <Cell key={i} fill={i === regByDay.length - 1 ? '#E76F2A' : '#2D6A4F'} opacity={0.6 + i * 0.03} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic sources */}
        <div className="card p-5">
          <div className="text-sm font-bold text-[var(--dark)] mb-4">Traffic Sources</div>
          <div className="space-y-3">
            {TRAFFIC.map((t) => (
              <div key={t.src}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--mid)]">{t.src}</span>
                  <span className="font-bold text-[var(--dark)]">{t.pct}%</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${t.pct}%`, background: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <div className="text-sm font-bold text-[var(--dark)] mb-3">Revenue by Month</div>
            {[
              { month: 'February', amount: 1240000 },
              { month: 'March', amount: 3820000 },
              { month: 'April', amount: 1760000 },
            ].map((r) => (
              <div key={r.month} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--mid)]">{r.month}</span>
                <span className="font-bold text-sm text-[var(--accent)]">{formatNGN(r.amount, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_REG_DATA = Array.from({ length: 15 }, (_, i) => ({
  date: `2026-04-${String(i + 1).padStart(2, '0')}`,
  count: [8, 15, 12, 22, 19, 35, 28, 41, 38, 55, 49, 68, 62, 78, 74][i],
}));
