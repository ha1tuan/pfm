import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { ChartPie, House, Landmark, ReceiptText, Send, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { t, type I18nKey } from '@/i18n';
import { colors, fonts, shadows } from '@/theme/tokens';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: I18nKey; icon: LucideIcon }> = {
  index: { label: 'nav.home', icon: House },
  budget: { label: 'nav.budget', icon: ChartPie },
  statement: { label: 'nav.statement', icon: ReceiptText },
  accounts: { label: 'nav.accounts', icon: Landmark },
};

/** Frosted bottom nav with the raised green Transfer action in the middle. */
function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const half = Math.ceil(state.routes.length / 2);

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const meta = TABS[route.name];
    if (!meta) return null;
    const on = state.index === index;
    const Icon = meta.icon;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => !on && navigation.navigate(route.name)}
        style={styles.tab}
      >
        <Icon size={24} strokeWidth={on ? 2.4 : 2} color={on ? colors.green700 : colors.neutral400} />
        <Text style={[styles.tabLabel, { color: on ? colors.green700 : colors.neutral400, fontFamily: on ? fonts.bold : fonts.medium }]}>
          {t(meta.label)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
      {state.routes.slice(0, half).map((_, i) => renderTab(i))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('nav.transfer')}
        onPress={() => router.push('/transfer')}
        style={({ pressed }) => [styles.center, pressed ? styles.centerPressed : null]}
      >
        <Send size={24} color="#fff" />
      </Pressable>
      {state.routes.slice(half).map((_, i) => renderTab(i + half))}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="statement" />
      <Tabs.Screen name="accounts" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.94)' : '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8 },
  tabLabel: { fontSize: 11, lineHeight: 14 },
  center: {
    width: 56,
    height: 56,
    marginTop: -26,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: colors.green600,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.brand,
  },
  centerPressed: { transform: [{ scale: 0.97 }] },
});
