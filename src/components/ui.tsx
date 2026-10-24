import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation';
import { useStore } from '../store';
import { ALIGN_END, ROW, TEXT_START } from '../rtl';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// نص عربي يُكتب من اليمين لليسار
export function T({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors } = useStore();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.text, { color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useStore();
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const { colors } = useStore();
  const { back } = useNav();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.bg }]}>
      <Pressable
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        style={[styles.iconBtn, { backgroundColor: colors.card }]}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.text} />
      </Pressable>
      <T style={styles.headerTitle} numberOfLines={1}>
        {title}
      </T>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12 }}>
      <T style={{ fontSize: 26, fontWeight: '700' }}>{title}</T>
      {subtitle ? <T style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>{subtitle}</T> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useStore();
  return <View style={[styles.card, { backgroundColor: colors.card }, style]}>{children}</View>;
}

export function IconButton({
  name,
  onPress,
  label,
  color,
  size = 22,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
}) {
  const { colors } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.iconBtnFlat, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.muted} />
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useStore();
  const bg = variant === 'primary' ? colors.primary : variant === 'dark' ? colors.text : 'transparent';
  const fg = variant === 'outline' ? colors.text : variant === 'dark' ? colors.bg : colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: variant === 'outline' ? colors.border : bg },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  text: { writingDirection: 'rtl', textAlign: TEXT_START, fontSize: 15 },
  header: {
    flexDirection: ROW,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  headerRight: { minWidth: 44, alignItems: ALIGN_END },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconBtnFlat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F3D2E',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  btn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingHorizontal: 16 },
  btnText: { fontSize: 15, fontWeight: '600' },
});
