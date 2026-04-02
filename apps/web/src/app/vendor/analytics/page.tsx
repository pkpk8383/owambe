'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatNGN } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Star, Calendar, Award } from 'lucide-react';

const MOCK_MONTHLY = [
  { month: 'Jan', revenue: 0, bookings: 0 },
  { month: 'Feb', revenue: 480000, bookings: 2 },
  { month: 'Mar', revenue: 1200000, bookings: 4 },
  { month: 'Apr', revenue: 850000, bookings: 3 },
  { month: 'May', revenue: 2100000, bookings: 6 },
  { month: 'Jun', revenue: 1750000, bookings: 5 },
];

export default function VendorAnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
  });

  const stats = data?.stats;

  return (
    <div className="p-6 animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent)]" />
          <div className="stat-label">Total Earned</div>
          <div className="stat-number">{stats ? formatNGN(stats.totalRevenue, true) : '—'}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[var(--accent)]">
            <TrendingUp size={10} /> All completed bookings
          </div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-yellow-400" />
          <div className="stat-label">In Escrow</div>
          <div className="stat-number">{stats ? formatNGN(stats.pendingPayout, true) : '—'}</div>
          <div className="text-[11px] text-[var(--muted)] mt-1.5">Releasing after events</div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent2)]" />
          <div className="stat-label">Rating</div>
          <div className="stat-number flex items-center gap-1.5">
            {stats?.rating ?? '—'}
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1.5">{stats?.reviewCount ?? 0} verified reviews</div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[#7B61FF]" />
          <div className="stat-label">Total Bookings</div>
          <div className="stat-number">{stats?.totalBookings ?? '—'}</div>
          <div className="text-[11px] text-[var(--muted)] mt-1.5">{stats?.confirmedBookings ?? 0} confirmed</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="card p-5">
          <div className="text-sm font-bold mb-4">Monthly Revenue (₦)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_MONTHLY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9080' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9A9080' }}
                tickFormatter={v => v >= 1000000 ? `₦${(v / 1000000).toFixed(1)}M` : `₦${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#1A1612', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v: any) => [formatNGN(v), 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {MOCK_MONTHLY.map((_, i) => (
                  <Cell key={i} fill={i === MOCK_MONTHLY.length - 1 ? '#E76F2A' : '#2D6A4F'} opacity={0.7 + i * 0.05} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings trend */}
        <div className="card p-5">
          <div className="text-sm font-bold mb-4">Bookings per Month</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={MOCK_MONTHLY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9080' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9A9080' }} />
              <Tooltip
                contentStyle={{ background: '#1A1612', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v: any) => [v, 'Bookings']} />
              <Line type="monotone" dataKey="bookings" stroke="#E76F2A" strokeWidth={2.5}
                dot={{ fill: '#E76F2A', strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Award size={14} className="text-[var(--accent)]" /> Performance Score
          </div>
          {[
            { label: 'Response Rate', value: '94%', pct: 94, color: '#2D6A4F' },
            { label: 'Acceptance Rate', value: '87%', pct: 87, color: '#059669' },
            { label: 'Completion Rate', value: '100%', pct: 100, color: '#E76F2A' },
            { label: 'Review Score', value: `${stats?.rating ?? 0}/5`, pct: (Number(stats?.rating ?? 0) / 5) * 100, color: '#D97706' },
          ].map(m => (
            <div key={m.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted)]">{m.label}</span>
                <span className="font-bold">{m.value}</span>
              </div>
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="text-sm font-bold mb-3">Booking Breakdown</div>
          {[
            { label: 'Instant Bookings', value: Math.ceil((stats?.totalBookings ?? 0) * 0.7), color: '#2D6A4F' },
            { label: 'RFQ Bookings', value: Math.floor((stats?.totalBookings ?? 0) * 0.3), color: '#E76F2A' },
            { label: 'Confirmed', value: stats?.confirmedBookings ?? 0, color: '#059669' },
            { label: 'Cancelled', value: Math.round((stats?.totalBookings ?? 0) * 0.05), color: '#E63946' },
          ].map(b => (
            <div key={b.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-xs text-[var(--mid)]">{b.label}</span>
              </div>
              <span className="font-bold text-sm">{b.value}</span>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="text-sm font-bold mb-3">Upcoming Payouts</div>
          {[
            { event: 'Wedding — Jul 15', amount: 1800000, daysLeft: 12 },
            { event: 'Conference — Jul 22', amount: 650000, daysLeft: 19 },
            { event: 'Birthday — Aug 3', amount: 320000, daysLeft: 31 },
          ].map(p => (
            <div key={p.event} className="flex justify-between items-start py-2.5 border-b border-[var(--border)] last:border-0">
              <div>
                <div className="text-xs font-semibold text-[var(--dark)]">{p.event}</div>
                <div className="text-[10px] text-[var(--muted)]">Releases in {p.daysLeft} days</div>
              </div>
              <div className="font-bold text-sm text-[var(--accent)]">{formatNGN(p.amount, true)}</div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Total upcoming</span>
            <span className="font-bold text-sm text-[var(--accent)]">
              {formatNGN(2770000, true)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
