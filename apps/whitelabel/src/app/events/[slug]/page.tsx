import { getTenant } from '../../../lib/tenant';
import { notFound } from 'next/navigation';
import axios from 'axios';
import RegisterForm from './RegisterForm';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const API_URL = process.env.OWAMBE_API_URL || 'https://api.owambe.com/api';

async function getEvent(slug: string) {
  try {
    const res = await axios.get(`${API_URL}/events/public/${slug}`, { timeout: 8000 });
    return res.data.event;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const [tenant, event] = await Promise.all([getTenant(), getEvent(params.slug)]);
  if (!event) return { title: 'Event not found' };
  return {
    title: `${event.name}${tenant ? ` | ${tenant.name}` : ''}`,
    description: event.description || `Register for ${event.name}`,
    openGraph: {
      title: event.name,
      description: event.description,
      images: event.coverImageUrl ? [event.coverImageUrl] : [],
    },
  };
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const [tenant, event] = await Promise.all([getTenant(), getEvent(params.slug)]);
  if (!tenant) notFound();
  if (!event) notFound();

  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const totalRegistered = event._count?.attendees || 0;
  const spotsLeft = event.maxCapacity ? event.maxCapacity - totalRegistered : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const isLive = event.status === 'LIVE';

  // Active ticket types
  const activeTickets = event.ticketTypes?.filter((t: any) => t.status === 'ACTIVE') || [];

  return (
    <>
      {/* Nav */}
      <nav style={{
        background: 'var(--brand-primary)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} style={{ height: 28, width: 'auto' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{tenant.name}</span>
          )}
        </Link>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          ← All events
        </Link>
      </nav>

      {/* Hero */}
      <div style={{
        height: 300,
        background: event.coverImageUrl
          ? `url(${event.coverImageUrl}) center/cover`
          : `linear-gradient(135deg, var(--brand-primary) 0%, #1a4d38 100%)`,
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 0 32px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {event.type && (
              <span style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                backdropFilter: 'blur(4px)',
              }}>
                {event.type}
              </span>
            )}
            {isLive && (
              <span style={{
                background: '#059669', color: '#fff',
                padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700,
              }}>
                ● Happening now
              </span>
            )}
            {isSoldOut && (
              <span style={{
                background: '#E63946', color: '#fff',
                padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700,
              }}>
                Sold out
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {event.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 32,
          alignItems: 'start',
        }}>
          {/* Left: Details */}
          <div>
            {/* Quick facts */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {startDate && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--brand-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Calendar size={16} color="var(--brand-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                        {format(startDate, 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                        {format(startDate, 'h:mm a')}
                        {endDate ? ` – ${format(endDate, 'h:mm a')}` : ''}
                      </div>
                    </div>
                  </div>
                )}
                {(event.venue || event.city) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--brand-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MapPin size={16} color="var(--brand-primary)" />
                    </div>
                    <div>
                      {event.venue && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{event.venue}</div>
                      )}
                      {event.city && (
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{event.city}, Nigeria</div>
                      )}
                    </div>
                  </div>
                )}
                {event.maxCapacity && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--brand-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Users size={16} color="var(--brand-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                        {totalRegistered} registered
                        {spotsLeft !== null && !isSoldOut && ` · ${spotsLeft} spots left`}
                      </div>
                      {event.maxCapacity && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 4, background: '#E2DDD5', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(100, (totalRegistered / event.maxCapacity) * 100)}%`,
                              background: spotsLeft && spotsLeft < 20 ? '#E63946' : 'var(--brand-primary)',
                              borderRadius: 2,
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--dark)' }}>
                  About this event
                </h2>
                <div style={{
                  fontSize: 15, color: '#3D3730', lineHeight: 1.75,
                  whiteSpace: 'pre-line',
                }}>
                  {event.description}
                </div>
              </div>
            )}

            {/* Organiser */}
            {event.planner && (
              <div className="card" style={{ background: 'var(--brand-primary-light)', borderColor: 'var(--brand-primary)', borderOpacity: 0.2 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Organised by
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>
                  {event.planner.companyName || tenant.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: '#059669' }} />
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Verified event organiser</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Registration */}
          <div style={{ position: 'sticky', top: 72 }}>
            <RegisterForm
              event={event}
              tenant={tenant}
              isSoldOut={isSoldOut}
              activeTickets={activeTickets}
            />
          </div>
        </div>
      </main>
    </>
  );
}
