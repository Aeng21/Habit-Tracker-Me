import type { Request, Response } from 'express';
import { z } from 'zod';
import { uid } from '../middleware/auth.js';
import HabitModel from '../models/habitModel.js';
import { addDays, DATE_RE } from '../utils/date.js';

const dateSchema = z.string().regex(DATE_RE, 'Format tanggal harus YYYY-MM-DD');

const listQuery = z.object({ from: dateSchema, to: dateSchema, today: dateSchema });

const bodySchema = z.object({
  title: z.string().trim().min(1, 'Nama target harus diisi').max(100, 'Nama maksimal 100 karakter'),
  goal: z
    .string()
    .trim()
    .max(255, 'Tujuan maksimal 255 karakter')
    .optional()
    .transform((v) => (v ? v : null)),
  weekly_target: z.coerce.number().int().min(1, 'Minimal 1x per minggu').max(7, 'Maksimal 7x per minggu'),
  target_date: z
    .union([dateSchema, z.literal(''), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
});

const toggleSchema = z.object({ date: dateSchema });
const idSchema = z.coerce.number().int().positive();

/** Hitung streak: hari berurutan sampai hari ini (atau kemarin jika hari ini belum dicentang). */
function computeStreak(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function groupBy<T>(rows: T[], key: (r: T) => number, value: (r: T) => string): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const r of rows) {
    const arr = map.get(key(r)) ?? [];
    arr.push(value(r));
    map.set(key(r), arr);
  }
  return map;
}

const HabitController = {
  async list(req: Request, res: Response): Promise<void> {
    const { from, to, today } = listQuery.parse(req.query);
    const userId = uid(req);

    const [habits, rangeLogs, streakLogs] = await Promise.all([
      HabitModel.list(userId),
      HabitModel.logsBetween(userId, from, to),
      HabitModel.logsBetween(userId, addDays(today, -400), today),
    ]);

    const inRange = groupBy(rangeLogs, (l) => l.habit_id, (l) => l.log_date);
    const forStreak = groupBy(streakLogs, (l) => l.habit_id, (l) => l.log_date);

    const data = habits.map((h) => ({
      ...h,
      logs: inRange.get(h.id) ?? [],
      streak: computeStreak(new Set(forStreak.get(h.id) ?? []), today),
    }));
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = bodySchema.parse(req.body);
    const id = await HabitModel.create(uid(req), input);
    res.status(201).json({ success: true, message: 'Target ditambahkan', data: { id } });
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = idSchema.parse(req.params.id);
    const input = bodySchema.parse(req.body);
    const ok = await HabitModel.update(uid(req), id, input);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Target diperbarui' });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const id = idSchema.parse(req.params.id);
    const ok = await HabitModel.remove(uid(req), id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Target dihapus' });
  },

  async toggle(req: Request, res: Response): Promise<void> {
    const id = idSchema.parse(req.params.id);
    const { date } = toggleSchema.parse(req.body);
    const userId = uid(req);
    if (!(await HabitModel.owns(userId, id))) {
      res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
      return;
    }
    const done = await HabitModel.toggle(userId, id, date);
    res.json({ success: true, data: { done } });
  },
};

export default HabitController;
