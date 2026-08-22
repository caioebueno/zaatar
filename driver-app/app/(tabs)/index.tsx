import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/auth';
import { getNextDispatch, listDriverDispatches, activateDriver, DispatchEntity } from '@/lib/dispatch-api';
import { calculateOrderTotal } from '@/utils/orderTotal';
import {
  getTrackingStatus,
  startDriverTracking,
  stopDriverTracking,
  startRouteTracking,
  stopRouteTracking,
  type TrackingStatus,
} from '@/lib/route-tracking';

// ─── Zappy tokens (dark) ──────────────────────────────────────────────────────
const Z = {
  bg:       '#191919',
  chrome:   '#202020',
  surface:  '#252525',
  elevated: '#2F2F2F',
  border:   'rgba(255,255,255,0.094)',
  divider:  'rgba(255,255,255,0.055)',
  fg1:      '#F1F1F1',
  fg2:      '#9B9B9B',
  fg3:      '#B4B4B4',
  brand:    '#FF3D14',
  volt:     '#FFD600',
  success:  '#22C55E',
};

const SANS    = 'Geist_400Regular';
const SANS_M  = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B  = 'Geist_700Bold';
const MONO    = 'GeistMono_400Regular';

const money = (cents: number) => 'R$ ' + (cents / 100).toFixed(2).replace('.', ',');

// Tracking counts as "on" only while we're actually sending location to the
// server — i.e. a location batch was flushed within this window. A registered
// background task that isn't producing/uploading fixes is treated as off.
const SENDING_WINDOW_MS = 90_000;

type Addr = NonNullable<DispatchEntity['orders'][number]['deliveryAddress']>;

