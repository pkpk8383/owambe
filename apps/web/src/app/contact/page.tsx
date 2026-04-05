import Link from 'next/link';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center">
          <Link href="/" className="font-bold text-[18px] text-[var(--dark)]">
            owambe<span className="text-[var(--accent2)]">.com</span>
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-5 py-16">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--dark)] mb-6 inline-block">← Home</Link>
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-[var(--muted)] mb-10">We're here to help — for vendor support, enterprise enquiries, or press.</p>

        <div className="grid grid-cols-2 gap-6 mb-10">
          {[
            { icon: <Mail size={20} />, label: 'General', value: 'hello@owambe.com', href: 'mailto:hello@owambe.com' },
            { icon: <MessageSquare size={20} />, label: 'Support', value: 'support@owambe.com', href: 'mailto:support@owambe.com' },
            { icon: <Phone size={20} />, label: 'Phone (Lagos)', value: '+234 800 OWA MBECOM', href: 'tel:+234800' },
            { icon: <MapPin size={20} />, label: 'Address', value: 'Victoria Island, Lagos, Nigeria', href: null },
          ].map(c => (
            <div key={c.label} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--pill)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                {c.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-1">{c.label}</div>
                {c.href ? (
                  <a href={c.href} className="text-sm font-semibold text-[var(--accent)] hover:underline">{c.value}</a>
                ) : (
                  <div className="text-sm font-semibold">{c.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-[var(--pill)]">
          <h2 className="font-bold text-base mb-1">For vendors</h2>
          <p className="text-sm text-[var(--muted)]">
            Want to list your services on Owambe? Register at{' '}
            <Link href="/register" className="text-[var(--accent)] hover:underline">owambe.com/register</Link> and select &ldquo;Vendor&rdquo;.
            Our team verifies profiles within 48 hours.
          </p>
        </div>
      </main>
    </div>
  );
}
