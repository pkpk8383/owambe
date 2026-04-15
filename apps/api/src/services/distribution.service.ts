import axios from 'axios';
import { logger } from '../utils/logger';

// ─── CHANNEL CONFIG ───────────────────────────────────
const EB_TOKEN   = process.env.EVENTBRITE_API_KEY   || '';
const FB_TOKEN   = process.env.FACEBOOK_PAGE_TOKEN  || '';
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID     || '';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL   || 'https://owambe.com';

// ─── SHARED TYPES ─────────────────────────────────────
export interface ChannelResult {
  success: boolean;
  externalId?:  string;
  externalUrl?: string;
  error?:       string;
}

export interface EventPayload {
  id:           string;
  name:         string;
  description:  string;
  slug:         string;
  startDate:    Date;
  endDate?:     Date | null;
  venue?:       string | null;
  address?:     string | null;
  city?:        string | null;
  coverImageUrl?: string | null;
  type:         string;
  ticketTypes:  Array<{ name: string; price: number; currency: string; capacity?: number | null }>;
  maxCapacity?: number | null;
  planner:      { companyName?: string | null; user: { email: string } };
}

// ─── EVENTBRITE ───────────────────────────────────────
export async function pushToEventbrite(event: EventPayload): Promise<ChannelResult> {
  if (!EB_TOKEN) return { success: false, error: 'Eventbrite API key not configured' };

  try {
    const headers = {
      Authorization: `Bearer ${EB_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // 1. Get organizer (first owned organizer for this token)
    const orgRes = await axios.get('https://www.eventbriteapi.com/v3/users/me/organizers/', { headers });
    const organizerId = orgRes.data.organizers?.[0]?.id;
    if (!organizerId) return { success: false, error: 'No Eventbrite organizer found for this token' };

    // 2. Create event
    const startUtc = new Date(event.startDate).toISOString().replace('.000Z', 'Z');
    const endUtc   = event.endDate
      ? new Date(event.endDate).toISOString().replace('.000Z', 'Z')
      : new Date(new Date(event.startDate).getTime() + 4 * 60 * 60 * 1000)
          .toISOString().replace('.000Z', 'Z');

    const createRes = await axios.post('https://www.eventbriteapi.com/v3/events/', {
      event: {
        name:         { html: event.name },
        description:  { html: `<p>${event.description || ''}</p><p><strong>Powered by <a href="${APP_URL}">Owambe</a></strong></p>` },
        start:        { timezone: 'Africa/Lagos', utc: startUtc },
        end:          { timezone: 'Africa/Lagos', utc: endUtc },
        currency:     'NGN',
        online_event: false,
        organizer_id: organizerId,
        listed:       true,
        shareable:    true,
        invite_only:  false,
        show_remaining: true,
        capacity:     event.maxCapacity ?? undefined,
        url:          `${APP_URL}/events/${event.slug}`,
      }
    }, { headers });

    const ebEventId = createRes.data.id;

    // 3. Add venue if available
    if (event.venue) {
      try {
        const venueRes = await axios.post('https://www.eventbriteapi.com/v3/venues/', {
          venue: {
            name:    event.venue,
            address: {
              address_1: event.address || event.venue,
              city:      event.city    || 'Lagos',
              country:   'NG',
            },
          }
        }, { headers });

        await axios.post(`https://www.eventbriteapi.com/v3/events/${ebEventId}/`, {
          event: { venue_id: venueRes.data.id }
        }, { headers });
      } catch {
        // Venue creation optional — don't fail event push
      }
    }

    // 4. Create ticket classes for each ticket type
    for (const ticket of event.ticketTypes) {
      await axios.post(`https://www.eventbriteapi.com/v3/events/${ebEventId}/ticket_classes/`, {
        ticket_class: {
          name:           ticket.name,
          free:           ticket.price === 0,
          quantity_total: ticket.capacity ?? event.maxCapacity ?? 1000,
          cost:           ticket.price > 0 ? `NGN,${ticket.price * 100}` : undefined, // in minor units
          minimum_quantity: 1,
          maximum_quantity: 10,
          sales_end:      startUtc,
          hidden:         false,
        }
      }, { headers });
    }

    // 5. Add cover image if available
    if (event.coverImageUrl) {
      try {
        await axios.post(`https://www.eventbriteapi.com/v3/events/${ebEventId}/`, {
          event: { logo: { url: event.coverImageUrl } }
        }, { headers });
      } catch {
        // Image optional
      }
    }

    // 6. Publish the event
    await axios.post(`https://www.eventbriteapi.com/v3/events/${ebEventId}/publish/`, {}, { headers });

    const externalUrl = `https://www.eventbrite.com/e/${ebEventId}`;
    logger.info(`Eventbrite: published event ${ebEventId} for "${event.name}"`);

    return { success: true, externalId: ebEventId, externalUrl };
  } catch (err: any) {
    const msg = err.response?.data?.error_description || err.response?.data?.error || err.message;
    logger.error(`Eventbrite push failed for "${event.name}": ${msg}`);
    return { success: false, error: msg };
  }
}

export async function unpublishFromEventbrite(externalId: string): Promise<ChannelResult> {
  if (!EB_TOKEN) return { success: false, error: 'Eventbrite API key not configured' };
  try {
    await axios.post(
      `https://www.eventbriteapi.com/v3/events/${externalId}/unpublish/`,
      {},
      { headers: { Authorization: `Bearer ${EB_TOKEN}` } }
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error_description || err.message };
  }
}

