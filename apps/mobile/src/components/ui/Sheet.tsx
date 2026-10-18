import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { absoluteFill, colors, radius, shadows } from '@/theme/tokens';
import { Text } from './Text';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Bottom sheet: 28pt top corners, grab handle, scrim tap closes. */
export function Sheet({ open, onClose, title, description, icon: Icon, actions, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={title} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {Icon ? (
              <View style={styles.icon}>
                <Icon size={28} color={colors.green600} />
              </View>
            ) : null}
            <Text variant="h3">{title}</Text>
            {description ? (
              <Text variant="bodySm" style={styles.description}>
                {description}
              </Text>
            ) : null}
            {children ? <View style={styles.body}>{children}</View> : null}
          </ScrollView>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
    paddingHorizontal: 20,
    ...shadows.lg,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.neutral200, marginBottom: 16 },
  content: { paddingBottom: 4 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  description: { marginTop: 6 },
  body: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
