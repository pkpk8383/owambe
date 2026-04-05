import Link from 'next/link';
import { getTenant } from '../lib/tenant';

export default async function NotFound() {
  const tenant = await getTenant();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 28 }}>
        This page doesn't exist on {tenant?.name || 'this portal'}.
      </p>
      <Link href="/" className="btn-primary">← Back to events</Link>
    </div>
  );
}
