import type { LinkedBankAccount } from '@/domain/types';
import { t } from '@/i18n';
import styles from './BankTile.module.scss';

/** Linked Bank Account card. Shows no balance: the system does not hold one for external accounts. */
export function BankTile({ account }: { account: LinkedBankAccount }) {
  return (
    <div className={styles.card}>
      <span className={styles.logo} data-bank={account.brandColor}>
        {account.bankShort}
      </span>
      <span className={styles.text}>
        <span className={styles.name}>
          {account.bankName}
          {account.isDefault ? <span className={styles.default}>{t('wallet.defaultBank')}</span> : null}
        </span>
        <span className={styles.number}>{account.maskedNumber}</span>
      </span>
    </div>
  );
}
