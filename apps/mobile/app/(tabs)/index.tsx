import { router } from 'expo-router';
import {
  ArrowDownToLine,
  Bell,
  ChartPie,
  Landmark,
  NotebookPen,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useActivity, useBudgets, useWallet } from '@/api/queries';
import { ActivityRow } from '@/components/finance/ActivityRow';
import { BalanceCard } from '@/components/finance/BalanceCard';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen, ScrollBody, SectionTitle } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { t, type I18nKey } from '@/i18n';
import { formatVndCompact } from '@/lib/format';
import { openActivity } from '@/lib/navigation';
import { spendingSince, startOfMonth } from '@/lib/spending';
import { colors, fonts, shadows } from '@/theme/tokens';

function greetingKey(): I18nKey {
  const h = new Date().getHours();
  if (h < 11) return 'home.greetingMorning';
  if (h < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

const SHORTCUTS: { icon: LucideIcon; label: I18nKey; go: () => void }[] = [
  { icon: Send, label: 'home.transfer', go: () => router.push('/transfer') },
  { icon: Plus, label: 'home.topUp', go: () => router.push({ pathname: '/move-money', params: { mode: 'topUp' } }) },
  { icon: ArrowDownToLine, label: 'home.withdraw', go: () => router.push({ pathname: '/move-money', params: { mode: 'withdrawal' } }) },
  { icon: Landmark, label: 'home.accounts', go: () => router.navigate('/accounts') },
  { icon: ReceiptText, label: 'home.statement', go: () => router.navigate('/statement') },
  { icon: ChartPie, label: 'home.budget', go: () => router.navigate('/budget') },
  { icon: PiggyBank, label: 'home.goals', go: () => router.navigate('/budget') },
  { icon: NotebookPen, label: 'home.manualEntry', go: () => router.navigate({ pathname: '/budget', params: { entry: '1' } }) },
];

function BudgetInsight() {
  const { data: activity } = useActivity();
  const { data: budgets } = useBudgets();
  if (!budgets) return null;
  const totals = spendingSince(activity ?? [], startOfMonth());
  const spent = budgets.reduce((sum, b) => sum + (totals.get(b.categoryId) ?? 0), 0);
  const limit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const over = spent > limit;
  return (
    <Card variant="tint" style={styles.insight} onPress={() => router.navigate('/budget')}>
      <View style={styles.insightIcon}>
        <Sparkles size={22} color={colors.green950} />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong" color={colors.green900}>
          {t('home.insightTitle', { spent: formatVndCompact(spent), budget: formatVndCompact(limit) })}
        </Text>
        <ProgressBar value={spent} max={limit} height={6} track="rgba(6,78,59,0.1)" style={styles.insightBar} />
        <Text variant="caption" color={colors.green700}>
          {over
            ? t('home.insightOver', { over: formatVndCompact(spent - limit) })
            : t('home.insightBody', { left: formatVndCompact(limit - spent) })}
        </Text>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const { data: wallet } = useWallet();
  const { data: activity } = useActivity();
  const recent = (activity ?? []).slice(0, 4);

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={wallet?.ownerName ?? ' '} ring size={40} />
        <View style={styles.flex}>
          <Text variant="caption">{t(greetingKey())}</Text>
          <Text variant="title">{wallet?.ownerName.split(' ').slice(-2).join(' ')}</Text>
        </View>
        <IconButton icon={Search} label={t('statement.title')} variant="outline" size={42} onPress={() => router.navigate('/statement')} />
        <IconButton icon={Bell} label={t('home.notifications')} variant="outline" size={42} badge />
      </View>

      <ScrollBody>
        <BalanceCard
          available={wallet?.availableBalance ?? 0}
          held={wallet?.heldBalance ?? 0}
          actions={[
            { label: t('home.transfer'), icon: Send, primary: true, onPress: SHORTCUTS[0].go },
            { label: t('home.topUp'), icon: Plus, onPress: SHORTCUTS[1].go },
            { label: t('home.withdraw'), icon: ArrowDownToLine, onPress: SHORTCUTS[2].go },
          ]}
        />

        <View style={styles.grid}>
          {SHORTCUTS.slice(3).map(({ icon: Icon, label, go }) => (
            <Pressable key={label} onPress={go} style={styles.shortcut} accessibilityRole="button">
              <View style={styles.shortcutTile}>
                <Icon size={22} color={colors.green700} />
              </View>
              <Text style={styles.shortcutLabel}>{t(label)}</Text>
            </Pressable>
          ))}
        </View>

        <BudgetInsight />

        <SectionTitle title={t('home.recent')} action={t('common.viewAll')} onAction={() => router.navigate('/statement')} />
        <Card padding={{ vertical: 0, horizontal: 16 }}>
          {recent.map((a, i) => (
            <ActivityRow key={a.item.id} activity={a} divider={i < recent.length - 1} onPress={() => openActivity(a)} />
          ))}
        </Card>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, marginTop: 20 },
  shortcut: { width: '20%', alignItems: 'center', gap: 6 },
  shortcutTile: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  shortcutLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textBody, textAlign: 'center' },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20 },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.gold400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBar: { marginVertical: 8 },
});
