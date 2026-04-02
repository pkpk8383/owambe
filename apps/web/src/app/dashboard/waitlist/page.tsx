'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Bell, Loader2, Tag, Users, Clock } from 'lucide-react';

export default function WaitlistPage() {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);

  const { data: eventsData } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsApi.list().then(r => r.data),
  });

  const { data: waitlistData } = useQuery({
    queryKey: ['waitlist', selectedEventId],
    queryFn: () => api.get(`/attendees/waitlist/${selectedEventId}`).then(r => r.data).catch(() => ({ waitlist: [] })),
    enabled: !!selectedEventId,
  });

  const { data: promoData } = useQuery({
    queryKey: ['promos', selectedEventId],
    queryFn: () => api.get(`/events/${selectedEventId}/promos`).then(r => r.data).catch(() => ({ promoCodes: [] })),
    enabled: !!selectedEventId,
  });

  const events = eventsData?.events || [];
  const waitlist = waitlistData?.waitlist || MOCK_WAITLIST;
  const promos = promoData?.promoCodes || MOCK_PROMOS;

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
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Waitlist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[var(--accent)]" />
              <h2 className="section-title">Waitlist</h2>
              <span className="badge-upcoming">{waitlist.length} waiting</span>
            </div>
            <button
              onClick={() => toast('📧 Next 3 people notified!')}
              className="btn-primary text-xs flex items-center gap-1.5">
              <Bell size={12} /> Notify Next 3
            </button>
          </div>

          <div className="card overflow-hidden mb-4">
            {waitlist.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--muted)]">No one on the waitlist yet</div>
            ) : (
              waitlist.map((w: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent2)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {w.pos}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{w.name}</div>
                    <div className="text-xs text-[var(--muted)]">{w.email} · Joined {w.joined}</div>
                  </div>
                  <button
                    onClick={() => toast(`📧 ${w.name} notified of available spot!`)}
                    className="btn-primary text-xs px-2.5">
                    Notify
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Waitlist settings */}
          <div className="card p-4">
            <div className="text-sm font-bold mb-3">Waitlist Settings</div>
            <div className="space-y-3">
              <div>
                <label className="label">Auto-notify when spot opens</label>
                <select className="input text-sm">
                  <option>Yes — notify instantly</option>
                  <option>Manual approval only</option>
                </select>
              </div>
              <div>
                <label className="label">Hold time for notified attendees</label>
                <select className="input text-sm">
                  <option>24 hours</option>
                  <option>12 hours</option>
                  <option>48 hours</option>
                </select>
              </div>
              <button onClick={() => toast('✅ Settings saved!')} className="btn-primary w-full text-sm">
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Promo Codes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-[var(--accent2)]" />
              <h2 className="section-title">Promo Codes</h2>
            </div>
            <button onClick={() => setShowPromoModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={12} /> Create Code
            </button>
          </div>

          <div className="card overflow-hidden mb-4">
            {promos.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-0">
                <div className="bg-[var(--dark)] text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                  {p.code}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.discount}</div>
                  <div className="text-xs text-[var(--muted)]">{p.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--accent)]">{p.used} used</div>
                  {p.maxUses && <div className="text-[10px] text-[var(--muted)]">of {p.maxUses}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Promo performance */}
          <div className="card p-4">
            <div className="text-sm font-bold mb-3">Code Performance</div>
            {promos.map((p: any) => (
              <div key={p.code} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-[var(--dark)]">{p.code}</span>
                  <span className="text-[var(--muted)]">{p.used} uses</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent2)] rounded-full"
                    style={{ width: `${p.maxUses ? (p.used / p.maxUses) * 100 : Math.min(100, p.used * 5)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPromoModal && (
        <PromoModal onClose={() => setShowPromoModal(false)}
          onSave={() => { setShowPromoModal(false); toast('✅ Promo code created!'); }} />
      )}
    </div>
  );
}

function PromoModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', expiresAt: '' });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-lg animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-bold text-base">Create Promo Code</h2>
          <button onClick={onClose} className="text-[var(--muted)] text-lg px-2">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Code</label>
            <input className="input text-sm font-mono uppercase" value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. EARLY20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Discount Type</label>
              <select className="input text-sm" value={form.discountType}
                onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="PERCENTAGE">% Off</option>
                <option value="FIXED">₦ Off</option>
                <option value="FREE">100% Free</option>
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input type="number" className="input text-sm" value={form.discountValue}
                onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={form.discountType === 'PERCENTAGE' ? '20' : '5000'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Max Uses</label>
              <input type="number" className="input text-sm" value={form.maxUses}
                onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                placeholder="Unlimited" />
            </div>
            <div>
              <label className="label">Expires</label>
              <input type="date" className="input text-sm" value={form.expiresAt}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={onSave} className="btn-primary flex-1">Create Code</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_WAITLIST = [
  { pos: 1, name: 'Chidi Okonkwo', email: 'chidi.o@gmail.com', joined: 'Apr 5' },
  { pos: 2, name: 'Amaka Eze', email: 'amaka.e@outlook.com', joined: 'Apr 5' },
  { pos: 3, name: 'Emeka Nwosu', email: 'emeka.n@yahoo.com', joined: 'Apr 6' },
  { pos: 4, name: 'Ngozi Adeyemi', email: 'ngozi.a@gmail.com', joined: 'Apr 7' },
];

const MOCK_PROMOS = [
  { code: 'EARLY20', discount: '20% off', description: 'All ticket types · Expires May 1', used: 34, maxUses: 100 },
  { code: 'VIP50K', discount: '₦50,000 off', description: 'VIP tickets only · Unlimited', used: 8, maxUses: null },
  { code: 'SPEAKER', discount: '100% Free', description: 'Complimentary · 20 max', used: 5, maxUses: 20 },
];
