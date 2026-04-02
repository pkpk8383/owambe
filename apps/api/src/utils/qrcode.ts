import crypto from 'crypto';

export function generateQrCode(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}
