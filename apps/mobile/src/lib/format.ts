import type { Vnd } from '@/domain/types';

const MINUS = '−';

export function formatVndDigits(value: Vnd): string {
  return Math.abs(Math.round(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function signPrefix(value: Vnd, signed: boolean): string {
  if (value < 0) return MINUS;
  return signed && value > 0 ? '+' : '';
}

export const formatVnd = (value: Vnd) => `${value < 0 ? MINUS : ''}${formatVndDigits(value)} ₫`;

/** 4.220.000 → "4,22tr", 100.000 → "100k". */
export function formatVndCompact(value: Vnd): string {
  const abs = Math.abs(value);
  const fmt = (n: number, d: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: d });
  if (abs >= 1_000_000_000) return `${fmt(value / 1e9, 2)} tỷ`;
  if (abs >= 1_000_000) return `${fmt(value / 1e6, 2)}tr`;
  if (abs >= 1_000) return `${fmt(value / 1e3, 0)}k`;
  return fmt(value, 0);
}

export const parseDigits = (text: string) => Number(text.replace(/\D/g, '')) || 0;

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Hôm nay", "Hôm qua" or dd/mm/yyyy — used for statement grouping. */
export function relativeDay(iso: string, labels: { today: string; yesterday: string }): string {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000);
  if (diff === 0) return labels.today;
  if (diff === 1) return labels.yesterday;
  return formatDate(iso);
}

/** Masks a phone number for display: 0912345678 → 0912 ••• 678. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits.slice(0, 4)} ••• ${digits.slice(-3)}`;
}

/** 0903112233 → 0903 112 233 (full number, for the user to verify a recipient). */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}
