import { api, errMsg } from '../lib/api';
import { confirmDialog, esc, icon, openDialog, toast } from '../lib/dom';
import { addDays, dateLabel, dayShort, parseISO, todayISO } from '../lib/format';
import type { Habit, Page } from '../lib/types';

function render(root: HTMLElement): void {
  const today = todayISO();
  let offset = 0; // 0 = 7 hari terakhir, 1 = 7 hari sebelumnya, dst.
  let habits: Habit[] = [];

  const windowEnd = (): string => addDays(today, -7 * offset);
  const windowDays = (): string[] => {
    const end = windowEnd();
    return Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
  };

  root.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Target &amp; Kebiasaan</h1>
        <p class="page-sub">Tulis tujuanmu, lalu centang setiap hari kamu menjalankannya.</p>
      </div>
      <button type="button" data-action="add" class="btn-primary">${icon('plus', 'size-4')} Tambah target</button>
    </div>

    <div class="mt-8 flex items-center gap-2">
      <button type="button" data-action="prev" aria-label="7 hari sebelumnya" class="btn-icon border border-neutral-200">${icon('left', 'size-4')}</button>
      <span id="range" class="min-w-44 text-center text-sm font-medium"></span>
      <button type="button" data-action="next" aria-label="7 hari berikutnya" class="btn-icon border border-neutral-200">${icon('right', 'size-4')}</button>
    </div>

    <div id="list" class="mt-6 space-y-4"></div>`;

  const $ = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;

  function card(h: Habit, days: string[]): string {
    const done = new Set(h.logs);
    const count = days.filter((d) => done.has(d)).length;
    const pct = Math.min(100, Math.round((count / h.weekly_target) * 100));
    const reached = count >= h.weekly_target;

    const cells = days
      .map((d) => {
        const on = done.has(d);
        const future = d > today;
        const isToday = d === today;
        return `
          <div class="flex flex-col items-center gap-1.5">
            <span class="text-[11px] uppercase tracking-wide ${isToday ? 'font-semibold text-black' : 'text-neutral-400'}">${dayShort(d)}</span>
            <button type="button" data-action="toggle" data-id="${h.id}" data-date="${d}" ${future ? 'disabled' : ''}
              aria-pressed="${on}" aria-label="${dateLabel(d)}"
              class="inline-flex size-10 items-center justify-center rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-30
                ${on ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-500 hover:border-black'}
                ${isToday && !on ? 'ring-2 ring-neutral-200 ring-offset-1' : ''}">
              ${on ? icon('check', 'size-4') : parseISO(d).getDate()}
            </button>
          </div>`;
      })
      .join('');

    let deadline = '';
    if (h.target_date) {
      const overdue = h.target_date < today;
      deadline = `<span class="${overdue ? 'text-black' : ''}">Tenggat ${dateLabel(h.target_date)}${overdue ? ' (lewat)' : ''}</span>`;
    }

    return `
      <article class="card p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold tracking-tight">${esc(h.title)}</h3>
            ${h.goal ? `<p class="mt-0.5 text-sm text-neutral-500">${esc(h.goal)}</p>` : ''}
          </div>
          <div class="flex shrink-0">
            <button type="button" class="btn-icon" data-action="edit" data-id="${h.id}" aria-label="Ubah">${icon('pencil', 'size-4')}</button>
            <button type="button" class="btn-icon" data-action="del" data-id="${h.id}" aria-label="Hapus">${icon('trash', 'size-4')}</button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-7 gap-1 sm:gap-2">${cells}</div>

        <div class="mt-5">
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span class="${reached ? 'font-semibold text-black' : ''}">${count} / ${h.weekly_target}x dalam 7 hari${reached ? ' · tercapai' : ''}</span>
            <span class="inline-flex items-center gap-1">${icon('flame', 'size-3.5')} Streak ${h.streak} hari</span>
            ${deadline}
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div class="h-full rounded-full bg-black transition-all" style="width:${pct}%"></div>
          </div>
        </div>
      </article>`;
  }

  function draw(): void {
    const days = windowDays();
    $('#range').textContent = `${dateLabel(days[0]!)} – ${dateLabel(days[6]!)}`;
    root.querySelector<HTMLButtonElement>('[data-action="next"]')!.disabled = offset === 0;

    $('#list').innerHTML = habits.length
      ? habits.map((h) => card(h, days)).join('')
      : `<div class="card px-6 py-14 text-center">
           <p class="text-sm font-medium">Belum ada target</p>
           <p class="mt-1 text-sm text-neutral-500">Mulai dengan satu kebiasaan kecil, misalnya “Olahraga 30 menit”.</p>
         </div>`;
  }

  async function load(): Promise<void> {
    const days = windowDays();
    habits = await api.get<Habit[]>(`/habits?from=${days[0]}&to=${days[6]}&today=${today}`);
    draw();
  }

  async function reload(): Promise<void> {
    try {
      await load();
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  }

  function openForm(existing?: Habit): void {
    const weekly = existing?.weekly_target ?? 7;
    const options = Array.from({ length: 7 }, (_, i) => i + 1)
      .map((n) => `<option value="${n}" ${n === weekly ? 'selected' : ''}>${n}x per minggu${n === 7 ? ' (setiap hari)' : ''}</option>`)
      .join('');

    const dlg = openDialog(`
      <form class="p-6" novalidate>
        <h2 class="text-lg font-semibold tracking-tight">${existing ? 'Ubah target' : 'Tambah target'}</h2>
        <div class="mt-5 space-y-4">
          <div>
            <label class="label" for="h-title">Kebiasaan</label>
            <input id="h-title" name="title" maxlength="100" class="input" placeholder="Contoh: Olahraga 30 menit" value="${esc(existing?.title)}" required />
          </div>
          <div>
            <label class="label" for="h-goal">Tujuan (opsional)</label>
            <input id="h-goal" name="goal" maxlength="255" class="input" placeholder="Contoh: Badan lebih sehat" value="${esc(existing?.goal)}" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="h-weekly">Frekuensi</label>
              <select id="h-weekly" name="weekly_target" class="input">${options}</select>
            </div>
            <div>
              <label class="label" for="h-date">Tenggat (opsional)</label>
              <input id="h-date" name="target_date" type="date" class="input" value="${existing?.target_date ?? ''}" />
            </div>
          </div>
          <p data-error class="hidden rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm" role="alert"></p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" data-close class="btn-outline">Batal</button>
          <button type="submit" class="btn-primary">Simpan</button>
        </div>
      </form>`);

    const form = dlg.querySelector('form')!;
    const errorEl = dlg.querySelector<HTMLElement>('[data-error]')!;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {
        title: String(fd.get('title') ?? '').trim(),
        goal: String(fd.get('goal') ?? '').trim(),
        weekly_target: Number(fd.get('weekly_target')),
        target_date: String(fd.get('target_date') ?? ''),
      };
      try {
        if (existing) await api.put(`/habits/${existing.id}`, body);
        else await api.post('/habits', body);
        dlg.close();
        toast(existing ? 'Target diperbarui' : 'Target ditambahkan');
        await reload();
      } catch (err) {
        errorEl.textContent = errMsg(err);
        errorEl.classList.remove('hidden');
      }
    });
  }

  root.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    if (!btn || btn.disabled) return;
    const id = Number(btn.dataset.id);

    switch (btn.dataset.action) {
      case 'prev':
        offset++;
        await reload();
        break;
      case 'next':
        if (offset > 0) offset--;
        await reload();
        break;
      case 'add':
        openForm();
        break;
      case 'edit': {
        const h = habits.find((x) => x.id === id);
        if (h) openForm(h);
        break;
      }
      case 'del':
        if (await confirmDialog('Hapus target ini beserta seluruh riwayatnya?')) {
          try {
            await api.del(`/habits/${id}`);
            toast('Target dihapus');
            await reload();
          } catch (err) {
            toast(errMsg(err), 'err');
          }
        }
        break;
      case 'toggle':
        try {
          await api.post(`/habits/${id}/toggle`, { date: btn.dataset.date });
          await reload();
        } catch (err) {
          toast(errMsg(err), 'err');
        }
        break;
    }
  });

  draw();
  void reload();
}

export const targetPage: Page = {
  path: '/target',
  title: 'Target',
  icon: 'target',
  render,
};
