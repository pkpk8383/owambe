import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'Owambe — Nigeria\'s Event Planning Platform', template: '%s | Owambe' },
  description: 'AI-powered event planning for Nigeria. Find venues, vendors, and manage events end-to-end on owambe.com',
  keywords: ['event planning Nigeria', 'Lagos events', 'event vendors Nigeria', 'wedding venues Lagos'],
  openGraph: {
    title: 'Owambe — Nigeria\'s Event Planning Platform',
    description: 'AI-powered event planning. Book verified vendors. Manage everything in one place.',
    url: 'https://owambe.com',
    siteName: 'Owambe',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body bg-surface text-dark antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1A1612', color: '#fff', borderRadius: '9px', fontSize: '14px' },
              success: { iconTheme: { primary: '#2D6A4F', secondary: '#fff' } },
              error: { iconTheme: { primary: '#E63946', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
