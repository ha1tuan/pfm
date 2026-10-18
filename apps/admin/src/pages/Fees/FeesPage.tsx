import { Button, InputNumber, Select, Skeleton, Table } from 'antd';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCreateFeeVersion, useDecideFeeVersion, useFeeVersions } from '@/api/queries';
import { Badge } from '@/components/Badge/Badge';
import {
  CurrentVersionSection,
  MakerCheckerNotice,
  NewVersionModal,
  NoPendingVersion,
  PendingVersionSection,
  VersionHistory,
} from '@/components/ConfigVersion/ConfigVersion';
import type { FeeKind, FeeRule, TransactionType } from '@/domain/types';
import { t } from '@/i18n';
import { formatPercentBps, formatVnd, formatVndDigits } from '@/lib/format';
import styles from './FeesPage.module.scss';

export function describeBand(rule: FeeRule): string {
  if (rule.minAmount === 0 && rule.maxAmount === null) return t('fees.anyAmount');
  if (rule.minAmount === 0) return t('fees.upTo', { max: formatVnd(rule.maxAmount!) });
  if (rule.maxAmount === null) return t('fees.above', { min: formatVnd(rule.minAmount - 1) });
  return t('fees.between', { min: formatVnd(rule.minAmount), max: formatVnd(rule.maxAmount) });
}

export function describeFee(rule: FeeRule): string {
  switch (rule.kind) {
    case 'free':
      return t('common.free');
    case 'fixed':
      return t('fees.perTx', { amount: formatVnd(rule.fixed) });
    case 'percent':
      return formatPercentBps(rule.percentBps);
    case 'percentPlusFixed':
      return `${formatPercentBps(rule.percentBps)} + ${formatVnd(rule.fixed)}`;
  }
}

const ruleKey = (r: FeeRule) => JSON.stringify(r);

function FeeRulesTable({ rules, baseline }: { rules: FeeRule[]; baseline?: FeeRule[] }) {
  const unchanged = new Set(baseline?.map(ruleKey));
  return (
    <Table<FeeRule>
      rowKey={(r) => `${r.transactionType}-${r.minAmount}`}
      pagination={false}
      dataSource={rules}
      rowClassName={(r) => clsx(baseline && !unchanged.has(ruleKey(r)) && styles.changed)}
      columns={[
        { title: t('tx.typeFilter'), dataIndex: 'transactionType', render: (type: TransactionType) => <Badge size="sm">{t(`txType.${type}`)}</Badge> },
        { title: t('fees.band'), key: 'band', render: (_, r) => describeBand(r) },
        {
          title: t('fees.rule'),
          key: 'rule',
          render: (_, r) => <span className={clsx(styles.rule, r.kind === 'free' && styles.free)}>{describeFee(r)}</span>,
        },
        { title: t('fees.minFee'), dataIndex: 'minFee', align: 'right', render: (v: number) => (v ? formatVnd(v) : t('common.none')) },
      ]}
    />
  );
}

const amountInput = {
  formatter: (v?: number | string) => (v ? formatVndDigits(Number(v)) : ''),
  parser: (v?: string) => Number((v ?? '').replace(/\D/g, '')),
};

function FeeRulesEditor({ rules, onChange }: { rules: FeeRule[]; onChange: (rules: FeeRule[]) => void }) {
  const patch = (index: number, change: Partial<FeeRule>) =>
    onChange(rules.map((r, i) => (i === index ? { ...r, ...change } : r)));

  return (
    <Table<FeeRule>
      rowKey={(_, i) => String(i)}
      size="small"
      pagination={false}
      dataSource={rules}
      columns={[
        { title: t('tx.typeFilter'), dataIndex: 'transactionType', width: 150, render: (type: TransactionType) => t(`txType.${type}`) },
        { title: t('fees.band'), key: 'band', width: 150, render: (_, r) => <span className={styles.bandCell}>{describeBand(r)}</span> },
        {
          title: t('fees.rule'),
          key: 'kind',
          width: 140,
          render: (_, r, i) => (
            <Select<FeeKind>
              value={r.kind}
              onChange={(kind) => patch(i, { kind })}
              className={styles.fullWidth}
              options={(['free', 'fixed', 'percent', 'percentPlusFixed'] as FeeKind[]).map((k) => ({ value: k, label: t(`fees.kind.${k}`) }))}
            />
          ),
        },
        {
          title: t('fees.percentLabel'),
          key: 'percent',
          render: (_, r, i) => (
            <InputNumber<number>
              disabled={r.kind !== 'percent' && r.kind !== 'percentPlusFixed'}
              value={r.percentBps / 100}
              min={0}
              max={10}
              step={0.05}
              suffix="%"
              onChange={(v) => patch(i, { percentBps: Math.round((v ?? 0) * 100) })}
              className={styles.fullWidth}
            />
          ),
        },
        {
          title: t('fees.fixedLabel'),
          key: 'fixed',
          render: (_, r, i) => (
            <InputNumber<number>
              disabled={r.kind !== 'fixed' && r.kind !== 'percentPlusFixed'}
              value={r.fixed}
              min={0}
              step={500}
              suffix="₫"
              {...amountInput}
              onChange={(v) => patch(i, { fixed: v ?? 0 })}
              className={styles.fullWidth}
            />
          ),
        },
        {
          title: t('fees.minFee'),
          key: 'minFee',
          render: (_, r, i) => (
            <InputNumber<number>
              disabled={r.kind === 'free'}
              value={r.minFee}
              min={0}
              step={100}
              suffix="₫"
              {...amountInput}
              onChange={(v) => patch(i, { minFee: v ?? 0 })}
              className={styles.fullWidth}
            />
          ),
        },
      ]}
    />
  );
}

export function FeesPage() {
  const { data: versions } = useFeeVersions();
  const decide = useDecideFeeVersion();
  const create = useCreateFeeVersion();
  const [draft, setDraft] = useState<FeeRule[] | null>(null);

  if (!versions) return <Skeleton active paragraph={{ rows: 10 }} />;

  const active = versions.find((v) => v.status === 'active');
  const pending = versions.filter((v) => v.status === 'pendingApproval');

  return (
    <div className={styles.page}>
      <MakerCheckerNotice />

      {pending.length ? (
        pending.map((v) => (
          <PendingVersionSection
            key={v.id}
            version={v}
            deciding={decide.isPending}
            onDecide={(approve) => decide.mutateAsync({ id: v.id, approve })}
          >
            <FeeRulesTable rules={v.rules} baseline={active?.rules} />
          </PendingVersionSection>
        ))
      ) : (
        <NoPendingVersion />
      )}

      <CurrentVersionSection
        version={active}
        actions={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setDraft(active?.rules ?? [])}>
            {t('config.newVersion')}
          </Button>
        }
      >
        <FeeRulesTable rules={active?.rules ?? []} />
      </CurrentVersionSection>

      <VersionHistory versions={versions} />

      <NewVersionModal
        open={!!draft}
        title={t('config.newVersion')}
        submitting={create.isPending}
        onClose={() => setDraft(null)}
        onSubmit={async (meta) => {
          await create.mutateAsync({ rules: draft ?? [], ...meta });
          setDraft(null);
        }}
      >
        {draft ? <FeeRulesEditor rules={draft} onChange={setDraft} /> : null}
      </NewVersionModal>
    </div>
  );
}
