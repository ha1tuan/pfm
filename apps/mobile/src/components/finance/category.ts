import {
  ArrowDownLeft,
  ArrowUpRight,
  Bike,
  Gamepad2,
  PiggyBank,
  Plus,
  Receipt,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import type { CategoryId } from '@/domain/types';
import { colors } from '@/theme/tokens';

/** Each spending Category has an icon and an accent pair (tile background, glyph). */
export const CATEGORY_STYLE: Record<CategoryId, { icon: LucideIcon; bg: string; fg: string }> = {
  food: { icon: Utensils, bg: colors.coral50, fg: colors.coral500 },
  shopping: { icon: ShoppingBag, bg: colors.violet50, fg: colors.violet500 },
  transport: { icon: Bike, bg: colors.blue50, fg: colors.blue500 },
  bills: { icon: Receipt, bg: colors.gold50, fg: colors.gold600 },
  fun: { icon: Gamepad2, bg: colors.pink50, fg: colors.pink500 },
  saving: { icon: PiggyBank, bg: colors.green50, fg: colors.green600 },
  transfer: { icon: ArrowUpRight, bg: colors.neutral50, fg: colors.neutral700 },
  income: { icon: ArrowDownLeft, bg: colors.green50, fg: colors.green600 },
  topUp: { icon: Plus, bg: colors.green50, fg: colors.green600 },
};

export const EXPENSE_CATEGORIES: CategoryId[] = ['food', 'shopping', 'transport', 'bills', 'fun', 'saving', 'transfer'];
export const INCOME_CATEGORIES: CategoryId[] = ['income', 'topUp'];
