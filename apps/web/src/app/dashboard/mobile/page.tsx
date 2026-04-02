'use client';

import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Smartphone, QrCode, Bell, Map, MessageSquare, Star } from 'lucide-react';

export default function MobileAppPage() {
  const { data: eventsData } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsApi.list({ status: 'PUBLISHED', limit: 5 }).then(r => r.data),
  });

  const events = eventsData?.events || [];

  const FEATURES = [
    { icon: <QrCode size={20} />, title: 'Digital QR Ticket', desc: 'Attendees get a QR code ticket in the app for contactless check-in' },
    { icon: <Bell size={20} />, title: 'Push Notifications', desc: 'Send reminders, schedule changes, and announcements in real-time' },
    { icon: <Map size={20} />, title: 'Venue Map & Directions', desc: 'In-app navigation and room-by-room maps for large venues' },
    { icon: <MessageSquare size={20} />, title: 'Live Q&A', desc: 'Attendees submit and upvote questions during sessions' },
    { icon: <Star size={20} />, title: 'Session Ratings', desc: 'Instant feedback after each session — live data in your dashboard' },
    { icon: <Smartphone size={20} />, title: 'Personalised Schedule', desc: 'Attendees build their agenda from your session list' },
  ];

  return (
    <div className="p-6 animate-fade-up">
      <div className="grid grid-cols-2 gap-6">
        {/* Left: App preview */}
        <div>
          <div className="card p-6 text-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
              <Smartphone size={28} className="text-white" />
            </div>
            <h2 className="font-bold text-lg mb-2">Owambe Attendee App</h2>
            <p className="text-sm text-[var(--muted)] mb-5 leading-relaxed">
              Every event you publish automatically gets an attendee experience app.
              Attendees access it on iOS, Android, or as a mobile web app — no download required.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => toast('App Store coming soon!')}
                className="btn-primary text-sm flex items-center gap-2">
                📱 App Store
              </button>
              <button onClick={() => toast('Play Store coming soon!')}
                className="btn-secondary text-sm flex items-center gap-2">
                🤖 Play Store
              </button>
            </div>
          </div>

          {/* QR code per event */}
          <div className="card p-5">
            <div className="text-sm font-bold mb-3">App Access QR Codes</div>
            <p className="text-xs text-[var(--muted)] mb-3">
              Print this QR code at your event venue — attendees scan it to instantly open their event app.
            </p>
            {events.length === 0 ? (
              <div className="text-center py-6 text-sm text-[var(--muted)]">
                No published events yet
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev: any) => (
                  <div key={ev.id}
                    className="flex items-center justify-between py-2.5 px-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    <div>
                      <div className="font-semibold text-sm">{ev.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        owambe.com/events/{ev.slug}/app
                      </div>
                    </div>
                    <button onClick={() => toast('QR code downloaded!')}
                      className="btn-secondary text-xs px-2.5">
                      ↓ QR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Features */}
        <div>
          <h3 className="font-bold text-sm mb-4">App Features</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-4 hover:shadow-card transition-all">
                <div className="text-[var(--accent)] mb-2">{f.icon}</div>
                <div className="font-semibold text-sm mb-1">{f.title}</div>
                <div className="text-xs text-[var(--muted)] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Availability by plan */}
          <div className="card p-4">
            <div className="text-sm font-bold mb-3">Available on Your Plan</div>
            {[
              { plan: 'Starter', features: ['QR ticket', 'Basic schedule'], available: true },
              { plan: 'Growth ₦150K/mo', features: ['All above + Push notifications, Q&A, Ratings'], available: true },
              { plan: 'Scale ₦450K/mo', features: ['All above + Venue maps, Personalised schedule, White-label'], available: true },
            ].map(p => (
              <div key={p.plan} className="flex items-start gap-2.5 py-2.5 border-b border-[var(--border)] last:border-0">
                <div className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-white text-[9px] font-bold">✓</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{p.plan}</div>
                  <div className="text-xs text-[var(--muted)]">{p.features.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
