import { errMsg } from './lib/api';
import { errorBox } from './lib/dom';
import type { Page } from './lib/types';
import { pages } from './routes';

export function startRouter(view: HTMLElement, onChange: (page: Page) => void): void {
  let token = 0;

  const run = (): void => {
    const path = window.location.hash.slice(1) || '/';
    const page = pages.find((p) => p.path === path) ?? pages[0]!;
    const mine = ++token;

    onChange(page);
    document.title = `${page.title} · Monolife`;

    // Container baru tiap navigasi supaya event listener halaman lama ikut terbuang.
    const container = document.createElement('div');
    container.className = 'fade-in';
    view.replaceChildren(container);

    Promise.resolve(page.render(container)).catch((e: unknown) => {
      if (mine === token) container.innerHTML = errorBox(errMsg(e));
    });
  };

  window.addEventListener('hashchange', run);
  run();
}
