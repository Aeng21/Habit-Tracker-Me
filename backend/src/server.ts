import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';

import { env, isProd } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();

// Semua aset frontend lokal (offline), jadi CSP default helmet sudah cukup.
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

app.use(
  session({
    store: sessionStore,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// API
app.use('/api/auth', authRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/habits', requireAuth, habitRoutes);

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Setelah `npm run build`, backend ikut menyajikan frontend (satu server saja).
const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '../../frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: err.issues.map((i) => i.message).join(', ') });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    ...(!isProd && err instanceof Error ? { error: err.message } : {}),
  });
});

app.listen(env.PORT, () => {
  console.log(`Monolife backend berjalan di http://localhost:${env.PORT}`);
});
