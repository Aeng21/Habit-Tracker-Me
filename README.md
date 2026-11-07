# Monolife

Website pribadi untuk mengelola **keuangan** dan **target/kebiasaan**. Tampilan hitam-putih dengan abu sebagai pelengkap.
Dirancang untuk dikembangkan jangka panjang.

**Stack:** TypeScript · Node.js + Express 5 · MySQL · Vite · HTML + Tailwind CSS v4 (dibundel lokal, tanpa CDN → offline).

## Menjalankan

1. Jalankan MySQL (XAMPP/Laragon), lalu impor skema:
   ```
   mysql -u root < database.sql
   ```
2. Salin `backend/.env.example` menjadi `backend/.env`, isi kredensial MySQL dan `SESSION_SECRET`.
3. Install dan jalankan:
   ```
   npm run install:all
   npm run dev
   ```
4. Buka http://localhost:2002 lalu daftar akun.

Port: frontend `2002` (proxy `/api` ke backend), backend `3002`.

### Produksi / satu server
```
npm run build   # build frontend ke frontend/dist
npm start       # backend ikut menyajikan frontend di http://localhost:3002
```

## Struktur

```
backend/src
  config/       env (zod) & pool MySQL
  middleware/   requireAuth
  models/       query SQL per entitas
  controllers/  validasi (zod) + logika
  routes/       pemetaan endpoint
frontend/src
  pages/        satu file per menu (dashboard, keuangan, target)
  routes.ts     daftar halaman -> otomatis jadi menu sidebar
  router.ts     hash router    layout.ts  sidebar & shell
  lib/          api, format, dom helper, types
```

## Menambah menu baru

1. Backend: tambah `model`, `controller`, `route`, lalu daftarkan di `server.ts` dengan `requireAuth`.
2. Frontend: buat `src/pages/fitur.ts` yang mengekspor objek `Page`, lalu tambahkan ke array di `src/routes.ts`.
3. Tabel baru → tambahkan ke `database.sql`.

## API ringkas

| Endpoint | Fungsi |
| --- | --- |
| `POST /api/auth/register · login · logout`, `GET /api/auth/me` | autentikasi (session di MySQL) |
| `GET /api/transactions?month=YYYY-MM` | daftar transaksi per bulan |
| `GET /api/transactions/summary?month=` | total, per kategori, transaksi terbaru |
| `POST/PUT/DELETE /api/transactions[/:id]` | tulis / ubah / hapus transaksi |
| `GET /api/habits?from=&to=&today=` | target + centang + streak |
| `POST/PUT/DELETE /api/habits[/:id]` | kelola target |
| `POST /api/habits/:id/toggle` `{date}` | centang / batalkan centang hari |
