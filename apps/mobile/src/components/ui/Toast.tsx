import { CircleCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, radius, shadows } from '@/theme/tokens';
import { Text } from './Text';

interface ToastState {
  current: { title: string; message?: string } | null;
  show: (title: string, message?: string) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  current: null,
  show: (title, message) => {
    clearTimeout(timer);
    set({ current: { title, message } });
    timer = setTimeout(() => set({ current: null }), 2400);
  },
}));

/** Mounted once in the root layout. */
export function ToastHost() {
  const current = useToast((s) => s.current);
  const insets = useSafeAreaInsets();
  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 96 }]} accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <CircleCheck size={22} color={colors.green400} />
        <View style={styles.text}>
          <Text variant="bodyStrong" color="#fff">
            {current.title}
          </Text>
          {current.message ? (
            <Text variant="caption" color={colors.green200}>
              {current.message}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 20, right: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.green900,
    ...shadows.lg,
  },
  text: { flex: 1, gap: 2 },
});
