import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/database.js';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  trx_date: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  trx_date: string;
}

const COLUMNS = 'id, type, amount, category, note, trx_date';

const TransactionModel = {
  async listByRange(userId: number, from: string, to: string): Promise<Transaction[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM transactions
       WHERE user_id = ? AND trx_date BETWEEN ? AND ?
       ORDER BY trx_date DESC, id DESC`,
      [userId, from, to],
    );
    return rows as Transaction[];
  },

  async recent(userId: number, limit: number): Promise<Transaction[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM transactions WHERE user_id = ?
       ORDER BY trx_date DESC, id DESC LIMIT ?`,
      [userId, limit],
    );
    return rows as Transaction[];
  },

  async totals(userId: number, from: string, to: string): Promise<{ income: number; expense: number }> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM transactions WHERE user_id = ? AND trx_date BETWEEN ? AND ?`,
      [userId, from, to],
    );
    const row = rows[0] as { income: number; expense: number };
    return { income: Number(row.income), expense: Number(row.expense) };
  },

  async expenseByCategory(userId: number, from: string, to: string): Promise<{ category: string; total: number }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense' AND trx_date BETWEEN ? AND ?
       GROUP BY category ORDER BY total DESC`,
      [userId, from, to],
    );
    return rows.map((r) => ({ category: r.category as string, total: Number(r.total) }));
  },

  async categories(userId: number): Promise<{ type: TransactionType; category: string }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT DISTINCT type, category FROM transactions WHERE user_id = ? ORDER BY category`,
      [userId],
    );
    return rows as { type: TransactionType; category: string }[];
  },

  async create(userId: number, input: TransactionInput): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO transactions (user_id, type, amount, category, note, trx_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, input.type, input.amount, input.category, input.note, input.trx_date],
    );
    return result.insertId;
  },

  async update(userId: number, id: number, input: TransactionInput): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE transactions SET type = ?, amount = ?, category = ?, note = ?, trx_date = ?
       WHERE id = ? AND user_id = ?`,
      [input.type, input.amount, input.category, input.note, input.trx_date, id, userId],
    );
    return result.affectedRows > 0;
  },

  async remove(userId: number, id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    return result.affectedRows > 0;
  },
};

export default TransactionModel;
