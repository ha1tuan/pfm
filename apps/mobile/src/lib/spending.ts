import type { ActivityItem, CategoryId } from '@/domain/types';

/** Outflows per Category since `start`: Transactions that did not fail, plus Manual Entries. */
export function spendingSince(activity: ActivityItem[], start: Date): Map<CategoryId, number> {
  const totals = new Map<CategoryId, number>();
  for (const a of activity) {
    if (new Date(a.at) < start || a.item.amount >= 0) continue;
    if (a.kind === 'transaction' && a.item.status === 'failed') continue;
    totals.set(a.item.categoryId, (totals.get(a.item.categoryId) ?? 0) - a.item.amount);
  }
  return totals;
}

export function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
