import { Button, Progress, Segmented, Skeleton, Table } from 'antd';
import { Activity, ArrowLeftRight, ArrowRight, TriangleAlert, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDashboard, type DashboardRange } from '@/api/queries';
import { AmountText } from '@/components/AmountText/AmountText';
import { AreaChart } from '@/components/AreaChart/AreaChart';
import { TransactionStatusBadge } from '@/components/Badge/Badge';
import { PageSection } from '@/components/PageSection/PageSection';
import { StatCard } from '@/components/StatCard/StatCard';
import type { Transaction, TransactionType } from '@/domain/types';
import { t } from '@/i18n';
import { formatNumber, formatShortDateTime, formatVndCompact } from '@/lib/format';
import styles from './DashboardPage.module.scss';

const pct = (n: number) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;

// Progress colours must be passed as a prop; values mirror _variables.scss.
const MIX_COLOR: Record<TransactionType, string> = {
  p2pTransfer: '#0E8A5F',
  bankTransfer: '#F5B73B',
  topUp: '#5DD39E',
  withdrawal: '#2F7FE0',
};

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('7d');
  const { data } = useDashboard(range);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const openTx = (tx: Transaction) => setParams({ ...Object.fromEntries(params), tx: tx.id });

  if (!data) return <Skeleton active paragraph={{ rows: 12 }} />;

  return (
    <div className={styles.page}>
      <div className={styles.kpis}>
        <StatCard
          highlight
          label={t('dashboard.volumeToday')}
          value={`${formatVndCompact(data.volumeToday)} ₫`}
          delta={pct(data.volumeDeltaPct)}
          icon={Activity}
          footnote={t('dashboard.vsYesterday')}
        />
        <StatCard
          label={t('dashboard.countToday')}
          value={formatNumber(data.countToday)}
          delta={pct(data.countDeltaPct)}
          icon={ArrowLeftRight}
          footnote={t('dashboard.today')}
        />
        <StatCard
          label={t('dashboard.activeWallets')}
          value={formatNumber(data.activeWallets)}
          delta={pct(data.activeWalletsDeltaPct)}
          icon={Wallet}
          footnote={t('dashboard.last7Days')}
        />
        <StatCard
          label={t('dashboard.failureRate')}
          value={pct(data.failureRatePct)}
          delta={pct(data.failureRateDeltaPct)}
          deltaSentiment="bad"
          icon={TriangleAlert}
          footnote={t('dashboard.needsWatching')}
        />
      </div>

      <div className={styles.charts}>
        <PageSection
          title={t('dashboard.volumeChart')}
          subtitle={t('dashboard.systemWide')}
          actions={
            <Segmented<DashboardRange>
              value={range}
              onChange={setRange}
              options={[
                { value: '7d', label: t('dashboard.range7d') },
                { value: '30d', label: t('dashboard.range30d') },
                { value: '90d', label: t('dashboard.range90d') },
              ]}
            />
          }
        >
          <AreaChart data={data.series.map((p) => ({ label: p.label, value: p.value }))} title={t('dashboard.volumeChart')} />
        </PageSection>

        <PageSection title={t('dashboard.mixByType')}>
          <ul className={styles.mix}>
            {data.mix.map((m) => (
              <li key={m.type}>
                <div className={styles.mixRow}>
                  <span>{t(`txType.${m.type}`)}</span>
                  <span className={styles.mixPct}>{m.pct}%</span>
                </div>
                <Progress percent={m.pct} showInfo={false} strokeColor={MIX_COLOR[m.type]} size={{ height: 8 }} />
              </li>
            ))}
          </ul>
          <div className={styles.feeRevenue}>
            <div className={styles.feeRevenueLabel}>{t('dashboard.feeRevenueToday')}</div>
            <AmountText value={data.feeRevenueToday} size="lg" tone="brand" />
          </div>
        </PageSection>
      </div>

      <PageSection
        flush
        title={t('dashboard.latest')}
        actions={
          <Button type="text" iconPlacement="end" icon={<ArrowRight size={16} />} onClick={() => navigate('/transactions')}>
            {t('common.viewAll')}
          </Button>
        }
      >
        <Table<Transaction>
          rowKey="id"
          pagination={false}
          dataSource={data.latest}
          onRow={(tx) => ({ onClick: () => openTx(tx), className: styles.clickable })}
          columns={[
            { title: t('tx.id'), dataIndex: 'id', render: (id: string) => <span className={styles.mono}>{id}</span> },
            { title: t('tx.time'), dataIndex: 'createdAt', render: formatShortDateTime },
            { title: t('tx.user'), dataIndex: 'userName', render: (n: string) => <span className={styles.strong}>{n}</span> },
            { title: t('tx.type'), dataIndex: 'type', render: (type: TransactionType) => t(`txType.${type}`) },
            { title: t('tx.amount'), dataIndex: 'amount', align: 'right', render: (v: number) => <AmountText value={v} size="sm" /> },
            { title: t('tx.status'), dataIndex: 'status', render: (s: Transaction['status']) => <TransactionStatusBadge status={s} /> },
          ]}
        />
      </PageSection>
    </div>
  );
}
