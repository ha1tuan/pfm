import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Drawer, Form, Input, Modal, Skeleton } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Check, Clock, RotateCcw, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useReverseTransaction, useTransaction } from '@/api/queries';
import { AmountText } from '@/components/AmountText/AmountText';
import { TransactionStatusBadge } from '@/components/Badge/Badge';
import type { Transaction } from '@/domain/types';
import { t } from '@/i18n';
import { formatDateTime, formatVnd, formatVndDigits } from '@/lib/format';
import styles from './TransactionDrawer.module.scss';

type StepState = 'done' | 'current' | 'failed' | 'todo';

function lifecycleSteps(tx: Transaction): { label: string; state: StepState; detail: string }[] {
  const at = (seconds: number) => dayjs(tx.createdAt).add(seconds, 'second').format('HH:mm:ss');
  const reached = { initiated: 0, pendingAuth: 1, processing: 2, succeeded: 3, failed: 3, reversed: 3 }[tx.status];
  const state = (i: number): StepState => (i < reached ? 'done' : i === reached ? 'current' : 'todo');
  const finalLabel = tx.status === 'failed' ? t('txStatus.failed') : t('txStatus.succeeded');
  return [
    { label: t('txStatus.initiated'), state: 'done', detail: at(0) },
    { label: t('txStatus.pendingAuth'), state: state(1), detail: reached > 1 ? at(14) : t('drawer.waiting') },
    { label: t('txStatus.processing'), state: state(2), detail: reached > 2 ? at(16) : t('drawer.waiting') },
    {
      label: finalLabel,
      state: tx.status === 'failed' ? 'failed' : reached === 3 ? 'done' : 'todo',
      detail: tx.failureReason ?? (reached === 3 ? at(19) : t('drawer.waiting')),
    },
  ];
}

const STEP_ICON = { done: Check, current: Clock, todo: Clock, failed: X };

const reverseSchema = z.object({ reason: z.string().trim().min(5, t('common.reasonRequired')) });
type ReverseForm = z.infer<typeof reverseSchema>;

function ReverseDialog({ tx, open, onClose }: { tx: Transaction; open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const reverse = useReverseTransaction();
  const { control, handleSubmit, reset, formState } = useForm<ReverseForm>({
    resolver: zodResolver(reverseSchema),
    defaultValues: { reason: '' },
  });

  const submit = handleSubmit(async ({ reason }) => {
    await reverse.mutateAsync({ id: tx.id, reason });
    message.success(t('drawer.reversed', { id: tx.id }));
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      title={t('drawer.reverseTitle', { id: tx.id })}
      okText={t('drawer.reverseConfirm')}
      okButtonProps={{ danger: true, loading: reverse.isPending }}
      cancelText={t('common.cancel')}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <p className={styles.dialogBody}>{t('drawer.reverseBody')}</p>
      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label={t('drawer.reverseReason')}
          validateStatus={formState.errors.reason ? 'error' : undefined}
          help={formState.errors.reason?.message}
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} rows={3} placeholder={t('drawer.reverseReasonPlaceholder')} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function DrawerBody({ tx }: { tx: Transaction }) {
  const rows: [string, string, boolean?][] = [
    [t('tx.type'), t(`txType.${tx.type}`)],
    [t('tx.user'), tx.userName],
    [t('drawer.wallet'), tx.walletId, true],
    [t('drawer.counterparty'), tx.counterparty],
    [t('tx.fee'), tx.fee ? formatVnd(tx.fee) : t('common.free')],
    [t('tx.time'), formatDateTime(tx.createdAt)],
    [t('drawer.channel'), tx.channel],
    [t('drawer.ip'), tx.ip, true],
  ];

  return (
    <>
      <div className={styles.id}>{tx.id}</div>
      <div className={styles.headline}>
        <AmountText value={tx.amount} size="lg" />
        <TransactionStatusBadge status={tx.status} />
      </div>
      {tx.reversedById ? <div className={styles.relation}>{t('drawer.reversedBy', { id: tx.reversedById })}</div> : null}
      {tx.reversalOfId ? <div className={styles.relation}>{t('drawer.reversalOf', { id: tx.reversalOfId })}</div> : null}

      <dl className={styles.facts}>
        {rows.map(([label, value, mono]) => (
          <div key={label} className={styles.fact}>
            <dt>{label}</dt>
            <dd className={clsx(mono && styles.mono)}>{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className={styles.sectionTitle}>{t('drawer.progress')}</h3>
      <ol className={styles.steps}>
        {lifecycleSteps(tx).map((step) => {
          const Icon = STEP_ICON[step.state];
          return (
            <li key={step.label} className={styles.step} data-state={step.state}>
              <span className={styles.stepIcon}>
                <Icon size={14} strokeWidth={3} />
              </span>
              <div>
                <div className={styles.stepLabel}>{step.label}</div>
                <div className={styles.stepDetail}>{step.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {tx.ledger.length ? (
        <>
          <h3 className={styles.sectionTitle}>{t('drawer.ledger')}</h3>
          <table className={styles.ledger}>
            <thead>
              <tr>
                <th />
                <th>{t('drawer.debit')}</th>
                <th>{t('drawer.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {tx.ledger.map((entry, i) => (
                <tr key={i}>
                  <td>{entry.account}</td>
                  <td>{entry.debit ? formatVndDigits(entry.debit) : ''}</td>
                  <td>{entry.credit ? formatVndDigits(entry.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </>
  );
}

/** Opened from any page via the `?tx=<id>` search param. */
export function TransactionDrawer() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const txId = params.get('tx');
  const { data: tx, isLoading } = useTransaction(txId);
  const [reverseOpen, setReverseOpen] = useState(false);

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('tx');
    setParams(next);
  };

  const canReverse = tx?.status === 'succeeded' && !tx.reversalOfId && !tx.reversedById;

  return (
    <Drawer
      open={!!txId}
      onClose={close}
      title={t('drawer.title')}
      size={440}
      footer={
        tx ? (
          <div className={styles.footer}>
            <Button block size="large" icon={<Wallet size={17} />} onClick={() => navigate(`/wallets/${tx.walletId}`)}>
              {t('drawer.viewWallet')}
            </Button>
            {canReverse ? (
              <Button block size="large" danger icon={<RotateCcw size={17} />} onClick={() => setReverseOpen(true)}>
                {t('drawer.reverse')}
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      {isLoading || !tx ? <Skeleton active /> : <DrawerBody tx={tx} />}
      {tx && canReverse ? <ReverseDialog tx={tx} open={reverseOpen} onClose={() => setReverseOpen(false)} /> : null}
    </Drawer>
  );
}
