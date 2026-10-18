import { router } from 'expo-router';
import type { ActivityItem } from '@/domain/types';

export function openActivity(a: ActivityItem) {
  router.push({ pathname: '/activity/[kind]/[id]', params: { kind: a.kind, id: a.item.id } });
}
