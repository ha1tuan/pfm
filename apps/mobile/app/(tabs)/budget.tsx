import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Gift, Home, Laptop, Plane, Plus, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';
import { useActivity, useAddManualEntry, useBudgets, useGoals } from '@/api/queries';
import { AmountText } from '@/components/finance/AmountText';
import { CATEGORY_STYLE, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/components/finance/category';
import { Donut } from '@/components/finance/Donut';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen, ScreenHeader, ScrollBody, SectionTitle } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tag';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import type { CategoryId, Goal } from '@/domain/types';
import { t } from '@/i18n';
import { formatVndCompact, formatVndDigits, parseDigits } from '@/lib/format';
import { spendingSince } from '@/lib/spending';
import { absoluteFill, colors, fonts, noWebOutline } from '@/theme/tokens';

type Period = 'week' | 'month' | 'year';

const GOAL_ICON: Record<Goal['icon'], LucideIcon> = { plane: Plane, laptop: Laptop, home: Home, gift: Gift };

function periodStart(period: Period): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'week') d.setDate(d.getDate() - 6);
  if (period === 'month') d.setDate(1);
  if (period === 'year') d.setMonth(0, 1);
  return d;
}

const entrySchema = z.object({
  kind: z.enum(['expense', 'income']),
  amount: z.number().int().positive(t('budget.amountRequired')),
  categoryId: z.custom<CategoryId>(),
  note: z.string().trim().max(80),
});
type EntryForm = z.infer<typeof entrySchema>;

function ManualEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useAddManualEntry();
  const client = useQueryClient();
  const toast = useToast((s) => s.show);
  const { control, handleSubmit, watch, setValue, formState, reset } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: { kind: 'expense', amount: 0, categoryId: 'food', note: '' },
  });
  const kind = watch('kind');
  const categories = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const save = handleSubmit(async ({ kind: k, amount, categoryId, note }) => {
    await add.mutateAsync({ amount: k === 'expense' ? -amount : amount, categoryId, note, occurredAt: new Date().toISOString() });
    await client.invalidateQueries({ queryKey: ['activity'] });
    toast(t('budget.entrySaved'));
    reset();
    onClose();
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('budget.entryTitle')}
      description={t('budget.entrySub')}
      actions={<Button label={t('budget.entrySave')} size="lg" fullWidth loading={add.isPending} onPress={save} />}
    >
      <View style={styles.form}>
        <Segmented<EntryForm['kind']>
          value={kind}
          onChange={(k) => {
            setValue('kind', k);
            setValue('categoryId', k === 'expense' ? 'food' : 'income');
          }}
          items={[
            { value: 'expense', label: t('budget.expense') },
            { value: 'income', label: t('budget.income') },
          ]}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <View>
              <Text variant="label">{t('budget.entryAmount')}</Text>
              <TextInput
                value={field.value ? formatVndDigits(field.value) : ''}
                onChangeText={(v) => field.onChange(parseDigits(v))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.neutral300}
                style={styles.entryAmount}
                accessibilityLabel={t('budget.entryAmount')}
              />
              {formState.errors.amount ? (
                <Text variant="caption" color={colors.red600}>
                  {formState.errors.amount.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <View>
              <Text variant="label">{t('budget.entryCategory')}</Text>
              <View style={styles.tags}>
                {categories.map((c) => (
                  <Tag key={c} label={t(`category.${c}`)} icon={CATEGORY_STYLE[c].icon} selected={field.value === c} onPress={() => field.onChange(c)} />
                ))}
              </View>
            </View>
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <Input label={t('budget.entryNote')} placeholder={t('budget.entryNotePlaceholder')} value={field.value} onChangeText={field.onChange} />
          )}
        />
      </View>
    </Sheet>
  );
}

