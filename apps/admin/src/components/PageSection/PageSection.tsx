import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './PageSection.module.scss';

interface PageSectionProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** flush = content runs edge to edge (tables). */
  flush?: boolean;
  tone?: 'card' | 'sunken';
  className?: string;
  children: ReactNode;
}

export function PageSection({ title, subtitle, actions, flush, tone = 'card', className, children }: PageSectionProps) {
  return (
    <section className={clsx(styles.section, flush && styles.flush, tone === 'sunken' && styles.sunken, className)}>
      {title || actions ? (
        <header className={styles.header}>
          <div>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
