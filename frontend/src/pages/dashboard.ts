import { api, errMsg } from '../lib/api';
import { esc, icon, toast } from '../lib/dom';
import { dateLabel, longDateLabel, monthKey, monthLabel, rupiah, todayISO } from '../lib/format';
import type { Habit, Page, Summary } from '../lib/types';
import { state } from '../state';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function render(root: HTMLElement): void {
  const today = todayISO();
  const month = monthKey(today);
  let habits: Habit[] = [];

  root.innerHTML = `
    <h1 class="page-title">${greeting()}, ${esc(state.username)}</h1>
    <p class="page-sub">${longDateLabel(today)}</p>

    <div id="summary" class="mt-8 grid gap-4 sm:grid-cols-3"></div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="card">
        <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 class="text-sm font-semibold">Target hari ini</h2>
          <a href="#/target" class="text-xs text-neutral-500 underline-offset-4 hover:text-black hover:underline">Lihat semua</a>
        </div>
        <div id="habits"></div>
      </section>

      <section class="card">
        <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 class="text-sm font-semibold">Transaksi terbaru</h2>
          <a href="#/keuangan" class="text-xs text-neutral-500 underline-offset-4 hover:text-black hover:underline">Lihat semua</a>
        </div>
        <div id="recent"></div>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;
  const empty = (text: string): string => `<p class="px-5 py-10 text-center text-sm text-neutral-500">${text}</p>`;

  function drawHabits(): void {
    if (!habits.length) {
      $('#habits').innerHTML = empty('Belum ada target. Tambahkan di menu Target.');
      return;
    }
    const doneCount = habits.filter((h) => h.logs.includes(today)).length;
    $('#habits').innerHTML = `
      <p class="px-5 pt-4 text-xs text-neutral-500">${doneCount} dari ${habits.length} selesai</p>
      <ul class="divide-y divide-neutral-100">
        ${habits
          .map((h) => {
            const on = h.logs.includes(today);
            return `
              <li class="flex items-center gap-4 px-5 py-3.5">
                <button type="button" data-toggle="${h.id}" aria-pressed="${on}" aria-label="Tandai ${esc(h.title)}"
                  class="inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition ${
                    on ? 'border-black bg-black text-white' : 'border-neutral-300 hover:border-black'
                  }">${on ? icon('check', 'size-4') : ''}</button>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium ${on ? 'text-neutral-400 line-through' : ''}">${esc(h.title)}</p>
                  <p class="text-xs text-neutral-500">Streak ${h.streak} hari</p>
                </div>
              </li>`;
          })
          .join('')}
      </ul>`;
  }

  async function loadHabits(): Promise<void> {
    habits = await api.get<Habit[]>(`/habits?from=${today}&to=${today}&today=${today}`);
    drawHabits();
  }

  async function loadSummary(): Promise<void> {
    const s = await api.get<Summary>(`/transactions/summary?month=${month}`);

    const stat = (label: string, value: string, dark = false): string => `
      <div class="rounded-2xl p-5 ${dark ? 'bg-black text-white' : 'border border-neutral-200 bg-white'}">
        <p class="text-xs font-medium uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-neutral-500'}">${label}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">${value}</p>
      </div>`;
    $('#summary').innerHTML =
      stat(`Pemasukan · ${monthLabel(month)}`, rupiah(s.income)) +
      stat('Pengeluaran', rupiah(s.expense)) +
      stat('Saldo', rupiah(s.balance), true);

    $('#recent').innerHTML = s.recent.length
      ? `<ul class="divide-y divide-neutral-100">${s.recent
          .map((t) => {
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
                <p class="whitespace-nowrap text-sm font-semibold ${income ? '' : 'text-neutral-600'}">${income ? '+' : '−'}${rupiah(t.amount)}</p>
              </li>`;
          })
          .join('')}</ul>`
      : empty('Belum ada transaksi.');
  }

  root.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-toggle]');
    if (!btn) return;
    try {
      await api.post(`/habits/${btn.dataset.toggle}/toggle`, { date: today });
      await loadHabits();
    } catch (err) {
      toast(errMsg(err), 'err');
    }
  });

  const guard = (p: Promise<void>, id: string): void => {
    p.catch((e: unknown) => {
      $(id).innerHTML = empty(esc(errMsg(e)));
    });
  };
  guard(loadSummary(), '#recent');
  guard(loadHabits(), '#habits');
}

export const dashboardPage: Page = {
  path: '/',
  title: 'Beranda',
  icon: 'home',
  render,
};
