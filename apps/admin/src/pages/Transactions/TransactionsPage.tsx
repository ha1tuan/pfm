import { Button, DatePicker, Input, InputNumber, Select, Table, Tabs } from 'antd';
import type { Dayjs } from 'dayjs';
import { RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactions, type TransactionQuery } from '@/api/queries';
import { AmountText } from '@/components/AmountText/AmountText';
import { TransactionStatusBadge } from '@/components/Badge/Badge';
import { TRANSACTION_TYPES, type Transaction, type TransactionStatus, type TransactionType } from '@/domain/types';
import { t } from '@/i18n';
import { formatNumber, formatShortDateTime, formatVnd, formatVndDigits } from '@/lib/format';
import styles from './TransactionsPage.module.scss';

const STATUS_TABS: (TransactionStatus | 'all')[] = ['all', 'processing', 'pendingAuth', 'succeeded', 'failed', 'reversed'];
const PAGE_SIZE = 10;

interface Filters {
  keyword: string;
  type?: TransactionType;
  range: [Dayjs | null, Dayjs | null] | null;
  minAmount: number | null;
}

const EMPTY_FILTERS: Filters = { keyword: '', range: null, minAmount: null };

export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const query: TransactionQuery = {
    status: status === 'all' ? undefined : status,
    type: filters.type,
    keyword: filters.keyword || undefined,
    from: filters.range?.[0]?.startOf('day').toISOString(),
    to: filters.range?.[1]?.endOf('day').toISOString(),
    minAmount: filters.minAmount ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, isFetching } = useTransactions(query);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const openTx = (tx: Transaction) => setParams({ ...Object.fromEntries(params), tx: tx.id });

  return (
    <div className={styles.page}>
      <Tabs
        activeKey={status}
        onChange={(key) => {
          setStatus(key as TransactionStatus | 'all');
          setPage(1);
        }}
        items={STATUS_TABS.map((s) => ({ key: s, label: s === 'all' ? t('common.all') : t(`txStatus.${s}`) }))}
        className={styles.tabs}
      />

      <div className={styles.filters}>
        <label className={styles.field} data-grow="2">
          <span>{t('tx.keyword')}</span>
          <Input
            prefix={<Search size={16} className={styles.muted} />}
            placeholder={t('tx.keywordPlaceholder')}
            value={filters.keyword}
            onChange={(e) => update({ keyword: e.target.value })}
            allowClear
          />
        </label>
        <label className={styles.field}>
          <span>{t('tx.typeFilter')}</span>
          <Select<TransactionType | undefined>
            value={filters.type}
            onChange={(type) => update({ type })}
            placeholder={t('common.all')}
            allowClear
            options={TRANSACTION_TYPES.map((type) => ({ value: type, label: t(`txType.${type}`) }))}
          />
        </label>
        <label className={styles.field} data-grow="1.4">
          <span>{t('tx.dateRange')}</span>
          <DatePicker.RangePicker
            value={filters.range}
            onChange={(range) => update({ range })}
            format="DD/MM/YYYY"
          />
        </label>
        <label className={styles.field}>
          <span>{t('tx.minAmount')}</span>
          <InputNumber<number>
            className={styles.fullWidth}
            min={0}
            step={100_000}
            value={filters.minAmount}
            onChange={(minAmount) => update({ minAmount })}
            formatter={(v) => (v ? formatVndDigits(Number(v)) : '')}
            parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
            suffix="₫"
            placeholder="0"
          />
        </label>
        <Button icon={<RotateCcw size={16} />} onClick={() => update(EMPTY_FILTERS)}>
          {t('common.reset')}
        </Button>
      </div>

      <Table<Transaction>
        className={styles.table}
        rowKey="id"
        loading={isFetching}
        dataSource={data?.items}
        locale={{ emptyText: t('tx.empty') }}
        onRow={(tx) => ({ onClick: () => openTx(tx), className: styles.clickable })}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total, [from, to]) =>
            t('common.showing', { from, to, total: formatNumber(total) }),
        }}
        columns={[
          { title: t('tx.id'), dataIndex: 'id', width: 150, render: (id: string) => <span className={styles.mono}>{id}</span> },
          { title: t('tx.time'), dataIndex: 'createdAt', width: 120, render: formatShortDateTime },
          {
            title: t('tx.user'),
            dataIndex: 'userName',
            render: (_: string, tx) => (
              <div>
                <div className={styles.strong}>{tx.userName}</div>
                <div className={styles.monoSmall}>{tx.walletId}</div>
              </div>
            ),
          },
          { title: t('tx.type'), dataIndex: 'type', render: (type: TransactionType) => t(`txType.${type}`) },
          { title: t('tx.amount'), dataIndex: 'amount', align: 'right', render: (v: number) => <AmountText value={v} size="sm" /> },
          {
            title: t('tx.fee'),
            dataIndex: 'fee',
            align: 'right',
            render: (fee: number) => (fee ? formatVnd(fee) : <span className={styles.muted}>{t('common.none')}</span>),
          },
          { title: t('tx.status'), dataIndex: 'status', width: 140, render: (s: TransactionStatus) => <TransactionStatusBadge status={s} /> },
        ]}
      />
    </div>
  );
}
