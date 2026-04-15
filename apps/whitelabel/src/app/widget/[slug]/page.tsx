import axios from 'axios';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Users } from 'lucide-react';
import WidgetRegisterForm from './WidgetRegisterForm';

const API_URL = process.env.OWAMBE_API_URL || 'https://api.owambe.com/api';

async function getEvent(slug: string) {
  try {
    const res = await axios.get(`${API_URL}/events/public/${slug}`, { timeout: 8000 });
    return res.data.event;
  } catch { return null; }
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { mode?: string; primary?: string; accent?: string };
}) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const mode        = searchParams.mode || 'card';
  const primary     = searchParams.primary ? decodeURIComponent(searchParams.primary) : '#2D6A4F';
  const accent      = searchParams.accent  ? decodeURIComponent(searchParams.accent)  : '#E76F2A';
  const startDate   = event.startDate ? new Date(event.startDate) : null;
  const activeTickets = (event.ticketTypes || []).filter((t: any) => t.status === 'ACTIVE');
  const totalRegistered = event._count?.attendees || 0;
  const spotsLeft   = event.maxCapacity ? event.maxCapacity - totalRegistered : null;
  const isSoldOut   = spotsLeft !== null && spotsLeft <= 0;
  const minPrice    = activeTickets.length
    ? Math.min(...activeTickets.map((t: any) => Number(t.price)))
    : 0;

  const cssVars = `
    :root {
      --w-primary: ${primary};
      --w-accent: ${accent};
      --w-primary-light: ${hexToRgba(primary, 0.08)};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #fff;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }
  `;

  // ── BUTTON MODE ───────────────────────────────────────
  if (mode === 'button') {
    return (
      <html>
        <head>
          <style dangerouslySetInnerHTML={{ __html: cssVars }} />
          <script dangerouslySetInnerHTML={{ __html: `
            function openEvent() {
              window.open('${process.env.OWAMBE_MAIN_URL || 'https://owambe.com'}/events/${params.slug}', '_blank');
            }
            window.addEventListener('load', function() {
              window.parent.postMessage({ type: 'owambe-resize', slug: '${params.slug}', height: 64 }, '*');
            });
          ` }} />
        </head>
        <body>
          <button
            onClick={() => {}}
            style={{
              width: '100%', height: 56,
              background: `var(--w-primary)`, color: '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onClick="openEvent()">
            🎟️ Register for {event.name}
            {minPrice > 0 && ` · From ₦${minPrice.toLocaleString('en-NG')}`}
          </button>
        </body>
      </html>
    );
  }

  // ── CARD + FULL MODE ──────────────────────────────────
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          ${cssVars}
          .widget-wrap {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .widget-hero {
            height: 160px;
            background: linear-gradient(135deg, var(--w-primary) 0%, #1a4d38 100%);
            position: relative;
            display: flex;
            align-items: flex-end;
            padding: 0 0 16px;
          }
          .widget-hero-img {
            position: absolute; inset: 0;
            object-fit: cover; width: 100%; height: 100%;
          }
          .widget-hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
          }
          .widget-hero-content { position: relative; z-index: 1; padding: 0 16px; }
          .widget-body { padding: 16px; }
          .meta-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; margin-bottom: 8px; }
          .pill {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 2px 10px; border-radius: 20px;
            font-size: 11px; font-weight: 700;
            margin-bottom: 8px;
          }
          .btn-register {
            width: 100%; padding: 12px;
            background: var(--w-primary); color: #fff;
            border: none; border-radius: 8px;
            font-size: 14px; font-weight: 700;
            cursor: pointer; margin-top: 12px;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          }
          .btn-register:hover { opacity: 0.92; }
          .poweredby {
            text-align: center; font-size: 11px; color: #aaa;
            padding: 8px 0 4px;
          }
          .poweredby a { color: var(--w-primary); text-decoration: none; font-weight: 600; }
          input, select {
            width: 100%; padding: 8px 10px;
            border: 1px solid #e5e7eb; border-radius: 6px;
            font-size: 13px; font-family: inherit;
            margin-bottom: 8px; outline: none;
          }
          input:focus, select:focus { border-color: var(--w-primary); }
          label { font-size: 12px; font-weight: 600; color: #555; display: block; margin-bottom: 3px; }
          .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .success-box {
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 10px; padding: 20px; text-align: center;
          }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Auto-resize notification to parent
          function notifyHeight() {
            var h = document.body.scrollHeight;
            window.parent.postMessage({ type: 'owambe-resize', slug: '${params.slug}', height: h + 16 }, '*');
          }
          window.addEventListener('load', notifyHeight);
          var observer = new MutationObserver(notifyHeight);
          document.addEventListener('DOMContentLoaded', function() {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
          });

          // Track click attribution
          fetch('/api/distribution/${event.id}/distributions/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'WIDGET_EMBED', referrer: document.referrer }),
          }).catch(function(){});
        ` }} />
      </head>
      <body>
        <div className="widget-wrap">
          {/* Hero */}
          <div className="widget-hero">
            {event.coverImageUrl && (
              <img src={event.coverImageUrl} alt={event.name} className="widget-hero-img" />
            )}
            <div className="widget-hero-overlay" />
            <div className="widget-hero-content">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  {event.type}
                </span>
                {isSoldOut && (
                  <span className="pill" style={{ background: '#E63946', color: '#fff' }}>Sold out</span>
                )}
              </div>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                {event.name}
              </h2>
            </div>
          </div>

          {/* Details */}
          <div className="widget-body">
            {startDate && (
              <div className="meta-row">
                <Calendar size={13} color={primary} />
                <span>{format(startDate, 'EEE, MMM d, yyyy · h:mm a')}</span>
              </div>
            )}
            {(event.venue || event.city) && (
              <div className="meta-row">
                <MapPin size={13} color={primary} />
                <span>{[event.venue, event.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {spotsLeft !== null && !isSoldOut && (
              <div className="meta-row">
                <Users size={13} color={spotsLeft < 20 ? '#E63946' : '#666'} />
                <span style={{ color: spotsLeft < 20 ? '#E63946' : undefined }}>
                  {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ marginTop: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: primary }}>
                {minPrice === 0 ? 'Free' : `From ₦${minPrice.toLocaleString('en-NG')}`}
              </span>
            </div>

            {/* CARD mode: just a register button linking out */}
            {mode === 'card' && (
              <>
                <a
                  href={`${process.env.OWAMBE_MAIN_URL || 'https://owambe.com'}/events/${params.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '12px',
                    background: isSoldOut ? '#9CA3AF' : primary, color: '#fff',
                    borderRadius: 8, fontSize: 14, fontWeight: 700,
                    textDecoration: 'none', marginTop: 12,
                    pointerEvents: isSoldOut ? 'none' : undefined,
                  }}>
                  {isSoldOut ? '🎟️ Sold Out' : '🎟️ Register Now →'}
                </a>
              </>
            )}

            {/* FULL mode: inline registration form */}
            {mode === 'full' && !isSoldOut && (
              <WidgetRegisterForm
                event={event}
                activeTickets={activeTickets}
                slug={params.slug}
                primaryColor={primary}
                accentColor={accent}
              />
            )}

            {mode === 'full' && isSoldOut && (
              <div className="success-box" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>😔</div>
                <p style={{ fontWeight: 700, color: '#9a3412' }}>This event is sold out</p>
                <a href={`${process.env.OWAMBE_MAIN_URL || 'https://owambe.com'}/events/${params.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: primary, fontSize: 13, display: 'block', marginTop: 8 }}>
                  Join the waitlist →
                </a>
              </div>
            )}
          </div>

          <div className="poweredby">
            Powered by{' '}
            <a href="https://owambe.com" target="_blank" rel="noopener noreferrer">
              Owambe
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}
