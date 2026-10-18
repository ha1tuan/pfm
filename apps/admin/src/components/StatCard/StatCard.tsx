import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import styles from './StatCard.module.scss';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  /** "good" colours the delta green, "bad" red — independent of direction. */
  deltaDirection?: 'up' | 'down';
  deltaSentiment?: 'good' | 'bad';
  footnote?: string;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaDirection = 'up',
  deltaSentiment = 'good',
  footnote,
  highlight,
}: StatCardProps) {
  const Arrow = deltaDirection === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={clsx(styles.card, highlight && styles.highlight)}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.icon}>
          <Icon size={17} />
        </span>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.foot}>
        {delta ? (
          <span className={styles.delta} data-sentiment={deltaSentiment}>
            <Arrow size={13} strokeWidth={2.5} />
            {delta}
          </span>
        ) : null}
        {footnote}
      </div>
    </div>
  );
}
