import clsx from 'clsx';
import type { Vnd } from '@/domain/types';
import { formatVndDigits, signPrefix } from '@/lib/format';
import styles from './AmountText.module.scss';

interface AmountTextProps {
  value: Vnd;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show "+" for positive values and colour money-in green. */
  signed?: boolean;
  /** inverse = white text on deep-green surfaces. */
  tone?: 'auto' | 'inverse' | 'brand' | 'muted';
  className?: string;
}

export function AmountText({ value, size = 'md', signed = false, tone = 'auto', className }: AmountTextProps) {
  const moneyIn = tone === 'auto' && signed && value > 0;
  return (
    <span
      className={clsx(styles.amount, styles[size], moneyIn && styles.moneyIn, tone !== 'auto' && styles[tone], className)}
    >
      {signPrefix(value, signed)}
      {formatVndDigits(value)}
      <span className={styles.currency}>₫</span>
    </span>
  );
}
