import { Alert, Input, Table } from 'antd';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findWallet, useRecentWallets } from '@/api/queries';
import { AmountText } from '@/components/AmountText/AmountText';
import { Badge } from '@/components/Badge/Badge';
import { PageSection } from '@/components/PageSection/PageSection';
import { PersonAvatar } from '@/components/PersonAvatar/PersonAvatar';
import type { Wallet } from '@/domain/types';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import styles from './WalletsPage.module.scss';

export function WalletsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [notFound, setNotFound] = useState<string | null>(params.get('q'));
  const [searching, setSearching] = useState(false);
  const { data: wallets, isLoading } = useRecentWallets();

  const search = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    const wallet = await findWallet(query);
    setSearching(false);
    if (wallet) navigate(`/wallets/${wallet.id}`);
    else setNotFound(query);
  };

  return (
    <div className={styles.page}>
      <PageSection title={t('wallet.lookupTitle')}>
        <Input.Search
          size="large"
          placeholder={t('wallet.lookupPlaceholder')}
          enterButton
          loading={searching}
          defaultValue={params.get('q') ?? ''}
          onSearch={search}
        />
        {notFound ? (
          <Alert className={styles.alert} type="warning" showIcon title={t('wallet.notFound', { query: notFound })} />
        ) : null}
      </PageSection>

      <PageSection flush title={t('wallet.recent')}>
        <Table<Wallet>
          rowKey="id"
          loading={isLoading}
          pagination={false}
          dataSource={wallets}
          onRow={(w) => ({ onClick: () => navigate(`/wallets/${w.id}`), className: styles.clickable })}
          columns={[
            {
              title: t('tx.user'),
              dataIndex: 'userName',
              render: (_: string, w) => (
                <div className={styles.person}>
                  <PersonAvatar name={w.userName} size="sm" />
                  <div>
                    <div className={styles.strong}>{w.userName}</div>
                    <div className={styles.mono}>{w.id}</div>
                  </div>
                </div>
              ),
            },
            { title: t('wallet.phone'), dataIndex: 'phone' },
            { title: t('wallet.kycColumn'), dataIndex: 'kycLevel', render: (l: number) => <Badge tone="gold" size="sm">{t('wallet.kyc', { level: l })}</Badge> },
            {
              title: t('tx.status'),
              dataIndex: 'status',
              render: (s: Wallet['status']) => (
                <Badge tone={s === 'locked' ? 'danger' : 'success'} dot size="sm">
                  {t(`wallet.status.${s}`)}
                </Badge>
              ),
            },
            { title: t('wallet.available'), dataIndex: 'availableBalance', align: 'right', render: (v: number) => <AmountText value={v} size="sm" /> },
            { title: t('wallet.lastLogin'), dataIndex: 'lastLoginAt', render: formatDateTime },
          ]}
        />
      </PageSection>
    </div>
  );
}
