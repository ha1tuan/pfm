import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { t } from '@/i18n';
import { colors, gutter } from '@/theme/tokens';
import { IconButton } from './Button';
import { Text } from './Text';

interface ScreenProps {
  children: ReactNode;
  /** Bottom edge is left to tab bars / bottom CTA bars. */
  edges?: Edge[];
  background?: string;
}

export function Screen({ children, edges = ['top'], background = colors.surfacePage }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: background }]}>
      {children}
    </SafeAreaView>
  );
}

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Tab roots pass false: they have no back destination. */
  showBack?: boolean;
  right?: ReactNode;
  dark?: boolean;
}

export function ScreenHeader({ title, onBack, showBack = true, right, dark }: ScreenHeaderProps) {
  const back = !showBack ? undefined : (onBack ?? (router.canGoBack() ? () => router.back() : undefined));
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton icon={ChevronLeft} label={t('common.back')} variant={dark ? 'glass' : 'ghost'} onPress={back} />
      ) : (
        <View style={styles.spacer} />
      )}
      <Text variant="title" align="center" color={dark ? '#fff' : undefined} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

export function ScrollBody({
  children,
  padded = true,
  contentStyle,
}: {
  children: ReactNode;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padded ? styles.padded : null, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text variant="label" color={colors.green600}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Fixed CTA bar pinned above the home indicator. */
export function BottomBar({ children }: { children: ReactNode }) {
  return <SafeAreaView edges={['bottom']} style={styles.bottomBar}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, minHeight: 52 },
  title: { flex: 1 },
  spacer: { width: 44 },
  padded: { paddingHorizontal: gutter, paddingBottom: 32 },
  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: gutter,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
