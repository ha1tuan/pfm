import { Input, Select, Table } from 'antd';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useAudit, type AuditQuery } from '@/api/queries';
import { Badge, type BadgeTone } from '@/components/Badge/Badge';
import { PersonAvatar } from '@/components/PersonAvatar/PersonAvatar';
import type { AuditAction, AuditEntry, StaffRole } from '@/domain/types';
import { t } from '@/i18n';
import { formatDateTimeSeconds, formatNumber } from '@/lib/format';
import styles from './AuditPage.module.scss';

const ACTION_TONE: Record<AuditAction, BadgeTone> = {
  login: 'neutral',
  view: 'neutral',
  create: 'brand',
  approve: 'success',
  reject: 'warning',
  lock: 'danger',
  unlock: 'info',
  reverse: 'warning',
  kycApprove: 'success',
};

const ACTIONS = Object.keys(ACTION_TONE) as AuditAction[];
const ROLES: (StaffRole | 'system')[] = ['admin', 'operations', 'control', 'system'];
const PAGE_SIZE = 12;

export function AuditPage() {
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState<AuditAction>();
  const [role, setRole] = useState<StaffRole | 'system'>();
  const [page, setPage] = useState(1);
  const query: AuditQuery = { keyword: keyword || undefined, action, role, page, pageSize: PAGE_SIZE };
  const { data, isFetching } = useAudit(query);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        <label className={styles.field} data-grow="2">
          <span>{t('audit.search')}</span>
          <Input
            prefix={<Search size={16} className={styles.muted} />}
            placeholder={t('audit.searchPlaceholder')}
            value={keyword}
            onChange={(e) => reset(setKeyword)(e.target.value)}
            allowClear
          />
        </label>
        <label className={styles.field}>
          <span>{t('audit.action')}</span>
          <Select<AuditAction | undefined>
            allowClear
            placeholder={t('common.all')}
            value={action}
            onChange={reset(setAction)}
            options={ACTIONS.map((a) => ({ value: a, label: t(`audit.actions.${a}`) }))}
          />
        </label>
        <label className={styles.field}>
          <span>{t('audit.role')}</span>
          <Select<StaffRole | 'system' | undefined>
            allowClear
            placeholder={t('common.all')}
            value={role}
            onChange={reset(setRole)}
            options={ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))}
          />
        </label>
      </div>

      <Table<AuditEntry>
        className={styles.table}
        rowKey="id"
        loading={isFetching}
        dataSource={data?.items}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total, [from, to]) => t('common.showing', { from, to, total: formatNumber(total) }),
        }}
        columns={[
          { title: t('audit.at'), dataIndex: 'at', width: 190, render: (at: string) => <span className={styles.mono}>{formatDateTimeSeconds(at)}</span> },
          {
            title: t('audit.actor'),
            dataIndex: 'actorName',
            render: (_: string, e) => (
              <div className={styles.actor}>
                <PersonAvatar name={e.actorName} size="sm" />
                <div>
                  <div className={styles.strong}>{e.actorName}</div>
                  {e.actorRole ? <div className={styles.role}>{t(`role.${e.actorRole}`)}</div> : null}
                </div>
              </div>
            ),
          },
          {
            title: t('audit.action'),
            dataIndex: 'action',
            width: 140,
            render: (a: AuditAction) => (
              <Badge size="sm" tone={ACTION_TONE[a]} mono>
                {t(`audit.actions.${a}`)}
              </Badge>
            ),
          },
          { title: t('audit.target'), dataIndex: 'target', render: (v: string) => <span className={styles.target}>{v}</span> },
          { title: t('audit.change'), dataIndex: 'change', render: (v: string) => <code className={styles.change}>{v}</code> },
          { title: t('audit.ip'), dataIndex: 'ip', width: 120, render: (v: string) => <span className={styles.mono}>{v}</span> },
        ]}
      />
    </div>
  );
}
