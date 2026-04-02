import Link from 'next/link';

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <Link href="/" className="font-bold text-[18px] text-[var(--dark)]">
            event<span className="text-[var(--accent2)]">flow</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link href="/plan" className="btn-secondary text-xs px-3 py-1.5">Plan with AI ✨</Link>
            <Link href="/login" className="btn-primary text-xs px-3 py-1.5">Sign in</Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
