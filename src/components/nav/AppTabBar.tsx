import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { BREAKPOINT, brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ROLE_LABEL } from '@/lib/rbac';

// Only the parts of the navigator's props that this bar needs.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

const META: Record<string, { icon: string; label: string }> = {
  index: { icon: '☕', label: 'POS' },
  orders: { icon: '🧾', label: 'Orders' },
  menu: { icon: '🍽️', label: 'Menu' },
  inventory: { icon: '📦', label: 'Inventory' },
  analytics: { icon: '📊', label: 'Analytics' },
  settings: { icon: '⚙️', label: 'Settings' },
};

const EXPAND_AT = 1100; // wide enough to show labels beside the icons

export function AppTabBar(props: TabBarProps) {
  const { width } = useWindowDimensions();
  if (width < BREAKPOINT) return <BottomBar {...props} />;
  return <Rail {...props} expanded={width >= EXPAND_AT} />;
}

// ---------- Side rail (tablets / browsers) ----------
function Rail({ state, navigation, expanded }: TabBarProps & { expanded: boolean }) {
  const insets = useSafeAreaInsets();
  const { user, branch, branches, setBranch } = useAuth();

  const nextBranch = () => {
    if (branches.length < 2 || !branch) return;
    const i = branches.findIndex((b) => b.id === branch.id);
    setBranch(branches[(i + 1) % branches.length]);
  };

  return (
    <View style={[styles.rail, { width: expanded ? 236 : 92, paddingTop: insets.top + 18 }]}>
      <View style={[styles.brandRow, !expanded && styles.center]}>
        <Logo size={expanded ? 56 : 52} />
        {expanded && (
          <View>
            <Text style={[displayText(26, 'extrabold'), styles.wordmark]}>39ers</Text>
            <Text style={styles.wordSub}>Aklan POS</Text>
          </View>
        )}
      </View>

      <View style={styles.items}>
        {state.routes.map((route, i) => {
          const meta = META[route.name];
          if (!meta) return null;
          const on = state.index === i;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.item, expanded ? styles.itemRow : styles.itemCol, on && styles.itemOn]}>
              <Text style={styles.icon}>{meta.icon}</Text>
              <Text style={[styles.label, !expanded && styles.labelSmall, on && styles.labelOn]} numberOfLines={1}>
                {meta.label}
              </Text>
              {on && expanded && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.foot, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={nextBranch}
          disabled={branches.length < 2}
          style={[styles.userCard, !expanded && styles.userCardSmall]}
          accessibilityLabel={branches.length > 1 ? 'Switch branch' : undefined}>
          <View style={styles.avatar}>
            <Text style={[displayText(20), styles.avatarText]}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          {expanded && (
            <View style={styles.flex}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name}
              </Text>
              <Text style={styles.userMeta} numberOfLines={1}>
                {user ? ROLE_LABEL[user.role] : ''}
              </Text>
              <Text style={styles.branch} numberOfLines={1}>
                {branch?.name}
              </Text>
              {branches.length > 1 && <Text style={styles.switchHint}>Tap to switch branch</Text>}
            </View>
          )}
        </Pressable>
        {!expanded && branch && <Text style={styles.codeTag}>{branch.code}</Text>}
      </View>
    </View>
  );
}

// ---------- Bottom bar (phones) ----------
function BottomBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const meta = META[route.name];
        if (!meta) return null;
        const on = state.index === i;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={styles.bItem}>
            <View style={[styles.bIcon, on && styles.bIconOn]}>
              <Text style={styles.bEmoji}>{meta.icon}</Text>
            </View>
            <Text style={[styles.bLabel, on && styles.bLabelOn]} numberOfLines={1}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center' },

  rail: { backgroundColor: brand.brown800, paddingHorizontal: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, marginBottom: 28 },
  wordmark: { color: brand.white },
  wordSub: { fontSize: 13, color: brand.brown300, marginTop: -2 },
  items: { flex: 1, gap: 6 },
  item: { borderRadius: 18, alignItems: 'center' },
  itemRow: { flexDirection: 'row', gap: 14, paddingVertical: 13, paddingHorizontal: 14 },
  itemCol: { paddingVertical: 10, gap: 2 },
  itemOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  icon: { fontSize: 22 },
  label: { fontSize: 16, fontWeight: '700', color: brand.brown300, flex: 0 },
  labelSmall: { fontSize: 12 },
  labelOn: { color: brand.white },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.accent, marginLeft: 'auto' },

  foot: { paddingTop: 12, alignItems: 'center', gap: 6 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  userCardSmall: { width: 'auto', padding: 6, borderRadius: 30 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: brand.onAccent },
  userName: { fontSize: 15, fontWeight: '800', color: brand.white },
  userMeta: { fontSize: 13, color: brand.brown300 },
  branch: { fontSize: 12, color: brand.brown300, marginTop: 2 },
  switchHint: { fontSize: 11, color: brand.accent, marginTop: 2, fontWeight: '700' },
  codeTag: { fontSize: 11, fontWeight: '800', color: brand.brown300, letterSpacing: 0.5 },

  bottom: {
    flexDirection: 'row',
    backgroundColor: brand.surface,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  bItem: { flex: 1, alignItems: 'center', gap: 2 },
  bIcon: { width: 52, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bIconOn: { backgroundColor: brand.accentSoft },
  bEmoji: { fontSize: 20 },
  bLabel: { fontSize: 11, fontWeight: '700', color: brand.textMuted },
  bLabelOn: { color: brand.brown800 },
});
