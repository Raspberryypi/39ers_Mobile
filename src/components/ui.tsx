import { useState, type ReactElement, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type KeyboardTypeOptions,
  type LayoutChangeEvent,
  type RefreshControlProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BREAKPOINT, Radius, brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ROLE_LABEL } from '@/lib/rbac';
import { money } from '@/printing/ticketBuilder';

export const peso = (n: number) => `₱${money(n)}`;

export const useIsWide = () => useWindowDimensions().width >= BREAKPOINT;

/** A small picture for a menu item, guessed from its name (drinks, fries, dumplings, ...). */
export function emojiFor(name: string, category?: string): string {
  const text = `${name} ${category ?? ''}`.toLowerCase();
  const rules: [RegExp, string][] = [
    [/fries|fry/, '🍟'],
    [/nugget|chicken/, '🍗'],
    [/siomai|dumpling/, '🥟'],
    [/burger/, '🍔'],
    [/sandwich|toast/, '🥪'],
    [/pizza/, '🍕'],
    [/noodle|pasta|ramen/, '🍜'],
    [/rice/, '🍚'],
    [/cake|waffle|dessert|cookie/, '🍰'],
    [/frappe|smoothie|shake|slush/, '🥤'],
    [/tea|matcha/, '🧋'],
    [/coffee|latte|americano|espresso|macchiato|cappuccino|mocha/, '☕'],
    [/juice|lemon|soda/, '🍹'],
    [/snack/, '🍟'],
  ];
  return rules.find(([re]) => re.test(text))?.[1] ?? '🍽️';
}

// ---------- Button ----------
type Variant = 'primary' | 'accent' | 'soft' | 'outline' | 'danger';

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: brand.brown800, fg: brand.white, border: brand.brown800 },
  accent: { bg: brand.accent, fg: brand.onAccent, border: brand.accent },
  soft: { bg: brand.brown100, fg: brand.brown800, border: brand.brown100 },
  outline: { bg: brand.surface, fg: brand.brown800, border: brand.border },
  danger: { bg: '#FBEAE8', fg: brand.danger, border: '#FBEAE8' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, minHeight: size === 'lg' ? 56 : 48 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text style={[styles.btnText, { color: v.fg, fontSize: size === 'lg' ? 18 : 16 }]}>{title}</Text>
    </Pressable>
  );
}

