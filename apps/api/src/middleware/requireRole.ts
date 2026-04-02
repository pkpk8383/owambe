import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    if (!roles.includes(userRole)) {
      return next(new AppError(`Access restricted to: ${roles.join(', ')}`, 403));
    }
    next();
  };
}
