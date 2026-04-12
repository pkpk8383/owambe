import Link from 'next/link';
import { Sparkles, MapPin, Star, Zap, Shield, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <img src="/owambe-logo-nav.png" alt="Owambe" className="h-9 w-auto" />
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2">
            <Link href="/vendors" className="px-3 py-1.5 text-sm text-[var(--mid)] hover:text-[var(--dark)] rounded-lg hover:bg-[var(--bg)] transition-colors">Browse Vendors</Link>
            <Link href="/plan" className="px-3 py-1.5 text-sm font-semibold text-[var(--accent)] rounded-lg hover:bg-[var(--pill)] transition-colors flex items-center gap-1">
              <Sparkles size={13} /> Plan with AI
            </Link>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="btn-secondary text-xs px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--pill)] text-[var(--accent)] text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Sparkles size={13} /> Launching in Lagos, Nigeria 🇳🇬
        </div>
        <h1 className="text-5xl font-bold text-[var(--dark)] leading-tight mb-5 text-balance">
          Nigeria's smartest<br />event planning platform
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl mx-auto mb-8 leading-relaxed">
          AI plans your entire event in minutes. Book verified venues, catering, photography, makeup, AV and more — all within your budget.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/plan" className="btn-accent px-8 py-3 text-base flex items-center gap-2">
            <Sparkles size={16} /> Plan My Event Free
          </Link>
          <Link href="/vendors" className="btn-secondary px-8 py-3 text-base">
            Browse Vendors
          </Link>
        </div>
        <p className="text-xs text-[var(--muted)] mt-4">No account needed to start planning · 200+ verified vendors in Lagos</p>
      </section>

      {/* Stats */}
      <section className="bg-[var(--dark)] py-12">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-4 gap-8 text-center">
          {[
            { val: '200+', label: 'Verified vendors', sub: 'Lagos' },
            { val: '93%', label: 'Cheaper than Cvent', sub: 'for planners' },
            { val: '8', label: 'Vendor categories', sub: 'all in one' },
            { val: '₦0', label: 'To list as vendor', sub: 'commission only' },
          ].map(s => (
            <div key={s.val}>
              <div className="font-bold text-3xl text-[var(--accent2)] mb-1">{s.val}</div>
              <div className="text-sm text-white font-medium">{s.label}</div>
              <div className="text-xs text-white/40">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Plan your event in 4 steps</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { n: 1, icon: '💬', title: 'Tell the AI', desc: 'Describe your event, location, date and budget in plain English' },
            { n: 2, icon: '🤖', title: 'AI finds vendors', desc: 'We match verified vendors near you within your budget' },
            { n: 3, icon: '📋', title: 'Pick your plan', desc: 'Choose from 3 packages — budget, standard, or premium' },
            { n: 4, icon: '✅', title: 'Book & relax', desc: 'Pay deposit, we hold it in escrow until your event is done' },
          ].map(step => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] flex items-center justify-center text-2xl mx-auto mb-3">{step.icon}</div>
              <div className="font-bold text-sm mb-1">{step.title}</div>
              <div className="text-xs text-[var(--muted)] leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Vendor categories */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-2">Every vendor you need</h2>
          <p className="text-center text-sm text-[var(--muted)] mb-8">All 8 categories, all verified, all in Lagos</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { emoji: '🏛', name: 'Venues', sub: 'Hotels, rooftops, halls' },
              { emoji: '🍽', name: 'Catering & F&B', sub: 'Nigerian & continental' },
              { emoji: '📸', name: 'Photography', sub: 'Photo, video, drone' },
              { emoji: '🎛', name: 'AV & Production', sub: 'Sound, lighting, stage' },
              { emoji: '💐', name: 'Décor & Florals', sub: 'Theming & centrepieces' },
              { emoji: '🎶', name: 'Entertainment', sub: 'Bands, DJs, MCs' },
              { emoji: '💄', name: 'Makeup Artists', sub: 'Bridal & editorial' },
              { emoji: '🎤', name: 'Speakers', sub: 'Keynotes & panels' },
            ].map(cat => (
              <Link key={cat.name} href={`/vendors?category=${cat.name}`}>
                <div className="card p-4 hover:shadow-card hover:border-[var(--accent)] transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <div className="font-semibold text-sm mb-0.5">{cat.name}</div>
                  <div className="text-xs text-[var(--muted)]">{cat.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For vendors CTA */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="bg-[var(--dark)] rounded-3xl p-10 grid grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-[var(--accent2)] font-semibold text-sm mb-3">For Vendors & Businesses</div>
            <h2 className="text-2xl font-bold text-white mb-3">List your business free. Earn more.</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Zero upfront cost. 0% commission for your first 90 days. Guaranteed payment via escrow. We bring the clients to you.
            </p>
            <Link href="/vendor/settings" className="btn-accent inline-flex items-center gap-2">
              List My Business Free <Zap size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Shield size={18} />, title: 'Guaranteed payment', desc: 'Escrow protects every booking' },
              { icon: <Users size={18} />, title: 'Qualified leads', desc: 'AI sends you matched clients' },
              { icon: <Star size={18} />, title: 'Build reputation', desc: 'Verified reviews from real clients' },
              { icon: <Sparkles size={18} />, title: 'AI profile builder', desc: 'We write your listing for you' },
            ].map(f => (
              <div key={f.title} className="bg-white/[0.05] rounded-xl p-3">
                <div className="text-[var(--accent2)] mb-1.5">{f.icon}</div>
                <div className="text-white text-xs font-semibold mb-0.5">{f.title}</div>
                <div className="text-white/40 text-[11px]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <img src="/owambe-logo-sm.png" alt="Owambe" className="h-6 w-auto" />
          <div className="text-xs text-[var(--muted)]">© 2026 Owambe.com · Lagos, Nigeria 🇳🇬</div>
          <div className="flex gap-4 text-xs text-[var(--muted)]">
            <Link href="/terms" className="hover:text-[var(--dark)]">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--dark)]">Privacy</Link>
            <Link href="/contact" className="hover:text-[var(--dark)]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
