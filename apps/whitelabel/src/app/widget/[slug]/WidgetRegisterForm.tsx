'use client';

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.owambe.com/api';

interface Props {
  event:        any;
  activeTickets: any[];
  slug:         string;
  primaryColor: string;
  accentColor:  string;
}

export default function WidgetRegisterForm({ event, activeTickets, slug, primaryColor, accentColor }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', ticketTypeId: activeTickets[0]?.id || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ticketRef, setTicketRef] = useState('');

  const selectedTicket = activeTickets.find((t: any) => t.id === form.ticketTypeId);
  const price = selectedTicket ? Number(selectedTicket.price) : 0;
  const isFree = price === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/events/public/${slug}/register`, {
        ...form,
        referralSource: 'WIDGET',
        referralMedium: typeof window !== 'undefined' ? window.location.hostname : '',
      });

      if (!isFree && res.data.payment?.authorizationUrl) {
        // Paid event: open Paystack in new tab
        window.open(res.data.payment.authorizationUrl, '_blank');
      }

      setTicketRef(res.data.attendee?.qrCode || '');
      setSuccess(true);

      // Notify parent of height change
      window.parent.postMessage({
        type: 'owambe-resize',
        slug,
        height: document.body.scrollHeight + 16,
      }, '*');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 10, padding: 20, textAlign: 'center', marginTop: 12,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <p style={{ fontWeight: 700, color: '#065f46', fontSize: 15, marginBottom: 4 }}>
          You're registered!
        </p>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Check your email for your ticket and confirmation.
        </p>
        {ticketRef && (
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, fontFamily: 'monospace' }}>
            Ref: {ticketRef.slice(0, 16)}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      {activeTickets.length > 1 && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>
            Ticket Type
          </label>
          <select
            value={form.ticketTypeId}
            onChange={e => setForm(f => ({ ...f, ticketTypeId: e.target.value }))}
            style={{
              width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
              borderRadius: 6, fontSize: 13, fontFamily: 'inherit', marginBottom: 0,
            }}>
            {activeTickets.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} — {Number(t.price) === 0 ? 'Free' : `₦${Number(t.price).toLocaleString('en-NG')}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 0 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>
            First name *
          </label>
          <input
            required value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="Amara"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>
            Last name *
          </label>
          <input
            required value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            placeholder="Okafor"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }}
          />
        </div>
      </div>

      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>
        Email *
      </label>
      <input
        type="email" required value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        placeholder="amara@example.com"
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }}
      />

      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>
        Phone (optional)
      </label>
      <input
        type="tel" value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        placeholder="+234 800 000 0000"
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }}
      />

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 6, padding: '8px 12px', fontSize: 12,
          color: '#dc2626', marginBottom: 8,
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '12px',
          background: submitting ? '#9ca3af' : primaryColor,
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
        {submitting ? '⏳ Registering…' : isFree
          ? '🎟️ Register — Free'
          : `🎟️ Register — ₦${price.toLocaleString('en-NG')}`}
      </button>
    </form>
  );
}
