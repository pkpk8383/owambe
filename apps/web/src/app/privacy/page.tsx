import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-8">Last updated: January 2026</p>
        <div className="prose max-w-none text-sm text-[var(--mid)] leading-relaxed space-y-4">
          <p>Owambe.com collects and uses personal data to provide event planning services to users in Nigeria and the broader African continent.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Data We Collect</h2>
          <p>Name, email, phone number, payment information (processed by Paystack — we do not store card details), event preferences, and usage data for improving the platform.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">How We Use Your Data</h2>
          <p>To process bookings, send event confirmations, generate QR tickets, facilitate vendor contracts, and send relevant marketing communications (with your consent).</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Data Retention</h2>
          <p>Contract audit trails are retained for 7 years as required by Nigerian law. Other data is retained for the duration of your account plus 2 years.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:privacy@owambe.com" className="text-[var(--accent)]">privacy@owambe.com</a>.</p>
          <h2 className="font-bold text-base text-[var(--dark)] mt-6">Cookies</h2>
          <p>We use essential cookies for authentication and analytics cookies (with consent) to improve our service.</p>
        </div>
      </main>
    </div>
  );
}
