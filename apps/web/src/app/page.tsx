import Link from 'next/link';
import { Sparkles, Star, Zap, Shield, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <img
              src="/owambe-logo-nav.png"
              alt="Owambe"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/vendors"
              className="px-3 py-2 text-sm text-[var(--mid)] hover:text-[var(--dark)] rounded-lg hover:bg-[var(--bg)] transition-colors"
            >
              Browse Vendors
            </Link>
            <Link
              href="/plan"
              className="px-3 py-2 text-sm font-semibold text-[var(--accent)] rounded-lg hover:bg-[var(--pill)] transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={13} /> Plan with AI
            </Link>
          </div>
          <div className="flex gap-2 ml-2">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[#F0EAFA] to-[var(--bg)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)] opacity-[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--pill)] text-[var(--accent)] text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-[rgba(108,43,217,0.15)]">
            <Sparkles size={13} /> Launching in Lagos, Nigeria 🇳🇬
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--dark)] leading-[1.1] mb-6 max-w-3xl mx-auto">
            Nigeria&apos;s smartest event planning platform
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-lg mx-auto mb-10 leading-relaxed">
            AI plans your entire event in minutes. Book verified venues, catering, photography, makeup, AV and more — all within your budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/plan"
              className="btn-accent px-8 py-3.5 text-base flex items-center gap-2 shadow-lg shadow-[rgba(201,162,39,0.25)] hover:shadow-xl hover:shadow-[rgba(201,162,39,0.3)] transition-all"
            >
              <Sparkles size={16} /> Plan My Event Free
            </Link>
            <Link href="/vendors" className="btn-secondary px-8 py-3.5 text-base flex items-center gap-2">
              Browse Vendors <ArrowRight size={15} />
            </Link>
          </div>
          <p className="text-xs text-[var(--muted)] mt-5">No account needed to start · 200+ verified vendors in Lagos</p>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--dark)] py-12">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
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

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Plan your event in 4 steps</h2>
        <p className="text-center text-[var(--muted)] text-sm mb-12">From idea to booked vendors in under 10 minutes</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { n: 1, icon: '💬', title: 'Tell the AI', desc: 'Describe your event, location, date and budget in plain English' },
            { n: 2, icon: '🤖', title: 'AI finds vendors', desc: 'We match verified vendors near you within your budget' },
            { n: 3, icon: '📋', title: 'Pick your plan', desc: 'Choose from 3 packages — budget, standard, or premium' },
            { n: 4, icon: '✅', title: 'Book & relax', desc: 'Pay deposit, we hold it in escrow until your event is done' },
          ].map(step => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] border border-[rgba(108,43,217,0.15)] flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
                {step.icon}
              </div>
              <div className="font-bold text-sm mb-1.5 text-[var(--dark)]">{step.title}</div>
              <div className="text-xs text-[var(--muted)] leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vendor categories ──────────────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Every vendor you need</h2>
          <p className="text-center text-sm text-[var(--muted)] mb-10">All 8 categories, all verified, all in Lagos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <div className="card p-4 hover:shadow-md hover:border-[rgba(108,43,217,0.3)] hover:-translate-y-0.5 transition-all cursor-pointer text-center group">
                  <div className="text-3xl mb-2.5">{cat.emoji}</div>
                  <div className="font-semibold text-sm mb-0.5 group-hover:text-[var(--accent)] transition-colors">{cat.name}</div>
                  <div className="text-xs text-[var(--muted)]">{cat.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── For vendors CTA ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="bg-[var(--dark)] rounded-3xl p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="text-[var(--accent2)] font-semibold text-xs uppercase tracking-widest mb-3">For Vendors & Businesses</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">List your business free. Earn more.</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Zero upfront cost. 0% commission for your first 90 days. Guaranteed payment via escrow. We bring the clients to you.
            </p>
            <Link href="/vendor/settings" className="btn-accent inline-flex items-center gap-2 shadow-lg shadow-[rgba(201,162,39,0.2)]">
              List My Business Free <Zap size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 relative">
            {[
              { icon: <Shield size={18} />, title: 'Guaranteed payment', desc: 'Escrow protects every booking' },
              { icon: <Users size={18} />, title: 'Qualified leads', desc: 'AI sends you matched clients' },
              { icon: <Star size={18} />, title: 'Build reputation', desc: 'Verified reviews from real clients' },
              { icon: <Sparkles size={18} />, title: 'AI profile builder', desc: 'We write your listing for you' },
            ].map(f => (
              <div key={f.title} className="bg-white/[0.06] rounded-xl p-3.5 border border-white/[0.06]">
                <div className="text-[var(--accent2)] mb-2">{f.icon}</div>
                <div className="text-white text-xs font-semibold mb-0.5">{f.title}</div>
                <div className="text-white/40 text-[11px] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-8 bg-white">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/owambe-logo-nav.png" alt="Owambe" className="h-8 w-auto" />
          <div className="text-xs text-[var(--muted)]">© 2026 Owambe.com · Lagos, Nigeria 🇳🇬</div>
          <div className="flex gap-5 text-xs text-[var(--muted)]">
            <Link href="/terms" className="hover:text-[var(--dark)] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--dark)] transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-[var(--dark)] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
