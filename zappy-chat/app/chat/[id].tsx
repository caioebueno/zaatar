import {
  View, Text, TextInput, StyleSheet, useColorScheme,
  TouchableOpacity, FlatList, Platform, Image, Modal, Alert,
  ScrollView, ActivityIndicator, Keyboard, KeyboardAvoidingView, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { getColors, avatarTint, getInitials, F, type ColorTheme } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import { useRealtime } from '../../context/realtime';
import { useChats } from '../../context/chats';
import { fetchMessages, sendConversationMessage, takeOverConversation, resolveConversation, markConversationRead, upsertOrderIntent, type ConversationMessage, type ConversationOrder, type ConversationOrderIntent } from '../../lib/api';
import { Audio } from 'expo-av';

type ChatState = 'ai_handling' | 'take_care' | 'resolved';
type Sender = 'customer' | 'bot' | 'agent';
type MsgItem =
  | { kind: 'msg'; id: string; from: Sender; text: string; at: string; senderName?: string }
  | { kind: 'voice'; id: string; from: Sender; durationSec: number; seed: number; at: string; senderName?: string; audioUrl?: string }
  | { kind: 'image'; id: string; from: Sender; images: { url: string; thumb?: string }[]; caption?: string; at: string; senderName?: string }
  | { kind: 'day'; id: string; label: string; at: string }
  | { kind: 'handoff'; id: string; who: string; at: string }
  | { kind: 'resolved'; id: string; by: string; at: string };

// ─── Message helpers ──────────────────────────────────────────
function formatTime(ts: number | string | null | undefined): string {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? ts * 1000 : Date.parse(String(ts));
  if (isNaN(ms)) return '';
  const d = new Date(ms);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function buildItems(apiMsgs: ConversationMessage[]): MsgItem[] {
  const items: MsgItem[] = [];
  let lastDateKey = '';

  for (const m of apiMsgs) {
    if (m.private) continue;
    if (m.message_type === 2) continue; // activity rows

    const audioAttachment = (m.attachments as any[])?.find(
      (a: any) => a.file_type === 'audio' && a.data_url,
    );
    const imageAttachments: { url: string; thumb?: string }[] = ((m.attachments as any[]) ?? [])
      .filter((a: any) => a.file_type === 'image' && (a.data_url || a.url))
      .map((a: any) => ({ url: a.data_url ?? a.url, thumb: a.thumb_url ?? a.thumbnailUrl ?? undefined }));
    const hasText = !!m.content?.trim();
    if (!hasText && !audioAttachment && imageAttachments.length === 0) continue;

    const ts = typeof m.created_at === 'number' ? m.created_at * 1000 : Date.parse(String(m.created_at ?? 0));
    const d = new Date(ts);
    const todayKey = new Date().toDateString();
    const dateKey = d.toDateString();
    const dateLabel = dateKey === todayKey
      ? 'Today'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      items.push({ kind: 'day', id: `day-${ts}`, label: dateLabel, at: formatTime(m.created_at) });
    }

    const senderType = ((m.sender as any)?.type ?? '').toLowerCase();
    const sentBy = String(m.content_attributes?.sent_by ?? '').toLowerCase();
    const senderName: string = (m.sender as any)?.name ?? '';
    const isBot = sentBy === 'ai' || senderType.includes('bot');
    const from: Sender = m.message_type === 0
      ? 'customer'
      : isBot ? 'bot' : 'agent';

    if (audioAttachment) {
      const durationSec = Math.max(1, Math.round((audioAttachment.file_size ?? 8000) / 1000));
      items.push({
        kind: 'voice', id: String(m.id), from, durationSec, seed: m.id % 233,
        at: formatTime(m.created_at), senderName, audioUrl: audioAttachment.data_url,
      });
    } else if (imageAttachments.length > 0) {
      items.push({
        kind: 'image', id: String(m.id), from,
        images: imageAttachments,
        caption: m.content?.trim() || undefined,
        at: formatTime(m.created_at), senderName,
      });
    } else {
      items.push({ kind: 'msg', id: String(m.id), from, text: m.content!, at: formatTime(m.created_at), senderName });
    }
  }
  return items;
}

// Deterministic PRNG waveform — same seed → same bars every render
function makeBars(seed: number, count = 28): number[] {
  const bars: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const h = 0.20 + Math.abs(Math.sin(i * 0.7 + seed * 0.13)) * 0.55 + r * 0.25;
    bars.push(Math.min(1, h));
  }
  return bars;
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

// ─── Templates ────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'g1', cat: 'greeting', title: 'Hand-off intro',   body: 'Hi {customer_first}, this is {agent_name} stepping in. I\'ve got your order #{order_id} open — let me sort this out for you.' },
  { id: 'g2', cat: 'greeting', title: 'First contact',    body: 'Hi {customer_first}! Thanks for reaching out — how can I help you tonight?' },
  { id: 'o1', cat: 'order',    title: 'Driver en route',  body: 'Your driver {driver_name} is on the way — currently about {eta_minutes} minutes out.' },
  { id: 'o2', cat: 'order',    title: 'Order delayed',    body: 'I\'m so sorry, order #{order_id} is running about {delay_minutes} minutes behind. The driver just left the restaurant.' },
  { id: 'o3', cat: 'order',    title: 'Refund issued',    body: 'I\'ve issued a full refund for order #{order_id} — it\'ll show up in 3–5 business days on the original card.' },
  { id: 'a1', cat: 'apology',  title: 'Sincere apology',  body: 'I\'m really sorry about this, {customer_first}. This isn\'t the experience we want for you — I\'m fixing it now.' },
  { id: 'a2', cat: 'apology',  title: 'Comp / make-good', body: 'On us this time — I\'ve credited {comp_amount} to your next order. We\'ll do better.' },
  { id: 'i1', cat: 'info',     title: 'Hours tonight',    body: 'We\'re open until {closing_time} tonight. Last orders go in 30 minutes before close.' },
];
const CATS = [
  { id: 'all', label: 'All' },
  { id: 'greeting', label: 'Greeting' },
  { id: 'order', label: 'Order' },
  { id: 'apology', label: 'Apology' },
  { id: 'info', label: 'Info' },
];

