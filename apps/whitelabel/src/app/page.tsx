import { getTenant, getTenantEvents } from '../lib/tenant';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Search, ArrowRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

function formatPrice(ticketTypes: Array<{ price: number; name: string }>): string {
  if (!ticketTypes?.length) return 'Free';
  const prices = ticketTypes.map(t => Number(t.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === 0 && max === 0) return 'Free';
  if (min === max) return `₦${min.toLocaleString('en-NG')}`;
  return `From ₦${min.toLocaleString('en-NG')}`;
}

function EventCard({ event, tenant }: { event: any; tenant: any }) {
  const startDate = event.startDate ? new Date(event.startDate) : null;
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - (event._count?.attendees || 0)
    : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const minPrice = formatPrice(event.ticketTypes);

  return (
    <Link href={`/events/${event.slug}`}
      className="card group block hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] overflow-hidden p-0"
      style={{ borderRadius: 'var(--radius)' }}>

      {/* Cover image */}
      <div style={{
        height: 180,
        background: event.coverImageUrl
          ? `url(${event.coverImageUrl}) center/cover`
          : `linear-gradient(135deg, var(--brand-primary), var(--brand-primary)cc)`,
        position: 'relative',
      }}>
        {!event.coverImageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.25,
          }}>
            <span style={{ fontSize: 64 }}>🎉</span>
          </div>
        )}
        {/* Status badge */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {event.status === 'LIVE' ? (
            <span style={{
              background: '#059669', color: '#fff',
              padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700,
            }}>● Live now</span>
          ) : isSoldOut ? (
            <span style={{
              background: '#E63946', color: '#fff',
              padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700,
            }}>Sold out</span>
          ) : null}
        </div>
        {/* Price badge */}
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
          <span style={{
            background: 'rgba(0,0,0,0.65)', color: '#fff',
            padding: '4px 10px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, backdropFilter: 'blur(4px)',
          }}>
            {minPrice}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 6,
        }}>
          {event.type}
        </div>
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: 'var(--dark)',
          marginBottom: 10, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.name}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
              <Calendar size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
              {format(startDate, 'EEE, MMM d, yyyy · h:mm a')}
            </div>
          )}
          {(event.venue || event.city) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
              <MapPin size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
              {[event.venue, event.city].filter(Boolean).join(', ')}
            </div>
          )}
          {spotsLeft !== null && !isSoldOut && spotsLeft < 50 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontSize: 13, fontWeight: 600 }}>
              <Users size={13} style={{ flexShrink: 0 }} />
              Only {spotsLeft} spots left
            </div>
          )}
        </div>

        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14, borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {event._count?.attendees || 0} registered
          </span>
          <span style={{
            color: 'var(--brand-primary)', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'gap 0.15s',
          }} className="group-hover:gap-2">
            Register <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || '';
  const { events, total } = await getTenantEvents(tenant.subdomain, { search, page, limit: 12 });
  const totalPages = Math.ceil(total / 12);

  return (
    <>
      {/* Nav */}
      <nav style={{
        background: 'var(--brand-primary)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name}
              style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{tenant.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tenant.socialLinks?.website && (
            <a href={tenant.socialLinks.website} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              Website <ExternalLink size={11} />
            </a>
          )}
          <a href={`https://owambe.com`} target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            Powered by Owambe
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'var(--brand-primary)',
        padding: '48px 24px 64px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {tenant.tagline && (
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 12 }}>
              {tenant.tagline}
            </p>
          )}
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Events by{' '}
            <span style={{ color: 'var(--brand-accent)' }}>{tenant.name}</span>
          </h1>
          <p style={{ fontSize: 16, opacity: 0.75, lineHeight: 1.6, marginBottom: 32 }}>
            {total > 0
              ? `${total} upcoming event${total !== 1 ? 's' : ''} — browse and register below`
              : 'New events coming soon. Check back later.'}
          </p>

          {/* Search */}
          <form action="/" method="GET"
            style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 12, backdropFilter: 'blur(8px)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', borderRadius: 8 }}>
              <Search size={15} color="var(--muted)" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search events..."
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: 14,
                  background: 'transparent', color: 'var(--dark)',
                  fontFamily: 'var(--brand-font)',
                }}
              />
            </div>
            <button type="submit" className="btn-accent" style={{ borderRadius: 8, padding: '10px 20px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Events grid */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        {search && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
            {total} result{total !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;{' '}
            <a href="/" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Clear</a>
          </p>
        )}

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No events found</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              {search ? 'Try a different search term' : 'Check back soon for upcoming events'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {events.map((event: any) => (
              <EventCard key={event.id} event={event} tenant={tenant} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            {page > 1 && (
              <a href={`/?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="btn-secondary" style={{ padding: '8px 16px' }}>
                ← Previous
              </a>
            )}
            <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center' }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a href={`/?page=${page + 1}${search ? `&search=${search}` : ''}`}
                className="btn-primary" style={{ padding: '8px 16px' }}>
                Next →
              </a>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
          {tenant.footerText || `© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.`}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(tenant.socialLinks || {}).map(([platform, url]) =>
            url ? (
              <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                {platform}
              </a>
            ) : null
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--border)', marginTop: 12 }}>
          Powered by{' '}
          <a href="https://owambe.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--brand-primary)' }}>owambe.com</a>
        </p>
      </footer>
    </>
  );
}
