import { api, errMsg } from '../lib/api';
import { confirmDialog, esc, icon, openDialog, toast } from '../lib/dom';
import { dateLabel, monthKey, monthLabel, rupiah, shiftMonth, todayISO } from '../lib/format';
import type { Page, Transaction, TrxType } from '../lib/types';

const DEFAULT_CATEGORIES: Record<TrxType, string[]> = {
  income: ['Gaji', 'Bonus', 'Usaha', 'Hadiah', 'Lainnya'],
  expense: ['Makan', 'Transport', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
};

type Filter = 'all' | TrxType;

function render(root: HTMLElement): void {
  let month = monthKey(todayISO());
  let filter: Filter = 'all';
  let items: Transaction[] = [];
  let known: { type: TrxType; category: string }[] = [];

  root.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Keuangan</h1>
        <p class="page-sub">Catat pemasukan dan pengeluaranmu.</p>
      </div>
      <button type="button" data-action="add" class="btn-primary">${icon('plus', 'size-4')} Tambah transaksi</button>
    </div>

    <div class="mt-8 flex items-center gap-2">
      <button type="button" data-action="prev" aria-label="Bulan sebelumnya" class="btn-icon border border-neutral-200">${icon('left', 'size-4')}</button>
      <span id="monthLabel" class="min-w-40 text-center text-sm font-medium capitalize"></span>
      <button type="button" data-action="next" aria-label="Bulan berikutnya" class="btn-icon border border-neutral-200">${icon('right', 'size-4')}</button>
    </div>

    <div id="summary" class="mt-6 grid gap-4 sm:grid-cols-3"></div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 class="text-sm font-semibold">Transaksi</h2>
          <div id="filters" class="flex rounded-lg bg-neutral-100 p-1 text-xs font-medium"></div>
        </div>
        <div id="list"></div>
      </section>

      <section class="card h-fit p-5">
        <h2 class="text-sm font-semibold">Pengeluaran per kategori</h2>
        <div id="breakdown" class="mt-4 space-y-4"></div>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;

  function draw(): void {
    $('#monthLabel').textContent = monthLabel(month);

    const income = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    const stat = (label: string, value: string, dark = false): string => `
      <div class="rounded-2xl p-5 ${dark ? 'bg-black text-white' : 'border border-neutral-200 bg-white'}">
        <p class="text-xs font-medium uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-neutral-500'}">${label}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">${value}</p>
      </div>`;
    $('#summary').innerHTML =
      stat('Pemasukan', rupiah(income)) + stat('Pengeluaran', rupiah(expense)) + stat('Saldo bulan ini', rupiah(balance), true);

    const tab = (value: Filter, label: string): string =>
      `<button type="button" data-filter="${value}" class="rounded-md px-3 py-1.5 transition ${
        filter === value ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
      }">${label}</button>`;
    $('#filters').innerHTML = tab('all', 'Semua') + tab('income', 'Masuk') + tab('expense', 'Keluar');

    const shown = filter === 'all' ? items : items.filter((t) => t.type === filter);
    $('#list').innerHTML = shown.length
      ? `<ul class="divide-y divide-neutral-100">${shown.map(row).join('')}</ul>`
      : `<p class="px-5 py-12 text-center text-sm text-neutral-500">Belum ada transaksi di bulan ini.</p>`;

    const byCat = new Map<string, number>();
    for (const t of items) if (t.type === 'expense') byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    $('#breakdown').innerHTML = sorted.length
      ? sorted
          .map(([cat, total]) => {
            const pct = expense > 0 ? Math.round((total / expense) * 100) : 0;
            return `
              <div>
                <div class="flex items-baseline justify-between text-sm">
                  <span>${esc(cat)}</span>
                  <span class="text-neutral-500">${rupiah(total)}</span>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div class="h-full rounded-full bg-black" style="width:${pct}%"></div>
                </div>
              </div>`;
          })
          .join('')
      : `<p class="text-sm text-neutral-500">Belum ada pengeluaran.</p>`;
  }

  function row(t: Transaction): string {
    const income = t.type === 'income';
    return `
      <li class="flex items-center gap-4 px-5 py-3.5">
        <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
          income ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-700'
        }">${icon(income ? 'arrowDown' : 'arrowUp', 'size-4')}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">${esc(t.category)}</p>
          <p class="truncate text-xs text-neutral-500">${dateLabel(t.trx_date)}${t.note ? ' · ' + esc(t.note) : ''}</p>
        </div>
        <p class="whitespace-nowrap text-sm font-semibold ${income ? 'text-black' : 'text-neutral-600'}">
          ${income ? '+' : '−'}${rupiah(t.amount)}
        </p>
        <div class="flex shrink-0">
          <button type="button" class="btn-icon" data-action="edit" data-id="${t.id}" aria-label="Ubah">${icon('pencil', 'size-4')}</button>
          <button type="button" class="btn-icon" data-action="del" data-id="${t.id}" aria-label="Hapus">${icon('trash', 'size-4')}</button>
        </div>
      </li>`;
  }

  async function load(): Promise<void> {
    items = await api.get<Transaction[]>(`/transactions?month=${month}`);
    draw();
  }

  async function reload(): Promise<void> {
    try {
      await load();
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  }

  function categoryOptions(type: TrxType): string {
    const set = new Set<string>(DEFAULT_CATEGORIES[type]);
    for (const k of known) if (k.type === type) set.add(k.category);
    return [...set].map((c) => `<option value="${esc(c)}"></option>`).join('');
  }

  function openForm(existing?: Transaction): void {
    const t: Transaction = existing ?? {
      id: 0,
      type: 'expense',
      amount: 0,
      category: '',
      note: null,
      trx_date: todayISO(),
    };

    const radio = (value: TrxType, label: string): string => `
      <label class="flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium text-neutral-500 transition has-checked:bg-black has-checked:text-white">
        <input type="radio" name="type" value="${value}" class="sr-only" ${t.type === value ? 'checked' : ''} />${label}
      </label>`;

    const dlg = openDialog(`
      <form class="p-6" novalidate>
        <h2 class="text-lg font-semibold tracking-tight">${existing ? 'Ubah transaksi' : 'Tambah transaksi'}</h2>
        <div class="mt-5 space-y-4">
          <div class="flex gap-1 rounded-lg bg-neutral-100 p-1">${radio('expense', 'Pengeluaran')}${radio('income', 'Pemasukan')}</div>
          <div>
            <label class="label" for="f-amount">Nominal (Rp)</label>
            <input id="f-amount" name="amount" type="number" min="1" step="any" inputmode="decimal" class="input" value="${t.amount || ''}" required />
          </div>
          <div>
            <label class="label" for="f-category">Kategori</label>
            <input id="f-category" name="category" list="f-cats" maxlength="50" class="input" value="${esc(t.category)}" autocomplete="off" required />
            <datalist id="f-cats"></datalist>
          </div>
          <div>
            <label class="label" for="f-date">Tanggal</label>
            <input id="f-date" name="trx_date" type="date" class="input" value="${t.trx_date}" required />
          </div>
          <div>
            <label class="label" for="f-note">Catatan (opsional)</label>
            <input id="f-note" name="note" maxlength="255" class="input" value="${esc(t.note ?? '')}" />
          </div>
          <p data-error class="hidden rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm" role="alert"></p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" data-close class="btn-outline">Batal</button>
          <button type="submit" class="btn-primary">Simpan</button>
        </div>
      </form>`);

    const form = dlg.querySelector('form')!;
    const datalist = dlg.querySelector('datalist')!;
    const errorEl = dlg.querySelector<HTMLElement>('[data-error]')!;
    const currentType = (): TrxType => (form.elements.namedItem('type') as RadioNodeList).value as TrxType;

    const refreshCats = (): void => {
      datalist.innerHTML = categoryOptions(currentType());
    };
    refreshCats();
    form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', refreshCats));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {
        type: fd.get('type'),
        amount: Number(fd.get('amount')),
        category: String(fd.get('category') ?? '').trim(),
        trx_date: fd.get('trx_date'),
        note: String(fd.get('note') ?? '').trim(),
      };
      try {
        if (existing) await api.put(`/transactions/${existing.id}`, body);
        else await api.post('/transactions', body);
        dlg.close();
        toast(existing ? 'Transaksi diperbarui' : 'Transaksi disimpan');
        await refreshKnown();
        // Pindah ke bulan transaksi agar langsung terlihat.
        month = monthKey(String(body.trx_date));
        await reload();
      } catch (err) {
        errorEl.textContent = errMsg(err);
        errorEl.classList.remove('hidden');
      }
    });
  }

  async function refreshKnown(): Promise<void> {
    try {
      known = await api.get<{ type: TrxType; category: string }[]>('/transactions/categories');
    } catch {
      /* saran kategori bersifat opsional */
    }
  }

  root.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const filterBtn = target.closest<HTMLElement>('[data-filter]');
    if (filterBtn) {
      filter = filterBtn.dataset.filter as Filter;
      draw();
      return;
    }

    const btn = target.closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    switch (btn.dataset.action) {
      case 'prev':
        month = shiftMonth(month, -1);
        await reload();
        break;
      case 'next':
        month = shiftMonth(month, 1);
        await reload();
        break;
      case 'add':
        openForm();
        break;
      case 'edit': {
        const t = items.find((x) => x.id === id);
        if (t) openForm(t);
        break;
      }
      case 'del':
        if (await confirmDialog('Hapus transaksi ini?')) {
          try {
            await api.del(`/transactions/${id}`);
            toast('Transaksi dihapus');
            await reload();
          } catch (err) {
            toast(errMsg(err), 'err');
          }
        }
        break;
    }
  });

  draw();
  void refreshKnown();
  void reload();
}

export const keuanganPage: Page = {
  path: '/keuangan',
  title: 'Keuangan',
  icon: 'wallet',
  render,
};
