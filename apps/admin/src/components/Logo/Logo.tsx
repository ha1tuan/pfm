import clsx from 'clsx';
import styles from './Logo.module.scss';

interface LogoProps {
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Placeholder vector of the PFM wallet mark with gold keyhole.
 * Replace with the official SVG once the brand team exports one (design system ships low-res PNG only).
 */
export function Logo({ tone = 'dark', className }: LogoProps) {
  return (
    <span className={clsx(styles.logo, tone === 'light' && styles.light, className)}>
      <svg className={styles.mark} viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="8" width="36" height="26" rx="9" className={styles.body} />
        <path d="M2 15h26a10 10 0 0 1 10 10v2H2z" className={styles.flap} />
        <circle cx="28" cy="21" r="4.2" className={styles.keyhole} />
        <rect x="26.8" y="22" width="2.4" height="6" rx="1.2" className={styles.keyhole} />
      </svg>
      <span className={styles.word}>PFM</span>
    </span>
  );
}
