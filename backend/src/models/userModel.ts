import bcrypt from 'bcrypt';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/database.js';

export interface User {
  id: number;
  username: string;
  password: string;
}

const UserModel = {
  async findByUsername(username: string): Promise<User | undefined> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username],
    );
    return rows[0] as User | undefined;
  },

  async create(username: string, password: string): Promise<number> {
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed],
    );
    return result.insertId;
  },

  verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },
};

export default UserModel;
