import type { Me } from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    json = null;
  }

  if (res.status === 401 && !url.startsWith('/auth/')) {
    window.location.href = '/login.html';
    throw new ApiError('Sesi berakhir, silakan login kembali', 401);
  }
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? 'Server tidak dapat dihubungi', res.status);
  }
  return json.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};

export const auth = {
  me: () => api.get<Me>('/auth/me'),
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (username: string, password: string) => api.post('/auth/register', { username, password }),
  logout: () => api.post('/auth/logout'),
};

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}
