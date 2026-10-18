import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { ActivityItem } from '@/domain/types';
import { t } from '@/i18n';
import { formatTime, relativeDay } from '@/lib/format';
import { colors, fonts, radius } from '@/theme/tokens';
import { AmountText } from './AmountText';
import { CATEGORY_STYLE } from './category';

/** One line in Home/Statement: a Transaction or a Manual Entry. */
export function ActivityRow({ activity, divider, onPress }: { activity: ActivityItem; divider?: boolean; onPress?: () => void }) {
  const { icon: Icon, bg, fg } = CATEGORY_STYLE[activity.item.categoryId];
  const isTx = activity.kind === 'transaction';
  const title = isTx ? activity.item.counterpartyName : activity.item.note || t(`category.${activity.item.categoryId}`);
  const day = relativeDay(activity.at, { today: t('common.today'), yesterday: t('common.yesterday') });
  const subtitle = `${day} · ${formatTime(activity.at)}`;
  const status = isTx ? activity.item.status : undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, divider ? styles.divider : null, pressed ? styles.pressed : null]}
    >
      <View style={[styles.tile, { backgroundColor: bg }]}>
        <Icon size={21} color={fg} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.subRow}>
          {!isTx ? <Text style={styles.manual}>{t('statement.manualBadge')}</Text> : null}
          <Text variant="caption" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.trailing}>
        <AmountText value={activity.item.amount} signed size="md" struck={status === 'failed'} />
        {status === 'processing' ? <Text style={[styles.status, { color: colors.gold600 }]}>{t('txStatus.processing')}</Text> : null}
        {status === 'failed' ? <Text style={[styles.status, { color: colors.red500 }]}>{t('txStatus.failed')}</Text> : null}
        {status === 'reversed' ? <Text style={[styles.status, { color: colors.textMuted }]}>{t('txStatus.reversed')}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  pressed: { opacity: 0.85 },
  tile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitle: { flexShrink: 1 },
  manual: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.neutral600,
    backgroundColor: colors.neutral50,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  trailing: { alignItems: 'flex-end', gap: 2 },
  status: { fontFamily: fonts.semibold, fontSize: 11 },
});
