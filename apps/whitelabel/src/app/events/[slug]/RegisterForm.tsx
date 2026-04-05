'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, Tag } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.owambe.com/api';

interface Props {
  event: any;
  tenant: any;
  isSoldOut: boolean;
  activeTickets: any[];
}

export default function RegisterForm({ event, tenant, isSoldOut, activeTickets }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', company: '', ticketTypeId: activeTickets[0]?.id || '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [ticketRef, setTicketRef] = useState('');

  const selectedTicket = activeTickets.find(t => t.id === form.ticketTypeId);
  const basePrice = selectedTicket ? Number(selectedTicket.price) : 0;
  const discount = promoData?.promo?.discountAmount || 0;
  const finalPrice = Math.max(0, basePrice - discount);
  const isFree = finalPrice === 0;

  async function validatePromo() {
    if (!promoCode.trim() || !form.ticketTypeId) {
      toast.error('Select a ticket type first');
      return;
    }
    setPromoLoading(true);
    try {
      const res = await axios.post(`${API_URL}/promos/validate`, {
        code: promoCode.trim().toUpperCase(),
        eventId: event.id,
        ticketPrice: basePrice,
      });
      setPromoData(res.data);
      toast.success(`✅ Code applied — you save ₦${res.data.promo.discountAmount.toLocaleString('en-NG')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid promo code');
      setPromoData(null);
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.ticketTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/events/public/${event.slug}/register`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.toLowerCase().trim(),
        phone: form.phone,
        company: form.company,
        ticketTypeId: form.ticketTypeId,
        promoCodeId: promoData?.promo?.id,
      });
      setTicketRef(res.data.attendee?.qrCode || '');
      setRegistered(true);
      toast.success('🎉 Registered successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatNGN(n: number) {
    return `₦${n.toLocaleString('en-NG')}`;
  }

  if (registered) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--brand-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle size={28} color="var(--brand-primary)" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>You're registered!</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          A confirmation email with your QR ticket has been sent to{' '}
          <strong style={{ color: 'var(--dark)' }}>{form.email}</strong>
        </p>
        {ticketRef && (
          <div style={{
            background: 'var(--brand-primary-light)',
            borderRadius: 8, padding: 12,
            fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.1em',
            color: 'var(--brand-primary)', fontWeight: 700,
          }}>
            {ticketRef}
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
          Show this reference or your QR code email at the venue entrance.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
      {/* Price header */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
          {isSoldOut ? 'Event sold out' : isFree ? 'Free event' : 'Ticket price'}
        </div>
        {!isSoldOut && (
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand-primary)' }}>
            {isFree ? 'Free' : formatNGN(finalPrice)}
          </div>
        )}
      </div>

      {isSoldOut ? (
        <div style={{
          background: '#FEE2E2', borderRadius: 8, padding: 14,
          color: '#991B1B', fontSize: 14, fontWeight: 600, textAlign: 'center',
        }}>
          This event is sold out. Check back for availability.
        </div>
      ) : (
        <>
          {/* Ticket selector */}
          {activeTickets.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">Ticket type *</label>
              {activeTickets.map((t: any) => {
                const sold = t._count?.attendees || 0;
                const rem = t.capacity ? t.capacity - sold : null;
                const soldOut = rem !== null && rem <= 0;
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: soldOut ? 'not-allowed' : 'pointer',
                    border: `1.5px solid ${form.ticketTypeId === t.id ? 'var(--brand-primary)' : 'var(--border)'}`,
                    background: form.ticketTypeId === t.id ? 'var(--brand-primary-light)' : '#fff',
                    opacity: soldOut ? 0.5 : 1,
                  }}>
                    <input type="radio" name="ticket" value={t.id} disabled={soldOut}
                      checked={form.ticketTypeId === t.id}
                      onChange={() => setForm(p => ({ ...p, ticketTypeId: t.id }))}
                      style={{ accentColor: 'var(--brand-primary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                      {rem !== null && !soldOut && rem < 30 && (
                        <div style={{ fontSize: 11, color: '#D97706', marginTop: 1 }}>
                          {rem} left
                        </div>
                      )}
                      {soldOut && <div style={{ fontSize: 11, color: '#E63946' }}>Sold out</div>}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: 15 }}>
                      {Number(t.price) === 0 ? 'Free' : formatNGN(Number(t.price))}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label className="label">First name *</label>
              <input className="input" value={form.firstName} placeholder="Adaeze"
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input className="input" value={form.lastName} placeholder="Okonkwo"
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email}
              placeholder="you@example.com"
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} placeholder="080xxxxxxxx"
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company} placeholder="Your org"
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          {/* Promo code */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Promo code</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                style={{ fontFamily: 'monospace', textTransform: 'uppercase', flex: 1 }}
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoData(null); }}
                placeholder="EARLYBIRD20"
              />
              <button type="button" onClick={validatePromo} disabled={promoLoading || !promoCode.trim()}
                className="btn-secondary"
                style={{ padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {promoLoading ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                Apply
              </button>
            </div>
            {promoData && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Code applied — you save {formatNGN(promoData.promo.discountAmount)}
              </div>
            )}
          </div>

          {/* Price summary */}
          {basePrice > 0 && (
            <div style={{
              background: 'var(--brand-primary-light)', borderRadius: 8,
              padding: 12, marginBottom: 16, fontSize: 13,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: discount > 0 ? 4 : 0 }}>
                <span style={{ color: 'var(--muted)' }}>Ticket price</span>
                <span style={{ fontWeight: 600 }}>{formatNGN(basePrice)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#059669' }}>Promo discount</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>−{formatNGN(discount)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.08)',
                  fontWeight: 800, fontSize: 15,
                }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--brand-primary)' }}>{isFree ? 'Free' : formatNGN(finalPrice)}</span>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '14px 20px',
              background: 'var(--brand-accent)',
              color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 10,
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'var(--brand-font)',
            }}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isFree ? 'Register Free →' : `Pay ${formatNGN(finalPrice)} & Register →`}
          </button>

          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
            🔒 Secure · Your QR ticket will be emailed immediately
          </p>
        </>
      )}
    </form>
  );
}
