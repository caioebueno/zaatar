import { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Tabs } from 'expo-router';
import { getColors, avatarTint, getInitials, F, type ColorTheme } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import { useChats, type Chat, type ChatState } from '../../context/chats';

type CountsMap = Record<'all' | 'ai_handling' | 'take_care', number>;

// Height of the large title area — used to sync the collapse animation.
const LARGE_TITLE_H = 72;


// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, size = 46, live = false, C }: { name: string; size?: number; live?: boolean; C: ColorTheme }) {
  const { bg, fg } = avatarTint(name, C.mode);
  return (
    <View style={{ position: 'relative', width: size + 4, height: size + 4, flexShrink: 0 }}>
      <View style={[s.avatarCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, margin: 2 }]}>
        <Text style={[s.avatarInitials, { color: fg, fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
      </View>
      {live && (
        <View style={{ position: 'absolute', top: 0, left: 0, width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, borderWidth: 2, borderColor: C.orange }} />
      )}
      <View style={[s.waBadge, { borderColor: C.paper }]}>
        <Text style={s.waText}>W</Text>
      </View>
    </View>
  );
}

// ─── Handler chip ─────────────────────────────────────────────
function HandlerChip({ chat, C }: { chat: Chat; C: ColorTheme }) {
  const isBot = chat.handler.kind === 'bot';
  const isAiHandling = chat.state === 'ai_handling';
  return (
    <View style={s.handlerRow}>
      {isBot
        ? <Ionicons name="hardware-chip-outline" size={11} color={isAiHandling ? C.needsFg : C.muted} />
        : <View style={[s.liveDot, { backgroundColor: C.orange }]} />}
      {isAiHandling && <Text style={[s.handlerText, { color: C.needsFg, fontFamily: F.monoSemibold }]}>AI is handling · </Text>}
      <Text style={[s.handlerText, { color: isAiHandling ? C.muted : isBot ? C.muted : C.orange, fontFamily: F.monoSemibold }]}>
        {chat.handler.note}
      </Text>
    </View>
  );
}

// ─── Unread badge ─────────────────────────────────────────────
function UnreadBadge({ n, C }: { n: number; C: ColorTheme }) {
  if (!n) return null;
  return (
    <View style={[s.unreadBadge, { backgroundColor: C.orange }]}>
      <Text style={[s.unreadText, { color: C.paper }]}>{n}</Text>
    </View>
  );
}

// ─── Chat row ─────────────────────────────────────────────────
function ChatRow({ chat, C, onPress, isLast }: { chat: Chat; C: ColorTheme; onPress: () => void; isLast: boolean }) {
  const isTakeCare = chat.state === 'take_care';
  const highlight = isTakeCare && chat.unread > 0;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[s.row, { backgroundColor: highlight ? C.needsRowTint : 'transparent' }]}
    >
      {highlight && <View style={[s.accentStripe, { backgroundColor: C.orange }]} />}
      <Avatar name={chat.name} size={46} live={isTakeCare} C={C} />
      <View style={s.rowContent}>
        <View style={s.rowTop}>
          <Text style={[s.chatName, { color: C.ink, fontFamily: F.semibold }]} numberOfLines={1}>{chat.name}</Text>
          <Text style={[s.chatTime, { color: C.muted, fontFamily: F.monoRegular }]}>{chat.when}</Text>
        </View>
        <Text style={[s.chatPreview, { color: chat.unread ? C.ink2 : C.muted, fontFamily: chat.unread ? F.medium : F.regular }]} numberOfLines={2}>
          {chat.last}
        </Text>
      </View>
      <View style={s.rowRight}>
        {isTakeCare && <UnreadBadge n={chat.unread} C={C} />}
        {!chat.unread && isTakeCare && <Ionicons name="checkmark" size={14} color={C.faint} />}
      </View>
      {!isLast && <View style={[s.sep, { backgroundColor: C.hairlineSoft, left: 74 }]} />}
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, count, accent, C }: { title: string; count: number; accent: string; C: ColorTheme }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionDot, { backgroundColor: accent }]} />
      <Text style={[s.sectionTitle, { color: C.ink2, fontFamily: F.monoSemibold }]}>{title}</Text>
      <Text style={[s.sectionCount, { color: C.faint, fontFamily: F.monoMedium }]}>{count}</Text>
    </View>
  );
}

// ─── Filter pills ─────────────────────────────────────────────
type FilterKey = 'all' | ChatState;
const FILTER_ITEMS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'take_care', label: 'Take care' },
  { id: 'ai_handling', label: 'AI is handling' },
];

