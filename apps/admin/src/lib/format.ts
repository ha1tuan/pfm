import dayjs from 'dayjs';
import type { Vnd } from '@/domain/types';

const MINUS = '−';

/** 12450000 → "12.450.000" (no sign, no currency). */
export function formatVndDigits(value: Vnd): string {
  return Math.abs(Math.round(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 12450000 → "12.450.000 ₫", −185000 → "−185.000 ₫". */
export function formatVnd(value: Vnd): string {
  return `${value < 0 ? MINUS : ''}${formatVndDigits(value)} ₫`;
}

export function signPrefix(value: Vnd, signed: boolean): string {
  if (value < 0) return MINUS;
  return signed && value > 0 ? '+' : '';
}

/** Compact VND for KPIs and chips: 1,28 tỷ · 4,2tr · 100k. */
export function formatVndCompact(value: Vnd): string {
  const abs = Math.abs(value);
  const fmt = (n: number, digits: number) =>
    n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
  if (abs >= 1_000_000_000) return `${fmt(value / 1_000_000_000, 2)} tỷ`;
  if (abs >= 1_000_000) return `${fmt(value / 1_000_000, 1)}tr`;
  if (abs >= 1_000) return `${fmt(value / 1_000, 0)}k`;
  return fmt(value, 0);
}

export function formatPercentBps(bps: number): string {
  return `${(bps / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

export const formatDateTime = (iso: string) => dayjs(iso).format('DD/MM/YYYY HH:mm');
export const formatDateTimeSeconds = (iso: string) => dayjs(iso).format('DD/MM/YYYY HH:mm:ss');
export const formatDate = (iso: string) => dayjs(iso).format('DD/MM/YYYY');
export const formatShortDateTime = (iso: string) => dayjs(iso).format('DD/MM HH:mm');
