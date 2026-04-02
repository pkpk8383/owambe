import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

// ─── CLASS MERGE HELPER ──────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CURRENCY FORMATTER ──────────────────────────────
export function formatNGN(amount: number | string, compact = false): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₦0';

  if (compact) {
    if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `₦${(num / 1_000).toFixed(0)}K`;
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── DATE FORMATTERS ─────────────────────────────────
export function formatDate(date: string | Date, fmt = 'PPP'): string {
  return format(new Date(date), fmt);
}

export function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, d MMM yyyy');
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ─── STRING HELPERS ──────────────────────────────────
export function truncate(str: string, len: number): string {
  return str.length > len ? `${str.slice(0, len)}...` : str;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── STATUS HELPERS ──────────────────────────────────
export const EVENT_STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     className: 'badge-draft',    dot: 'bg-gray-400' },
  PUBLISHED: { label: 'Published', className: 'badge-upcoming', dot: 'bg-yellow-500' },
  LIVE:      { label: 'Live',      className: 'badge-live',     dot: 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]' },
  ENDED:     { label: 'Ended',     className: 'badge-ended',    dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', className: 'badge-cancelled',dot: 'bg-red-400' },
};

export const VENDOR_CATEGORY_LABELS: Record<string, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering & F&B',
  AV_PRODUCTION: 'AV & Production',
  PHOTOGRAPHY_VIDEO: 'Photography & Video',
  DECOR_FLORALS: 'Décor & Florals',
  ENTERTAINMENT: 'Entertainment',
  MAKEUP_ARTIST: 'Makeup Artist',
  SPEAKER: 'Speaker',
};

export const VENDOR_CATEGORY_EMOJIS: Record<string, string> = {
  VENUE: '🏛',
  CATERING: '🍽',
  AV_PRODUCTION: '🎛',
  PHOTOGRAPHY_VIDEO: '📸',
  DECOR_FLORALS: '💐',
  ENTERTAINMENT: '🎶',
  MAKEUP_ARTIST: '💄',
  SPEAKER: '🎤',
};

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const NIGERIAN_CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Kaduna',
  'Enugu', 'Benin City', 'Owerri', 'Warri', 'Calabar', 'Abeokuta',
  'Ilorin', 'Lekki', 'Victoria Island', 'Ikeja', 'Surulere',
];

// ─── FILL RATE COLOR ─────────────────────────────────
export function fillRateColor(pct: number): string {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  return 'text-red-500';
}

// ─── ONBOARDING PROGRESS ─────────────────────────────
export function speakerProgress(checklist: Record<string, boolean>): number {
  const keys = Object.keys(checklist);
  const done = keys.filter(k => checklist[k]).length;
  return Math.round((done / keys.length) * 100);
}
