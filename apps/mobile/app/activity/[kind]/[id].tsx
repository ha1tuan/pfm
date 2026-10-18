import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Copy, Share2, Tag as TagIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';
import { useManualEntry, useSetCategory, useTransaction } from '@/api/queries';
import { AmountText } from '@/components/finance/AmountText';
import { CATEGORY_STYLE, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/components/finance/category';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen, ScreenHeader, ScrollBody } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tag';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import type { ActivityItem, CategoryId, TransactionStatus } from '@/domain/types';
import { SummaryRow } from '@/features/transfer/ConfirmStep';
import { t } from '@/i18n';
import { formatDate, formatTime, formatVnd } from '@/lib/format';
import { colors, fonts, radius } from '@/theme/tokens';

const STATUS_TONE: Record<TransactionStatus, BadgeTone> = {
  initiated: 'neutral',
  pendingAuth: 'info',
  processing: 'warning',
  succeeded: 'success',
  failed: 'danger',
  reversed: 'neutral',
};

function useActivityItem(kind: ActivityItem['kind'], id: string): ActivityItem | undefined {
  const tx = useTransaction(kind === 'transaction' ? id : '');
  const entry = useManualEntry(kind === 'manualEntry' ? id : '');
  if (kind === 'transaction' && tx.data) return { kind, at: tx.data.createdAt, item: tx.data };
  if (kind === 'manualEntry' && entry.data) return { kind, at: entry.data.occurredAt, item: entry.data };
  return undefined;
}

function CategorySheet({ activity, open, onClose }: { activity: ActivityItem; open: boolean; onClose: () => void }) {
  const setCategory = useSetCategory();
  const toast = useToast((s) => s.show);
  const options = activity.item.amount < 0 ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const pick = async (categoryId: CategoryId) => {
    await setCategory.mutateAsync({ kind: activity.kind, id: activity.item.id, categoryId });
    toast(t('detail.categoryChanged'));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('detail.changeCategory')}>
      <View style={styles.tags}>
        {options.map((c) => (
          <Tag key={c} label={t(`category.${c}`)} icon={CATEGORY_STYLE[c].icon} selected={activity.item.categoryId === c} onPress={() => pick(c)} />
        ))}
      </View>
    </Sheet>
  );
}

export default function ActivityDetailScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: ActivityItem['kind']; id: string }>();
  const activity = useActivityItem(kind, id);
  const toast = useToast((s) => s.show);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const isTx = kind === 'transaction';

  if (!activity) {
    return (
      <Screen>
        <ScreenHeader title={t(isTx ? 'detail.title' : 'detail.manualTitle')} />
        <ActivityIndicator color={colors.green600} style={styles.loading} />
      </Screen>
    );
  }

  const { icon: Icon, bg, fg } = CATEGORY_STYLE[activity.item.categoryId];
  const when = `${formatTime(activity.at)}, ${formatDate(activity.at)}`;
  const rows: [string, string][] =
    activity.kind === 'transaction'
      ? [
          [t('detail.time'), when],
          [t('detail.type'), t(`txType.${activity.item.type}`)],
          [t('detail.category'), t(`category.${activity.item.categoryId}`)],
          [t('detail.counterparty'), activity.item.counterpartyDetail],
          [t('detail.source'), t('common.walletName')],
          [t('detail.fee'), activity.item.fee ? formatVnd(activity.item.fee) : t('common.free')],
          ...(activity.item.note ? ([[t('detail.note'), activity.item.note]] as [string, string][]) : []),
        ]
      : [
          [t('detail.time'), when],
          [t('detail.category'), t(`category.${activity.item.categoryId}`)],
        ];
  const title = activity.kind === 'transaction' ? activity.item.counterpartyName : activity.item.note || t(`category.${activity.item.categoryId}`);

  const copyRef = async () => {
    await Clipboard.setStringAsync(activity.item.id);
    toast(t('common.copied'));
  };

  return (
    <Screen>
      <ScreenHeader title={t(isTx ? 'detail.title' : 'detail.manualTitle')} />
      <ScrollBody>
        <Card padding={24} style={styles.hero}>
          <View style={[styles.tile, { backgroundColor: bg }]}>
            <Icon size={28} color={fg} />
          </View>
          <Text variant="bodyStrong" color={colors.textBody} align="center" style={styles.title}>
            {title}
          </Text>
          <AmountText value={activity.item.amount} signed size="xl" />
          {activity.kind === 'transaction' ? (
            <Badge label={t(`txStatus.${activity.item.status}`)} tone={STATUS_TONE[activity.item.status]} dot />
          ) : (
            <Badge label={t('statement.manualBadge')} tone="neutral" />
          )}
        </Card>

        <Card padding={{ vertical: 4, horizontal: 20 }} style={styles.facts}>
          {rows.map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} />
          ))}
          {isTx ? (
            <Pressable onPress={copyRef} style={styles.refRow} accessibilityRole="button" accessibilityLabel={t('detail.copyRef')}>
              <Text variant="bodySm" style={styles.refLabel}>
                {t('detail.ref')}
              </Text>
              <View style={styles.refValue}>
                <Text style={styles.ref}>{activity.item.id}</Text>
                <Copy size={15} color={colors.green600} />
              </View>
            </Pressable>
          ) : null}
        </Card>

        {!isTx ? (
          <Text variant="caption" align="center" style={styles.manualNote}>
            {t('detail.manualNote')}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label={t('detail.changeCategory')} variant="secondary" iconLeft={TagIcon} fullWidth onPress={() => setCategoryOpen(true)} />
          {isTx ? (
            <Button
              label={t('common.share')}
              variant="secondary"
              iconLeft={Share2}
              fullWidth
              onPress={() => Share.share({ message: `${title} · ${formatVnd(activity.item.amount)} · ${activity.item.id}` })}
            />
          ) : null}
        </View>
      </ScrollBody>
      <CategorySheet activity={activity} open={categoryOpen} onClose={() => setCategoryOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 48 },
  hero: { alignItems: 'center', gap: 8 },
  tile: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 6 },
  facts: { marginTop: 12 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  refLabel: { fontSize: 14 },
  refValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ref: { fontFamily: fonts.mono, fontSize: 13, color: colors.textStrong },
  manualNote: { marginTop: 12, paddingHorizontal: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, borderRadius: radius.pill },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
