import type { NextFunction, Request, Response } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    return;
  }
  next();
}

/** Ambil id user dari session (hanya dipanggil setelah requireAuth). */
export function uid(req: Request): number {
  return req.session.userId as number;
}
