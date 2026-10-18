import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { ConfigVersionStatus, TransactionStatus } from '@/domain/types';
import { t } from '@/i18n';
import styles from './Badge.module.scss';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'gold';

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
  mono?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot, size = 'md', mono, children }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[size], mono && styles.mono)} data-tone={tone}>
      {dot ? <span className={styles.dot} /> : null}
      {children}
    </span>
  );
}

const TX_TONE: Record<TransactionStatus, BadgeTone> = {
  initiated: 'neutral',
  pendingAuth: 'info',
  processing: 'warning',
  succeeded: 'success',
  failed: 'danger',
  reversed: 'neutral',
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge tone={TX_TONE[status]} dot size="sm">
      {t(`txStatus.${status}`)}
    </Badge>
  );
}

const VERSION_TONE: Record<ConfigVersionStatus, BadgeTone> = {
  draft: 'neutral',
  pendingApproval: 'warning',
  approved: 'info',
  active: 'success',
  superseded: 'neutral',
  rejected: 'danger',
};

export function VersionStatusBadge({ status }: { status: ConfigVersionStatus }) {
  return (
    <Badge tone={VERSION_TONE[status]} dot size="sm">
      {t(`config.status.${status}`)}
    </Badge>
  );
}
