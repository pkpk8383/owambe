'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi, attendeesApi } from '@/lib/api';
import { formatNGN, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ExternalLink, Copy, QrCode, Download, Loader2 } from 'lucide-react';

export default function RegistrationPage() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: eventsData } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsApi.list().then(r => r.data),
  });

  const { data: eventData } = useQuery({
    queryKey: ['event-detail', selectedEventId],
    queryFn: () => eventsApi.get(selectedEventId).then(r => r.data),
    enabled: !!selectedEventId,
  });

  const { data: attendeeData } = useQuery({
    queryKey: ['attendees', selectedEventId],
    queryFn: () => attendeesApi.list(selectedEventId, { limit: 100 }).then(r => r.data),
    enabled: !!selectedEventId,
  });

  const events = eventsData?.events || [];
  const event = eventData?.event;
  const attendees = attendeeData?.attendees || [];
  const regUrl = event ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://owambe.com'}/events/${event.slug}` : '';

  function copyLink() {
    if (!regUrl) return;
    navigator.clipboard.writeText(regUrl);
    toast.success('Registration link copied!');
  }

  function exportCSV() {
    if (!attendees.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Ticket', 'Registered', 'Status'];
    const rows = attendees.map((a: any) => [
      `${a.firstName} ${a.lastName}`,
      a.email,
      a.phone || '',
      a.company || '',
      a.ticketType?.name || '',
      formatDate(a.registeredAt),
      a.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${event?.slug || 'event'}.csv`;
    a.click();
    toast.success('CSV downloaded!');
  }

  return (
    <div className="p-6 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <select className="input w-64 text-sm" value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}>
          <option value="">Select an event</option>
          {events.map((ev: any) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
        {regUrl && (
          <div className="flex gap-2">
            <button onClick={copyLink} className="btn-secondary text-xs flex items-center gap-1.5">
              <Copy size={12} /> Copy Link
            </button>
            <a href={regUrl} target="_blank" rel="noopener noreferrer"
              className="btn-primary text-xs flex items-center gap-1.5">
              <ExternalLink size={12} /> View Live Page
            </a>
          </div>
        )}
      </div>

      {!selectedEventId ? (
        <div className="card text-center py-12 text-[var(--muted)]">
          <QrCode size={36} className="mx-auto mb-3 text-[var(--border)]" />
          <div className="font-semibold text-[var(--dark)] mb-1">Select an event</div>
          <div className="text-sm">Choose an event to manage its registration page</div>
        </div>
      ) : event ? (
        <div className="grid grid-cols-[1fr_300px] gap-5">
          {/* Attendee list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">
                Attendees ({attendeeData?.total ?? 0})
              </div>
              <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1.5">
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="card overflow-hidden">
              {attendees.length === 0 ? (
                <div className="text-center py-10 text-sm text-[var(--muted)]">
                  No registrations yet. Share the registration link!
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[var(--border)]">
                      <th className="table-header">Name</th>
                      <th className="table-header">Email</th>
                      <th className="table-header">Ticket</th>
                      <th className="table-header">Registered</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a: any) => (
                      <tr key={a.id} className="table-row">
                        <td className="table-cell font-semibold text-sm">
                          {a.firstName} {a.lastName}
                        </td>
                        <td className="table-cell text-xs text-[var(--muted)]">{a.email}</td>
                        <td className="table-cell text-xs">{a.ticketType?.name}</td>
                        <td className="table-cell text-xs text-[var(--muted)]">
                          {formatDate(a.registeredAt, 'MMM d')}
                        </td>
                        <td className="table-cell">
                          <span className={a.status === 'CHECKED_IN' ? 'badge-confirmed' : 'badge-upcoming'}>
                            {a.status === 'CHECKED_IN' ? '✓ Checked In' : 'Registered'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Reg page preview */}
          <div>
            <div className="section-title mb-3">Registration Link</div>
            <div className="card p-4 mb-4">
              <div className="bg-[var(--bg)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--mid)] break-all mb-3">
                {regUrl}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copyLink} className="btn-secondary text-xs flex items-center justify-center gap-1.5">
                  <Copy size={11} /> Copy
                </button>
                <a href={regUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-primary text-xs flex items-center justify-center gap-1.5">
                  <ExternalLink size={11} /> Open
                </a>
              </div>
            </div>

            <div className="card p-4">
              <div className="section-title mb-3">Event Summary</div>
              <div className="space-y-2 text-sm">
                {[
                  ['Name', event.name],
                  ['Date', event.startDate ? formatDate(event.startDate, 'PPP') : '—'],
                  ['Venue', event.venue || '—'],
                  ['Capacity', event.maxCapacity || 'Unlimited'],
                  ['Registered', attendeeData?.total ?? 0],
                  ['Tickets', event.ticketTypes?.length ?? 0],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-[var(--muted)]">{l}</span>
                    <span className="font-semibold text-sm">{v as any}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      )}
    </div>
  );
}
