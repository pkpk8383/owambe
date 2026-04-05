import Link from 'next/link';

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--muted)] mb-8">Last updated: January 2026</p>
        <div className="prose max-w-none text-sm text-[var(--mid)] leading-relaxed space-y-4">
          <p>By using Owambe.com, you agree to these terms. Owambe provides a platform for event planning and vendor booking in Nigeria.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Payments & Escrow</h2>
          <p>All payments are processed via Paystack. Deposits (30%) are held in escrow and released to vendors 24 hours after a successful event. Owambe charges a commission of 8–12% on vendor bookings.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Cancellations</h2>
          <p>Cancellation policies vary by vendor and are stated in each service agreement. Platform-level disputes are handled via Owambe's dispute resolution process.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Contact</h2>
          <p>For questions: <a href="mailto:legal@owambe.com" className="text-[var(--accent)]">legal@owambe.com</a></p>
        </div>
      </main>
    </div>
  );
}
