import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, DatePicker, Form, Input, Modal, Table, Tooltip } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Check, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { currentStaff, staffName } from '@/api/queries';
import { VersionStatusBadge } from '@/components/Badge/Badge';
import { PageSection } from '@/components/PageSection/PageSection';
import type { ConfigVersionStatus } from '@/domain/types';
import { t } from '@/i18n';
import { formatDate, formatDateTime, formatShortDateTime } from '@/lib/format';
import styles from './ConfigVersion.module.scss';

export interface VersionLike {
  id: string;
  version: number;
  status: ConfigVersionStatus;
  effectiveFrom: string;
  makerId: string;
  checkerId?: string;
  createdAt: string;
  note: string;
}

export function MakerCheckerNotice() {
  return (
    <div className={styles.notice}>
      <Info size={18} className={styles.noticeIcon} />
      {t('config.makerChecker')}
    </div>
  );
}

export function CurrentVersionSection({
  version,
  actions,
  children,
}: {
  version?: VersionLike;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageSection
      flush
      title={t('config.current')}
      subtitle={
        version
          ? t('config.currentMeta', { version: `v${version.version}`, date: formatDate(version.effectiveFrom) })
          : undefined
      }
      actions={actions}
    >
      {children}
    </PageSection>
  );
}

interface PendingVersionProps {
  version: VersionLike;
  onDecide: (approve: boolean) => Promise<unknown>;
  deciding: boolean;
  /** Rendering of what this version changes compared to the one in effect. */
  children: ReactNode;
}

export function PendingVersionSection({ version, onDecide, deciding, children }: PendingVersionProps) {
  const { message } = App.useApp();
  const isOwn = version.makerId === currentStaff().id;

  const decide = async (approve: boolean) => {
    await onDecide(approve);
    message.success(t(approve ? 'config.approved' : 'config.rejected', { version: `v${version.version}` }));
  };

  const approve = (
    <Button type="primary" icon={<Check size={16} />} disabled={isOwn} loading={deciding} onClick={() => decide(true)}>
      {t('config.approve')}
    </Button>
  );

  return (
    <PageSection
      className={styles.pending}
      title={t('config.pending')}
      subtitle={t('config.pendingMeta', {
        version: `v${version.version}`,
        maker: staffName(version.makerId),
        createdAt: formatShortDateTime(version.createdAt),
        date: formatDate(version.effectiveFrom),
      })}
      actions={
        <>
          <Button danger icon={<X size={16} />} disabled={isOwn || deciding} onClick={() => decide(false)}>
            {t('config.reject')}
          </Button>
          {isOwn ? <Tooltip title={t('config.ownVersion')}>{approve}</Tooltip> : approve}
        </>
      }
    >
      <p className={styles.note}>“{version.note}”</p>
      <div className={styles.diffLabel}>{t('config.changed')}</div>
      {children}
    </PageSection>
  );
}

export function NoPendingVersion() {
  return <div className={styles.empty}>{t('config.noPending')}</div>;
}

export function VersionHistory({ versions }: { versions: VersionLike[] }) {
  return (
    <PageSection flush title={t('config.history')}>
      <Table<VersionLike>
        rowKey="id"
        size="middle"
        pagination={false}
        dataSource={versions}
        columns={[
          { title: t('config.version'), dataIndex: 'version', width: 100, render: (v: number) => <span className={styles.mono}>v{v}</span> },
          { title: t('tx.status'), dataIndex: 'status', width: 150, render: (s: ConfigVersionStatus) => <VersionStatusBadge status={s} /> },
          { title: t('config.effectiveFrom'), dataIndex: 'effectiveFrom', width: 140, render: formatDate },
          { title: t('config.note'), dataIndex: 'note', render: (n: string) => <span className={styles.strong}>{n}</span> },
          { title: t('config.maker'), dataIndex: 'makerId', width: 160, render: (id: string) => staffName(id) },
          { title: t('config.checker'), dataIndex: 'checkerId', width: 160, render: (id?: string) => (id ? staffName(id) : t('common.none')) },
          { title: t('tx.time'), dataIndex: 'createdAt', width: 160, render: formatDateTime },
        ]}
      />
    </PageSection>
  );
}

const versionMetaSchema = z.object({
  effectiveFrom: z.custom<Dayjs>((v) => dayjs.isDayjs(v), { message: t('config.effectiveFromHint') }),
  note: z.string().trim().min(8, t('config.noteRequired')),
});
type VersionMeta = z.infer<typeof versionMetaSchema>;

interface NewVersionModalProps {
  open: boolean;
  title: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (meta: { effectiveFrom: string; note: string }) => Promise<void>;
  /** The rule editor; its state lives in the caller. */
  children: ReactNode;
}

export function NewVersionModal({ open, title, submitting, onClose, onSubmit, children }: NewVersionModalProps) {
  const tomorrow = dayjs().add(1, 'day').startOf('day');
  const { control, handleSubmit, formState, reset } = useForm<VersionMeta>({
    resolver: zodResolver(versionMetaSchema),
    defaultValues: { effectiveFrom: tomorrow, note: '' },
  });

  const submit = handleSubmit(async ({ effectiveFrom, note }) => {
    await onSubmit({ effectiveFrom: effectiveFrom.startOf('day').toISOString(), note });
    reset({ effectiveFrom: tomorrow, note: '' });
  });

  return (
    <Modal
      open={open}
      title={title}
      width={760}
      okText={t('config.submit')}
      cancelText={t('common.cancel')}
      okButtonProps={{ loading: submitting }}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <div className={styles.editor}>{children}</div>
      <Form layout="vertical" requiredMark={false} className={styles.metaForm}>
        <Form.Item
          label={t('config.effectiveFrom')}
          extra={t('config.effectiveFromHint')}
          validateStatus={formState.errors.effectiveFrom ? 'error' : undefined}
          help={formState.errors.effectiveFrom?.message}
        >
          <Controller
            name="effectiveFrom"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                format="DD/MM/YYYY"
                allowClear={false}
                disabledDate={(d) => d.isBefore(tomorrow)}
                className={styles.fullWidth}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={t('config.note')}
          validateStatus={formState.errors.note ? 'error' : undefined}
          help={formState.errors.note?.message}
        >
          <Controller
            name="note"
            control={control}
            render={({ field }) => <Input {...field} placeholder={t('config.notePlaceholder')} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
