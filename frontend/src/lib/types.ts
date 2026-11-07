export type TrxType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TrxType;
  amount: number;
  category: string;
  note: string | null;
  trx_date: string;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category: string; total: number }[];
  recent: Transaction[];
}

export interface Habit {
  id: number;
  title: string;
  goal: string | null;
  weekly_target: number;
  target_date: string | null;
  logs: string[];
  streak: number;
}

export interface Me {
  loggedIn: boolean;
  username?: string;
}

/**
 * Satu halaman di aplikasi. Untuk menambah menu baru cukup buat file page
 * lalu daftarkan di `src/routes.ts`; sidebar & router otomatis menyesuaikan.
 */
export interface Page {
  path: string;
  title: string;
  icon: string;
  render(root: HTMLElement): void | Promise<void>;
}
