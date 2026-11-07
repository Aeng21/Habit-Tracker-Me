import type { Page } from './lib/types';
import { dashboardPage } from './pages/dashboard';
import { keuanganPage } from './pages/keuangan';
import { targetPage } from './pages/target';

/**
 * Daftar halaman aplikasi (urutan = urutan di sidebar).
 * Menu baru: buat `src/pages/namaFitur.ts` lalu tambahkan di sini.
 */
export const pages: Page[] = [dashboardPage, keuanganPage, targetPage];
