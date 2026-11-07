import type { Request, Response } from 'express';
import { z } from 'zod';
import { uid } from '../middleware/auth.js';
import TransactionModel from '../models/transactionModel.js';
import { DATE_RE, MONTH_RE, monthRange } from '../utils/date.js';

const monthSchema = z.object({
  month: z.string().regex(MONTH_RE, 'Format bulan harus YYYY-MM'),
});

const bodySchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Tipe harus income atau expense' }),
  amount: z.coerce
    .number({ message: 'Nominal harus berupa angka' })
    .positive('Nominal harus lebih dari 0')
    .max(9_999_999_999_999, 'Nominal terlalu besar'),
  category: z.string().trim().min(1, 'Kategori harus diisi').max(50, 'Kategori maksimal 50 karakter'),
  note: z
    .string()
    .trim()
    .max(255, 'Catatan maksimal 255 karakter')
    .optional()
    .transform((v) => (v ? v : null)),
  trx_date: z.string().regex(DATE_RE, 'Format tanggal harus YYYY-MM-DD'),
});

const idSchema = z.coerce.number().int().positive();

const TransactionController = {
  async list(req: Request, res: Response): Promise<void> {
    const { month } = monthSchema.parse(req.query);
    const { from, to } = monthRange(month);
    const data = await TransactionModel.listByRange(uid(req), from, to);
    res.json({ success: true, data });
  },

  async summary(req: Request, res: Response): Promise<void> {
    const { month } = monthSchema.parse(req.query);
    const { from, to } = monthRange(month);
    const userId = uid(req);
    const [totals, byCategory, recent] = await Promise.all([
      TransactionModel.totals(userId, from, to),
      TransactionModel.expenseByCategory(userId, from, to),
      TransactionModel.recent(userId, 5),
    ]);
    res.json({
      success: true,
      data: { ...totals, balance: totals.income - totals.expense, byCategory, recent },
    });
  },

  async categories(req: Request, res: Response): Promise<void> {
    const data = await TransactionModel.categories(uid(req));
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = bodySchema.parse(req.body);
    const id = await TransactionModel.create(uid(req), input);
    res.status(201).json({ success: true, message: 'Transaksi disimpan', data: { id } });
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = idSchema.parse(req.params.id);
    const input = bodySchema.parse(req.body);
    const ok = await TransactionModel.update(uid(req), id, input);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Transaksi diperbarui' });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const id = idSchema.parse(req.params.id);
    const ok = await TransactionModel.remove(uid(req), id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Transaksi dihapus' });
  },
};

export default TransactionController;
