const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const rupiah = (n: number): string => rupiahFmt.format(n);

const pad = (n: number): string => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export const todayISO = (): string => toISO(new Date());

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export const monthKey = (iso: string): string => iso.slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function dateLabel(iso: string): string {
  return parseISO(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function longDateLabel(iso: string): string {
  return parseISO(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function dayShort(iso: string): string {
  return parseISO(iso).toLocaleDateString('id-ID', { weekday: 'short' });
}
