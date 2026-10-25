import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { useNav } from '../navigation';
import { ALIGN_END, ROW, TEXT_START } from '../rtl';
import { useStore } from '../store';
import { FONTS } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function T({
  children,
  style,
  numberOfLines,
  selectable,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  const { colors } = useStore();
  return (
    <Text selectable={selectable} numberOfLines={numberOfLines} style={[s.text, { color: colors.text }, style]}>
      {children}
    </Text>
  );
}

// نقش إسلامي (نجمة ثمانية) يتكرر في الخلفية
export function IslamicPattern({ opacity = 0.1, color, size = 46, force }: { opacity?: number; color?: string; size?: number; force?: boolean }) {
  const { colors, state } = useStore();
  if (state.minimal && !force) return null;
  const c = color ?? colors.pattern;
  const h = size / 2;
  const k = size * 0.09;
  const star = `M${h} ${k} L${h + size * 0.1} ${size * 0.32} L${size - size * 0.2} ${size * 0.22} L${size * 0.68} ${h} L${size - size * 0.2} ${size * 0.78} L${h + size * 0.1} ${size * 0.68} L${h} ${size - k} L${h - size * 0.1} ${size * 0.68} L${size * 0.2} ${size * 0.78} L${size * 0.32} ${h} L${size * 0.2} ${size * 0.22} L${h - size * 0.1} ${size * 0.32} Z`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="ip" width={size} height={size} patternUnits="userSpaceOnUse">
            <Path d={star} fill="none" stroke={c} strokeWidth={0.8} />
            <Circle cx={h} cy={h} r={size * 0.1} fill="none" stroke={c} strokeWidth={0.6} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ip)" />
      </Svg>
    </View>
  );
}

// فاصل زخرفي بمعيّن ذهبي
export function Divider({ width = 140, color }: { width?: number; color?: string }) {
  const { colors } = useStore();
  const c = color ?? colors.gold;
  const m = width / 2;
  return (
    <Svg width={width} height={20} viewBox={`0 0 ${width} 20`}>
      <Path d={`M0 10 H${m - 16} M${m + 16} 10 H${width}`} stroke={c} strokeWidth={0.9} />
      <Path d={`M${m} 1 L${m + 9} 10 L${m} 19 L${m - 9} 10 Z`} fill="none" stroke={c} strokeWidth={1.2} />
      <Path d={`M${m} 5.5 L${m + 4.5} 10 L${m} 14.5 L${m - 4.5} 10 Z`} fill={c} />
    </Svg>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useStore();
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { colors } = useStore();
  const { back } = useNav();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <RoundButton icon="chevron-forward" label="رجوع" onPress={back} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 21, lineHeight: 32, color: colors.goldText, textAlign: 'center' }} numberOfLines={1}>
          {title}
        </T>
        {subtitle ? <T style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>{subtitle}</T> : null}
      </View>
      <View style={s.headerSide}>{right}</View>
    </View>
  );
}

export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { colors } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.row, { paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 12, justifyContent: 'space-between' }]}>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: FONTS.dhikrBold, fontSize: 28, lineHeight: 42, color: colors.goldText }}>{title}</T>
        {subtitle ? <T style={{ fontSize: 13, color: colors.muted }}>{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [s.round, { borderColor: colors.border, backgroundColor: colors.goldSoft, opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={icon} size={20} color={colors.goldText} />
    </Pressable>
  );
}

export function Card({ children, style, alt }: { children: ReactNode; style?: StyleProp<ViewStyle>; alt?: boolean }) {
  const { colors } = useStore();
  return (
    <View style={[s.card, { backgroundColor: alt ? colors.cardAlt : colors.card, borderColor: colors.border }, style]}>{children}</View>
  );
}

export function IconButton({
  name,
  onPress,
  label,
  color,
  size = 21,
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
      style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.muted} />
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const { colors } = useStore();
  const bg = variant === 'primary' ? colors.emerald : variant === 'gold' ? colors.gold : 'transparent';
  const fg = variant === 'outline' ? colors.goldText : variant === 'gold' ? '#1E130C' : colors.onEmerald;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: variant === 'outline' ? colors.borderStrong : bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        s.chip,
        active ? { backgroundColor: colors.gold, borderColor: colors.gold } : { borderColor: colors.border, backgroundColor: colors.goldSoft },
      ]}
    >
      <Text style={{ color: active ? '#1E130C' : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  emerald,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  emerald?: boolean;
}) {
  const { colors } = useStore();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [s.listRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
    >
      {icon ? (
        <View style={[s.listIcon, { backgroundColor: emerald ? colors.emerald : colors.goldSoft }]}>
          <Ionicons name={icon} size={21} color={emerald ? colors.onEmeraldMuted : colors.goldText} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T style={{ fontSize: 16, fontWeight: '600' }}>{title}</T>
        {subtitle ? <T style={{ fontSize: 13, color: colors.muted }}>{subtitle}</T> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-back" size={18} color={colors.gold} /> : null)}
    </Pressable>
  );
}

export const s = StyleSheet.create({
  text: { writingDirection: 'rtl', textAlign: TEXT_START, fontSize: 15 },
  row: { flexDirection: ROW, alignItems: 'center' },
  header: { flexDirection: ROW, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  headerSide: { minWidth: 44, alignItems: ALIGN_END },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 20, padding: 16, borderWidth: 1 },
  btn: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, flexDirection: ROW, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700' },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  listRow: { flexDirection: ROW, alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 70 },
  listIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
