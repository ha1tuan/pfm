import { Calendar, Download, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useActivity } from '@/api/queries';
import { ActivityRow } from '@/components/finance/ActivityRow';
import { AmountText } from '@/components/finance/AmountText';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/components/finance/category';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader, ScrollBody } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tag';
import { Text } from '@/components/ui/Text';
import type { ActivityItem, CategoryId } from '@/domain/types';
import { t } from '@/i18n';
import { formatVndDigits, parseDigits, relativeDay } from '@/lib/format';
import { openActivity } from '@/lib/navigation';
import { colors } from '@/theme/tokens';

type Direction = 'all' | 'in' | 'out';
type Period = 'last7' | 'thisMonth' | 'lastMonth';

interface Filters {
  period: Period;
  categories: CategoryId[];
  min: number;
  max: number;
}

const DEFAULT_FILTERS: Filters = { period: 'thisMonth', categories: [], min: 0, max: 0 };
const PERIODS: Period[] = ['last7', 'thisMonth', 'lastMonth'];

function inPeriod(iso: string, period: Period): boolean {
  const d = new Date(iso);
  const now = new Date();
  if (period === 'last7') return now.getTime() - d.getTime() <= 7 * 86_400_000;
  const month = period === 'thisMonth' ? now.getMonth() : now.getMonth() - 1;
  const ref = new Date(now.getFullYear(), month, 1);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function FilterSheet({ open, value, onClose, onApply }: { open: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState(value);
  const toggle = (c: CategoryId) =>
    setDraft((d) => ({ ...d, categories: d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c] }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('statement.filterTitle')}
      actions={
        <>
          <Button label={t('common.reset')} variant="outline" fullWidth onPress={() => setDraft(DEFAULT_FILTERS)} />
          <Button label={t('common.apply')} fullWidth onPress={() => onApply(draft)} />
        </>
      }
    >
      <Text variant="label">{t('statement.period')}</Text>
      <View style={styles.wrap}>
        {PERIODS.map((p) => (
          <Tag key={p} label={t(`statement.${p}`)} selected={draft.period === p} onPress={() => setDraft({ ...draft, period: p })} />
        ))}
      </View>
      <Text variant="label" style={styles.sheetLabel}>
        {t('statement.categories')}
      </Text>
      <View style={styles.wrap}>
        {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
          <Tag key={c} label={t(`category.${c}`)} selected={draft.categories.includes(c)} onPress={() => toggle(c)} />
        ))}
      </View>
      <View style={styles.range}>
        <View style={styles.flex}>
          <Input
            size="sm"
            label={t('statement.amountFrom')}
            keyboardType="number-pad"
            placeholder="0"
            value={draft.min ? formatVndDigits(draft.min) : ''}
            onChangeText={(v) => setDraft({ ...draft, min: parseDigits(v) })}
          />
        </View>
        <View style={styles.flex}>
          <Input
            size="sm"
            label={t('statement.amountTo')}
            keyboardType="number-pad"
            placeholder={t('statement.noLimit')}
            value={draft.max ? formatVndDigits(draft.max) : ''}
            onChangeText={(v) => setDraft({ ...draft, max: parseDigits(v) })}
          />
        </View>
      </View>
    </Sheet>
  );
}

export default function StatementScreen() {
  const { data: activity = [] } = useActivity();
  const [direction, setDirection] = useState<Direction>('all');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState(false);

  const list = useMemo(
    () =>
      activity.filter((a) => {
        const amount = a.item.amount;
        const abs = Math.abs(amount);
        return (
          (direction === 'all' || (direction === 'in' ? amount > 0 : amount < 0)) &&
          inPeriod(a.at, filters.period) &&
          (!filters.categories.length || filters.categories.includes(a.item.categoryId)) &&
          (!filters.min || abs >= filters.min) &&
          (!filters.max || abs <= filters.max)
        );
      }),
    [activity, direction, filters],
  );

  const walletTx = list.filter((a) => a.kind === 'transaction' && a.item.status !== 'failed');
  const sumIn = walletTx.filter((a) => a.item.amount > 0).reduce((s, a) => s + a.item.amount, 0);
  const sumOut = walletTx.filter((a) => a.item.amount < 0).reduce((s, a) => s + a.item.amount, 0);

  const groups = new Map<string, ActivityItem[]>();
  for (const a of list) {
    const key = relativeDay(a.at, { today: t('common.today'), yesterday: t('common.yesterday') });
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }

  const activeCount = filters.categories.length + (filters.min || filters.max ? 1 : 0);

  return (
    <Screen>
      <ScreenHeader showBack={false} title={t('statement.title')} right={<IconButton icon={Download} label={t('statement.export')} />} />
      <View style={styles.controls}>
        <Segmented<Direction>
          value={direction}
          onChange={setDirection}
          items={[
            { value: 'all', label: t('statement.all') },
            { value: 'in', label: t('statement.moneyIn') },
            { value: 'out', label: t('statement.moneyOut') },
          ]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Tag
            icon={SlidersHorizontal}
            label={activeCount ? t('statement.filterCount', { count: activeCount }) : t('statement.filter')}
            selected={activeCount > 0}
            onPress={() => setSheet(true)}
          />
          <Tag icon={Calendar} label={t(`statement.${filters.period}`)} onPress={() => setSheet(true)} />
          {filters.categories.map((c) => (
            <Tag
              key={c}
              label={t(`category.${c}`)}
              selected
              onRemove={() => setFilters({ ...filters, categories: filters.categories.filter((x) => x !== c) })}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollBody>
        <View style={styles.totals}>
          <Card variant="tint" padding={14} style={styles.flex}>
            <Text variant="caption" color={colors.green700}>
              {t('statement.moneyIn')}
            </Text>
            <AmountText value={sumIn} size="md" color={colors.green700} />
          </Card>
          <Card variant="sunken" padding={14} style={styles.flex}>
            <Text variant="caption">{t('statement.moneyOut')}</Text>
            <AmountText value={sumOut} size="md" />
          </Card>
        </View>
        <Text variant="caption" style={styles.walletOnly}>
          {t('statement.walletOnly')}
        </Text>

        {[...groups.entries()].map(([day, items]) => (
          <View key={day}>
            <Text variant="overline" style={styles.groupTitle}>
              {day}
            </Text>
            <Card padding={{ vertical: 0, horizontal: 16 }}>
              {items.map((a, i) => (
                <ActivityRow key={a.item.id} activity={a} divider={i < items.length - 1} onPress={() => openActivity(a)} />
              ))}
            </Card>
          </View>
        ))}
        {!list.length ? (
          <Text variant="body" align="center" color={colors.textMuted} style={styles.empty}>
            {t('statement.empty')}
          </Text>
        ) : null}
      </ScrollBody>

      <FilterSheet
        key={sheet ? 'open' : 'closed'}
        open={sheet}
        value={filters}
        onClose={() => setSheet(false)}
        onApply={(f) => {
          setFilters(f);
          setSheet(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  chips: { gap: 8 },
  totals: { flexDirection: 'row', gap: 10 },
  walletOnly: { marginTop: 8 },
  groupTitle: { marginTop: 20, marginBottom: 4 },
  empty: { paddingVertical: 48 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  sheetLabel: { marginTop: 18 },
  range: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
