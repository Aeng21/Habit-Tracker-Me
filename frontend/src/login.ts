import './styles.css';
import { auth, errMsg } from './lib/api';

type Mode = 'login' | 'register';

const form = document.getElementById('form') as HTMLFormElement;
const username = document.getElementById('username') as HTMLInputElement;
const password = document.getElementById('password') as HTMLInputElement;
const errorEl = document.getElementById('error') as HTMLElement;
const submit = document.getElementById('submit') as HTMLButtonElement;
const heading = document.getElementById('heading') as HTMLElement;
const subheading = document.getElementById('subheading') as HTMLElement;
const hint = document.getElementById('hint') as HTMLElement;
const tabs = document.querySelectorAll<HTMLButtonElement>('[data-mode]');

let mode: Mode = 'login';

function setMode(next: Mode): void {
  mode = next;
  const isLogin = mode === 'login';
  heading.textContent = isLogin ? 'Masuk' : 'Buat akun';
  subheading.textContent = isLogin ? 'Selamat datang kembali.' : 'Mulai catat keuangan dan targetmu.';
  submit.textContent = isLogin ? 'Masuk' : 'Daftar';
  password.autocomplete = isLogin ? 'current-password' : 'new-password';
  hint.classList.toggle('hidden', isLogin);
  errorEl.classList.add('hidden');
  tabs.forEach((t) => {
    const active = t.dataset.mode === mode;
    t.classList.toggle('bg-white', active);
    t.classList.toggle('shadow-sm', active);
    t.classList.toggle('text-black', active);
    t.classList.toggle('text-neutral-500', !active);
  });
}

function showError(message: string): void {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode as Mode)));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.add('hidden');

  const u = username.value.trim();
  const p = password.value;
  if (!u || !p) {
    showError('Username dan password harus diisi.');
    return;
  }

  submit.disabled = true;
  try {
    if (mode === 'login') await auth.login(u, p);
    else await auth.register(u, p);
    window.location.href = '/';
  } catch (err) {
    showError(errMsg(err));
    submit.disabled = false;
  }
});

setMode('login');

// Sudah login? langsung ke aplikasi.
auth
  .me()
  .then((me) => {
    if (me.loggedIn) window.location.href = '/';
  })
  .catch(() => {});
