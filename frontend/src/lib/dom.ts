const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Wajib dipakai untuk setiap data pengguna yang dimasukkan ke innerHTML. */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

const ICONS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  wallet: '<path d="M3 7a2 2 0 012-2h13v4"/><path d="M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z"/><circle cx="16.5" cy="14.5" r="1" fill="currentColor"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  logout: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/>',
  flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
};

export function icon(name: string, cls = 'size-5'): string {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
}

export function toast(message: string, kind: 'ok' | 'err' = 'ok'): void {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className =
    'fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm shadow-lg fade-in ' +
    (kind === 'ok' ? 'bg-black text-white' : 'border border-black bg-white text-black');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/** Buka modal <dialog>. Ditutup lewat klik latar, tombol [data-close], atau Esc. */
export function openDialog(html: string): HTMLDialogElement {
  const dlg = document.createElement('dialog');
  dlg.className = 'w-[min(30rem,92vw)] rounded-2xl border border-neutral-200 bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-black/50';
  dlg.innerHTML = html;
  dlg.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === dlg || t.closest('[data-close]')) dlg.close();
  });
  dlg.addEventListener('close', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
  return dlg;
}

export function confirmDialog(message: string, okLabel = 'Hapus'): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = openDialog(`
      <div class="p-6">
        <p class="text-sm text-neutral-800">${esc(message)}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" data-close class="btn-outline">Batal</button>
          <button type="button" data-ok class="btn-primary">${esc(okLabel)}</button>
        </div>
      </div>`);
    let result = false;
    dlg.querySelector('[data-ok]')?.addEventListener('click', () => {
      result = true;
      dlg.close();
    });
    dlg.addEventListener('close', () => resolve(result));
  });
}

export function errorBox(message: string): string {
  return `<div class="card p-6 text-sm text-neutral-600">${esc(message)}</div>`;
}
