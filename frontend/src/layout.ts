import { auth } from './lib/api';
import { esc, icon } from './lib/dom';
import { pages } from './routes';

export interface Shell {
  view: HTMLElement;
  setActive(path: string): void;
}

export function mountShell(app: HTMLElement, username: string): Shell {
  const navItems = pages
    .map(
      (p) => `
      <a href="#${p.path}" data-nav="${p.path}"
         class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-white">
        ${icon(p.icon, 'size-[18px]')}<span>${esc(p.title)}</span>
      </a>`,
    )
    .join('');

  app.innerHTML = `
    <div class="lg:flex">
      <div id="overlay" class="fixed inset-0 z-30 hidden bg-black/50 lg:hidden"></div>

      <aside id="sidebar"
        class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-black px-4 py-6 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0">
        <div class="flex items-center gap-3 px-2">
          <span class="inline-flex size-8 items-center justify-center rounded-lg bg-white">
            <span class="size-3 rounded-full bg-black"></span>
          </span>
          <span class="text-base font-semibold tracking-tight">Monolife</span>
        </div>

        <p class="mt-8 px-3 text-[11px] font-medium uppercase tracking-widest text-neutral-600">Menu</p>
        <nav class="mt-2 flex flex-col gap-1">${navItems}</nav>

        <div class="mt-auto border-t border-neutral-800 pt-4">
          <div class="flex items-center gap-3 px-2">
            <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold uppercase">
              ${esc(username.slice(0, 1))}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">${esc(username)}</p>
              <p class="text-xs text-neutral-500">Akun pribadi</p>
            </div>
            <button id="logout" type="button" title="Keluar" aria-label="Keluar"
              class="inline-flex size-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-900 hover:text-white">
              ${icon('logout', 'size-[18px]')}
            </button>
          </div>
        </div>
      </aside>

      <div class="min-w-0 flex-1">
        <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button id="menuBtn" type="button" aria-label="Buka menu" class="btn-icon text-black">${icon('menu')}</button>
          <span class="text-sm font-semibold tracking-tight">Monolife</span>
        </header>
        <main id="view" class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12"></main>
      </div>
    </div>`;

  const sidebar = app.querySelector<HTMLElement>('#sidebar')!;
  const overlay = app.querySelector<HTMLElement>('#overlay')!;

  const setOpen = (open: boolean): void => {
    sidebar.classList.toggle('-translate-x-full', !open);
    overlay.classList.toggle('hidden', !open);
  };

  app.querySelector('#menuBtn')!.addEventListener('click', () => setOpen(true));
  overlay.addEventListener('click', () => setOpen(false));
  sidebar.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-nav]')) setOpen(false);
  });

  app.querySelector('#logout')!.addEventListener('click', async () => {
    try {
      await auth.logout();
    } finally {
      window.location.href = '/login.html';
    }
  });

  return {
    view: app.querySelector<HTMLElement>('#view')!,
    setActive(path: string) {
      app.querySelectorAll<HTMLElement>('[data-nav]').forEach((a) => {
        const active = a.dataset.nav === path;
        a.classList.toggle('bg-white', active);
        a.classList.toggle('text-black', active);
        a.classList.toggle('font-medium', active);
        a.classList.toggle('text-neutral-400', !active);
      });
    },
  };
}
