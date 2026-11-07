import type { Request, Response } from 'express';
import { z } from 'zod';
import UserModel from '../models/userModel.js';

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter')
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

function startSession(req: Request, userId: number, username: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // regenerate -> cegah session fixation
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.username = username;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, password } = registerSchema.parse(req.body);

    if (await UserModel.findByUsername(username)) {
      res.status(409).json({ success: false, message: 'Username sudah dipakai' });
      return;
    }

    const id = await UserModel.create(username, password);
    await startSession(req, id, username);
    res.status(201).json({ success: true, message: 'Akun berhasil dibuat', data: { username } });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = loginSchema.parse(req.body);

    const user = await UserModel.findByUsername(username);
    const valid = user ? await UserModel.verifyPassword(password, user.password) : false;
    if (!user || !valid) {
      res.status(401).json({ success: false, message: 'Username atau password salah' });
      return;
    }

    await startSession(req, user.id, user.username);
    res.json({ success: true, message: 'Login berhasil', data: { username: user.username } });
  },

  logout(req: Request, res: Response): void {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ success: false, message: 'Gagal logout' });
        return;
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logout berhasil' });
    });
  },

  me(req: Request, res: Response): void {
    if (!req.session.userId) {
      res.json({ success: true, data: { loggedIn: false } });
      return;
    }
    res.json({ success: true, data: { loggedIn: true, username: req.session.username } });
  },
};

export default AuthController;