function openMaps(addr: Addr) {
  const query = encodeURIComponent(`${addr.street} ${addr.number}, ${addr.city}, ${addr.state}, ${addr.zipCode}`);
  const url = Platform.OS === 'ios' ? `maps://maps.apple.com/?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function paymentLabel(m: string): string {
  const map: Record<string, string> = {
    CREDIT_CARD: 'Cartão', DEBIT_CARD: 'Débito', CASH: 'Dinheiro', PIX: 'Pix', CARD: 'Cartão',
    cash: 'Dinheiro', card: 'Cartão',
  };
  return map[m] ?? m;
}

// ─── Past delivery type + mappers ─────────────────────────────────────────────
type PastDelivery = {
  id: string;
  customer: string;
  address: string;
  etaMin: number | null;
  actualMin: number | null;
  at: string;
  status: 'delivered' | 'late';
};

function mapDispatchToPast(d: DispatchEntity): PastDelivery | null {
  const sorted = [...d.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const first = sorted[0];
  if (!first || !d.startedDeliveryAt) return null;

  const lastDeliveredAt = sorted.reduce<string | null>((max, o) => {
    if (!o.deliveredAt) return max;
    return !max || o.deliveredAt > max ? o.deliveredAt : max;
  }, null);
  if (!lastDeliveredAt) return null;

  const actualMin = Math.round(
    (new Date(lastDeliveredAt).getTime() - new Date(d.startedDeliveryAt).getTime()) / 60000,
  );
  const etaMin = d.estimatedDeliveryDurationMinutes ?? first.estimatedDeliveryDurationMinutes ?? null;

  return {
    id: d.id,
    customer: first.customer?.name ?? 'Cliente',
    address: first.deliveryAddress ? `${first.deliveryAddress.street}, ${first.deliveryAddress.number}` : '—',
    etaMin,
    actualMin,
    at: new Date(d.startedDeliveryAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: etaMin !== null && actualMin > etaMin ? 'late' : 'delivered',
  };
}

function dateRangeFor(filter: 'today' | 'week' | 'month'): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const from = new Date(now);
  if (filter === 'week') from.setDate(now.getDate() - 6);
  if (filter === 'month') from.setDate(now.getDate() - 29);
  return { start: from.toISOString().split('T')[0], end };
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[primStyles.label, style]}>{children}</Text>;
}

function LiveDot({ color = Z.brand, size = 8 }: { color?: string; size?: number }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(300),
      ])
    ).start();
  }, []);
  const scale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacity = ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.1, 0] });
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }], opacity }} />
      <View style={{ position: 'absolute', inset: 0, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

const primStyles = StyleSheet.create({
  label: { fontFamily: SANS_M, fontSize: 12, color: Z.fg3, letterSpacing: 0.6, textTransform: 'uppercase' },
  card: { backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 12 },
});

// ─── Active delivery card ─────────────────────────────────────────────────────
function ActiveDeliveryCard({ dispatch, onNavigate }: { dispatch: DispatchEntity; onNavigate: () => void }) {
  const sorted = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const order = sorted.find((o) => !o.deliveredAt) ?? sorted[0];
  if (!order) return null;

  const addr = order.deliveryAddress;
  const eta = dispatch.estimatedDeliveryDurationMinutes ?? order.estimatedDeliveryDurationMinutes ?? null;
  const total = calculateOrderTotal(order);
  const paid = !!order.paidAt;
  const stops = dispatch.orders.length;

  return (
    <View style={[primStyles.card, { borderColor: 'rgba(255,61,20,0.30)', overflow: 'hidden' }]}>
      <View style={activeStyles.strip}>
        <LiveDot />
        <Text style={{ flex: 1, fontFamily: SANS_SB, fontSize: 14, color: Z.brand }}>Despacho em andamento</Text>
        <Text style={{ fontFamily: MONO, fontSize: 13, color: Z.fg3 }}>{stops} {stops === 1 ? 'parada' : 'paradas'}</Text>
      </View>

      <View style={{ padding: 16 }}>
        <Label style={{ marginBottom: 6 }}>Próxima parada</Label>
        <Text style={{ fontFamily: SANS_B, fontSize: 26, color: Z.fg1, letterSpacing: -0.65, lineHeight: 31, marginBottom: 12 }}>
          {order.customer?.name ?? 'Cliente'}
        </Text>

        {addr && (
          <TouchableOpacity style={[activeStyles.addr, { marginBottom: 14 }]} onPress={() => openMaps(addr)} activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Ionicons name="location" size={16} color={Z.brand} style={{ marginTop: 3 }} />
              <Text style={{ flex: 1, fontFamily: SANS, fontSize: 15, lineHeight: 22, color: Z.fg1 }}>
                {addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={Z.fg3} style={{ marginTop: 3 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Z.divider }}>
              <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.brand }}>Abrir no Google Maps</Text>
              {eta != null && <Text style={{ fontFamily: MONO, fontSize: 13, color: Z.fg3 }}>{eta} min</Text>}
            </View>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {paid ? (
            <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.fg2 }}>
              Pago em {paymentLabel(order.paymentMethod)} · nada a receber
            </Text>
          ) : (
            <>
              <Ionicons name="alert-circle" size={15} color={Z.volt} />
              <Text style={{ fontFamily: SANS_SB, fontSize: 14, color: Z.volt }}>
                Receber {money(total)} em {paymentLabel(order.paymentMethod)}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity style={btnStyles.brand} onPress={onNavigate} activeOpacity={0.88}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={btnStyles.brandText}>Continuar despacho</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const activeStyles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Z.divider },
  addr: { backgroundColor: Z.bg, borderWidth: 1, borderColor: Z.border, borderRadius: 8, padding: 14 },
});

const btnStyles = StyleSheet.create({
  brand: { height: 50, borderRadius: 8, backgroundColor: Z.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brandText: { fontFamily: SANS_SB, fontSize: 16, color: '#fff' },
});

// ─── Waiting card ─────────────────────────────────────────────────────────────
function WaitingCard() {
  return (
    <View style={[primStyles.card, { padding: 20 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <LiveDot color={Z.success} size={9} />
        <Text style={{ fontFamily: SANS_SB, fontSize: 16, color: Z.fg1 }}>Aguardando nova entrega</Text>
      </View>
      <Text style={{ fontFamily: SANS, fontSize: 15, lineHeight: 22, color: Z.fg3 }}>
        Você será notificado assim que um despacho for atribuído.
      </Text>
    </View>
  );
}

// ─── Tracking card ────────────────────────────────────────────────────────────
function TrackingCard({ active, busy, onToggle }: { active: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <View style={[primStyles.card, { padding: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Label style={{ marginBottom: 6 }}>Rastreamento de posição</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {active && <LiveDot color={Z.success} size={8} />}
            <Text style={{ fontFamily: SANS_B, fontSize: 20, color: active ? Z.success : Z.fg2, letterSpacing: -0.4 }}>
              {active ? 'Ativado' : 'Desativado'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onToggle}
          disabled={busy}
          activeOpacity={0.85}
          accessibilityRole="switch"
          accessibilityState={{ checked: active, busy }}
          style={{
            width: 60, height: 34, borderRadius: 999, padding: 3, opacity: busy ? 0.6 : 1,
            backgroundColor: active ? Z.success : Z.elevated,
            borderWidth: 1, borderColor: active ? Z.success : Z.border,
            flexDirection: 'row', alignItems: 'center', justifyContent: active ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: active ? '#0D0D0D' : Z.fg2 }} />
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Z.divider }}>
        <Text style={{ fontFamily: SANS, fontSize: 14, lineHeight: 21, color: Z.fg3 }}>
          {active
            ? 'Sua posição é enviada em segundo plano enquanto o app estiver aberto ou minimizado.'
            : 'Ative para que a operação acompanhe sua rota em tempo real.'}
        </Text>
      </View>
    </View>
  );
}

// ─── Today summary ────────────────────────────────────────────────────────────
function TodayCard({ onOpen }: { onOpen: () => void }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<PastDelivery[]>([]);
  const [deliveries, setDeliveries] = useState(0);
  const [earnings, setEarnings] = useState(0); // cents
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!token) return;
    const { start, end } = dateRangeFor('today');
    listDriverDispatches(token, start, end)
      .then((dispatches) => {
        const mapped = dispatches.map(mapDispatchToPast).filter((d): d is PastDelivery => d !== null);
        setRows(mapped);
        const done = dispatches.flatMap((d) => d.orders).filter((o) => !!o.deliveredAt);
        setDeliveries(done.length);
        setEarnings(done.reduce((s, o) => s + (o.deliveryAddress?.deliveryFee ?? 0), 0));
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [token]);

  const total = rows.length;
  const onTime = rows.filter((d) => d.status !== 'late').length;
  const onTimePct = total ? Math.round((onTime / total) * 100) : null;
  const withTime = rows.filter((d) => d.actualMin !== null);
  const avg = withTime.length ? Math.round(withTime.reduce((s, d) => s + d.actualMin!, 0) / withTime.length) : null;

  const dash = fetched ? '—' : '…';
  const stats: [string, string, string][] = [
    ['Entregas', String(deliveries), Z.fg1],
    ['No prazo', onTimePct != null ? `${onTimePct}%` : dash, onTimePct != null && onTimePct >= 80 ? Z.success : Z.volt],
    ['Tempo médio', avg != null ? `${avg} min` : dash, Z.fg1],
    ['Ganhos', earnings > 0 || fetched ? money(earnings) : dash, Z.success],
  ];

  return (
    <TouchableOpacity style={[primStyles.card, { padding: 16 }]} onPress={onOpen} activeOpacity={0.85}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Text style={{ flex: 1, fontFamily: SANS_B, fontSize: 20, color: Z.fg1, letterSpacing: -0.4 }}>Hoje</Text>
        <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.brand }}>Ver histórico</Text>
        <Ionicons name="chevron-forward" size={15} color={Z.brand} />
      </View>
      <View style={todayStyles.grid}>
        {stats.map(([label, value, color], i) => (
          <View
            key={label}
            style={[
              todayStyles.cell,
              // Left column → right divider; bottom row → top divider.
              i % 2 === 0 ? { borderRightWidth: 1 } : null,
              i >= 2 ? { borderTopWidth: 1 } : null,
            ]}
          >
            <Label style={{ marginBottom: 6 }}>{label}</Label>
            <Text style={{ fontFamily: SANS_B, fontSize: 22, color, letterSpacing: -0.55 }}>{value}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const todayStyles = StyleSheet.create({
  // Exactly 2 cells per row (width 50%, no gap); 1px dividers via per-cell borders.
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: Z.divider, borderRadius: 8, overflow: 'hidden' },
  cell: { width: '50%', backgroundColor: Z.surface, padding: 14, borderColor: Z.divider },
});

// ─── Home layout ──────────────────────────────────────────────────────────────
function HomeScreen({
  dispatch, loading, trackingActive, trackingBusy, onToggleTracking, onShowHistory,
}: {
  dispatch: DispatchEntity | null;
  loading: boolean;
  trackingActive: boolean;
  trackingBusy: boolean;
  onToggleTracking: () => void;
  onShowHistory: () => void;
}) {
  const { driver } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = driver?.name?.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: Z.bg }}>
      {/* Header */}
      <View style={[homeStyles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: SANS, fontSize: 14, color: Z.fg3, marginBottom: 4 }}>{greeting}</Text>
          <Text style={{ fontFamily: SANS_B, fontSize: 24, color: Z.fg1, letterSpacing: -0.6, lineHeight: 26 }} numberOfLines={1}>{firstName}</Text>
        </View>
        <TouchableOpacity style={homeStyles.gear} onPress={() => router.push('/settings')} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={18} color={Z.fg1} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={[primStyles.card, { padding: 28, alignItems: 'center' }]}>
            <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.fg3 }}>Carregando…</Text>
          </View>
        ) : (
          <>
            {dispatch ? (
              <ActiveDeliveryCard dispatch={dispatch} onNavigate={() => router.push('/delivery')} />
            ) : (
              <WaitingCard />
            )}
            <TrackingCard active={trackingActive} busy={trackingBusy} onToggle={onToggleTracking} />
          </>
        )}
        <TodayCard onOpen={onShowHistory} />
      </ScrollView>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: Z.chrome, borderBottomWidth: 1, borderBottomColor: Z.border,
  },
  gear: {
    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
    backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Root export (container) ──────────────────────────────────────────────────
export default function DriverHome() {
  const { token } = useAuth();
  const router = useRouter();
  const [dispatch, setDispatch] = useState<DispatchEntity | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    hasBufferedPoints: false,
    isRunning: false,
    mode: 'inactive',
    lastFlushAt: null,
  });
  const didInitialFetch = useRef(false);

  const refreshTrackingStatus = useCallback(async () => {
    const nextStatus = await getTrackingStatus().catch((): TrackingStatus => ({
      hasBufferedPoints: false,
      isRunning: false,
      mode: 'inactive',
      lastFlushAt: null,
    }));
    setTrackingStatus(nextStatus);
  }, []);

  const fetchDispatch = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNextDispatch(token);
      setDispatch(data);
    } catch {
      // keep previous on error
    } finally {
      if (!didInitialFetch.current) {
        didInitialFetch.current = true;
        setLoadingInitial(false);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchDispatch();
    const interval = setInterval(fetchDispatch, 5000);
    return () => clearInterval(interval);
  }, [fetchDispatch]);

  useEffect(() => {
    void refreshTrackingStatus();

    const interval = setInterval(() => {
      void refreshTrackingStatus();
    }, 4000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshTrackingStatus();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshTrackingStatus]);

  // The driver is always available: mark active + resume tracking on mount.
  const didResume = useRef(false);
  useEffect(() => {
    if (didResume.current || !token) return;
    didResume.current = true;
    activateDriver(token).catch((e) => console.log('[home] activate error', e));
    startDriverTracking(token)
      .then(refreshTrackingStatus)
      .catch((e) => console.log('[home] resume tracking error', e));
  }, [token, refreshTrackingStatus]);

  // Manage route tracking lifecycle from the dispatch polling state
  const prevRouteRef = useRef<{ id: string; started: boolean } | null>(null);
  useEffect(() => {
    if (!token) return;
    const cur = dispatch ? { id: dispatch.id, started: !!dispatch.startedDeliveryAt } : null;
    const prev = prevRouteRef.current;

    if (cur?.started && (prev?.id !== cur.id || !prev?.started)) {
      startRouteTracking(token, cur.id)
        .then(refreshTrackingStatus)
        .catch((e) => console.log('[home] startRouteTracking error', e));
    } else if (!cur?.started && prev?.started) {
      stopRouteTracking()
        .then(refreshTrackingStatus)
        .catch((e) => console.log('[home] stopRouteTracking error', e));
    }

    prevRouteRef.current = cur;
  }, [dispatch, token, refreshTrackingStatus]);

  const handleToggleTracking = useCallback(async () => {
    if (!token) return;

    setTrackingBusy(true);

    // Branch on whether we're actually sending (matches the displayed state):
    // if a registered task isn't uploading, tapping restarts it rather than stopping.
    const sending =
      trackingStatus.isRunning &&
      trackingStatus.lastFlushAt != null &&
      Date.now() - trackingStatus.lastFlushAt < SENDING_WINDOW_MS;

    try {
      if (sending) {
        await stopDriverTracking();
      } else if (dispatch?.startedDeliveryAt) {
        await startRouteTracking(token, dispatch.id);
      } else {
        await startDriverTracking(token);
      }

      await refreshTrackingStatus();
    } catch (error) {
      console.log('[home] toggle tracking error', error);
      Alert.alert(
        'Nao foi possivel atualizar o rastreamento',
        'Verifique as permissoes de localizacao e tente novamente.',
      );
    } finally {
      setTrackingBusy(false);
    }
  }, [token, trackingStatus.isRunning, trackingStatus.lastFlushAt, dispatch, refreshTrackingStatus]);

  // On only when a location send actually reached the server recently — a
  // registered task with no successful flush does not count as tracking.
  const trackingSending =
    trackingStatus.isRunning &&
    trackingStatus.lastFlushAt != null &&
    Date.now() - trackingStatus.lastFlushAt < SENDING_WINDOW_MS;

  return (
    <HomeScreen
      dispatch={dispatch}
      loading={loadingInitial}
      trackingActive={trackingSending}
      trackingBusy={trackingBusy}
      onToggleTracking={handleToggleTracking}
      onShowHistory={() => router.push('/entregas')}
    />
  );
}
