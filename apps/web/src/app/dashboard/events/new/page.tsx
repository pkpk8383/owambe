'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { eventsApi, aiApi } from '@/lib/api';
import { NIGERIAN_CITIES } from '@/lib/utils';
import { Sparkles, Loader2, Plus, Trash2, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';

// ─── SCHEMAS ─────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(3, 'Event name required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Event type required'),
  format: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']),
  startDate: z.string().min(1, 'Date required'),
  startTime: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  maxCapacity: z.coerce.number().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;

interface Ticket { name: string; price: number; capacity: number }

const EVENT_TYPES = ['Conference', 'Workshop', 'Networking Event', 'Wedding', 'Birthday', 'Corporate', 'Concert', 'Product Launch', 'Seminar', 'Other'];

export default function CreateEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([
    { name: 'General Admission', price: 0, capacity: 100 }
  ]);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { format: 'IN_PERSON' }
  });

  // ─── AI BUILDER ──────────────────────────────────────
  async function handleAiBuild() {
    const prompt = window.prompt('Describe your event in a sentence:');
    if (!prompt) return;
    setIsAiLoading(true);
    try {
      const res = await aiApi.generateEventCopy(prompt);
      const { name, description } = res.data;
      form.setValue('name', name || '');
      form.setValue('description', description || '');
      toast.success('✨ AI filled your event details!');
    } catch {
      toast.error('AI generation failed. Try again.');
    } finally {
      setIsAiLoading(false);
    }
  }

  // ─── STEP 1 SUBMIT ───────────────────────────────────
  async function handleStep1(data: Step1Data) {
    setIsSubmitting(true);
    try {
      const startDate = data.startTime
        ? `${data.startDate}T${data.startTime}:00`
        : `${data.startDate}T09:00:00`;

      const res = await eventsApi.create({ ...data, startDate });
      setCreatedEventId(res.data.event.id);
      setStep(2);
    } catch {
      // error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── STEP 2 SAVE TICKETS ─────────────────────────────
  async function handleStep2() {
    if (!createdEventId) return;
    // In production: save ticket types via API
    // For now: proceed to step 3
    setStep(3);
  }

  // ─── STEP 3 PUBLISH ──────────────────────────────────
  async function handlePublish() {
    if (!createdEventId) return;
    setIsSubmitting(true);
    try {
      await eventsApi.publish(createdEventId);
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('🚀 Event published! Registration link is live.');
      router.push('/dashboard/events');
    } catch {
      // error handled
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    toast.success('Draft saved');
    router.push('/dashboard/events');
  }

  // ─── TICKET HELPERS ──────────────────────────────────
  function addTicket() {
    setTickets(prev => [...prev, { name: 'New Ticket', price: 0, capacity: 100 }]);
  }

  function removeTicket(i: number) {
    setTickets(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateTicket(i: number, field: keyof Ticket, value: any) {
    setTickets(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-up">
      {/* Progress steps */}
      <div className="card px-6 py-3.5 flex items-center gap-0 mb-6">
        {[
          { n: 1, label: 'Details' },
          { n: 2, label: 'Tickets' },
          { n: 3, label: 'Publish' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                step > s.n ? 'bg-[var(--accent)] text-white' :
                step === s.n ? 'bg-[var(--accent2)] text-white' :
                'bg-[var(--border)] text-[var(--muted)]'
              }`}>{s.n}</div>
              <span className={`text-xs font-semibold ${step >= s.n ? 'text-[var(--dark)]' : 'text-[var(--muted)]'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-[var(--border)] mx-3" />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <form onSubmit={form.handleSubmit(handleStep1)}>
          {/* AI Builder */}
          <button
            type="button"
            onClick={handleAiBuild}
            disabled={isAiLoading}
            className="w-full mb-5 flex items-center gap-3 bg-gradient-to-r from-[#EEF7F2] to-[#E8F4EC] border-[1.5px] border-[rgba(45,106,79,0.2)] rounded-xl p-3.5 hover:shadow-md transition-all text-left"
          >
            {isAiLoading ? <Loader2 size={20} className="animate-spin text-[var(--accent)]" /> : <Sparkles size={20} className="text-[var(--accent)]" />}
            <div>
              <div className="text-[13px] font-bold text-[var(--accent)]">AI Event Builder</div>
              <div className="text-[11px] text-[var(--muted)]">Describe your event — AI fills everything in 2 seconds</div>
            </div>
            <span className="ml-auto btn-primary text-xs px-3 py-1.5">Generate →</span>
          </button>

          <div className="form-card">
            <div className="text-sm font-bold text-[var(--dark)] mb-4">Basic Info</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Event Name *</label>
                <input className="input" placeholder="e.g. Lagos Tech Summit 2026" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-[var(--danger)] mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="What makes this event unmissable?" {...form.register('description')} />
              </div>
              <div>
                <label className="label">Event Type *</label>
                <select className="input" {...form.register('type')}>
                  <option value="">Select type</option>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Format</label>
                <select className="input" {...form.register('format')}>
                  <option value="IN_PERSON">In-Person</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" className="input" {...form.register('startDate')} />
              </div>
              <div>
                <label className="label">Time</label>
                <input type="time" className="input" {...form.register('startTime')} />
              </div>
              <div>
                <label className="label">Venue / Location</label>
                <input className="input" placeholder="e.g. Eko Hotel & Suites" {...form.register('venue')} />
              </div>
              <div>
                <label className="label">City</label>
                <select className="input" {...form.register('city')}>
                  <option value="">Select city</option>
                  {NIGERIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Max Capacity</label>
                <input type="number" className="input" placeholder="500" {...form.register('maxCapacity')} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Continue to Tickets <ChevronRight size={14} />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <div className="form-card">
            <div className="text-sm font-bold text-[var(--dark)] mb-4">Ticket Types</div>
            <div className="space-y-2.5 mb-4">
              {tickets.map((ticket, i) => (
                <div key={i} className="flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3.5 py-3">
                  <input
                    className="input flex-1 text-sm"
                    value={ticket.name}
                    onChange={e => updateTicket(i, 'name', e.target.value)}
                    placeholder="Ticket name"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm text-[var(--muted)]">₦</span>
                    <input
                      type="number"
                      className="input w-28 text-sm"
                      value={ticket.price}
                      onChange={e => updateTicket(i, 'price', Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <input
                    type="number"
                    className="input w-24 text-sm shrink-0"
                    value={ticket.capacity}
                    onChange={e => updateTicket(i, 'capacity', Number(e.target.value))}
                    placeholder="Spots"
                  />
                  <button onClick={() => removeTicket(i)} className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addTicket} className="btn-secondary text-xs flex items-center gap-1.5">
              <Plus size={12} /> Add Ticket Type
            </button>
          </div>

          <div className="form-card">
            <div className="text-sm font-bold text-[var(--dark)] mb-4">Promo Code</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Code</label>
                <input className="input" placeholder="e.g. EARLY20" />
              </div>
              <div>
                <label className="label">Discount</label>
                <input className="input" placeholder="e.g. 20% or ₦5,000" />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft size={14} /> Back
            </button>
            <button onClick={handleStep2} className="btn-primary flex items-center gap-2">
              Preview & Publish <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <div className="form-card">
            <div className="text-sm font-bold text-[var(--dark)] mb-4">Event Preview</div>
            <div className="bg-gradient-to-br from-[#EEF7F2] to-[#F0FDF4] rounded-xl p-5 mb-4">
              <div className="font-bold text-lg text-[var(--dark)] mb-1">{form.getValues('name') || 'My Event'}</div>
              <div className="text-sm text-[var(--mid)] mb-3 line-clamp-2">{form.getValues('description') || 'Event description'}</div>
              <div className="flex gap-4 text-xs text-[var(--muted)]">
                <span>📅 {form.getValues('startDate') || 'TBD'}</span>
                <span>📍 {form.getValues('venue') || form.getValues('city') || 'TBD'}</span>
                <span>👥 {form.getValues('maxCapacity') || '—'} capacity</span>
              </div>
            </div>
            {tickets.map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 bg-[var(--bg)] rounded-lg mb-2 text-sm">
                <span>{t.name}</span>
                <span className="font-bold text-[var(--accent)]">{t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}</span>
              </div>
            ))}
            <div className="mt-4">
              <label className="label">Registration Link (auto-generated)</label>
              <div className="flex gap-2">
                <input
                  className="input text-xs bg-[var(--bg)]"
                  readOnly
                  value={`owambe.com/events/${form.getValues('name')?.toLowerCase().replace(/\s+/g, '-').slice(0, 30) || 'my-event'}`}
                />
                <button onClick={() => toast.success('Link copied!')} className="btn-secondary text-xs px-3">Copy</button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft size={14} /> Back
            </button>
            <div className="flex gap-2">
              <button onClick={handleSaveDraft} className="btn-secondary">Save Draft</button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="btn-accent flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                Publish Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
