import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3002),
  NODE_ENV: z.string().default('development'),
  DB_HOST: z.string().min(1, 'DB_HOST wajib diisi'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1, 'DB_USER wajib diisi'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME wajib diisi'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET minimal 16 karakter'),
  FRONTEND_URL: z.string().default('http://localhost:2002'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  console.error('Konfigurasi environment tidak valid:\n' + messages.join('\n'));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