// ─── Day divider ──────────────────────────────────────────────
function DayDivider({ label, at, C }: { label: string; at: string; C: ColorTheme }) {
  return (
    <View style={s.dayRow}>
      <View style={[s.dayLine, { backgroundColor: C.hairlineSoft }]} />
      <Text style={[s.dayLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>
        {label} · {at}
      </Text>
      <View style={[s.dayLine, { backgroundColor: C.hairlineSoft }]} />
    </View>
  );
}

// ─── Handoff note ─────────────────────────────────────────────
function HandoffNote({ who, at, C }: { who: string; at: string; C: ColorTheme }) {
  const bg = C.mode === 'dark' ? 'rgba(51,201,138,0.10)' : C.liveBg;
  const border = C.mode === 'dark' ? 'rgba(51,201,138,0.22)' : 'rgba(0,168,102,0.18)';
  return (
    <View style={s.handoffRow}>
      <View style={[s.handoffPill, { backgroundColor: bg, borderColor: border }]}>
        <View style={[s.handoffDot, { backgroundColor: C.live }]} />
        <Text style={[s.handoffText, { color: C.liveFg, fontFamily: F.monoSemibold }]}>
          Handed off to {who} · {at}
        </Text>
      </View>
    </View>
  );
}

// ─── Resolved note ───────────────────────────────────────────
function ResolvedNote({ by, at, C }: { by: string; at: string; C: ColorTheme }) {
  const bg = C.mode === 'dark' ? 'rgba(250,245,238,0.05)' : 'rgba(22,18,15,0.04)';
  return (
    <View style={s.resolvedRow}>
      <View style={[s.resolvedPill, { backgroundColor: bg, borderColor: C.hairline }]}>
        <Ionicons name="checkmark" size={11} color={C.faint} />
        <Text style={[s.resolvedText, { color: C.muted, fontFamily: F.monoSemibold }]}>
          Resolved by {by} · {at}
        </Text>
      </View>
    </View>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────
function Bubble({ from, text, at, senderName, showBadge, showTime, C }: {
  from: Sender; text: string; at: string; senderName?: string;
  showBadge: boolean; showTime: boolean; C: ColorTheme;
}) {
  const isAgent = from === 'agent';
  const isBot = from === 'bot';
  const isRight = isAgent || isBot;

  const bubbleBg = isBot
    ? C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : '#fff1ea'
    : C.paper;
  const bubbleFg = C.ink;
  const bubbleBorder = isBot
    ? C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)'
    : C.hairline;

  // Right-aligned (agent + bot): tail bottom-right. Left-aligned (customer): tail bottom-left.
  const radius = isRight
    ? { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16 }
    : { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };

  return (
    <View style={[s.bubbleWrap, isRight ? s.bubbleWrapRight : s.bubbleWrapLeft]}>
      {/* Sender badge — only on first message of a same-sender/same-minute group */}
      {showBadge && isBot && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(255,90,53,0.12)' : 'rgba(255,61,20,0.08)',
          borderColor: C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)',
        }]}>
          <Ionicons name="hardware-chip-outline" size={10} color={C.orange} />
          <Text style={[s.senderBadgeText, { color: C.orange, fontFamily: F.monoSemibold }]}>Zippy AI</Text>
        </View>
      )}
      {showBadge && isAgent && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink,
          borderColor: C.hairline,
        }]}>
          <Ionicons name="person-outline" size={10} color={C.muted} />
          <Text style={[s.senderBadgeText, { color: C.muted, fontFamily: F.monoSemibold }]}>
            {senderName || 'You'}
          </Text>
        </View>
      )}

      <View style={[
        s.bubble,
        radius,
        { backgroundColor: bubbleBg },
        { borderWidth: 1, borderColor: bubbleBorder },
      ]}>
        <Text style={[s.bubbleText, { color: bubbleFg, fontFamily: F.regular }]}>{text}</Text>
      </View>

      {/* Timestamp — only on last message of a same-sender/same-minute group */}
      {showTime && (
        <View style={[s.timeRow, isRight ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
          <Text style={[s.timeText, { color: C.faint, fontFamily: F.monoMedium }]}>{at}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Voice bubble ─────────────────────────────────────────────
function VoiceBubble({ from, durationSec, seed, at, showBadge, showTime, senderName, audioUrl, C }: {
  from: Sender; durationSec: number; seed: number; at: string;
  showBadge: boolean; showTime: boolean; senderName?: string; audioUrl?: string; C: ColorTheme;
}) {
  const isAgent = from === 'agent';
  const isBot   = from === 'bot';
  const isRight = isAgent || isBot;

  const [playing, setPlaying_]  = useState(false);
  const setPlaying = (v: boolean) => { playingRef.current = v; setPlaying_(v); };
  const [progress, setProgress] = useState(0);
  const [played, setPlayed]     = useState(false);
  const [realDuration, setRealDuration] = useState(durationSec);
  const soundRef        = useRef<Audio.Sound | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveWidthRef    = useRef(1);
  const wasPlayingRef   = useRef(false);
  const playingRef      = useRef(false);
  const realDurationRef = useRef(durationSec);
  const handleStatusRef = useRef<(s: any) => void>(() => {});

  const bars = useMemo(() => makeBars(seed), [seed]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopSimulation = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const handleStatus = (s: any) => {
    if (!s.isLoaded) return;
    if (s.didJustFinish) {
      setPlaying(false);
      setPlayed(true);
      setProgress(0);
      soundRef.current?.setPositionAsync(0);
      return;
    }
    const dur = s.durationMillis ?? durationSec * 1000;
    realDurationRef.current = dur / 1000;
    setRealDuration(dur / 1000);
    setProgress(s.positionMillis / Math.max(dur, 1));
  };
  handleStatusRef.current = handleStatus;

  const loadSound = async (): Promise<Audio.Sound> => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl! },
      { shouldPlay: false },
      (s) => handleStatusRef.current(s),
    );
    soundRef.current = sound;
    return sound;
  };

  const togglePlay = async () => {
    if (audioUrl) {
      const sound = soundRef.current ?? await loadSound();
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await sound.pauseAsync();
        setPlaying(false);
      } else {
        await sound.playAsync();
        setPlaying(true);
      }
    } else {
      if (playing) {
        stopSimulation();
        setPlaying(false);
      } else {
        setPlaying(true);
        const step = 50 / (durationSec * 1000);
        intervalRef.current = setInterval(() => {
          setProgress(p => {
            const n = p + step;
            if (n >= 1) { stopSimulation(); setPlaying(false); setPlayed(true); return 0; }
            return n;
          });
        }, 50);
      }
    }
  };

  const seekToFrac = async (frac: number) => {
    if (!audioUrl) return;
    const sound = soundRef.current ?? await loadSound();
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    const dur = status.durationMillis ?? realDurationRef.current * 1000;
    await sound.setPositionAsync(frac * dur);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / waveWidthRef.current));
        setProgress(frac);
        wasPlayingRef.current = playingRef.current;
        if (playingRef.current) {
          soundRef.current?.pauseAsync().catch(() => {});
          setPlaying(false);
        }
      },
      onPanResponderMove: (e) => {
        const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / waveWidthRef.current));
        setProgress(frac);
      },
      onPanResponderRelease: (e) => {
        const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / waveWidthRef.current));
        setProgress(frac);
        seekToFrac(frac).then(() => {
          if (wasPlayingRef.current) {
            soundRef.current?.playAsync();
            setPlaying(true);
          }
        });
      },
      onPanResponderTerminate: () => {
        if (wasPlayingRef.current) {
          soundRef.current?.playAsync();
          setPlaying(true);
        }
      },
    })
  ).current;

  const bubbleBg   = isAgent ? C.ink   : isBot ? (C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : '#fff1ea') : C.paper;
  const barIdle    = isAgent ? 'rgba(250,245,238,0.30)' : C.mode === 'dark' ? 'rgba(250,245,238,0.30)' : 'rgba(22,18,15,0.30)';
  const barActive  = isAgent ? C.cream : C.orange;
  const btnBg      = isAgent ? C.cream : C.orange;
  const btnFg      = isAgent ? C.ink   : C.cream;
  const timeFg     = isAgent ? 'rgba(250,245,238,0.78)' : C.muted;
  const borderColor = isBot
    ? (C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)')
    : (isAgent ? 'transparent' : C.hairline);

  const radius = isRight
    ? { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16 }
    : { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };

  const currentLabel = playing ? fmtDur(realDuration * progress) : fmtDur(realDuration);

  return (
    <View style={[s.bubbleWrap, isRight ? s.bubbleWrapRight : s.bubbleWrapLeft]}>
      {showBadge && isBot && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(255,90,53,0.12)' : 'rgba(255,61,20,0.08)',
          borderColor: C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)',
        }]}>
          <Ionicons name="hardware-chip-outline" size={10} color={C.orange} />
          <Text style={[s.senderBadgeText, { color: C.orange, fontFamily: F.monoSemibold }]}>Zippy AI</Text>
        </View>
      )}
      {showBadge && isAgent && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink,
          borderColor: C.hairline,
        }]}>
          <Ionicons name="person-outline" size={10} color={C.muted} />
          <Text style={[s.senderBadgeText, { color: C.muted, fontFamily: F.monoSemibold }]}>
            {senderName || 'You'}
          </Text>
        </View>
      )}

      <View style={[s.voiceBubble, radius, { backgroundColor: bubbleBg, borderColor, minWidth: 220 }]}>
        {/* Play / Pause */}
        <TouchableOpacity
          onPress={togglePlay}
          style={[s.voicePlayBtn, { backgroundColor: btnBg }]}
          activeOpacity={0.8}
        >
          {playing
            ? <Ionicons name="pause" size={14} color={btnFg} />
            : <Ionicons name="play" size={14} color={btnFg} style={{ marginLeft: 2 }} />
          }
        </TouchableOpacity>

        {/* Waveform — slide to seek */}
        <View
          style={s.voiceBars}
          onLayout={e => { waveWidthRef.current = e.nativeEvent.layout.width || 1; }}
          {...panResponder.panHandlers}
        >
          {bars.map((h, i) => {
            const filled = i / (bars.length - 1) <= progress;
            return (
              <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                <View style={{
                  height: Math.max(3, h * 28),
                  backgroundColor: filled ? barActive : barIdle,
                  borderRadius: 2,
                }} />
              </View>
            );
          })}
        </View>

        {/* Duration + unread dot */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[s.voiceTime, { color: timeFg, fontFamily: F.monoMedium }]}>{currentLabel}</Text>
          {!played && !isAgent && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isBot ? C.orange : C.live }} />
          )}
        </View>
      </View>

      {showTime && (
        <View style={[s.timeRow, isRight ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
          <Ionicons name="mic-outline" size={9} color={C.faint} style={{ marginRight: 3 }} />
          <Text style={[s.timeText, { color: C.faint, fontFamily: F.monoMedium }]}>
            Voice · {fmtDur(durationSec)}  {at}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Image viewer (full-screen lightbox) ─────────────────────
function ImageViewer({ images, startIdx, onClose }: {
  images: { url: string }[]; startIdx: number; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(startIdx);
  const n = images.length;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={12}
          style={{ position: 'absolute', top: insets.top + 12, right: 18, zIndex: 10, padding: 6 }}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        {n > 1 && (
          <Text style={{
            position: 'absolute', top: insets.top + 20, alignSelf: 'center', zIndex: 10,
            color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: F.monoMedium, letterSpacing: 0.6,
          }}>
            {idx + 1} / {n}
          </Text>
        )}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={{ uri: images[idx].url }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
        </View>
        {n > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
            <TouchableOpacity onPress={() => setIdx(i => Math.max(0, i - 1))} hitSlop={12} disabled={idx === 0}>
              <Ionicons name="chevron-back" size={32} color={idx === 0 ? 'rgba(255,255,255,0.25)' : '#fff'} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {images.map((_, i) => (
                <View key={i} style={{
                  width: i === idx ? 8 : 5, height: i === idx ? 8 : 5, borderRadius: 4,
                  backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.35)',
                }} />
              ))}
            </View>
            <TouchableOpacity onPress={() => setIdx(i => Math.min(n - 1, i + 1))} hitSlop={12} disabled={idx === n - 1}>
              <Ionicons name="chevron-forward" size={32} color={idx === n - 1 ? 'rgba(255,255,255,0.25)' : '#fff'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Image bubble ─────────────────────────────────────────────
// Grid layouts: 1 → portrait, 2 → side-by-side, 3 → hero+stack, 4+ → 2×2 with +N
const IW = 232; // inner grid width (bubble 240 − 4px padding each side)
const IG = 2;   // gap between tiles

function ImageBubble({ from, images, caption, at, showBadge, showTime, senderName, onOpen, C }: {
  from: Sender; images: { url: string; thumb?: string }[]; caption?: string; at: string;
  showBadge: boolean; showTime: boolean; senderName?: string;
  onOpen: (idx: number) => void; C: ColorTheme;
}) {
  const isAgent = from === 'agent';
  const isBot   = from === 'bot';
  const isRight = isAgent || isBot;
  const n = images.length;
  const tiles = images.slice(0, 4);
  const extra = Math.max(0, n - 4);

  const bubbleBg = isAgent ? C.ink : isBot ? (C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : '#fff1ea') : C.paper;
  const borderColor = isBot
    ? (C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)')
    : (isAgent ? 'transparent' : C.hairline);
  const radius = isRight
    ? { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16 }
    : { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };
  const timeFg = isAgent ? 'rgba(250,245,238,0.78)' : C.muted;

  const tileStyle = (w: number, h: number) => ({ width: w, height: h, borderRadius: 10, overflow: 'hidden' as const });

  const renderTile = (img: { url: string; thumb?: string }, i: number, w: number, h: number, isLast = false) => (
    <TouchableOpacity key={i} onPress={() => onOpen(i)} activeOpacity={0.88}
      style={tileStyle(w, h)}>
      <Image source={{ uri: img.thumb ?? img.url }} style={{ width: w, height: h }} resizeMode="cover" />
      {isLast && extra > 0 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(22,18,15,0.55)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600', letterSpacing: -0.5 }}>+{extra}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const buildGrid = () => {
    if (n === 1) {
      const h = Math.round(IW * 5 / 4);
      return <View style={{ padding: 4 }}>{renderTile(tiles[0], 0, IW, h)}</View>;
    }
    if (n === 2) {
      const w = Math.round((IW - IG) / 2);
      const h = Math.round(w * 1.2);
      return (
        <View style={{ flexDirection: 'row', gap: IG, padding: 4 }}>
          {tiles.map((img, i) => renderTile(img, i, w, h))}
        </View>
      );
    }
    if (n === 3) {
      const heroW = Math.round(IW * 0.58);
      const sideW = IW - heroW - IG;
      const totalH = IW; // square total
      const sideH = Math.round((totalH - IG) / 2);
      return (
        <View style={{ flexDirection: 'row', gap: IG, padding: 4 }}>
          {renderTile(tiles[0], 0, heroW, totalH)}
          <View style={{ gap: IG }}>
            {renderTile(tiles[1], 1, sideW, sideH)}
            {renderTile(tiles[2], 2, sideW, sideH)}
          </View>
        </View>
      );
    }
    // 4+: 2×2
    const w = Math.round((IW - IG) / 2);
    const h = w;
    return (
      <View style={{ gap: IG, padding: 4 }}>
        <View style={{ flexDirection: 'row', gap: IG }}>
          {renderTile(tiles[0], 0, w, h)}
          {renderTile(tiles[1], 1, w, h)}
        </View>
        <View style={{ flexDirection: 'row', gap: IG }}>
          {renderTile(tiles[2], 2, w, h)}
          {renderTile(tiles[3], 3, w, h, true)}
        </View>
      </View>
    );
  };

  return (
    <View style={[s.bubbleWrap, isRight ? s.bubbleWrapRight : s.bubbleWrapLeft]}>
      {showBadge && isBot && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(255,90,53,0.12)' : 'rgba(255,61,20,0.08)',
          borderColor: C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)',
        }]}>
          <Ionicons name="hardware-chip-outline" size={10} color={C.orange} />
          <Text style={[s.senderBadgeText, { color: C.orange, fontFamily: F.monoSemibold }]}>Zippy AI</Text>
        </View>
      )}
      {showBadge && isAgent && (
        <View style={[s.senderBadge, {
          backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink,
          borderColor: C.hairline,
        }]}>
          <Ionicons name="person-outline" size={10} color={C.muted} />
          <Text style={[s.senderBadgeText, { color: C.muted, fontFamily: F.monoSemibold }]}>
            {senderName || 'You'}
          </Text>
        </View>
      )}

      <View style={[s.imageBubble, radius, { backgroundColor: bubbleBg, borderColor }]}>
        {buildGrid()}
        {!!caption && (
          <Text style={[s.imageBubbleCaption, { color: isAgent ? C.cream : C.ink, fontFamily: F.regular }]}>
            {caption}
          </Text>
        )}
      </View>

      {showTime && (
        <View style={[s.timeRow, isRight ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
          <Ionicons name="image-outline" size={9} color={C.faint} style={{ marginRight: 3 }} />
          <Text style={[s.timeText, { color: timeFg, fontFamily: F.monoMedium }]}>
            {n === 1 ? 'Photo' : `${n} photos`}{'  '}{at}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Take-over / Resolved panel ───────────────────────────────
// Replaces composer when bot is handling or conversation is resolved.
function TakeOverPanel({ onTakeOver, takingOver, isResolved, onResolve, C, bottomInset }: {
  onTakeOver: () => void; takingOver: boolean; isResolved: boolean; onResolve: () => void; C: ColorTheme; bottomInset: number;
}) {
  const dotRingColor = C.mode === 'dark' ? 'rgba(51,201,138,0.18)' : 'rgba(0,168,102,0.14)';
  const btnShadow = !isResolved
    ? (C.mode === 'dark'
        ? { shadowColor: '#ff5a35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 18, elevation: 6 }
        : { shadowColor: '#ff3d14', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 4 })
    : {};

  const title = isResolved ? 'Conversation closed' : 'Zippy AI is handling this chat';
  const sub   = isResolved ? 'Reopen to continue talking with this customer.' : 'Bot is replying to the customer right now.';
  const cta   = isResolved ? 'Reopen conversation' : (takingOver ? 'Taking over…' : 'Take over chat');
  const hint  = isResolved ? 'The customer will receive a new message from you.' : 'The bot will pause and the customer sees you typing.';

  return (
    <View style={[s.toPanel, { backgroundColor: C.cream, borderTopColor: C.hairline, paddingBottom: bottomInset + 16 }]}>
      {/* Status row */}
      <View style={[s.toStatusRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isResolved ? (
            <Ionicons name="checkmark-circle-outline" size={14} color={C.faint} />
          ) : (
            <View style={[s.toDotRing, { backgroundColor: dotRingColor }]}>
              <View style={[s.toDot, { backgroundColor: C.live }]} />
            </View>
          )}
          <Text style={[s.toStatusLabel, { color: isResolved ? C.faint : C.live, fontFamily: F.monoSemibold }]}>
            {isResolved ? 'Resolved' : 'Bot active'}
          </Text>
          {!isResolved && (
            <Text style={[s.toStatusMuted, { color: C.faint, fontFamily: F.monoRegular }]}>· auto-replies on</Text>
          )}
        </View>
        {!isResolved && (
          <TouchableOpacity
            onPress={onResolve}
            style={[s.resolveBtn, { borderColor: C.hairline }]}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={11} color={C.ink2} />
            <Text style={[s.resolveBtnText, { color: C.ink2, fontFamily: F.monoSemibold }]}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Copy */}
      <Text style={[s.toTitle, { color: C.ink, fontFamily: F.semibold }]}>{title}</Text>
      <Text style={[s.toSub, { color: C.muted, fontFamily: F.regular }]}>{sub}</Text>

      {/* CTA */}
      <TouchableOpacity
        onPress={onTakeOver}
        disabled={takingOver}
        style={[s.toBtn, {
          backgroundColor: isResolved ? C.paper : C.orange,
          borderWidth: isResolved ? 1 : 0,
          borderColor: isResolved ? C.hairline : undefined,
          opacity: takingOver ? 0.7 : 1,
        }, btnShadow]}
        activeOpacity={0.82}
      >
        {!isResolved && (
          takingOver
            ? <ActivityIndicator size="small" color={C.cream} />
            : <Ionicons name="arrow-forward" size={16} color={C.cream} />
        )}
        <Text style={[s.toBtnText, { color: isResolved ? C.ink : C.cream, fontFamily: F.semibold }]}>
          {cta}
        </Text>
      </TouchableOpacity>

      {/* Hint */}
      <Text style={[s.toHint, { color: C.faint, fontFamily: F.monoRegular }]}>{hint}</Text>
    </View>
  );
}

// ─── Composer ─────────────────────────────────────────────────
function Composer({ draft, onChange, onOpenTemplates, onSend, onSendVoice, onResolve, onFocus, hasTemplate, C, bottomInset }: {
  draft: string; onChange: (v: string) => void;
  onOpenTemplates: () => void; onSend: () => void;
  onSendVoice: (v: { durationSec: number; seed: number }) => void;
  onResolve: () => void; onFocus: () => void;
  hasTemplate: boolean; C: ColorTheme; bottomInset: number;
}) {
  const empty = !draft.trim();
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec]       = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!recording) { setRecSec(0); return; }
    const t = setInterval(() => setRecSec(s => s + 0.1), 100);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!recording) { pulseAnim.stopAnimation(); pulseAnim.setValue(1); return; }
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
    ])).start();
  }, [recording]);

  const stopRecording = (send: boolean) => {
    const dur = Math.max(1, Math.round(recSec));
    setRecording(false);
    if (send) onSendVoice({ durationSec: dur, seed: Date.now() % 233 });
  };

  const fmtRec = (sec: number) => {
    const m  = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60).toString().padStart(2, '0');
    const t  = Math.floor((sec * 10) % 10);
    return `${m}:${ss}.${t}`;
  };

  const vars = useMemo(() => {
    const set = new Set<string>();
    const re = /\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(draft))) set.add(m[1]);
    return [...set];
  }, [draft]);

  const recStripBg  = C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : 'rgba(255,61,20,0.08)';
  const recStripBdr = C.mode === 'dark' ? 'rgba(255,90,53,0.28)' : 'rgba(255,61,20,0.22)';

  return (
    <View style={[s.composerWrap, { backgroundColor: C.cream, borderTopColor: C.hairline, paddingBottom: bottomInset + 10 }]}>
      {/* "You're in" status strip + resolve button */}
      <View style={s.composerStatus}>
        <View style={s.composerStatusLeft}>
          <View style={[s.composerDot, { backgroundColor: C.orange }]} />
          <Text style={[s.composerStatusText, { color: C.muted, fontFamily: F.monoSemibold }]}>
            You're in · bot paused
          </Text>
        </View>
        <TouchableOpacity
          onPress={onResolve}
          style={[s.resolveBtn, { borderColor: C.hairline }]}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={11} color={C.ink2} />
          <Text style={[s.resolveBtnText, { color: C.ink2, fontFamily: F.monoSemibold }]}>Resolve</Text>
        </TouchableOpacity>
      </View>

      {/* Variable hint banner */}
      {vars.length > 0 && (
        <View style={[s.varBanner, {
          backgroundColor: C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : 'rgba(255,61,20,0.08)',
          borderColor: C.mode === 'dark' ? 'rgba(255,90,53,0.22)' : 'rgba(255,61,20,0.18)',
        }]}>
          <Text style={[s.varFill, { color: C.orange, fontFamily: F.monoSemibold }]}>Fill {vars.length}</Text>
          {vars.map(v => (
            <View key={v} style={[s.varChip, { backgroundColor: C.paper, borderColor: C.mode === 'dark' ? 'rgba(255,90,53,0.30)' : 'rgba(255,61,20,0.22)' }]}>
              <Text style={[s.varChipText, { color: C.orange, fontFamily: F.monoSemibold }]}>{`{${v}}`}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.composerRow}>
        {/* Templates bolt button */}
        <TouchableOpacity
          onPress={onOpenTemplates}
          style={[s.composerBtn, {
            backgroundColor: hasTemplate ? C.orange : C.paper,
            borderColor: hasTemplate ? C.orange : C.hairline,
          }]}
          activeOpacity={0.75}
        >
          <Ionicons name="flash" size={18} color={hasTemplate ? C.cream : C.ink2} />
        </TouchableOpacity>

        {/* Text input OR recording strip */}
        {recording ? (
          <View style={[s.recStrip, { backgroundColor: recStripBg, borderColor: recStripBdr }]}>
            {/* Cancel */}
            <TouchableOpacity onPress={() => stopRecording(false)} hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={C.muted} />
            </TouchableOpacity>

            {/* Pulsing dot */}
            <Animated.View style={[s.recDot, { backgroundColor: C.orange, opacity: pulseAnim }]} />

            {/* Static bars */}
            <View style={s.recBars}>
              {Array.from({ length: 22 }).map((_, i) => (
                <View key={i} style={[s.recBar, {
                  backgroundColor: C.orange,
                  height: Math.max(4, Math.abs(Math.sin(i * 0.9)) * 20 + 4),
                }]} />
              ))}
            </View>

            {/* Live timer */}
            <Text style={[s.recTimer, { color: C.orange, fontFamily: F.monoSemibold }]}>{fmtRec(recSec)}</Text>
          </View>
        ) : (
          <View style={[s.inputPill, { backgroundColor: C.paper, borderColor: C.hairline }]}>
            <TextInput
              value={draft}
              onChangeText={onChange}
              placeholder="Type a message…"
              placeholderTextColor={C.faint}
              style={[s.inputField, { color: C.ink, fontFamily: F.regular }]}
              multiline
              onSubmitEditing={onSend}
              submitBehavior="newline"
              onFocus={onFocus}
            />
          </View>
        )}

        {/* Mic (when idle + empty) OR Send/Confirm */}
        {empty && !recording ? (
          <TouchableOpacity
            onPress={() => setRecording(true)}
            style={[s.composerBtn, { backgroundColor: C.paper, borderColor: C.hairline }]}
            activeOpacity={0.75}
          >
            <Ionicons name="mic-outline" size={18} color={C.ink2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={recording ? () => stopRecording(true) : onSend}
            disabled={empty && !recording}
            style={[s.composerBtn, {
              backgroundColor: (empty && !recording) ? C.paperSink : C.orange,
              borderColor: 'transparent',
              opacity: (empty && !recording) ? 0.6 : 1,
            }]}
            activeOpacity={0.75}
          >
            <Ionicons name="send" size={16} color={(empty && !recording) ? C.faint : C.cream} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Templates sheet ──────────────────────────────────────────
function TemplatesSheet({ visible, onClose, onPick, C, bottomInset }: {
  visible: boolean; onClose: () => void; onPick: (body: string) => void;
  C: ColorTheme; bottomInset: number;
}) {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let xs = TEMPLATES;
    if (cat !== 'all') xs = xs.filter(x => x.cat === cat);
    if (q.trim()) {
      const sq = q.toLowerCase();
      xs = xs.filter(x => x.title.toLowerCase().includes(sq) || x.body.toLowerCase().includes(sq));
    }
    return xs;
  }, [cat, q]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Scrim */}
      <TouchableOpacity style={[s.scrim]} activeOpacity={1} onPress={onClose} />
      {/* Sheet */}
      <View style={[s.sheet, { backgroundColor: C.cream, paddingBottom: bottomInset + 16 }]}>
        {/* Grabber */}
        <View style={s.sheetGrabberRow}>
          <View style={[s.sheetGrabber, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.18)' : 'rgba(22,18,15,0.18)' }]} />
        </View>
        {/* Header */}
        <View style={s.sheetHeader}>
          <Text style={[s.sheetTitle, { color: C.ink, fontFamily: F.bold }]}>Templates</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[s.sheetDone, { color: C.muted, fontFamily: F.monoSemibold }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.sheetSub, { color: C.muted, fontFamily: F.monoRegular }]}>
          Tap to drop into your reply · variables shown in orange
        </Text>
        {/* Search */}
        <View style={[s.searchRow, { backgroundColor: C.paper, borderColor: C.hairline }]}>
          <Ionicons name="search" size={15} color={C.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search templates"
            placeholderTextColor={C.faint}
            style={[s.searchInput, { color: C.ink, fontFamily: F.regular }]}
          />
        </View>
        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATS.map(cc => {
            const active = cat === cc.id;
            return (
              <TouchableOpacity
                key={cc.id}
                onPress={() => setCat(cc.id)}
                style={[s.catChip, {
                  backgroundColor: active ? C.pillActiveBg : 'transparent',
                  borderColor: active ? C.pillActiveBg : C.hairline,
                }]}
                activeOpacity={0.7}
              >
                <Text style={[s.catChipText, { color: active ? C.pillActiveFg : C.ink2, fontFamily: F.medium }]}>
                  {cc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Template list */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.tplList} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={[s.tplEmpty, { color: C.muted, fontFamily: F.regular }]}>No templates match.</Text>
          ) : filtered.map(tpl => (
            <TouchableOpacity
              key={tpl.id}
              onPress={() => { onPick(tpl.body); onClose(); }}
              style={[s.tplCard, { backgroundColor: C.paper, borderColor: C.hairline }]}
              activeOpacity={0.75}
            >
              <View style={s.tplCardTop}>
                <Text style={[s.tplTitle, { color: C.ink, fontFamily: F.semibold }]}>{tpl.title}</Text>
                <View style={[s.tplCatTag, { borderColor: C.hairline }]}>
                  <Text style={[s.tplCatText, { color: C.faint, fontFamily: F.monoSemibold }]}>{tpl.cat}</Text>
                </View>
              </View>
              <Text style={[s.tplBody, { color: C.muted, fontFamily: F.regular }]} numberOfLines={2}>
                {tpl.body}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Phone formatter ──────────────────────────────────────────
function formatPhone(raw: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  // Brazil +55: mobile 11 digits (XX 9XXXX-XXXX), landline 10 digits (XX XXXX-XXXX)
  if (raw.startsWith('+55') || (digits.startsWith('55') && digits.length >= 12)) {
    const d = digits.startsWith('55') ? digits.slice(2) : digits;
    if (d.length === 11) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  // US/Canada +1: 10 digits after country code
  if (raw.startsWith('+1') || (digits.startsWith('1') && digits.length === 11)) {
    const d = digits.length === 11 ? digits.slice(1) : digits;
    if (d.length === 10) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  // UK +44
  if (raw.startsWith('+44')) {
    const d = digits.slice(2);
    if (d.length === 10) return `+44 ${d.slice(0, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
  }
  // Mexico +52
  if (raw.startsWith('+52')) {
    const d = digits.slice(2);
    if (d.length === 10) return `+52 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  // Argentina +54
  if (raw.startsWith('+54')) {
    const d = digits.slice(2);
    if (d.length >= 10) return `+54 ${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  // Default: keep E.164 as-is
  return raw.startsWith('+') ? raw : `+${digits}`;
}

// ─── Order helpers ────────────────────────────────────────────
function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function relativeOrderTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function orderBadgeStyle(status: string, canceled: boolean, C: ColorTheme) {
  if (canceled) return { bg: C.needsBg, fg: C.needsFg };
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'en_route' || s === 'in_transit')
    return { bg: C.liveBg, fg: C.liveFg };
  if (s === 'preparing' || s === 'accepted')
    return { bg: C.mode === 'dark' ? 'rgba(255,90,53,0.15)' : 'rgba(255,61,20,0.10)', fg: C.orange };
  if (s === 'placed' || s === 'pending')
    return {
      bg: C.mode === 'dark' ? 'rgba(245,197,35,0.18)' : 'rgba(200,160,20,0.10)',
      fg: C.mode === 'dark' ? '#f5c523' : '#7a6000',
    };
  return { bg: C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink, fg: C.muted };
}

function orderDotColor(status: string, canceled: boolean, C: ColorTheme): string {
  if (canceled) return C.needs;
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'en_route' || s === 'in_transit') return C.live;
  if (s === 'preparing' || s === 'accepted') return C.orange;
  if (s === 'placed' || s === 'pending') return C.mode === 'dark' ? '#f5c523' : '#c8a000';
  return C.muted;
}

// ─── Order card ───────────────────────────────────────────────
function OrderCard({ order, onPress, C }: {
  order: ConversationOrder; onPress: () => void; C: ColorTheme;
}) {
  const badge = orderBadgeStyle(order.status, order.canceled, C);
  const dot = orderDotColor(order.status, order.canceled, C);
  const cardBg = C.mode === 'dark' ? 'rgba(250,245,238,0.05)' : C.paper;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[oc.card, { backgroundColor: cardBg, borderColor: C.hairline }]}
    >
      <View style={[oc.dot, { backgroundColor: dot }]} />
      <View style={oc.content}>
        <View style={oc.topRow}>
          <Text style={[oc.number, { color: C.ink, fontFamily: F.semibold }]}>
            #{order.number ?? order.id.slice(0, 6)}
          </Text>
          <View style={[oc.badge, { backgroundColor: badge.bg }]}>
            <Text style={[oc.badgeText, { color: badge.fg, fontFamily: F.monoSemibold }]}>
              {(order.canceled ? 'CANCELED' : order.status).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[oc.sub, { color: C.muted, fontFamily: F.monoRegular }]}>
          {capitalize(order.orderType)} · {fmtCents(order.totalCents)} · {relativeOrderTime(order.createdAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.faint} />
    </TouchableOpacity>
  );
}

// ─── Order intent card ────────────────────────────────────────
function OrderIntentCard({ intent, customerName, onDismiss, onReview, C }: {
  intent: ConversationOrderIntent;
  customerName: string;
  onDismiss: () => void;
  onReview: () => void;
  C: ColorTheme;
}) {
  const totalItems = intent.orderProducts.reduce((s, p) => s + p.quantity, 0);
  const isDelivery = intent.type?.toUpperCase() === 'DELIVERY';
  const cardBg = C.mode === 'dark' ? 'rgba(255,90,53,0.07)' : 'rgba(255,61,20,0.05)';
  const cardBorder = C.mode === 'dark' ? 'rgba(255,90,53,0.30)' : 'rgba(255,61,20,0.22)';
  const pillBg = C.mode === 'dark' ? 'rgba(250,245,238,0.07)' : C.paperSink;

  const missingType = !intent.type;
  const missingItems = totalItems === 0;
  const missingAddress = isDelivery && !intent.deliveryAddress;

  return (
    <View style={[oi.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Header */}
      <View style={oi.headerRow}>
        <View style={oi.headerLeft}>
          <Ionicons name="sparkles" size={11} color={C.orange} />
          <Text style={[oi.headerLabel, { color: C.orange, fontFamily: F.monoSemibold }]}>
            ZIPPY AI · ORDER INTENT
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={10} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color={C.faint} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[oi.title, { color: C.ink, fontFamily: F.semibold }]}>
        Looks like {customerName} wants to place an order.
      </Text>

      {/* Pills */}
      <View style={oi.pillsCol}>
        <View style={oi.pillsRow}>
          <View style={[oi.pill, { backgroundColor: pillBg, borderColor: missingType ? C.orange : cardBorder }]}>
            <Ionicons name={missingType ? 'alert-circle-outline' : (isDelivery ? 'location-outline' : 'storefront-outline')} size={12} color={missingType ? C.orange : C.muted} />
            <Text style={[oi.pillText, { color: missingType ? C.orange : C.ink, fontFamily: F.monoMedium }]}>
              {missingType ? 'Missing type' : (isDelivery ? 'Delivery' : 'Pickup')}
            </Text>
          </View>
          <View style={[oi.pill, { backgroundColor: pillBg, borderColor: missingItems ? C.orange : cardBorder }]}>
            <Ionicons name={missingItems ? 'alert-circle-outline' : 'bag-outline'} size={12} color={missingItems ? C.orange : C.muted} />
            <Text style={[oi.pillText, { color: missingItems ? C.orange : C.ink, fontFamily: F.monoMedium }]}>
              {missingItems ? 'Missing items' : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
            </Text>
          </View>
        </View>
        {(isDelivery || missingAddress) && (
          <View style={[oi.pill, { backgroundColor: pillBg, borderColor: missingAddress ? C.orange : cardBorder, alignSelf: 'flex-start', maxWidth: '100%' }]}>
            <Ionicons name={missingAddress ? 'alert-circle-outline' : 'navigate-outline'} size={12} color={missingAddress ? C.orange : C.muted} />
            <Text style={[oi.pillText, { color: missingAddress ? C.orange : C.ink, fontFamily: F.monoMedium }]} numberOfLines={1}>
              {missingAddress ? 'Missing address' : `${intent.deliveryAddress!.number} ${intent.deliveryAddress!.street}, ${intent.deliveryAddress!.city}`}
            </Text>
          </View>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[oi.cta, { backgroundColor: C.orange }]}
        activeOpacity={0.82}
        onPress={onReview}
      >
        <Text style={[oi.ctaText, { color: C.cream, fontFamily: F.semibold }]}>Review and create →</Text>
      </TouchableOpacity>
    </View>
  );
}
// ─── Screen ───────────────────────────────────────────────────
export default function ChatScreen() {
  const { id, name: pName, state: pState } = useLocalSearchParams<{
    id: string; name: string; state: string; last: string;
  }>();
  const router = useRouter();
  const C = getColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const { token, businessId, branchId: storedBranchId, logout } = useAuth();
  const branchId = storedBranchId ?? 'f27dacf2-e11d-4cde-9d02-a50431a19fef';
  const { subscribe } = useRealtime();
  const { chats, setChatsAndRef } = useChats();

  const name = pName ?? 'Customer';
  const [chatState, setChatState] = useState<ChatState>(
    (pState === 'take_care' || pState === 'resolved' ? pState : 'ai_handling') as ChatState,
  );

  const order = useMemo(() => chats.find(c => c.id === id)?.order ?? null, [chats, id]);
  const phone = useMemo(() => chats.find(c => c.id === id)?.phone ?? null, [chats, id]);
  const orderIntent = useMemo(() => chats.find(c => c.id === id)?.orderIntent ?? null, [chats, id]);
  console.log('[ChatScreen] orderIntent:', JSON.stringify(orderIntent, null, 2));
  const [dismissedIntentId, setDismissedIntentId] = useState<string | null>(null);
  const showOrderIntent = !!(orderIntent?.active && orderIntent.id !== dismissedIntentId);

  function handleDismissIntent() {
    if (!orderIntent) return;
    Alert.alert(
      'Remove order intent',
      'Are you sure you want to remove this order intent?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setDismissedIntentId(orderIntent.id);
            upsertOrderIntent(token!, businessId, { id: orderIntent.id, active: false }).catch(() => {});
          },
        },
      ],
    );
  }

  const [draft, setDraft] = useState('');
  const [apiItems, setApiItems] = useState<MsgItem[]>([]);
  const [localItems, setLocalItems] = useState<MsgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [takingOver, setTakingOver] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ url: string }[] | null>(null);
  const [viewerIdx, setViewerIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  const { bg, fg } = avatarTint(name, C.mode);
  const live = chatState === 'take_care' || chatState === 'resolved';

  const hasTemplate = !!draft && /\{[^}]+\}/.test(draft);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetchMessages(token, businessId, branchId, id);
      setApiItems(buildItems(res.payload ?? []));
    } catch (e: any) {
      if (e?.status === 401) await logout();
      // on other errors keep empty list — user sees a blank thread rather than crashing
    } finally {
      setLoading(false);
    }
  }, [token, businessId, branchId, id, logout]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    markConversationRead(token, businessId, branchId, id).catch(() => {});
  }, [token, businessId, branchId, id]);

  useEffect(() => {
    return subscribe((event) => {
      if (!event.conversationId || String(event.conversationId) !== String(id)) return;

      if (event.type === 'message_created') {
        const d = event.data;
const content = d.content;
        const audioAtt = d.hasAudio ? d.audioAttachments?.[0] : null;
        const imageAtts: { url: string; thumb?: string }[] = d.hasImage
          ? (d.imageAttachments ?? []).filter(a => !!a.url).map(a => ({ url: a.url!, thumb: a.thumbnailUrl ?? undefined }))
          : [];
        if (!content.trim() && !audioAtt && imageAtts.length === 0) return;

        const isIncoming = d.isCustomerMessage || d.direction === 'incoming';
        if (d.direction === 'outgoing' && d.source === 'agent') return;

        const from: Sender = isIncoming ? 'customer' : (d.source === 'ai' ? 'bot' : 'agent');
        const msgId = String(event.id ?? `sse-${Date.now()}`);
        const at = formatTime(d.messageSentAt);
        const senderName = d.senderName ?? '';
        let item: MsgItem;
        if (audioAtt?.url) {
          const durationSec = audioAtt.durationSeconds ? Math.max(1, Math.round(audioAtt.durationSeconds)) : 5;
          item = { kind: 'voice', id: msgId, from, durationSec, seed: msgId.length % 233, at, senderName, audioUrl: audioAtt.url };
        } else if (imageAtts.length > 0) {
          item = { kind: 'image', id: msgId, from, images: imageAtts, caption: content.trim() || undefined, at, senderName };
        } else {
          item = { kind: 'msg', id: msgId, from, text: content, at, senderName };
        }
        setApiItems(prev => prev.some(x => x.id === item.id) ? prev : [...prev, item]);
        setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 60);

        // Update chat state from inboxStatus on every message
        const inboxState = d.inboxStatus === 'take_care' ? 'take_care' : 'ai_handling';
        setChatState(prev => prev === 'resolved' ? prev : inboxState);
      } else if (event.type === 'chat_status_changed') {
        const inboxStatus = event.data.inboxStatus;
        setChatState(prev => prev === 'resolved' ? prev : (inboxStatus === 'take_care' ? 'take_care' : 'ai_handling'));
      }
    });
  }, [subscribe, id]);

  const allItems = useMemo(() => [...apiItems, ...localItems], [apiItems, localItems]);
  const reversedItems = useMemo(() => [...allItems].reverse(), [allItems]);

  const send = async () => {
    const message = draft.trim();
    if (!message) return;
    const now = new Date();
    const h = now.getHours(), min = now.getMinutes().toString().padStart(2, '0');
    const at = `${h % 12 || 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`;
    const msg: MsgItem = { kind: 'msg', id: `local-${Date.now()}`, from: 'agent', text: message, at };
    setLocalItems(prev => [...prev, msg]);
    setDraft('');
    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 60);

    if (!token || !id) return;
    try {
      await sendConversationMessage(token, businessId, branchId, id, {
        content: message,
      });
    } catch (e: any) {
      if (e?.status === 401) await logout();
    }
  };

  const handleResolve = async () => {
    const now = new Date();
    const h = now.getHours(), min = now.getMinutes().toString().padStart(2, '0');
    const at = `${h % 12 || 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`;
    setLocalItems(prev => [...prev, { kind: 'resolved', id: `resolved-${Date.now()}`, by: 'You', at }]);
    setChatState('resolved');
    setChatsAndRef(prev => prev.filter(c => c.id !== id));
    setDraft('');
    if (!token || !id) return;
    try {
      await resolveConversation(token, businessId, branchId, id);
    } catch (e: any) {
      if (e?.status === 401) await logout();
    }
  };

  const handleTakeOver = async () => {
    if (!token || !id || takingOver) return;
    setTakingOver(true);
    try {
      await takeOverConversation(token, businessId, branchId, id);
      setChatState('take_care');
    } catch (e: any) {
      if (e?.status === 401) await logout();
    } finally {
      setTakingOver(false);
    }
  };

  const sendVoice = ({ durationSec, seed }: { durationSec: number; seed: number }) => {
    console.log('[voice] sendVoice called', { durationSec, seed });
    const now = new Date();
    const h = now.getHours(), min = now.getMinutes().toString().padStart(2, '0');
    const at = `${h % 12 || 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`;
    const msg: MsgItem = { kind: 'voice', id: `local-voice-${Date.now()}`, from: 'agent', durationSec, seed, at };
    setLocalItems(prev => {
      console.log('[voice] adding to localItems, prev length:', prev.length);
      return [...prev, msg];
    });
    setTimeout(() => listRef.current?.scrollToIndex({ index: 0, animated: true }), 150);
  };

  const renderItem = ({ item, index }: { item: MsgItem; index: number }) => {
    if (item.kind === 'day') return <DayDivider label={item.label} at={item.at} C={C} />;
    if (item.kind === 'handoff') return <HandoffNote who={item.who} at={item.at} C={C} />;
    if (item.kind === 'resolved') return <ResolvedNote by={item.by} at={item.at} C={C} />;

    // inverted list: index-1 = visually below (newer), index+1 = visually above (older)
    const below = index > 0 ? reversedItems[index - 1] : null;
    const above = index < reversedItems.length - 1 ? reversedItems[index + 1] : null;
    const isBubble = (x: MsgItem | null) => x?.kind === 'msg' || x?.kind === 'voice' || x?.kind === 'image';
    const sameAsAbove = isBubble(above) && (above as any).from === item.from && (above as any).at === item.at;
    const sameAsBelow = isBubble(below) && (below as any).from === item.from && (below as any).at === item.at;

    if (item.kind === 'voice') {
      return (
        <VoiceBubble
          from={item.from}
          durationSec={item.durationSec}
          seed={item.seed}
          at={item.at}
          senderName={item.senderName}
          audioUrl={item.audioUrl}
          showBadge={!sameAsAbove}
          showTime={!sameAsBelow}
          C={C}
        />
      );
    }

    if (item.kind === 'image') {
      return (
        <ImageBubble
          from={item.from}
          images={item.images}
          caption={item.caption}
          at={item.at}
          senderName={item.senderName}
          showBadge={!sameAsAbove}
          showTime={!sameAsBelow}
          onOpen={(idx) => { setViewerImages(item.images); setViewerIdx(idx); }}
          C={C}
        />
      );
    }

    return (
      <Bubble
        from={item.from}
        text={(item as Extract<MsgItem, { kind: 'msg' }>).text}
        at={item.at}
        senderName={item.senderName}
        showBadge={!sameAsAbove}
        showTime={!sameAsBelow}
        C={C}
      />
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.cream }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: C.cream, borderBottomColor: C.hairline }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <View style={[s.headerAvatar, { backgroundColor: bg, borderRadius: 20 }]}>
            <Text style={[s.headerAvatarText, { color: fg, fontFamily: F.semibold }]}>
              {getInitials(name)}
            </Text>
          </View>
          {live && <View style={[s.liveRing, { borderColor: C.orange }]} />}
          <View style={[s.waBadge, { borderColor: C.cream }]}>
            <Text style={s.waText}>W</Text>
          </View>
        </View>

        <View style={s.headerInfo}>
          <Text style={[s.headerName, { color: C.ink, fontFamily: F.semibold }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[s.headerSub, { color: C.muted, fontFamily: F.monoRegular }]}>
            WhatsApp{phone ? ` · ${formatPhone(phone)}` : ''}
          </Text>
        </View>

      </View>

      {/* ── Order card ── */}
      {order && (
        <View style={[oc.container, { borderBottomColor: C.hairline }]}>
          <OrderCard
            order={order}
            onPress={() => router.push({ pathname: '/chat/order-detail', params: { id } })}
            C={C}
          />
        </View>
      )}

      {/* ── Messages + Composer ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={C.orange} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={reversedItems}
            extraData={reversedItems}
            keyExtractor={m => m.id}
            renderItem={renderItem}
            contentContainerStyle={s.msgList}
            showsVerticalScrollIndicator={false}
            inverted
          />
        )}

        {showOrderIntent && (
          <OrderIntentCard
            intent={orderIntent!}
            customerName={name}
            onDismiss={handleDismissIntent}
            onReview={() => router.push({ pathname: '/chat/review-order', params: { id } })}
            C={C}
          />
        )}

        {chatState === 'take_care' ? (
          <Composer
            draft={draft}
            onChange={setDraft}
            onOpenTemplates={() => setSheetOpen(true)}
            onSend={send}
            onSendVoice={sendVoice}
            onResolve={handleResolve}
            onFocus={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
            hasTemplate={hasTemplate}
            C={C}
            bottomInset={0}
          />
        ) : (
          <TakeOverPanel
            onTakeOver={chatState === 'resolved' ? () => setChatState('take_care') : handleTakeOver}
            takingOver={takingOver}
            isResolved={chatState === 'resolved'}
            onResolve={handleResolve}
            C={C}
            bottomInset={0}
          />
        )}
      </KeyboardAvoidingView>
      <View style={{ height: insets.bottom, backgroundColor: C.cream }} />

      {/* ── Templates sheet (overlay) ── */}
      <TemplatesSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPick={body => setDraft(body)}
        C={C}
        bottomInset={insets.bottom}
      />

      {/* ── Image viewer ── */}
      {viewerImages && (
        <ImageViewer
          images={viewerImages}
          startIdx={viewerIdx}
          onClose={() => setViewerImages(null)}
        />
      )}


    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 2 },
  headerAvatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 15, letterSpacing: -0.2 },
  liveRing: { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 22, borderWidth: 2 },
  waBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  waText: { color: '#fff', fontSize: 8, fontWeight: '700', lineHeight: 10 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 15, letterSpacing: -0.2 },
  headerSub: { fontSize: 10, letterSpacing: 0.4, marginTop: 1 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  statePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
  },
  stateDot: { width: 5, height: 5, borderRadius: 3 },
  statePillText: {
    fontFamily: F.monoSemibold, fontSize: 10,
    letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false,
  },

  // Messages
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 8, gap: 2 },

  // Day divider
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14 },
  dayLine: { flex: 1, height: 1 },
  dayLabel: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false },

  // Resolved note
  resolvedRow: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  resolvedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  resolvedText: { fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },

  // Handoff note
  handoffRow: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  handoffPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  handoffDot: { width: 6, height: 6, borderRadius: 3 },
  handoffText: { fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },

  // Bubbles
  bubbleWrap: { paddingHorizontal: 16, paddingVertical: 1, maxWidth: '78%' },
  bubbleWrapRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  // Sender badge — shown above every bot/agent bubble
  senderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
    marginBottom: 4, marginHorizontal: 4,
  },
  senderBadgeText: { fontSize: 9.5, letterSpacing: 0.9, textTransform: 'uppercase', includeFontPadding: false },
  bubble: { paddingHorizontal: 13, paddingVertical: 10 },
  bubbleText: { fontSize: 14.5, lineHeight: 21, letterSpacing: -0.1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginHorizontal: 6 },
  timeText: { fontSize: 10, includeFontPadding: false },

  // Image bubble
  imageBubble: { borderWidth: 1, overflow: 'hidden' },
  imageBubbleCaption: { fontSize: 14.5, lineHeight: 21, letterSpacing: -0.1, paddingHorizontal: 13, paddingBottom: 10, paddingTop: 4 },

  // Take-over panel
  toPanel: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 14 },
  toStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  toDotRing: {
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  toDot: { width: 8, height: 8, borderRadius: 4 },
  toStatusLabel: {
    fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false,
  },
  toStatusMuted: { fontSize: 10.5, letterSpacing: 0.4, includeFontPadding: false },
  toTitle: { fontSize: 15, letterSpacing: -0.15, lineHeight: 19 },
  toSub: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  toBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 14, marginTop: 12,
  },
  toBtnText: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
  toHint: {
    marginTop: 8, textAlign: 'center',
    fontSize: 10, letterSpacing: 0.4, includeFontPadding: false,
  },

  // Composer
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingTop: 8 },
  composerStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, paddingHorizontal: 2 },
  composerStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
  },
  resolveBtnText: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },
  composerDot: { width: 6, height: 6, borderRadius: 3 },
  composerStatusText: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },
  varBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  varFill: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },
  varChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  varChipText: { fontSize: 11, includeFontPadding: false },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputPill: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4, minHeight: 40, justifyContent: 'center' },
  inputField: { fontSize: 14.5, lineHeight: 21, maxHeight: 140, paddingVertical: 4 },

  // Templates sheet
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '72%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetGrabberRow: { paddingTop: 8, alignItems: 'center' },
  sheetGrabber: { width: 38, height: 4, borderRadius: 2 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  sheetTitle: { fontSize: 20, letterSpacing: -0.4 },
  sheetDone: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },
  sheetSub: { paddingHorizontal: 16, fontSize: 11, letterSpacing: 0.6, marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, padding: 9, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  catRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  catChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  catChipText: { fontSize: 12.5, includeFontPadding: false },
  tplList: { paddingHorizontal: 12, paddingBottom: 24, gap: 8 },
  tplEmpty: { textAlign: 'center', padding: 40, fontSize: 13 },
  tplCard: { borderRadius: 14, padding: 12, borderWidth: 1 },
  tplCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tplTitle: { fontSize: 13.5, letterSpacing: -0.1 },
  tplCatTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  tplCatText: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', includeFontPadding: false },
  tplBody: { fontSize: 13, lineHeight: 18 },

  // Voice bubble
  voiceBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingLeft: 8, paddingRight: 12,
    borderWidth: 1,
  },
  voicePlayBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  voiceBars: {
    flex: 1, flexDirection: 'row', alignItems: 'center', height: 28, gap: 2,
  },
  voiceTime: { fontSize: 11, letterSpacing: 0.2, includeFontPadding: false },

  // Recording strip
  recStrip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 22, paddingHorizontal: 12, minHeight: 40,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  recBars: {
    flex: 1, flexDirection: 'row', alignItems: 'center', height: 24, gap: 2, overflow: 'hidden',
  },
  recBar: { flex: 1, borderRadius: 2, opacity: 0.6 },
  recTimer: { fontSize: 12, letterSpacing: 0.2, flexShrink: 0, includeFontPadding: false },
});

// ─── Order card styles ────────────────────────────────────────
const oc = StyleSheet.create({
  container: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { fontSize: 15, letterSpacing: -0.2, includeFontPadding: false },
  badge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  badgeText: { fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },
  sub: { fontSize: 12, letterSpacing: 0.2, includeFontPadding: false },
});

// ─── Order intent card styles ─────────────────────────────────
const oi = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginBottom: 8,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerLabel: { fontSize: 10, letterSpacing: 1.0, includeFontPadding: false },
  title: { fontSize: 15, letterSpacing: -0.2, lineHeight: 21, includeFontPadding: false },
  pillsCol: { flexDirection: 'column', gap: 6 },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
  },
  pillText: { fontSize: 12, letterSpacing: 0.2, includeFontPadding: false },
  addressPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start', maxWidth: '100%',
  },
  addressText: { fontSize: 12, letterSpacing: 0.1, includeFontPadding: false, flexShrink: 1 },
  cta: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },
});
