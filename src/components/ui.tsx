import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { brand } from '@/constants/theme';
import { money } from '@/printing/ticketBuilder';

export const peso = (n: number) => `₱${money(n)}`;

// ---------- Button ----------
type Variant = 'primary' | 'accent' | 'outline' | 'danger';

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: brand.brown800, fg: brand.white, border: brand.brown800 },
  accent: { bg: brand.accent, fg: brand.onAccent, border: brand.accent },
  outline: { bg: 'transparent', fg: brand.brown800, border: brand.brown300 },
  danger: { bg: 'transparent', fg: brand.danger, border: brand.danger },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
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
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text style={[styles.btnText, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

// ---------- Chip ----------
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// ---------- Card ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------- Logo (text version of the 39ers badge; swap for the real image later) ----------
export function Logo({ size = 120 }: { size?: number }) {
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.05,
          left: size * 0.05,
          right: size * 0.05,
          bottom: size * 0.05,
          borderRadius: size / 2,
          borderWidth: Math.max(1, size * 0.012),
          borderColor: brand.white,
        }}
      />
      <Text style={{ color: brand.white, fontSize: size * 0.34, fontWeight: '800', fontStyle: 'italic' }}>
        39ers
      </Text>
      <Text
        style={{
          color: brand.white,
          fontSize: size * 0.065,
          fontWeight: '700',
          letterSpacing: 1,
          marginTop: size * 0.04,
        }}>
        MILKTEA, COFFEE
      </Text>
      <Text style={{ color: brand.white, fontSize: size * 0.065, fontWeight: '700', letterSpacing: 1 }}>
        AND SNACKS
      </Text>
    </View>
  );
}

// ---------- Sheet (centered popup used by every dialog) ----------
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
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
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
  btn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: brand.border,
    backgroundColor: brand.surface,
  },
  chipSelected: { backgroundColor: brand.brown800, borderColor: brand.brown800 },
  chipText: { fontSize: 15, fontWeight: '600', color: brand.textPrimary },
  chipTextSelected: { color: brand.white },
  card: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
  },
  logo: {
    backgroundColor: brand.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42,14,1,0.55)',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    backgroundColor: brand.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: brand.textPrimary, flex: 1 },
  close: { fontSize: 20, color: brand.textSecondary, paddingLeft: 12 },
  sheetBody: { flexShrink: 1, padding: 16 },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
});
