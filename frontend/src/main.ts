import './styles.css';
import { auth } from './lib/api';
import { mountShell } from './layout';
import { startRouter } from './router';
import { state } from './state';

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;

  let me;
  try {
    me = await auth.me();
  } catch {
    app.innerHTML = '<p class="p-10 text-sm text-neutral-600">Server tidak dapat dihubungi. Pastikan backend berjalan.</p>';
    return;
  }

  if (!me.loggedIn || !me.username) {
    window.location.href = '/login.html';
    return;
  }

  state.username = me.username;
  const shell = mountShell(app, me.username);
  startRouter(shell.view, (page) => shell.setActive(page.path));
}

void boot();
