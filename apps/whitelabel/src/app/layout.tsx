import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { getTenant, buildCssVars } from '../lib/tenant';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) {
    return {
      title: 'Event Portal — Powered by Owambe',
      description: 'Discover and register for events.',
    };
  }
  return {
    title: { default: tenant.metaTitle || tenant.name, template: `%s | ${tenant.name}` },
    description: tenant.metaDescription || tenant.tagline || `Events by ${tenant.name}`,
    openGraph: {
      title: tenant.metaTitle || tenant.name,
      description: tenant.metaDescription || tenant.tagline || '',
      images: tenant.metaImage ? [tenant.metaImage] : [],
      siteName: tenant.name,
    },
    icons: {
      icon: tenant.faviconUrl || '/favicon.ico',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();

  const cssVars = tenant ? buildCssVars(tenant) : `
    --brand-primary: #2D6A4F;
    --brand-accent: #E76F2A;
    --brand-bg: #FDFAF4;
    --brand-font: Inter, system-ui, sans-serif;
    --brand-primary-light: rgba(45,106,79,0.08);
    --brand-accent-light: rgba(231,111,42,0.10);
  `;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `:root { ${cssVars} } ${tenant?.customCss || ''}`
        }} />
        {tenant?.fontFamily && tenant.fontFamily !== 'Inter' && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${tenant.fontFamily.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`}
            rel="stylesheet"
          />
        )}
      </head>
      <body style={{ fontFamily: 'var(--brand-font)', background: tenant?.bgColor || '#FDFAF4' }}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
