import axios from 'axios';
import { headers } from 'next/headers';

const API_URL = process.env.OWAMBE_API_URL || 'https://api.owambe.com/api';

export interface TenantBranding {
  id: string;
  subdomain: string;
  customDomain: string | null;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  fontFamily: string;
  footerText: string | null;
  socialLinks: Record<string, string> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage: string | null;
  allowPublicReg: boolean;
  requireApproval: boolean;
  customCss: string | null;
  planner: {
    id: string;
    companyName: string | null;
    plan: string;
  };
}

// Resolve tenant from request headers (injected by Vercel edge middleware)
export async function getTenant(): Promise<TenantBranding | null> {
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';
    const subdomain = headersList.get('x-owambe-subdomain') || extractSubdomain(host);
    const customDomain = headersList.get('x-owambe-custom-domain') || null;

    if (!subdomain && !customDomain) return null;

    const params = customDomain
      ? { domain: customDomain }
      : { subdomain };

    const res = await axios.get(`${API_URL}/tenants/resolve`, {
      params,
      timeout: 5000,
    });

    return res.data.tenant as TenantBranding;
  } catch {
    return null;
  }
}

function extractSubdomain(host: string): string | null {
  // host = "techfest.owambe.com" → "techfest"
  // host = "localhost:3001" → null
  const parts = host.split('.');
  if (parts.length >= 3 && parts[1] === 'owambe') {
    return parts[0];
  }
  return null;
}

// Build CSS variables string from tenant branding
export function buildCssVars(tenant: TenantBranding): string {
  return `
    --brand-primary: ${tenant.primaryColor};
    --brand-accent: ${tenant.accentColor};
    --brand-bg: ${tenant.bgColor};
    --brand-font: ${tenant.fontFamily}, Inter, system-ui, sans-serif;
    --brand-primary-light: ${hexToRgba(tenant.primaryColor, 0.08)};
    --brand-accent-light: ${hexToRgba(tenant.accentColor, 0.10)};
  `.trim();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Fetch events for a tenant
export async function getTenantEvents(subdomain: string, params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const res = await axios.get(`${API_URL}/tenants/${subdomain}/events`, {
      params: { ...params, limit: params?.limit || 12 },
      timeout: 8000,
    });
    return res.data;
  } catch {
    return { events: [], total: 0 };
  }
}