// ---------- Chip (filter / choice pill) ----------
export function Chip({
  label,
  selected,
  onPress,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
      {count !== undefined && (
        <View style={[styles.count, selected && styles.countOn]}>
          <Text style={[styles.countText, selected && styles.countTextOn]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------- Card / Pill ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const PILLS = {
  neutral: { bg: brand.brown100, fg: brand.brown700 },
  good: { bg: brand.accentSoft, fg: brand.accentText },
  bad: { bg: '#FBEAE8', fg: brand.danger },
  bar: { bg: brand.barSoft, fg: '#2D5F8A' },
  kitchen: { bg: brand.kitchenSoft, fg: '#A5560E' },
} as const;

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof PILLS }) {
  const t = PILLS[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

// ---------- Logo (text version of the 39ers badge; swap for the real image later) ----------
export function Logo({ size = 120 }: { size?: number }) {
  const inset = size * 0.055;
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: size / 2,
          borderWidth: Math.max(1, size * 0.014),
          borderColor: brand.white,
          opacity: 0.9,
        }}
      />
      <Text style={[displayText(size * 0.4, 'extrabold'), { color: brand.white }]}>39ers</Text>
      {size >= 90 && (
        <Text
          style={{
            color: brand.white,
            fontSize: size * 0.06,
            fontWeight: '700',
            letterSpacing: 0.8,
            textAlign: 'center',
          }}>
          MILKTEA, COFFEE{'\n'}AND SNACKS
        </Text>
      )}
    </View>
  );
}

// ---------- Text field (with show / hide for passwords) ----------
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  error,
  hint,
  prefix,
  onSubmitEditing,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'off';
  error?: string | null;
  hint?: string;
  prefix?: string;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldOn, !!error && styles.fieldErr]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand.textMuted}
          secureTextEntry={!!secure && !shown}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          style={[styles.fieldInput, WEB_NO_OUTLINE]}
        />
        {secure ? (
          <Pressable
            onPress={() => setShown((s) => !s)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Hide password' : 'Show password'}>
            <Text style={styles.toggle}>{shown ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

// The field draws its own focus ring, so hide the browser's default outline on web.
const WEB_NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

// ---------- Page building blocks ----------
/** Title bar used at the top of every screen. Shows the signed-in role on phones. */
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.header, { paddingTop: insets.top + (wide ? 22 : 14) }, wide && styles.headerWide]}>
      <View style={styles.flex}>
        <Text style={[displayText(wide ? 34 : 28, 'extrabold'), styles.hTitle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.hSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {!wide && user ? <Pill label={ROLE_LABEL[user.role]} tone="good" /> : null}
    </View>
  );
}

/** Scrollable page body that stays readable on huge screens but fills tablets. */
export function Page({
  children,
  refreshControl,
}: {
  children: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  const wide = useIsWide();
  return (
    <ScrollView
      style={styles.flex}
      refreshControl={refreshControl}
      contentContainerStyle={[styles.page, wide && styles.pageWide]}>
      {children}
    </ScrollView>
  );
}

/** Measures a container and works out how many equal columns fit, so grids fill the space. */
export function useGrid(minItem: number, gap: number) {
  const [w, setW] = useState(0);
  const cols = w > 0 ? Math.max(1, Math.floor((w + gap) / (minItem + gap))) : 1;
  const itemWidth = w > 0 ? Math.floor((w - gap * (cols - 1)) / cols) : 0;
  const onLayout = (e: LayoutChangeEvent) => setW(Math.floor(e.nativeEvent.layout.width));
  return { onLayout, itemWidth, cols, ready: w > 0 };
}

export function EmptyState({
  emoji,
  title,
  text,
  children,
}: {
  emoji: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyArt}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
      </View>
      <Text style={[displayText(22), styles.emptyTitle]}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
      {children}
    </View>
  );
}

// ---------- Sheet: bottom sheet on phones, centered dialog on tablets ----------
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.backdrop, wide ? styles.backdropWide : styles.backdropNarrow]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close dialog" />
        <View
          style={[
            styles.sheet,
            wide ? styles.sheetWide : styles.sheetNarrow,
            !wide && { paddingBottom: insets.bottom },
          ]}>
          {!wide && <View style={styles.grab} />}
          <View style={styles.sheetHeader}>
            <Text style={[displayText(24), styles.sheetTitle]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" style={styles.closeBtn}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  btn: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnText: { fontWeight: '800' },

  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: brand.border,
    backgroundColor: brand.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipOn: { backgroundColor: brand.brown800, borderColor: brand.brown800 },
  chipText: { fontSize: 15, fontWeight: '700', color: brand.textPrimary },
  chipTextOn: { color: brand.white },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: brand.brown100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontSize: 12, fontWeight: '800', color: brand.brown700 },
  countTextOn: { color: brand.white },

  card: {
    backgroundColor: brand.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 18,
  },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '800' },

  logo: { backgroundColor: brand.brand, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: brand.border,
    backgroundColor: brand.surface,
  },
  fieldOn: { borderColor: brand.brown800 },
  fieldErr: { borderColor: brand.danger },
  fieldInput: { flex: 1, fontSize: 17, color: brand.textPrimary, paddingVertical: 12 },
  prefix: { fontSize: 17, fontWeight: '700', color: brand.textSecondary },
  toggle: { fontSize: 14, fontWeight: '800', color: brand.brown600 },
  fieldError: { fontSize: 13, color: brand.danger, marginTop: 6 },
  fieldHint: { fontSize: 13, color: brand.textMuted, marginTop: 6 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: brand.background,
  },
  headerWide: { paddingHorizontal: 24, paddingBottom: 8 },
  hTitle: { color: brand.brown800 },
  hSub: { fontSize: 14, color: brand.textSecondary, marginTop: 2 },

  page: { padding: 16, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  pageWide: { padding: 24, paddingTop: 12 },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyArt: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: brand.brown100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: brand.brown800, textAlign: 'center' },
  emptyText: { fontSize: 15, color: brand.textSecondary, textAlign: 'center', maxWidth: 320 },

  backdrop: { flex: 1, backgroundColor: 'rgba(36,12,1,0.55)' },
  backdropWide: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  backdropNarrow: { justifyContent: 'flex-end' },
  sheet: { backgroundColor: brand.surface, overflow: 'hidden' },
  sheetWide: { width: '100%', maxWidth: 580, maxHeight: '92%', borderRadius: Radius.xl },
  sheetNarrow: { width: '100%', maxHeight: '92%', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: brand.border, marginTop: 10 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sheetTitle: { flex: 1, color: brand.brown800 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  close: { fontSize: 15, color: brand.textSecondary, fontWeight: '800' },
  sheetBody: { flexShrink: 1, paddingHorizontal: 20 },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
});