// ─── FACEBOOK EVENTS ──────────────────────────────────
export async function pushToFacebook(event: EventPayload): Promise<ChannelResult> {
  if (!FB_TOKEN || !FB_PAGE_ID) {
    return { success: false, error: 'Facebook Page token and Page ID not configured' };
  }

  try {
    const startTime = Math.floor(new Date(event.startDate).getTime() / 1000); // Unix timestamp
    const endTime   = event.endDate
      ? Math.floor(new Date(event.endDate).getTime() / 1000)
      : startTime + 4 * 60 * 60;

    const params: Record<string, any> = {
      access_token: FB_TOKEN,
      name:         event.name,
      description:  `${event.description || ''}\n\nRegister at: ${APP_URL}/events/${event.slug}\n\nPowered by Owambe`,
      start_time:   startTime,
      end_time:     endTime,
      location:     [event.venue, event.city, 'Nigeria'].filter(Boolean).join(', '),
      privacy_type: 'OPEN',
      type:         'private',
    };

    if (event.coverImageUrl) {
      params.cover = event.coverImageUrl;
    }

    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/events`,
      params
    );

    const fbEventId  = res.data.id;
    const externalUrl = `https://www.facebook.com/events/${fbEventId}`;
    logger.info(`Facebook: created event ${fbEventId} for "${event.name}"`);

    return { success: true, externalId: fbEventId, externalUrl };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    logger.error(`Facebook push failed for "${event.name}": ${msg}`);
    return { success: false, error: msg };
  }
}

// ─── GOOGLE EVENTS (structured data endpoint) ─────────
// Google doesn't have a direct event publishing API —
// the standard approach is:
// 1. Emit structured data (JSON-LD) on the event page (handled by Next.js head)
// 2. Optionally ping Google via Indexing API for faster crawl
// We implement the Indexing API notification here.
export async function pushToGoogle(event: EventPayload): Promise<ChannelResult> {
  const eventUrl = `${APP_URL}/events/${event.slug}`;

  // Generate the JSON-LD schema that must also be on the event page
  const schema = buildEventSchema(event);

  // Try Indexing API if configured (optional — falls back gracefully)
  const googleKey = process.env.GOOGLE_INDEXING_API_KEY || '';
  if (googleKey) {
    try {
      await axios.post(
        `https://indexing.googleapis.com/v3/urlNotifications:publish`,
        { url: eventUrl, type: 'URL_UPDATED' },
        { headers: { Authorization: `Bearer ${googleKey}` } }
      );
      logger.info(`Google Indexing API: submitted ${eventUrl}`);
    } catch (err: any) {
      logger.warn(`Google Indexing API optional ping failed: ${err.message}`);
      // Not a hard failure — schema on page still works
    }
  }

  return {
    success: true,
    externalUrl: `https://www.google.com/search?q=${encodeURIComponent(event.name + ' ' + (event.city || 'Lagos'))}`,
    externalId: event.slug,
  };
}

export function buildEventSchema(event: EventPayload): object {
  const minPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map(t => t.price))
    : 0;
  const maxPrice = event.ticketTypes.length
    ? Math.max(...event.ticketTypes.map(t => t.price))
    : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || '',
    startDate: new Date(event.startDate).toISOString(),
    ...(event.endDate && { endDate: new Date(event.endDate).toISOString() }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue || event.city || 'Lagos, Nigeria',
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address || '',
        addressLocality: event.city || 'Lagos',
        addressCountry: 'NG',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.planner.companyName || 'Owambe Event',
      url: APP_URL,
    },
    ...(event.coverImageUrl && { image: [event.coverImageUrl] }),
    ...(event.ticketTypes.length > 0 && {
      offers: event.ticketTypes.map(t => ({
        '@type': 'Offer',
        name: t.name,
        price: t.price,
        priceCurrency: 'NGN',
        availability: 'https://schema.org/InStock',
        url: `${APP_URL}/events/${event.slug}`,
        validFrom: new Date().toISOString(),
      })),
    }),
    url: `${APP_URL}/events/${event.slug}`,
  };
}

// ─── WIDGET EMBED SNIPPET GENERATOR ──────────────────
export function generateWidgetSnippet(params: {
  slug:        string;
  mode:        'card' | 'full' | 'button';
  primaryColor?: string;
  accentColor?:  string;
  width?:        string;
}): { snippet: string; iframeUrl: string } {
  const WIDGET_URL = process.env.WHITELABEL_URL || 'https://portal.owambe.com';
  const iframeUrl  = `${WIDGET_URL}/widget/${params.slug}?mode=${params.mode}${
    params.primaryColor ? `&primary=${encodeURIComponent(params.primaryColor)}` : ''
  }${params.accentColor ? `&accent=${encodeURIComponent(params.accentColor)}` : ''}`;

  const heights: Record<string, number> = { button: 80, card: 420, full: 720 };
  const height = heights[params.mode] || 420;
  const width  = params.width || '100%';

  const snippet = `<!-- Owambe Event Widget -->
<div id="owambe-widget-${params.slug}"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${iframeUrl}';
    iframe.style.width = '${width}';
    iframe.style.height = '${height}px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.display = 'block';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Event Registration');
    document.getElementById('owambe-widget-${params.slug}').appendChild(iframe);
    // Auto-resize on message from widget
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'owambe-resize' && e.data.slug === '${params.slug}') {
        iframe.style.height = e.data.height + 'px';
      }
    });
  })();
</script>`;

  return { snippet, iframeUrl };
}
