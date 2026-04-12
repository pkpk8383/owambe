'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, ticketsApi, attendeesApi, speakersApi, sponsorsApi, contractsApi } from '@/lib/api';
import { formatNGN, formatDate, formatTimeAgo, EVENT_STATUS_CONFIG, cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  ArrowLeft, Edit2, Send, Trash2, QrCode, Users, Ticket,
  Mic, Trophy, FileText, BarChart2, Mail, Loader2, ExternalLink,
} from 'lucide-react';
import { StatCard } from '@/components/ui';

const TABS = ['Overview', 'Attendees', 'Tickets', 'Speakers', 'Sponsors', 'Contracts'] as const;
type Tab = typeof TABS[number];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then(r => r.data),
  });

  const { data: attendeesData } = useQuery({
    queryKey: ['attendees', id],
    queryFn: () => attendeesApi.list(id, { limit: 100 }).then(r => r.data),
    enabled: activeTab === 'Attendees',
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['ticket-types', id],
    queryFn: () => ticketsApi.list(id).then(r => r.data),
    enabled: activeTab === 'Tickets' || activeTab === 'Overview',
  });

  const { data: speakersData } = useQuery({
    queryKey: ['speakers', id],
    queryFn: () => speakersApi.list(id).then(r => r.data),
    enabled: activeTab === 'Speakers',
  });

  const { data: sponsorsData } = useQuery({
    queryKey: ['sponsors', id],
    queryFn: () => sponsorsApi.list(id).then(r => r.data),
    enabled: activeTab === 'Sponsors',
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts', { eventId: id }],
    queryFn: () => contractsApi.list({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'Contracts',
  });

  const publishMutation = useMutation({
    mutationFn: () => eventsApi.publish(id),
    onSuccess: () => {
      toast.success('🚀 Event published! It\'s now live.');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Publish failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(id),
    onSuccess: () => {
      toast.success('Event deleted');
      router.push('/dashboard/events');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  });

  if (isLoading) {
    return <div className="p-6 flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--muted)]" /></div>;
  }

  const event = data?.event;
  if (!event) return <div className="p-6 text-sm text-[var(--muted)]">Event not found.</div>;

  const cfg = EVENT_STATUS_CONFIG[event.status] || EVENT_STATUS_CONFIG.DRAFT;
  const attendees = attendeesData?.attendees || [];
  const tickets = ticketsData?.ticketTypes || [];
  const speakers = speakersData?.speakers || [];
  const sponsors = sponsorsData?.sponsors || [];
  const contracts = contractsData?.contracts || [];

  const totalRevenue = tickets.reduce((s: number, t: any) => s + Number(t.price) * (t.sold || 0), 0);
  const totalRegistered = event._count?.attendees || 0;
  const fillRate = event.maxCapacity ? Math.round((totalRegistered / event.maxCapacity) * 100) : null;

  return (
    <div className="p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <Link href="/dashboard/events"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--dark)] mb-3 transition-colors">
            <ArrowLeft size={14} /> All Events
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-bold text-xl">{event.name}</h1>
            <span className={cfg.className}>{cfg.label}</span>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {event.type} · {event.city} ·
            {event.startDate ? ` ${formatDate(event.startDate, 'MMM d, yyyy')}` : ' Date TBC'}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {event.status === 'PUBLISHED' && (
            <Link href={`/events/${event.slug}`} target="_blank"
              className="btn-secondary text-xs flex items-center gap-1.5">
              <ExternalLink size={12} /> View Page
            </Link>
          )}
          {event.status === 'DRAFT' && (
            <button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}
              className="btn-primary text-xs flex items-center gap-1.5">
              {publishMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Publish
            </button>
          )}
          {['PUBLISHED', 'LIVE'].includes(event.status) && (
            <Link href={`/dashboard/checkin?eventId=${id}`}
              className="btn-accent text-xs flex items-center gap-1.5">
              <QrCode size={12} /> Check-in
            </Link>
          )}
          {event.status === 'DRAFT' && (
            <button
              onClick={() => {
                if (confirm('Delete this event? This cannot be undone.')) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Registered" value={totalRegistered}
          sub={event.maxCapacity ? `of ${event.maxCapacity} capacity` : 'No limit set'} color="#6C2BD9" />
        <StatCard label="Fill Rate" value={fillRate !== null ? `${fillRate}%` : '—'}
          sub={fillRate !== null && fillRate >= 80 ? '🔥 Nearly full' : 'Spots available'} color="#C9A227" />
        <StatCard label="Revenue" value={formatNGN(totalRevenue, true)}
          sub="from ticket sales" color="#7B61FF" />
        <StatCard label="Ticket Types" value={tickets.length}
          sub={`${tickets.filter((t: any) => t.status === 'ACTIVE').length} active`} color="#059669" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-[var(--border)] rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === tab ? 'bg-[var(--dark)] text-white' : 'text-[var(--muted)] hover:text-[var(--dark)]'
            }`}>
            {tab === 'Overview' && <BarChart2 size={11} />}
            {tab === 'Attendees' && <Users size={11} />}
            {tab === 'Tickets' && <Ticket size={11} />}
            {tab === 'Speakers' && <Mic size={11} />}
            {tab === 'Sponsors' && <Trophy size={11} />}
            {tab === 'Contracts' && <FileText size={11} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-[2fr_1fr] gap-5">
          <div className="card">
            <h3 className="font-bold text-sm mb-3">Event Details</h3>
            <div className="space-y-2">
              {[
                ['Name', event.name],
                ['Type', event.type],
                ['Format', event.format],
                ['Start', event.startDate ? formatDate(event.startDate, 'EEE, MMM d, yyyy · h:mm a') : 'TBC'],
                ['End', event.endDate ? formatDate(event.endDate, 'EEE, MMM d, yyyy · h:mm a') : '—'],
                ['Venue', event.venue || '—'],
                ['City', event.city || '—'],
                ['Capacity', event.maxCapacity ? `${event.maxCapacity} guests` : 'Unlimited'],
                ['Status', event.status],
                ['Slug', event.slug],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-[var(--muted)]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/emails?eventId=${id}`}
                  className="flex items-center gap-2 text-sm text-[var(--mid)] hover:text-[var(--dark)] py-2 hover:bg-[var(--bg)] rounded-lg px-2 transition-colors">
                  <Mail size={14} /> Send Email Campaign
                </Link>
                <Link href={`/dashboard/speakers?eventId=${id}`}
                  className="flex items-center gap-2 text-sm text-[var(--mid)] hover:text-[var(--dark)] py-2 hover:bg-[var(--bg)] rounded-lg px-2 transition-colors">
                  <Mic size={14} /> Manage Speakers
                </Link>
                <Link href={`/dashboard/waitlist?eventId=${id}`}
                  className="flex items-center gap-2 text-sm text-[var(--mid)] hover:text-[var(--dark)] py-2 hover:bg-[var(--bg)] rounded-lg px-2 transition-colors">
                  <Users size={14} /> Waitlist & Promos
                </Link>
              </div>
            </div>
            {event.description && (
              <div className="card">
                <h3 className="font-bold text-sm mb-2">Description</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Attendees' && (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-bold">{totalRegistered} Attendees</span>
            <Link href={`/dashboard/checkin?eventId=${id}`}
              className="btn-primary text-xs flex items-center gap-1.5">
              <QrCode size={11} /> Open Scanner
            </Link>
          </div>
          {attendees.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--muted)]">No attendees yet</div>
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Ticket</th>
                <th className="table-header">Status</th>
                <th className="table-header">Registered</th>
              </tr></thead>
              <tbody>
                {attendees.map((a: any) => (
                  <tr key={a.id} className="table-row">
                    <td className="table-cell font-medium">{a.firstName} {a.lastName}</td>
                    <td className="table-cell text-[var(--muted)]">{a.email}</td>
                    <td className="table-cell text-sm">{a.ticketType?.name}</td>
                    <td className="table-cell">
                      <span className={a.checkIn ? 'badge-confirmed' : 'badge-upcoming'}>
                        {a.checkIn ? 'Checked in' : 'Registered'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-[var(--muted)]">
                      {formatTimeAgo(a.registeredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Tickets' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">{tickets.length} Ticket Types</span>
            <Link href={`/dashboard/registration?eventId=${id}`} className="btn-primary text-xs">
              + Add Ticket
            </Link>
          </div>
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    {t.description && <div className="text-xs text-[var(--muted)] mt-0.5">{t.description}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--accent)]">{Number(t.price) === 0 ? 'Free' : formatNGN(Number(t.price))}</div>
                    <span className={t.status === 'ACTIVE' ? 'badge-confirmed' : 'badge-draft'}>
                      {t.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-[var(--muted)]">
                  <span>Sold: <strong className="text-[var(--dark)]">{t.sold || 0}</strong></span>
                  {t.capacity && <span>Capacity: <strong className="text-[var(--dark)]">{t.capacity}</strong></span>}
                  <span>Revenue: <strong className="text-[var(--accent)]">{formatNGN(Number(t.price) * (t.sold || 0), true)}</strong></span>
                </div>
                {t.capacity && (
                  <div className="mt-2 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${Math.min(100, ((t.sold || 0) / t.capacity) * 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Speakers' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">{speakers.length} Speakers</span>
            <Link href={`/dashboard/speakers?eventId=${id}`} className="btn-primary text-xs">+ Add Speaker</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {speakers.map((s: any) => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--pill)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-[var(--muted)]">{s.title}{s.company ? ` · ${s.company}` : ''}</div>
                </div>
              </div>
            ))}
            {speakers.length === 0 && <div className="col-span-2 text-center py-8 text-sm text-[var(--muted)]">No speakers added</div>}
          </div>
        </div>
      )}

      {activeTab === 'Sponsors' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">{sponsors.length} Sponsors</span>
            <Link href={`/dashboard/sponsors?eventId=${id}`} className="btn-primary text-xs">+ Add Sponsor</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sponsors.map((s: any) => (
              <div key={s.id} className="card text-center">
                {s.logoUrl && <img src={s.logoUrl} alt={s.name} className="h-10 object-contain mx-auto mb-2" />}
                <div className="font-semibold text-sm">{s.name}</div>
                <span className="badge-upcoming text-[10px]">{s.tier}</span>
              </div>
            ))}
            {sponsors.length === 0 && <div className="col-span-3 text-center py-8 text-sm text-[var(--muted)]">No sponsors added</div>}
          </div>
        </div>
      )}

      {activeTab === 'Contracts' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">{contracts.length} Contracts</span>
            <Link href={`/dashboard/contracts/new`} className="btn-primary text-xs">+ New Contract</Link>
          </div>
          <div className="card overflow-hidden p-0">
            {contracts.length === 0 ? (
              <div className="text-center py-10 text-sm text-[var(--muted)]">No contracts linked to this event</div>
            ) : (
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Contract</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                </tr></thead>
                <tbody>
                  {contracts.map((c: any) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <Link href={`/dashboard/contracts/${c.id}`} className="font-medium hover:text-[var(--accent)]">
                          {c.title}
                        </Link>
                        <div className="text-[10px] font-mono text-[var(--muted)]">{c.reference}</div>
                      </td>
                      <td className="table-cell text-sm">{c.vendor?.businessName}</td>
                      <td className="table-cell text-sm font-semibold">
                        {c.totalAmount ? formatNGN(Number(c.totalAmount), true) : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={c.status === 'FULLY_SIGNED' ? 'badge-confirmed' : c.status === 'DRAFT' ? 'badge-draft' : 'badge-pending'}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
