'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, bookingsApi } from '@/lib/api';
import { formatNGN, formatEventDate } from '@/lib/utils';
import Link from 'next/link';
import { TrendingUp, Star, Calendar, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function VendorOverviewPage() {
  const { data: revenueData } = useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
  });
  const { data: bookingsData } = useQuery({
    queryKey: ['vendor-bookings', { limit: 5 }],
    queryFn: () => bookingsApi.list({ limit: 5 }).then(r => r.data),
  });

  const stats = revenueData?.stats;
  const bookings = bookingsData?.bookings || [];

  return (
    <div className="p-6 animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent)]" />
          <div className="stat-label">Total Revenue</div>
          <div className="stat-number">{stats ? formatNGN(stats.totalRevenue, true) : '—'}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[var(--accent)]">
            <TrendingUp size={10} /> All completed bookings
          </div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent2)]" />
          <div className="stat-label">Pending Payout</div>
          <div className="stat-number">{stats ? formatNGN(stats.pendingPayout, true) : '—'}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-yellow-600">
            <Clock size={10} /> In escrow
          </div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[#7B61FF]" />
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-number">{stats?.confirmedBookings ?? '—'}</div>
          <div className="text-[11px] text-[var(--muted)] mt-1.5">of {stats?.totalBookings ?? 0} total</div>
        </div>
        <div className="stat-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-yellow-400" />
          <div className="stat-label">Rating</div>
          <div className="stat-number flex items-center gap-1">
            {stats?.rating ?? '—'}
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1.5">{stats?.reviewCount ?? 0} reviews</div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">Recent Bookings</h2>
        <Link href="/vendor/bookings" className="text-sm text-[var(--accent)] font-semibold hover:underline">
          View all →
        </Link>
      </div>

      <div className="card overflow-hidden mb-6">
        {bookings.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--muted)]">
            <Calendar size={32} className="mx-auto mb-3 text-[var(--border)]" />
            No bookings yet. Make sure your profile is complete and verified.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="table-header">Reference</th>
                <th className="table-header">Event Date</th>
                <th className="table-header">Type</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="table-row">
                  <td className="table-cell font-mono text-xs">{b.reference}</td>
                  <td className="table-cell">{formatEventDate(b.eventDate)}</td>
                  <td className="table-cell">
                    <span className="text-xs bg-[var(--bg)] px-2 py-0.5 rounded-full">{b.bookingType}</span>
                  </td>
                  <td className="table-cell font-semibold">{formatNGN(b.totalAmount)}</td>
                  <td className="table-cell">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="table-cell">
                    <Link href={`/vendor/bookings/${b.id}`}
                      className="text-xs text-[var(--accent)] font-semibold hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="section-title mb-3">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/vendor/availability', icon: Calendar, label: 'Update Availability', sub: 'Block dates or mark open', color: 'var(--accent)' },
          { href: '/vendor/packages', icon: DollarSign, label: 'Manage Packages', sub: 'Add or edit pricing packages', color: 'var(--accent2)' },
          { href: '/vendor/settings', icon: CheckCircle, label: 'Complete Profile', sub: 'Add photos and bank account', color: '#7B61FF' },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="card p-4 hover:shadow-card transition-all cursor-pointer group">
            <a.icon size={20} style={{ color: a.color }} className="mb-3" />
            <div className="font-semibold text-sm text-[var(--dark)] mb-1">{a.label}</div>
            <div className="text-xs text-[var(--muted)]">{a.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-live',
    CANCELLED: 'badge-cancelled',
  };
  return <span className={config[status] || 'badge-draft'}>{status}</span>;
}
