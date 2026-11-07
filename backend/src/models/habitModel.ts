import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/database.js';

export interface Habit {
  id: number;
  title: string;
  goal: string | null;
  weekly_target: number;
  target_date: string | null;
  created_at: string;
}

export interface HabitInput {
  title: string;
  goal: string | null;
  weekly_target: number;
  target_date: string | null;
}

const HabitModel = {
  async list(userId: number): Promise<Habit[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, title, goal, weekly_target, target_date, created_at
       FROM habits WHERE user_id = ? AND archived = 0 ORDER BY id`,
      [userId],
    );
    return rows as Habit[];
  },

  async logsBetween(userId: number, from: string, to: string): Promise<{ habit_id: number; log_date: string }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT habit_id, log_date FROM habit_logs
       WHERE user_id = ? AND log_date BETWEEN ? AND ?`,
      [userId, from, to],
    );
    return rows as { habit_id: number; log_date: string }[];
  },

  async owns(userId: number, id: number): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT 1 FROM habits WHERE id = ? AND user_id = ? AND archived = 0',
      [id, userId],
    );
    return rows.length > 0;
  },

  async create(userId: number, input: HabitInput): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO habits (user_id, title, goal, weekly_target, target_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, input.title, input.goal, input.weekly_target, input.target_date],
    );
    return result.insertId;
  },

  async update(userId: number, id: number, input: HabitInput): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE habits SET title = ?, goal = ?, weekly_target = ?, target_date = ?
       WHERE id = ? AND user_id = ?`,
      [input.title, input.goal, input.weekly_target, input.target_date, id, userId],
    );
    return result.affectedRows > 0;
  },

  async remove(userId: number, id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    return result.affectedRows > 0;
  },

  /** Balik status selesai pada tanggal tertentu. Mengembalikan status terbaru. */
  async toggle(userId: number, habitId: number, date: string): Promise<boolean> {
    const [del] = await db.query<ResultSetHeader>(
      'DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND log_date = ?',
      [habitId, userId, date],
    );
    if (del.affectedRows > 0) return false;
    await db.query('INSERT INTO habit_logs (habit_id, user_id, log_date) VALUES (?, ?, ?)', [habitId, userId, date]);
    return true;
  },
};

export default HabitModel;
