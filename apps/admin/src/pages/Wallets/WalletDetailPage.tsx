import { zodResolver } from '@hookform/resolvers/zod';
import { App, Form, Input, Modal, Progress, Skeleton, Switch, Table, Tabs } from 'antd';
import { Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useSetWalletLock, useTransactions, useWallet, useWalletUsage } from '@/api/queries';
import { AmountText } from '@/components/AmountText/AmountText';
import { Badge, TransactionStatusBadge } from '@/components/Badge/Badge';
import { BankTile } from '@/components/BankTile/BankTile';
import { PageSection } from '@/components/PageSection/PageSection';
import { PersonAvatar } from '@/components/PersonAvatar/PersonAvatar';
import type { Transaction, TransactionType, Wallet } from '@/domain/types';
import { t } from '@/i18n';
import { formatDate, formatDateTime, formatShortDateTime, formatVnd, formatVndDigits } from '@/lib/format';
import styles from './WalletDetailPage.module.scss';

const lockSchema = z.object({ reason: z.string().trim().min(5, t('common.reasonRequired')) });
type LockForm = z.infer<typeof lockSchema>;

function LockDialog({ wallet, open, onClose }: { wallet: Wallet; open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const setLock = useSetWalletLock();
  const locking = wallet.status === 'active';
  const { control, handleSubmit, reset, formState } = useForm<LockForm>({
    resolver: zodResolver(lockSchema),
    defaultValues: { reason: '' },
  });

  const submit = handleSubmit(async ({ reason }) => {
    await setLock.mutateAsync({ id: wallet.id, locked: locking, reason });
    message.success(t(locking ? 'wallet.locked' : 'wallet.unlocked', { id: wallet.id }));
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      title={t(locking ? 'wallet.lockTitle' : 'wallet.unlockTitle', { id: wallet.id })}
      okText={t(locking ? 'wallet.lockConfirm' : 'wallet.unlockConfirm')}
      okButtonProps={{ danger: locking, loading: setLock.isPending }}
      cancelText={t('common.cancel')}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label={t('wallet.lockReason')}
          validateStatus={formState.errors.reason ? 'error' : undefined}
          help={formState.errors.reason?.message}
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={3} placeholder={t('wallet.lockReasonPlaceholder')} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function ProfileCard({ wallet }: { wallet: Wallet }) {
  const [lockOpen, setLockOpen] = useState(false);
  const locked = wallet.status === 'locked';
  const facts: [string, string][] = [
    [t('wallet.phone'), wallet.phone],
    [t('wallet.email'), wallet.email],
    [t('wallet.createdAt'), formatDate(wallet.createdAt)],
    [t('wallet.lastLogin'), formatDateTime(wallet.lastLoginAt)],
  ];

  return (
    <PageSection>
      <div className={styles.identity}>
        <PersonAvatar name={wallet.userName} size="xl" ring />
        <div>
          <div className={styles.name}>{wallet.userName}</div>
          <div className={styles.mono}>{wallet.id}</div>
        </div>
      </div>
      <div className={styles.badges}>
        <Badge tone={locked ? 'danger' : 'success'} dot>
          {t(`wallet.status.${wallet.status}`)}
        </Badge>
        <Badge tone="gold">{t('wallet.kyc', { level: wallet.kycLevel })}</Badge>
      </div>

      <div className={styles.balance}>
        <div className={styles.balanceLabel}>{t('wallet.available')}</div>
        <AmountText value={wallet.availableBalance} size="lg" tone="inverse" />
        <div className={styles.balanceHeld}>{t('wallet.held', { amount: formatVnd(wallet.heldBalance) })}</div>
      </div>

      <dl className={styles.facts}>
        {facts.map(([label, value]) => (
          <div key={label} className={styles.fact}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.device}>
        <Smartphone size={18} />
        <div>
          <div className={styles.deviceTitle}>{t('wallet.device')}</div>
          <div className={styles.deviceMeta}>
            {wallet.device.model} · {wallet.device.os} · {formatDate(wallet.device.boundAt)}
          </div>
        </div>
      </div>

      <div className={styles.lockRow}>
        <div>
          <div className={styles.lockTitle}>{t('wallet.lock')}</div>
          <div className={styles.lockHint}>{t('wallet.lockHint')}</div>
        </div>
        <Switch checked={locked} onChange={() => setLockOpen(true)} />
      </div>
      <LockDialog wallet={wallet} open={lockOpen} onClose={() => setLockOpen(false)} />
    </PageSection>
  );
}

function UsageCard({ walletId }: { walletId: string }) {
  const { data } = useWalletUsage(walletId);
  return (
    <PageSection title={t('wallet.usageToday')}>
      {(data ?? []).map((u) => {
        const pct = u.limit ? (u.used / u.limit) * 100 : 0;
        // Auto-tone per design system: green → gold at 80% → red at 100%.
        const color = pct >= 100 ? '#E5484D' : pct >= 80 ? '#F5B73B' : '#1FA673';
        return (
          <div key={u.transactionType} className={styles.usage}>
            <div className={styles.usageRow}>
              <span>{t(`txType.${u.transactionType}`)}</span>
              <span>
                {formatVndDigits(u.used)} / {formatVndDigits(u.limit)} ₫
              </span>
            </div>
            <Progress percent={pct} showInfo={false} strokeColor={color} size={{ height: 6 }} />
          </div>
        );
      })}
    </PageSection>
  );
}

function WalletTransactions({ walletId }: { walletId: string }) {
  const [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();
  const { data, isFetching } = useTransactions({ walletId, page, pageSize: 8 });
  const openTx = (tx: Transaction) => setParams({ ...Object.fromEntries(params), tx: tx.id });
  return (
    <Table<Transaction>
      rowKey="id"
      size="middle"
      loading={isFetching}
      dataSource={data?.items}
      onRow={(tx) => ({ onClick: () => openTx(tx), className: styles.clickable })}
      pagination={{ current: page, pageSize: 8, total: data?.total ?? 0, onChange: setPage, showSizeChanger: false }}
      columns={[
        { title: t('tx.id'), dataIndex: 'id', render: (id: string) => <span className={styles.mono}>{id}</span> },
        { title: t('tx.time'), dataIndex: 'createdAt', render: formatShortDateTime },
        { title: t('tx.type'), dataIndex: 'type', render: (type: TransactionType) => t(`txType.${type}`) },
        { title: t('tx.amount'), dataIndex: 'amount', align: 'right', render: (v: number) => <AmountText value={v} size="sm" /> },
        { title: t('tx.status'), dataIndex: 'status', render: (s: Transaction['status']) => <TransactionStatusBadge status={s} /> },
      ]}
    />
  );
}

export function WalletDetailPage() {
  const { walletId = '' } = useParams();
  const { data: wallet } = useWallet(walletId);

  if (!wallet) return <Skeleton active avatar paragraph={{ rows: 10 }} />;

  return (
    <div className={styles.page}>
      <div className={styles.side}>
        <ProfileCard wallet={wallet} />
        <UsageCard walletId={wallet.id} />
      </div>
      <PageSection>
        <Tabs
          items={[
            { key: 'tx', label: t('wallet.tabTransactions'), children: <WalletTransactions walletId={wallet.id} /> },
            {
              key: 'banks',
              label: t('wallet.tabBanks', { count: wallet.linkedBankAccounts.length }),
              children: (
                <div className={styles.banks}>
                  {wallet.linkedBankAccounts.map((b) => (
                    <BankTile key={b.id} account={b} />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </PageSection>
    </div>
  );
}
