import { vi } from './vi';

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type I18nKey = Leaves<typeof vi>;

const messages: unknown = vi;

/** t('wallet.held', { amount: '0 ₫' }) — every UI string goes through here. */
export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages);
  if (typeof value !== 'string') return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
