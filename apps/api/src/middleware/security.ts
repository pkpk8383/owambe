import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

// ─── REQUEST SIZE LIMIT ──────────────────────────────
export function requestSizeLimit(maxSizeMB = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxSizeMB * 1024 * 1024) {
      return next(new AppError(`Request too large (max ${maxSizeMB}MB)`, 413));
    }
    next();
  };
}

// ─── SQL INJECTION GUARD ─────────────────────────────
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION)\b)/gi,
  /(--|;|\/\*|\*\/)/g,
  /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
];

export function sqlInjectionGuard(req: Request, _res: Response, next: NextFunction) {
  const checkValue = (val: any): boolean => {
    if (typeof val === 'string') {
      return SQL_INJECTION_PATTERNS.some(p => p.test(val));
    }
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.query) || checkValue(req.body)) {
    logger.warn(`Potential SQL injection attempt from ${req.ip}: ${req.path}`);
    return next(new AppError('Invalid request parameters', 400));
  }
  next();
}

// ─── XSS SANITISER ───────────────────────────────────
function sanitiseString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitiseObject(obj: any): any {
  if (typeof obj === 'string') return sanitiseString(obj);
  if (Array.isArray(obj)) return obj.map(sanitiseObject);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitiseObject(v)])
    );
  }
  return obj;
}

export function xssSanitiser(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitiseObject(req.body);
  next();
}

// ─── IP LOGGER ───────────────────────────────────────
export function ipLogger(req: Request, _res: Response, next: NextFunction) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  (req as any).clientIp = ip;
  next();
}

// ─── MAINTENANCE MODE ────────────────────────────────
export function maintenanceMode(enabled: boolean) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (enabled) {
      return res.status(503).json({
        success: false,
        error: 'Owambe is undergoing scheduled maintenance. We\'ll be back shortly!',
        retryAfter: 3600,
      });
    }
    next();
  };
}

// ─── CORS ORIGIN VALIDATOR ───────────────────────────
export function validateOrigin(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      logger.warn(`Blocked CORS request from: ${origin}`);
      return res.status(403).json({ success: false, error: 'Origin not allowed' });
    }
    next();
  };
}

// ─── REQUEST ID ──────────────────────────────────────
import { v4 as uuid } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] as string || uuid();
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// ─── TIMEOUT ─────────────────────────────────────────
export function requestTimeout(ms = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`Request timeout: ${req.method} ${req.path}`);
        res.status(408).json({ success: false, error: 'Request timeout' });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
  };
}

// ─── AUDIT LOG ────────────────────────────────────────
export function auditLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const userId = (req as any).userId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 1000) {
      logger.warn({
        requestId: (req as any).requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        userId: userId || 'anonymous',
        ip: (req as any).clientIp,
      });
    }
  });

  next();
}

// ─── PAYSTACK WEBHOOK BODY PARSER ────────────────────
// Must be applied BEFORE express.json() on the webhook route
// to preserve raw body for signature verification
import express from 'express';

export const rawBodyParser = express.raw({
  type: 'application/json',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  },
});
