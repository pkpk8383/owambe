import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import EventRegistrationForm from './EventRegistrationForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchEvent(slug: string) {
  try {
    const res = await fetch(`${API_URL}/events/public/${slug}`, {
      next: { revalidate: 60 }, // revalidate every 60 seconds
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.event ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) {
    return { title: 'Event Not Found | Owambe' };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://owambe.com';
  return {
    title: `${event.name} | Owambe`,
    description: event.description
      ? event.description.slice(0, 160)
      : `Register for ${event.name} on Owambe — Nigeria's premier event platform.`,
    openGraph: {
      title: event.name,
      description: event.description?.slice(0, 160) ?? `Register for ${event.name} on Owambe.`,
      url: `${appUrl}/events/${params.slug}`,
      type: 'website',
      siteName: 'Owambe',
    },
  };
}

function buildJsonLd(event: any, slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://owambe.com';
  const organizer = event.planner
    ? {
        '@type': 'Organization',
        name:
          event.planner.companyName ||
          `${event.planner.user?.firstName ?? ''} ${event.planner.user?.lastName ?? ''}`.trim() ||
          'Owambe Planner',
      }
    : undefined;

  // Build offers array from ticket types
  const offers =
    event.ticketTypes && event.ticketTypes.length > 0
      ? event.ticketTypes.map((t: any) => ({
          '@type': 'Offer',
          name: t.name,
          price: Number(t.price).toFixed(2),
          priceCurrency: 'NGN',
          availability:
            t.capacity && t._count?.attendees >= t.capacity
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
          url: `${appUrl}/events/${slug}`,
          validFrom: event.createdAt ?? new Date().toISOString(),
        }))
      : {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'NGN',
          availability: 'https://schema.org/InStock',
          url: `${appUrl}/events/${slug}`,
        };

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description ?? undefined,
    url: `${appUrl}/events/${slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    offers,
  };

  if (event.startDate) {
    jsonLd.startDate = event.startDate;
  }
  if (event.endDate) {
    jsonLd.endDate = event.endDate;
  }
  if (event.venue || event.city) {
    jsonLd.location = {
      '@type': 'Place',
      name: event.venue ?? event.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city ?? undefined,
        addressCountry: 'NG',
      },
    };
  }
  if (organizer) {
    jsonLd.organizer = organizer;
  }
  if (event.imageUrl) {
    jsonLd.image = event.imageUrl;
  }

  return jsonLd;
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function PublicEventPage({ params }: { params: { slug: string } }) {
  const event = await fetchEvent(params.slug);

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

  const jsonLd = buildJsonLd(event, params.slug);

  return (
    <>
      {/* Google schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--bg)]">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2D6A4F, #1A4D38)' }}
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
            {/* Interactive registration form (client component) */}
            <EventRegistrationForm event={event} slug={params.slug} />

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
                    {event.planner.companyName ||
                      `${event.planner.user?.firstName ?? ''} ${event.planner.user?.lastName ?? ''}`}
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
    </>
  );
}
