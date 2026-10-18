import { Button, InputNumber, Segmented, Skeleton } from 'antd';
import { ArrowDownToLine, ArrowRight, Landmark, Plus, Send, Wallet, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useCreateLimitVersion, useDecideLimitVersion, useLimitVersions } from '@/api/queries';
import { Badge } from '@/components/Badge/Badge';
import {
  CurrentVersionSection,
  MakerCheckerNotice,
  NewVersionModal,
  NoPendingVersion,
  PendingVersionSection,
  VersionHistory,
} from '@/components/ConfigVersion/ConfigVersion';
import type { KycLevel, LimitRule, TransactionType } from '@/domain/types';
import { t, type I18nKey } from '@/i18n';
import { formatNumber, formatVndDigits } from '@/lib/format';
import styles from './LimitsPage.module.scss';

const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  p2pTransfer: Send,
  bankTransfer: Landmark,
  withdrawal: ArrowDownToLine,
  topUp: Wallet,
};

const FIELDS: { key: keyof Omit<LimitRule, 'transactionType'>; label: I18nKey; count?: boolean }[] = [
  { key: 'perTransaction', label: 'limits.perTransaction' },
  { key: 'daily', label: 'limits.daily' },
  { key: 'monthly', label: 'limits.monthly' },
  { key: 'dailyCount', label: 'limits.dailyCount', count: true },
];

const formatField = (value: number, count?: boolean) =>
  count ? `${formatNumber(value)} ${t('common.times')}` : `${formatVndDigits(value)} ₫`;

function LimitCards({ rules }: { rules: LimitRule[] }) {
  return (
    <div className={styles.cards}>
      {rules.map((rule) => {
        const Icon = TYPE_ICON[rule.transactionType];
        return (
          <div key={rule.transactionType} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardIcon}>
                <Icon size={18} />
              </span>
              {t(`txType.${rule.transactionType}`)}
            </div>
            <dl className={styles.values}>
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <dt>{t(f.label)}</dt>
                  <dd>{formatField(rule[f.key], f.count)}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function LimitDiff({ rules, baseline }: { rules: LimitRule[]; baseline: LimitRule[] }) {
  const changes = rules.flatMap((rule) => {
    const before = baseline.find((b) => b.transactionType === rule.transactionType);
    return FIELDS.filter((f) => before && before[f.key] !== rule[f.key]).map((f) => ({
      type: rule.transactionType,
      field: f,
      from: before![f.key],
      to: rule[f.key],
    }));
  });
  return (
    <ul className={styles.diff}>
      {changes.map((c) => (
        <li key={`${c.type}-${c.field.key}`}>
          <Badge size="sm">{t(`txType.${c.type}`)}</Badge>
          <span className={styles.diffField}>{t(c.field.label)}</span>
          <span className={styles.diffFrom}>{formatField(c.from, c.field.count)}</span>
          <ArrowRight size={14} className={styles.diffArrow} />
          <span className={styles.diffTo}>{formatField(c.to, c.field.count)}</span>
        </li>
      ))}
    </ul>
  );
}

function LimitEditor({ rules, onChange }: { rules: LimitRule[]; onChange: (rules: LimitRule[]) => void }) {
  const patch = (type: TransactionType, key: keyof LimitRule, value: number) =>
    onChange(rules.map((r) => (r.transactionType === type ? { ...r, [key]: value } : r)));
  return (
    <div className={styles.editor}>
      {rules.map((rule) => (
        <fieldset key={rule.transactionType} className={styles.editorGroup}>
          <legend>{t(`txType.${rule.transactionType}`)}</legend>
          {FIELDS.map((f) => (
            <label key={f.key} className={styles.editorField}>
              <span>{t(f.label)}</span>
              <InputNumber<number>
                value={rule[f.key]}
                min={0}
                step={f.count ? 1 : 1_000_000}
                suffix={f.count ? t('common.times') : '₫'}
                formatter={(v) => (v ? formatVndDigits(Number(v)) : '')}
                parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
                onChange={(v) => patch(rule.transactionType, f.key, v ?? 0)}
                className={styles.fullWidth}
              />
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

export function LimitsPage() {
  const [level, setLevel] = useState<KycLevel>(2);
  const { data: versions } = useLimitVersions(level);
  const decide = useDecideLimitVersion();
  const create = useCreateLimitVersion();
  const [draft, setDraft] = useState<LimitRule[] | null>(null);

  const active = versions?.find((v) => v.status === 'active');
  const pending = versions?.filter((v) => v.status === 'pendingApproval') ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Segmented<KycLevel>
          size="large"
          value={level}
          onChange={setLevel}
          options={([1, 2] as KycLevel[]).map((l) => ({ value: l, label: t('limits.kycTab', { level: l }) }))}
        />
      </div>
      <MakerCheckerNotice />

      {!versions ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          {pending.length ? (
            pending.map((v) => (
              <PendingVersionSection
                key={v.id}
                version={v}
                deciding={decide.isPending}
                onDecide={(approve) => decide.mutateAsync({ id: v.id, approve })}
              >
                <LimitDiff rules={v.rules} baseline={active?.rules ?? []} />
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
            <div className={styles.cardsWrap}>
              <LimitCards rules={active?.rules ?? []} />
              <div className={styles.regulatory}>
                <Badge tone="info">{t('limits.noteLabel')}</Badge>
                {t('limits.regulatoryNote')}
              </div>
            </div>
          </CurrentVersionSection>

          <VersionHistory versions={versions} />
        </>
      )}

      <NewVersionModal
        open={!!draft}
        title={`${t('config.newVersion')} · ${t('limits.kycTab', { level })}`}
        submitting={create.isPending}
        onClose={() => setDraft(null)}
        onSubmit={async (meta) => {
          await create.mutateAsync({ kycLevel: level, rules: draft ?? [], ...meta });
          setDraft(null);
        }}
      >
        {draft ? <LimitEditor rules={draft} onChange={setDraft} /> : null}
      </NewVersionModal>
    </div>
  );
}
