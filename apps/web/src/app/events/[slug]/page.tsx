'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventsApi, ticketsApi, promosApi } from '@/lib/api';
import { formatNGN, formatEventDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, MapPin, Calendar, Users, Tag } from 'lucide-react';

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', ticketTypeId: '' });
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<any>(null);
  const [registered, setRegistered] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => eventsApi.getPublic(slug).then(r => r.data),
  });

  const registerMutation = useMutation({
    mutationFn: () => eventsApi.registerAttendee(slug, {
      ...form,
      promoCodeId: promoValid?.promo?.id,
    }),
    onSuccess: (res) => {
      setRegistered(true);
      setQrCode(res.data.attendee?.qrCode);
      toast.success('🎉 Registration successful!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    },
  });

  const validatePromo = async () => {
    if (!promoCode.trim() || !form.ticketTypeId) {
      toast.error('Enter a ticket type and promo code');
      return;
    }
    try {
      const ticket = event.ticketTypes.find((t: any) => t.id === form.ticketTypeId);
      const res = await promosApi.validate(promoCode.trim().toUpperCase(), event.id, ticket?.price);
      setPromoValid(res.data);
      toast.success(`✅ Code applied! You save ${formatNGN(res.data.promo.discountAmount)}`);
    } catch {
      toast.error('Invalid or expired promo code');
      setPromoValid(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 size={28} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  const event = data?.event;
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold mb-2">Event not found</h1>
          <Link href="/" className="text-[var(--accent)] hover:underline">← Back to Owambe</Link>
        </div>
      </div>
    );
  }

  const selectedTicket = event.ticketTypes?.find((t: any) => t.id === form.ticketTypeId);
  const discountAmount = promoValid?.promo?.discountAmount || 0;
  const finalPrice = selectedTicket ? Math.max(0, Number(selectedTicket.price) - discountAmount) : 0;

  if (registered) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-[var(--border)]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're registered! 🎉</h1>
          <p className="text-[var(--muted)] mb-2">
            Welcome to <strong>{event.name}</strong>
          </p>
          <p className="text-sm text-[var(--muted)] mb-6">
            A confirmation email with your QR ticket has been sent to {form.email}
          </p>
          {qrCode && (
            <div className="bg-[var(--bg)] rounded-lg p-3 mb-6">
              <p className="text-xs text-[var(--muted)] mb-1">Ticket Reference</p>
              <p className="font-mono font-bold text-sm tracking-wider">{qrCode}</p>
            </div>
          )}
          <Link href="/" className="btn-primary inline-flex">
            Back to Owambe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #6C2BD9, #4A1D96)` }}
        className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← owambe.com
          </Link>
          <h1 className="text-white font-bold text-3xl mt-4 mb-3">{event.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/75">
            {event.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatEventDate(event.startDate)}
              </div>
            )}
            {(event.venue || event.city) && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                {event.venue}{event.city ? `, ${event.city}` : ''}
              </div>
            )}
            {event.maxCapacity && (
              <div className="flex items-center gap-1.5">
                <Users size={14} />
                {event.maxCapacity - (event._count?.attendees || 0)} spots left
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Registration form */}
          <div className="card p-6">
            <h2 className="font-bold text-base mb-4">Register for this event</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">First name *</label>
                <input className="input text-sm" placeholder="Adaeze"
                  value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Last name *</label>
                <input className="input text-sm" placeholder="Okonkwo"
                  value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            <div className="mb-3">
              <label className="label">Email *</label>
              <input type="email" className="input text-sm" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Phone</label>
                <input className="input text-sm" placeholder="080xxxxxxxx"
                  value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Company / Organisation</label>
                <input className="input text-sm" placeholder="Your company"
                  value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              </div>
            </div>

            {/* Ticket selector */}
            {event.ticketTypes?.length > 0 && (
              <div className="mb-4">
                <label className="label">Select Ticket *</label>
                <div className="space-y-2">
                  {event.ticketTypes.map((t: any) => {
                    const sold = t._count?.attendees || 0;
                    const remaining = t.capacity ? t.capacity - sold : null;
                    const isSoldOut = remaining !== null && remaining <= 0;
                    return (
                      <label key={t.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.ticketTypeId === t.id ? 'border-[var(--accent)] bg-[var(--pill)]' :
                          isSoldOut ? 'border-[var(--border)] opacity-50 cursor-not-allowed' :
                          'border-[var(--border)] hover:border-[var(--accent2)]'
                        }`}>
                        <input
                          type="radio"
                          name="ticket"
                          value={t.id}
                          disabled={isSoldOut}
                          checked={form.ticketTypeId === t.id}
                          onChange={() => setForm(p => ({ ...p, ticketTypeId: t.id }))}
                          className="accent-[var(--accent)]"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{t.name}</div>
                          {t.description && <div className="text-xs text-[var(--muted)]">{t.description}</div>}
                          {remaining !== null && (
                            <div className="text-xs text-[var(--muted)] mt-0.5">
                              {isSoldOut ? '🔴 Sold out' : `${remaining} remaining`}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-[var(--accent)] text-sm">
                          {Number(t.price) === 0 ? 'Free' : formatNGN(t.price)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Promo code */}
            <div className="mb-5">
              <label className="label">Promo Code</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1 font-mono uppercase"
                  placeholder="EARLYBIRD20"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null); }}
                />
                <button onClick={validatePromo} className="btn-secondary text-xs px-3 flex items-center gap-1">
                  <Tag size={12} /> Apply
                </button>
              </div>
              {promoValid && (
                <div className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle size={11} /> Promo applied — you save {formatNGN(promoValid.promo.discountAmount)}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (!form.firstName || !form.lastName || !form.email || !form.ticketTypeId) {
                  toast.error('Please fill in all required fields');
                  return;
                }
                registerMutation.mutate();
              }}
              disabled={registerMutation.isPending}
              className="btn-accent w-full py-3 flex items-center justify-center gap-2 font-bold"
            >
              {registerMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedTicket && Number(selectedTicket.price) > 0
                ? `Pay ${formatNGN(finalPrice)} & Register →`
                : 'Register Free →'
              }
            </button>

            <p className="text-xs text-[var(--muted)] text-center mt-3">
              🔒 Secure via Owambe · Your QR ticket will be emailed immediately
            </p>
          </div>

          {/* Event summary sidebar */}
          <div>
            <div className="card p-5 mb-4">
              <h3 className="font-bold text-sm mb-3">About This Event</h3>
              {event.description && (
                <p className="text-sm text-[var(--mid)] leading-relaxed mb-4">{event.description}</p>
              )}
              <div className="space-y-2 text-sm">
                {event.startDate && (
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                    <span>{formatEventDate(event.startDate)}</span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                    <span>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Organiser */}
            {event.planner && (
              <div className="card p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Organised by</p>
                <p className="font-semibold text-sm">
                  {event.planner.companyName || `${event.planner.user?.firstName} ${event.planner.user?.lastName}`}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 font-semibold">Verified Planner</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