function FilterPills({ value, onChange, counts, C }: {
  value: FilterKey; onChange: (v: FilterKey) => void; counts: CountsMap; C: ColorTheme;
}) {
  const accents: Partial<Record<FilterKey, string>> = { ai_handling: C.live, take_care: C.orange };
  return (
    <View style={[s.pillsOuter, { backgroundColor: C.cream }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsContainer}>
        {FILTER_ITEMS.map((it) => {
          const active = value === it.id;
          return (
            <TouchableOpacity key={it.id} onPress={() => onChange(it.id)} activeOpacity={0.7}
              style={[s.filterPill, { backgroundColor: active ? C.pillActiveBg : C.pillIdleBg, borderColor: active ? C.pillActiveBg : C.hairline }]}>
              {accents[it.id] && !active && <View style={[s.pillAccentDot, { backgroundColor: accents[it.id] }]} />}
              <Text style={[s.pillLabel, { color: active ? C.pillActiveFg : C.pillIdleFg, fontFamily: F.medium }]}>{it.label}</Text>
              <Text style={[s.pillCount, { color: active ? C.pillCountActive : C.faint, fontFamily: F.monoMedium }]}>{counts[it.id]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Zippy Pulse mark (primary brand icon from design) ────────
function ZappyIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="18" fill="#ff3d14" />
      <Rect x="41" y="51" width="18" height="18" rx="8" fill="#faf5ee" />
      <Path d="M28 60 A 22 22 0 0 1 72 60" stroke="#faf5ee" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55" />
      <Path d="M18 60 A 32 32 0 0 1 82 60" stroke="#faf5ee" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.25" />
    </Svg>
  );
}

// ─── Top bar (fixed) ──────────────────────────────────────────
function TopBar({ agentInitials, titleOpacity, titleTranslateY, C }: {
  agentInitials: string;
  titleOpacity: Animated.AnimatedInterpolation<number>;
  titleTranslateY: Animated.AnimatedInterpolation<number>;
  C: ColorTheme;
}) {
  return (
    <View style={[s.topBar, { backgroundColor: C.cream }]}>
      <View style={s.logoRow}>
        <ZappyIcon size={28} />
        <Text style={[s.logoText, { color: C.ink, fontFamily: F.extrabold }]}>Zappy</Text>
      </View>
      {/* "Inbox" fades in as large title scrolls away */}
      <Animated.Text
        style={[s.topBarTitle, { color: C.ink, fontFamily: F.bold, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}
        pointerEvents="none"
      >
        Inbox
      </Animated.Text>
      <View style={[s.userAvatar, { backgroundColor: C.avatarMonoBg }]}>
        <Text style={[s.userAvatarText, { color: C.avatarMonoFg, fontFamily: F.semibold }]}>{agentInitials}</Text>
      </View>
    </View>
  );
}

// ─── Large title (scrolls away) ───────────────────────────────
function LargeTitle({ opacity, C }: { opacity: Animated.AnimatedInterpolation<number>; C: ColorTheme }) {
  return (
    <Animated.View style={[s.largeTitleContainer, { opacity }]}>
      <Text style={[s.inboxTitle, { color: C.ink, fontFamily: F.bold }]}>Inbox</Text>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function InboxScreen() {
  const C = getColors(useColorScheme());
  const router = useRouter();
  const { agent } = useAuth();
  const { chats, loadingChats, fetchError, refreshing, load, setChatsAndRef, setRefreshing } = useChats();
  const [filter, setFilter] = useState<FilterKey>('all');

  const scrollY = useRef(new Animated.Value(0)).current;

  // Large title fades out as you scroll
  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, LARGE_TITLE_H * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  // Small title in top bar fades in slightly after
  const smallTitleOpacity = scrollY.interpolate({
    inputRange: [LARGE_TITLE_H * 0.4, LARGE_TITLE_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // Small title slides up from below into the bar
  const smallTitleTranslateY = scrollY.interpolate({
    inputRange: [LARGE_TITLE_H * 0.4, LARGE_TITLE_H],
    outputRange: [8, 0],
    extrapolate: 'clamp',
  });

  const agentInitials = useMemo(() => {
    if (!agent?.name) return '?';
    return agent.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }, [agent?.name]);


  const takeCareUnread = useMemo(
    () => chats.filter(c => c.state === 'take_care').reduce((s, c) => s + c.unread, 0),
    [chats],
  );

  const counts = useMemo<CountsMap>(() => ({
    all: chats.length,
    ai_handling: chats.filter(c => c.state === 'ai_handling').length,
    take_care: takeCareUnread,
  }), [chats, takeCareUnread]);

  const groups = useMemo(() => {
    if (filter !== 'all') return null;
    const defs: { id: ChatState; title: string; accent: string }[] = [
      { id: 'take_care', title: 'Take care', accent: C.orange },
      { id: 'ai_handling', title: 'AI is handling', accent: C.live },
    ];
    return defs.map(d => ({ ...d, items: chats.filter(c => c.state === d.id) })).filter(g => g.items.length);
  }, [filter, chats, C]);

  const flatList = filter !== 'all' ? chats.filter(c => c.state === filter) : [];

  const renderContent = () => {
    if (loadingChats && chats.length === 0) {
      return (
        <View style={s.emptyState}>
          <ActivityIndicator color={C.orange} />
        </View>
      );
    }
    if (fetchError) {
      return (
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, { color: C.needs, fontFamily: F.monoSemibold }]}>ERROR</Text>
          <Text style={[s.emptyText, { color: C.muted, fontFamily: F.monoRegular }]}>{fetchError}</Text>
        </View>
      );
    }
    if (chats.length === 0) {
      return (
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, { color: C.muted, fontFamily: F.monoSemibold }]}>ALL CLEAR</Text>
          <Text style={[s.emptyText, { color: C.faint, fontFamily: F.monoRegular }]}>No conversations yet.</Text>
        </View>
      );
    }
    if (filter === 'all') {
      return (
        <>
          {groups?.map(g => (
            <View key={g.id}>
              <SectionHeader title={g.title} count={g.items.length} accent={g.accent} C={C} />
              <View style={[s.groupBlock, { backgroundColor: C.paper, borderColor: C.hairline }]}>
                {g.items.map((chat, i) => (
                  <ChatRow key={chat.id} chat={chat} C={C} isLast={i === g.items.length - 1}
                    onPress={() => {
                      setChatsAndRef(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                      router.push({ pathname: '/chat/[id]', params: { id: chat.id, name: chat.name, state: chat.state, last: chat.last.slice(0, 120) } } as any);
                    }} />
                ))}
              </View>
            </View>
          ))}
          <View style={s.endLabel}>
            <Text style={[s.endText, { color: C.faint, fontFamily: F.monoRegular }]}>End of inbox</Text>
          </View>
        </>
      );
    }
    return (
      <>
        {flatList.map((chat, index) => (
          <ChatRow key={chat.id} chat={chat} C={C} isLast={index === flatList.length - 1}
            onPress={() => {
              setChatsAndRef(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
              router.push({ pathname: '/chat/[id]', params: { id: chat.id, name: chat.name, state: chat.state, last: chat.last.slice(0, 120) } } as any);
            }} />
        ))}
        {flatList.length > 0 && (
          <View style={s.endLabel}>
            <Text style={[s.endText, { color: C.faint, fontFamily: F.monoRegular }]}>End of inbox</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.cream }]} edges={['top']}>
      <Tabs.Screen options={{ tabBarBadge: takeCareUnread > 0 ? takeCareUnread : undefined }} />
      {/* Fixed top bar — logo left, animated "Inbox" center, avatar right */}
      <TopBar
        agentInitials={agentInitials}
        titleOpacity={smallTitleOpacity}
        titleTranslateY={smallTitleTranslateY}
        C={C}
      />

      {/*
        Scrollable content with stickyHeaderIndices:
          [0] LargeTitle  — scrolls away behind the top bar
          [1] FilterPills — sticks just below the top bar once LargeTitle leaves
          [2] Content
      */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={C.orange}
          />
        }
      >
        <LargeTitle opacity={largeTitleOpacity} C={C} />
        <FilterPills value={filter} onChange={setFilter} counts={counts} C={C} />
        {renderContent()}
      </Animated.ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // Top bar (fixed, above scroll)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 17,
    letterSpacing: -0.4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 22, letterSpacing: -0.5 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 12, letterSpacing: -0.2 },

  // Large title (inside scroll, collapses on scroll)
  largeTitleContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  inboxTitle: { fontSize: 32, letterSpacing: -1, lineHeight: 38, marginTop: 8, marginBottom: 6 },

  // Filter pills (sticky header at index 1)
  pillsOuter: { paddingBottom: 6 },
  pillsContainer: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 2, gap: 6 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillAccentDot: { width: 6, height: 6, borderRadius: 3 },
  pillLabel: { fontSize: 13, letterSpacing: -0.1, includeFontPadding: false },
  pillCount: { fontSize: 11, includeFontPadding: false },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionCount: { fontSize: 11 },
  groupBlock: { borderTopWidth: 1, borderBottomWidth: 1 },

  // Row
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, position: 'relative' },
  accentStripe: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
  rowContent: { flex: 1, minWidth: 0, paddingLeft: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  chatName: { flex: 1, fontSize: 15, letterSpacing: -0.2 },
  chatTime: { fontSize: 11, flexShrink: 0 },
  handlerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  handlerText: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  chatPreview: { fontSize: 13.5, lineHeight: 19, marginTop: 5 },
  rowRight: { alignItems: 'flex-end', paddingTop: 2, paddingLeft: 8 },
  sep: { position: 'absolute', bottom: 0, right: 16, height: StyleSheet.hairlineWidth },

  // Avatar
  avatarCircle: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { letterSpacing: -0.2 },
  waBadge: { position: 'absolute', right: -1, bottom: -1, width: 16, height: 16, borderRadius: 8, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  waText: { color: '#fff', fontSize: 8, fontWeight: '700', lineHeight: 10 },

  // Unread
  unreadBadge: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontSize: 11, fontWeight: '700', includeFontPadding: false, textAlignVertical: 'center' },

  // End / Empty
  endLabel: { padding: 20, alignItems: 'center' },
  endText: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  emptyText: { fontSize: 12 },

});