export default function BudgetScreen() {
  const params = useLocalSearchParams<{ entry?: string }>();
  const [period, setPeriod] = useState<Period>('month');
  const [entryOpen, setEntryOpen] = useState(false);
  const { data: activity = [] } = useActivity();
  const { data: budgets = [] } = useBudgets();
  const { data: goals = [] } = useGoals();

  useEffect(() => {
    if (params.entry) setEntryOpen(true);
  }, [params.entry]);

  const totals = spendingSince(activity, periodStart(period));
  const budgeted = budgets.map((b) => ({ ...b, spent: totals.get(b.categoryId) ?? 0 }));
  const spent = budgeted.reduce((s, b) => s + b.spent, 0);
  const limit = budgets.reduce((s, b) => s + b.limit, 0);
  const month = new Date().getMonth() + 1;

  return (
    <Screen>
      <ScreenHeader
        showBack={false}
        title={t('budget.title')}
        right={<Button label={t('budget.addEntry')} size="sm" variant="secondary" iconLeft={Plus} onPress={() => setEntryOpen(true)} />}
      />
      <ScrollBody>
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          items={[
            { value: 'week', label: t('budget.week') },
            { value: 'month', label: t('budget.month') },
            { value: 'year', label: t('budget.year') },
          ]}
        />

        <Card padding={20} style={styles.summary}>
          <View style={styles.donut}>
            <Donut
              parts={budgeted.filter((b) => b.spent > 0).map((b) => ({ key: b.categoryId, value: b.spent, color: CATEGORY_STYLE[b.categoryId].fg }))}
              size={140}
              stroke={18}
            />
            <View style={styles.donutCenter}>
              <Text variant="caption">{t('budget.spent')}</Text>
              <Text style={styles.donutValue}>{formatVndCompact(spent)}</Text>
              {period === 'month' ? <Text variant="caption" color={colors.textSubtle}>/ {formatVndCompact(limit)}</Text> : null}
            </View>
          </View>
          <View style={styles.legend}>
            {budgeted.map((b) => (
              <View key={b.categoryId} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: CATEGORY_STYLE[b.categoryId].fg }]} />
                <Text variant="caption" color={colors.textBody} style={styles.flex}>
                  {t(`category.${b.categoryId}`)}
                </Text>
                <Text style={styles.legendPct}>{spent ? Math.round((b.spent / spent) * 100) : 0}%</Text>
              </View>
            ))}
          </View>
        </Card>

        <SectionTitle title={t('budget.budgetsTitle', { month })} action={t('budget.edit')} />
        <Card padding={{ vertical: 4, horizontal: 16 }}>
          {budgeted.map((b, i) => {
            const { icon: Icon, bg, fg } = CATEGORY_STYLE[b.categoryId];
            const over = b.spent > b.limit;
            return (
              <View key={b.categoryId} style={[styles.budgetRow, i < budgeted.length - 1 ? styles.divider : null]}>
                <View style={styles.budgetHead}>
                  <View style={[styles.tile, { backgroundColor: bg }]}>
                    <Icon size={20} color={fg} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.nameRow}>
                      <Text variant="bodyStrong">{t(`category.${b.categoryId}`)}</Text>
                      {over ? <Badge label={t('budget.over')} tone="danger" size="sm" /> : null}
                    </View>
                    <Text variant="caption">
                      {over
                        ? t('budget.overBy', { amount: formatVndCompact(b.spent - b.limit) })
                        : t('budget.left', { amount: formatVndCompact(b.limit - b.spent) })}
                    </Text>
                  </View>
                  <AmountText value={b.spent} size="sm" />
                </View>
                <ProgressBar value={b.spent} max={b.limit} height={6} style={styles.budgetBar} />
              </View>
            );
          })}
        </Card>

        <SectionTitle title={t('budget.goalsTitle')} action={t('budget.addGoal')} />
        <View style={styles.goals}>
          {goals.map((g, i) => {
            const Icon = GOAL_ICON[g.icon];
            const inverse = i % 2 === 0;
            return (
              <Card key={g.id} variant={inverse ? 'inverse' : 'tint'} padding={16} style={styles.flex}>
                <Icon size={22} color={inverse ? colors.gold400 : colors.green700} />
                <Text variant="bodyStrong" color={inverse ? '#fff' : colors.green900} style={styles.goalName}>
                  {g.name}
                </Text>
                <Text variant="caption" color={inverse ? colors.green200 : colors.green700}>
                  {t('budget.goalProgress', { saved: formatVndCompact(g.saved), target: formatVndCompact(g.target) })}
                </Text>
                <ProgressBar
                  value={g.saved}
                  max={g.target}
                  height={6}
                  color={inverse ? colors.gold400 : colors.green500}
                  track={inverse ? 'rgba(255,255,255,0.14)' : 'rgba(6,78,59,0.1)'}
                  style={styles.goalBar}
                />
              </Card>
            );
          })}
        </View>
      </ScrollBody>

      <ManualEntrySheet open={entryOpen} onClose={() => setEntryOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 18 },
  donut: { width: 140, height: 140 },
  donutCenter: { ...absoluteFill, alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.4, color: colors.textHeading },
  legend: { flex: 1, gap: 8, minWidth: 0 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 4 },
  legendPct: { fontFamily: fonts.bold, fontSize: 13, color: colors.textStrong },
  budgetRow: { paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  budgetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetBar: { marginTop: 10, marginLeft: 52 },
  goals: { flexDirection: 'row', gap: 10 },
  goalName: { marginTop: 10 },
  goalBar: { marginTop: 10 },
  form: { gap: 16 },
  entryAmount: { ...noWebOutline, fontFamily: fonts.extrabold, fontSize: 32, letterSpacing: -0.6, color: colors.textHeading, paddingVertical: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
