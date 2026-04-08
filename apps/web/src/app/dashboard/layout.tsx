'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { cn, initials } from '@/lib/utils';
import {
  Zap, Calendar, Plus, Globe, Scan, Clock, Mail,
  Mic, MapPin, Trophy, Smartphone, BarChart2, CreditCard,
  LogOut, Search, Bell, LayoutTemplate, FileSignature, Link2
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: Zap, label: 'Dashboard' },
      { href: '/dashboard/events', icon: Calendar, label: 'My Events', badge: null },
      { href: '/dashboard/events/new', icon: Plus, label: 'Create Event' },
    ]
  },
  {
    label: 'Attendee Tools',
    items: [
      { href: '/dashboard/registration', icon: Globe, label: 'Reg. Page' },
      { href: '/dashboard/checkin', icon: Scan, label: 'Check-in Scanner' },
      { href: '/dashboard/waitlist', icon: Clock, label: 'Waitlist & Promos' },
    ]
  },
  {
    label: 'Marketing & Content',
    items: [
      { href: '/dashboard/emails', icon: Mail, label: 'Email Campaigns' },
      { href: '/dashboard/speakers', icon: Mic, label: 'Speaker Management' },
    ]
  },
  {
    label: 'Logistics',
    items: [
      { href: '/dashboard/venue', icon: MapPin, label: 'Venue & Map' },
      { href: '/dashboard/sponsors', icon: Trophy, label: 'Sponsors' },
    ]
  },
  {
    label: 'Other',
    items: [
      { href: '/dashboard/mobile', icon: Smartphone, label: 'Attendee App' },
      { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
      { href: '/dashboard/contracts', icon: FileSignature, label: 'Contracts & E-Sign' },
      { href: '/dashboard/crm', icon: Link2, label: 'CRM Sync', badge: 'Scale' },
      { href: '/dashboard/instalments', icon: CreditCard, label: 'Instalment Plans' },
      { href: '/dashboard/whitelabel', icon: LayoutTemplate, label: 'White-label Portal', badge: 'Scale' },
      { href: '/dashboard/pricing', icon: CreditCard, label: 'Pricing' },
    ]
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* SIDEBAR */}
      <aside className="w-[212px] bg-[var(--dark)] flex flex-col flex-shrink-0 overflow-y-auto no-scrollbar">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/[0.08] flex-shrink-0">
          <Link href="/dashboard">
            <div className="font-bold text-[19px] text-white tracking-tight">
              event<span className="text-[var(--accent2)]">flow</span>
            </div>
            <div className="text-[9px] text-white/30 uppercase tracking-[2px] mt-0.5">
              Owambe Platform
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="text-[9px] uppercase tracking-[2px] text-white/20 px-2 py-2 mt-2">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nav-item mb-0.5', isActive && 'active')}
                  >
                    <item.icon size={15} className="shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[var(--accent2)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-2.5 py-3 border-t border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/[0.06] transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent2)] to-[var(--accent3)] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {initials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-white/65 font-medium truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[9px] text-[var(--accent2)] font-semibold tracking-wide">
                {user.profile?.plan || 'STARTER'} PLAN
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-white/40 text-sm hover:text-white hover:bg-white/[0.06] transition-colors mt-1"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const pathname = usePathname();

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/events': 'My Events',
    '/dashboard/events/new': 'Create Event',
    '/dashboard/registration': 'Registration Page',
    '/dashboard/checkin': 'Check-in Scanner',
    '/dashboard/waitlist': 'Waitlist & Promos',
    '/dashboard/emails': 'Email Campaigns',
    '/dashboard/speakers': 'Speaker Management',
    '/dashboard/venue': 'Venue & Map',
    '/dashboard/sponsors': 'Sponsors',
    '/dashboard/mobile': 'Attendee App',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/pricing': 'Pricing',
  };

  const title = titles[pathname] ||
    (pathname.includes('/events/') ? 'Event Details' : 'Owambe');

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] h-[52px] px-6 flex items-center gap-3 flex-shrink-0 sticky top-0 z-10">
      <h1 className="font-bold text-[16px] text-[var(--dark)] flex-1">{title}</h1>
      <button className="flex items-center gap-2 text-[var(--mid)] border border-[var(--border)] bg-transparent text-xs font-semibold px-3 py-1.5 rounded-md hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
        <Search size={13} />
        Search
      </button>
      <button className="relative text-[var(--muted)] hover:text-[var(--dark)] transition-colors">
        <Bell size={18} />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent2)] rounded-full" />
      </button>
      <Link
        href="/dashboard/events/new"
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
      >
        <Plus size={13} />
        New Event
      </Link>
    </header>
  );
}
