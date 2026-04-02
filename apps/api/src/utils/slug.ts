import { prisma } from '../database/client';
import crypto from 'crypto';

export async function generateSlug(name: string, table: 'events' | 'vendors'): Promise<string> {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  let slug = base;
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    let exists = false;

    if (table === 'events') {
      exists = !!(await prisma.event.findFirst({ where: { slug: candidate } }));
    } else {
      exists = !!(await prisma.vendor.findFirst({ where: { slug: candidate } }));
    }

    if (!exists) return candidate;
    counter++;
  }
}

export function generateQrCode(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

export function generateReference(prefix: string = 'OWB'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
