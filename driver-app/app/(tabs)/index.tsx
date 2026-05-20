import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { getNextDispatch, listDriverDispatches, activateDriver, deactivateDriver, DispatchEntity } from '@/lib/dispatch-api';
import { calculateOrderTotal } from '@/utils/orderTotal';
import { startDriverTracking, stopDriverTracking } from '@/lib/route-tracking';

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  bg:     '#0a0807',
  surf:   '#181310',
  surf2:  '#1e1812',
  surf3:  '#2a211b',
  line:   'rgba(250,245,238,0.09)',
  lineS:  'rgba(250,245,238,0.13)',
  text:   '#faf5ee',
  dim:    'rgba(250,245,238,0.68)',
  faint:  'rgba(250,245,238,0.48)',
  vfaint: 'rgba(250,245,238,0.28)',
  zippy:  '#ff3d14',
  green:  '#34d39a',
  amber:  '#f2b338',
};

const SANS    = 'Geist_400Regular';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_B  = 'GeistMono_700Bold';

// ─── Past delivery type ───────────────────────────────────────────────────────
type PastDelivery = {
  id: string;
  customer: string;
  extraCount: number;
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
    extraCount: sorted.length - 1,
    address: first.deliveryAddress
      ? `${first.deliveryAddress.street}, ${first.deliveryAddress.number}`
      : '—',
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
  if (filter === 'week')  from.setDate(now.getDate() - 6);
  if (filter === 'month') from.setDate(now.getDate() - 29);
  return { start: from.toISOString().split('T')[0], end };
}

// ─── ZippyMark ────────────────────────────────────────────────────────────────
function ZippyMark({ size = 24 }: { size?: number }) {
  const s = size / 100;
  const cx = 50 * s;
  const cy = 60 * s;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: D.zippy, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: cx - 32 * s, top: cy - 32 * s, width: 64 * s, height: 32 * s, overflow: 'hidden' }}>
        <View style={{ width: 64 * s, height: 64 * s, borderRadius: 32 * s, borderWidth: 6 * s, borderColor: 'rgba(255,255,255,0.25)' }} />
      </View>
      <View style={{ position: 'absolute', left: cx - 22 * s, top: cy - 22 * s, width: 44 * s, height: 22 * s, overflow: 'hidden' }}>
        <View style={{ width: 44 * s, height: 44 * s, borderRadius: 22 * s, borderWidth: 8 * s, borderColor: 'rgba(255,255,255,0.55)' }} />
      </View>
      <View style={{ position: 'absolute', left: 41 * s, top: 51 * s, width: 18 * s, height: 18 * s, borderRadius: 4 * s, backgroundColor: '#fff' }} />
    </View>
  );
}

// ─── Animated ring dot (pulse) ────────────────────────────────────────────────
function RingDot({ color = D.green, size = 8 }: { color?: string; size?: number }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(400),
      ])
    ).start();
  }, []);
  const scale   = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacity = ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.1, 0] });
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{
        position: 'absolute', inset: 0, borderRadius: size / 2,
        backgroundColor: color, transform: [{ scale }], opacity,
      }} />
      <View style={{ position: 'absolute', inset: 0, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paymentLabel(m: string) {
  if (m === 'cash') return 'Dinheiro';
  if (m === 'card') return 'Cartão';
  return m;
}

// ─── ActivateCard ─────────────────────────────────────────────────────────────
function ActivateCard({ onActivate, loading }: { onActivate: () => void; loading: boolean }) {
  const now     = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={activateStyles.card}>
      {/* Header strip */}
      <View style={activateStyles.strip}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={activateStyles.offlineDot} />
          <Text style={activateStyles.stripLabel}>Offline · Inativo</Text>
        </View>
        <Text style={activateStyles.timeText}>{timeStr}</Text>
      </View>

      <View style={{ padding: 16, paddingBottom: 18 }}>
        <Text style={activateStyles.title}>Iniciar turno de entregas</Text>
        <Text style={activateStyles.subtitle}>
          Ative sua disponibilidade para começar a receber pedidos de entrega.
        </Text>

        <TouchableOpacity
          style={[activateStyles.btn, loading && { opacity: 0.6 }]}
          onPress={onActivate}
          disabled={loading}
          activeOpacity={0.88}
        >
          <Text style={activateStyles.btnText}>Ficar disponível</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const activateStyles = StyleSheet.create({
  card:       { backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 18, overflow: 'hidden' },
  strip:      { backgroundColor: D.surf2, borderBottomWidth: 1, borderBottomColor: D.line, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(250,245,238,0.20)' },
  stripLabel: { fontFamily: MONO_B, fontSize: 10, color: D.faint, letterSpacing: 1.0, textTransform: 'uppercase' },
  timeText:   { fontFamily: MONO, fontSize: 10, color: D.vfaint },
  title:      { fontSize: 16, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.4, marginBottom: 6 },
  subtitle:   { fontSize: 12.5, fontFamily: SANS, color: D.faint, lineHeight: 20, marginBottom: 18 },
  btn:        { height: 50, borderRadius: 14, backgroundColor: D.zippy, alignItems: 'center', justifyContent: 'center', shadowColor: D.zippy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 5 },
  btnText:    { fontFamily: SANS_B, fontSize: 14, color: '#fff', letterSpacing: -0.1 },
});

// ─── DeactivateBanner ─────────────────────────────────────────────────────────
function DeactivateBanner({ onDeactivate, loading }: { onDeactivate: () => void; loading: boolean }) {
  return (
    <View style={deactivateStyles.bar}>
      <RingDot color={D.green} size={8} />
      <Text style={deactivateStyles.label}>Em serviço · Online</Text>
      <TouchableOpacity
        style={deactivateStyles.btn}
        onPress={onDeactivate}
        disabled={loading}
        activeOpacity={0.75}
      >
        <Text style={deactivateStyles.btnText}>Desativar</Text>
      </TouchableOpacity>
    </View>
  );
}

const deactivateStyles = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.surf2, borderWidth: 1, borderColor: D.line, borderRadius: 12, paddingVertical: 9, paddingLeft: 14, paddingRight: 10 },
  label:   { flex: 1, fontFamily: MONO_B, fontSize: 10, color: D.dim, letterSpacing: 0.6 },
  btn:     { height: 28, borderRadius: 8, borderWidth: 1, borderColor: D.line, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: SANS_B, fontSize: 11, color: D.faint, letterSpacing: -0.1 },
});

// ─── OfflineStatusStrip ───────────────────────────────────────────────────────
function OfflineStatusStrip() {
  return (
    <View style={offlineStyles.strip}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={offlineStyles.dot} />
        <Text style={offlineStyles.label}>Offline · Inativo</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <ZippyMark size={14} />
        <Text style={offlineStyles.portal}>Portal do Motorista</Text>
      </View>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  strip:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: D.surf2, borderWidth: 1, borderColor: D.line, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14 },
  dot:    { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(250,245,238,0.20)' },
  label:  { fontFamily: MONO_B, fontSize: 10, color: D.faint, letterSpacing: 0.6 },
  portal: { fontFamily: MONO, fontSize: 9.5, color: D.vfaint, letterSpacing: 0.6 },
});

// ─── WaitingCard ──────────────────────────────────────────────────────────────
function WaitingCard() {
  const r0 = useRef(new Animated.Value(0)).current;
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    [[r0, 0], [r1, 700], [r2, 1400]].forEach(([r, delay]) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay as number),
          Animated.timing(r as Animated.Value, { toValue: 1, duration: 2400, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const rings = [r0, r1, r2];

  return (
    <View style={waitStyles.card}>
      <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        {rings.map((r, i) => {
          const scale   = r.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
          const opacity = r.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.08, 0] });
          return (
            <Animated.View key={i} style={[StyleSheet.absoluteFillObject, {
              borderRadius: 28, borderWidth: 1, borderColor: D.lineS,
              transform: [{ scale }], opacity,
            }]} />
          );
        })}
        <View style={waitStyles.bagCircle}>
          <Ionicons name="bag-outline" size={22} color={D.faint} />
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={waitStyles.title}>Aguardando entregas</Text>
        <Text style={waitStyles.sub}>Você será notificado assim que uma rota for atribuída.</Text>
      </View>

      <View style={waitStyles.statusChip}>
        <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: D.green }} />
        <Text style={waitStyles.statusText}>Conectado · Em serviço</Text>
      </View>
    </View>
  );
}

const waitStyles = StyleSheet.create({
  card:       { backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 18, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', gap: 12 },
  bagCircle:  { width: 56, height: 56, borderRadius: 28, backgroundColor: D.surf2, borderWidth: 1, borderColor: D.line, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 15, fontFamily: SANS_B, color: D.dim, letterSpacing: -0.2, textAlign: 'center' },
  sub:        { fontSize: 12, fontFamily: SANS, color: D.faint, lineHeight: 18, textAlign: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: D.surf2, borderWidth: 1, borderColor: D.line, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 14 },
  statusText: { fontFamily: MONO, fontSize: 10, color: D.dim, letterSpacing: 0.8 },
});

// ─── ActiveDeliveryCard ───────────────────────────────────────────────────────
function ActiveDeliveryCard({ dispatch, onNavigate }: { dispatch: DispatchEntity; onNavigate: () => void }) {
  const sorted = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const order  = sorted[0];
  if (!order) return null;

  const addr       = order.deliveryAddress;
  const eta        = dispatch.estimatedDeliveryDurationMinutes ?? order.estimatedDeliveryDurationMinutes ?? '—';
  const total      = calculateOrderTotal(order);
  const paid       = !!order.paidAt;

  return (
    <View style={activeStyles.card}>
      {/* Alert strip */}
      <View style={activeStyles.strip}>
        <RingDot color={D.zippy} size={8} />
        <Text style={activeStyles.stripLabel}>{dispatch.startedDeliveryAt ? 'Entrega Ativa' : 'Entrega Pendente'} · #{order.number ?? order.id.slice(0, 6)}</Text>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="time-outline" size={12} color={D.dim} />
          <Text style={activeStyles.etaText}>{eta} min</Text>
        </View>
      </View>

      <View style={{ padding: 14, gap: 12 }}>
        {/* Customer name */}
        <Text style={activeStyles.customerName} numberOfLines={1}>
          {order.customer?.name ?? 'Cliente'}
        </Text>

        {/* Address */}
        {addr && (
          <View style={activeStyles.addrRow}>
            <Ionicons name="location-outline" size={15} color={D.zippy} />
            <View style={{ flex: 1 }}>
              <Text style={activeStyles.addrText} numberOfLines={2}>
                {addr.street}, {addr.number}
                {addr.complement ? ` — ${addr.complement}` : ''}
              </Text>
              <Text style={activeStyles.addrSub}>
                {addr.city}
                {typeof eta === 'number' ? ` · ${eta} min estimado` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {order.orderProducts.slice(0, 3).map((op) => (
            <View key={op.id} style={activeStyles.itemChip}>
              <Text style={activeStyles.itemQty}>{op.quantity}×</Text>
              <Text style={activeStyles.itemName} numberOfLines={1}>{op.product.name}</Text>
            </View>
          ))}
          {order.orderProducts.length > 3 && (
            <View style={activeStyles.itemChip}>
              <Text style={activeStyles.itemName}>+{order.orderProducts.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Value + payment */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={activeStyles.valueKicker}>Valor · {paymentLabel(order.paymentMethod)}</Text>
            <Text style={activeStyles.valueAmount}>R$ {(total / 100).toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={[activeStyles.payBadge, paid ? activeStyles.payBadgePaid : activeStyles.payBadgePending]}>
            <View style={[{ width: 6, height: 6, borderRadius: 2 }, paid ? { backgroundColor: D.green } : { backgroundColor: D.zippy }]} />
            <Text style={[activeStyles.payBadgeText, { color: paid ? D.green : D.zippy }]}>
              {paid ? 'PAGO' : paymentLabel(order.paymentMethod).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Navigate CTA */}
        <TouchableOpacity style={activeStyles.navBtn} onPress={onNavigate} activeOpacity={0.88}>
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={activeStyles.navBtnText}>Ver Entrega</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const activeStyles = StyleSheet.create({
  card:         { backgroundColor: D.surf, borderWidth: 1.5, borderColor: 'rgba(255,61,20,0.28)', borderRadius: 18, overflow: 'hidden' },
  strip:        { backgroundColor: 'rgba(255,61,20,0.14)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,20,0.15)', paddingVertical: 9, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stripLabel:   { fontFamily: MONO_B, fontSize: 10, color: D.zippy, letterSpacing: 1.8, textTransform: 'uppercase' },
  etaText:      { fontFamily: MONO_B, fontSize: 11, color: D.dim },
  customerName: { fontSize: 22, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.6 },
  addrRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: D.surf2, borderRadius: 11, padding: 10 },
  addrText:     { fontSize: 13, fontFamily: SANS_B, color: D.text, lineHeight: 18, marginBottom: 3 },
  addrSub:      { fontFamily: MONO, fontSize: 10, color: D.faint, letterSpacing: 0.4 },
  itemChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: D.surf3, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  itemQty:      { fontFamily: MONO_B, fontSize: 11, color: D.zippy },
  itemName:     { fontSize: 12, fontFamily: SANS, color: D.dim, maxWidth: 110 },
  valueKicker:  { fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  valueAmount:  { fontSize: 20, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },
  payBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  payBadgePaid: { backgroundColor: 'rgba(52,211,154,0.09)', borderWidth: 1, borderColor: 'rgba(52,211,154,0.20)' },
  payBadgePending: { backgroundColor: 'rgba(255,61,20,0.09)', borderWidth: 1, borderColor: 'rgba(255,61,20,0.18)' },
  payBadgeText: { fontFamily: MONO_B, fontSize: 10, letterSpacing: 0.8 },
  navBtn:       { height: 50, borderRadius: 14, backgroundColor: D.zippy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  navBtnText:   { fontFamily: SANS_B, fontSize: 14, color: '#fff', letterSpacing: -0.1 },
});

// ─── PastSummaryCard ──────────────────────────────────────────────────────────
function PastSummaryCard({ onPress }: { onPress: () => void }) {
  const { token } = useAuth();
  const [rows,    setRows]    = useState<PastDelivery[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!token) return;
    const { start, end } = dateRangeFor('today');
    listDriverDispatches(token, start, end)
      .then(dispatches => {
        const mapped = dispatches
          .map(mapDispatchToPast)
          .filter((d): d is PastDelivery => d !== null)
          .sort((a, b) => b.at.localeCompare(a.at));
        setRows(mapped);
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [token]);

  const withTime  = rows.filter(d => d.actualMin !== null && d.etaMin !== null);
  const avgActual = withTime.length ? Math.round(withTime.reduce((s, d) => s + d.actualMin!, 0) / withTime.length) : null;
  const avgEta    = withTime.length ? Math.round(withTime.filter(d => d.etaMin !== null).reduce((s, d) => s + d.etaMin!, 0) / withTime.filter(d => d.etaMin !== null).length) : null;
  const onTimePct = rows.length ? Math.round((rows.filter(d => d.status !== 'late').length / rows.length) * 100) : null;
  const delta     = avgActual !== null && avgEta !== null ? avgActual - avgEta : null;

  const chartRows = rows.slice(0, 6);
  const maxVal    = Math.max(...chartRows.flatMap(r => [r.etaMin ?? 0, r.actualMin ?? 0]), 1);
  const CHART_H   = 52;

  return (
    <TouchableOpacity style={summaryStyles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={summaryStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={summaryStyles.kicker}>Performance de Hoje</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
            <Text style={summaryStyles.heroNum}>{avgActual ?? (fetched ? '—' : '…')}</Text>
            {avgActual !== null && <Text style={summaryStyles.heroUnit}>min</Text>}
            {delta !== null && (
              <View style={[summaryStyles.deltaBadge, delta > 0 ? summaryStyles.deltaBadgeLate : summaryStyles.deltaBadgeGood]}>
                <Text style={[summaryStyles.deltaText, { color: delta > 0 ? D.amber : D.green }]}>
                  {delta > 0 ? `+${delta}m acima` : delta < 0 ? `${Math.abs(delta)}m abaixo` : 'no prazo'}
                </Text>
              </View>
            )}
          </View>
          {avgEta !== null && (
            <Text style={summaryStyles.heroSub}>média real vs ETA de {avgEta} min</Text>
          )}
        </View>
        <View style={summaryStyles.verTudoBtn}>
          <Text style={summaryStyles.verTudoText}>Ver tudo</Text>
          <Ionicons name="chevron-forward" size={12} color={D.faint} />
        </View>
      </View>

      {/* Mini bar chart */}
      {chartRows.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View style={summaryStyles.chartRow}>
            {chartRows.map((r) => {
              const etaH  = r.etaMin    !== null ? Math.max(4, Math.round((r.etaMin    / maxVal) * CHART_H)) : 0;
              const actH  = r.actualMin !== null ? Math.max(4, Math.round((r.actualMin / maxVal) * CHART_H)) : 0;
              const barBg = r.status === 'late' ? 'rgba(242,179,56,0.55)' : actH < etaH ? 'rgba(52,211,154,0.55)' : 'rgba(250,245,238,0.18)';
              return (
                <View key={r.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: '100%', height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                    {etaH > 0 && (
                      <View style={{
                        flex: 1, height: etaH, borderRadius: 3,
                        backgroundColor: 'transparent',
                        borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 0,
                        borderColor: 'rgba(250,245,238,0.20)',
                      }} />
                    )}
                    {actH > 0 && (
                      <View style={{ flex: 1, height: actH, borderRadius: 3, backgroundColor: barBg }} />
                    )}
                  </View>
                  <Text style={summaryStyles.chartLabel}>{r.at}</Text>
                </View>
              );
            })}
          </View>
          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            {[
              { bg: 'transparent', bc: 'rgba(250,245,238,0.25)', label: 'ETA' },
              { bg: 'rgba(52,211,154,0.55)',  bc: undefined, label: 'Antes do prazo' },
              { bg: 'rgba(242,179,56,0.55)',  bc: undefined, label: 'Atrasado' },
            ].map(({ bg, bc, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 2,
                  backgroundColor: bg,
                  borderWidth: bc ? 1 : 0, borderColor: bc,
                }} />
                <Text style={summaryStyles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty state */}
      {fetched && rows.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 18, gap: 6 }}>
          <Ionicons name="bag-outline" size={28} color={D.faint} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: D.faint }}>Nenhuma entrega hoje</Text>
        </View>
      )}

      {/* Bottom stat row */}
      {rows.length > 0 && (
        <View style={summaryStyles.statRow}>
          {[
            { label: 'No prazo',  value: onTimePct !== null ? `${onTimePct}%` : '—', color: onTimePct !== null ? (onTimePct >= 80 ? D.green : D.amber) : D.faint },
            { label: 'Entregas',  value: `${rows.length}`, color: D.dim },
          ].map(({ label, value, color }) => (
            <View key={label} style={summaryStyles.statCell}>
              <Text style={summaryStyles.statLabel}>{label}</Text>
              <Text style={[summaryStyles.statValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: D.surf,
    borderWidth: 1.5, borderColor: D.line,
    borderRadius: 18, padding: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kicker: {
    fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: D.faint, marginBottom: 5,
  },
  heroNum:  { fontFamily: SANS_EB, fontSize: 28, color: D.text, letterSpacing: -1.2 },
  heroUnit: { fontFamily: SANS_B,  fontSize: 14, color: D.dim },
  heroSub:  { fontSize: 11.5, fontFamily: SANS, color: D.faint, marginTop: 4 },
  deltaBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  deltaBadgeGood: { backgroundColor: 'rgba(52,211,154,0.10)', borderColor: 'rgba(52,211,154,0.20)' },
  deltaBadgeLate: { backgroundColor: 'rgba(242,179,56,0.10)', borderColor: 'rgba(242,179,56,0.20)' },
  deltaText:      { fontFamily: MONO_B, fontSize: 11 },
  verTudoBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: D.surf2, borderRadius: 9,
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 1, borderColor: D.line,
  },
  verTudoText: { fontFamily: MONO_B, fontSize: 10, color: D.faint, letterSpacing: 0.5 },
  chartRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  chartLabel:  { fontFamily: MONO, fontSize: 8, color: 'rgba(250,245,238,0.12)', letterSpacing: 0.4, textAlign: 'center' },
  legendText:  { fontFamily: MONO, fontSize: 8.5, color: D.faint, letterSpacing: 0.4 },
  statRow:     { flexDirection: 'row', gap: 8, marginTop: 14 },
  statCell:    { flex: 1, backgroundColor: D.surf2, borderRadius: 9, padding: 10 },
  statLabel:   { fontFamily: MONO_B, fontSize: 8.5, letterSpacing: 1.0, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  statValue:   { fontSize: 13, fontFamily: SANS_B, letterSpacing: -0.2 },
});

// ─── HomeSkeletonCard ─────────────────────────────────────────────────────────
function HomeSkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.18] });

  const Block = ({ w, h, style }: { w: number | string; h: number; style?: object }) => (
    <Animated.View style={[{ width: w, height: h, borderRadius: 8, backgroundColor: D.text, opacity }, style]} />
  );

  return (
    <View style={{ backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 18, overflow: 'hidden' }}>
      <View style={{ backgroundColor: D.surf2, borderBottomWidth: 1, borderBottomColor: D.line, paddingVertical: 10, paddingHorizontal: 16 }}>
        <Block w="38%" h={9} />
      </View>
      <View style={{ padding: 16, gap: 14 }}>
        <Block w="55%" h={22} />
        <Block w="80%" h={14} />
        <Block w="100%" h={44} style={{ borderRadius: 12 }} />
      </View>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen({
  dispatch, active, activating, loading, onActivate, onDeactivate, onShowHistory,
}: {
  dispatch: DispatchEntity | null;
  active: boolean;
  activating: boolean;
  loading: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onShowHistory: () => void;
}) {
  const { driver } = useAuth();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const initial    = driver?.name?.[0]?.toUpperCase() ?? '?';
  const firstName  = driver?.name?.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Top nav */}
      <View style={[homeStyles.topNav, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={homeStyles.greeting}>{greeting}</Text>
          <Text style={homeStyles.driverName}>{firstName} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TouchableOpacity style={homeStyles.avatar} onPress={() => router.push('/settings')} activeOpacity={0.8}>
            <Text style={homeStyles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 36, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status strip / Deactivate banner */}
        {active
          ? <DeactivateBanner onDeactivate={onDeactivate} loading={activating} />
          : <OfflineStatusStrip />
        }

        {/* Delivery / Activate section */}
        <View>
          {loading
            ? <HomeSkeletonCard />
            : !active
              ? <ActivateCard onActivate={onActivate} loading={activating} />
              : dispatch
                ? <ActiveDeliveryCard dispatch={dispatch} onNavigate={() => router.push('/delivery')} />
                : <WaitingCard />
          }
        </View>

        <View style={{ gap: 6 }}>
          <Text style={homeStyles.sectionKicker}>Histórico de Entregas</Text>
          <PastSummaryCard onPress={onShowHistory} />
        </View>

      </ScrollView>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  topNav:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 12 },
  greeting:    { fontFamily: MONO_B, fontSize: 9.5, letterSpacing: 1.8, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  driverName:  { fontSize: 20, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.6 },
avatar:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,61,20,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,61,20,0.24)', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontFamily: SANS_EB, fontSize: 14, color: D.zippy, letterSpacing: -0.3 },
  sectionKicker:   { fontFamily: MONO_B, fontSize: 9.5, letterSpacing: 1.8, textTransform: 'uppercase', color: D.faint },
});

// ─── Root export ──────────────────────────────────────────────────────────────
export default function DriverHome() {
  const { token, driver } = useAuth();
  const router = useRouter();
  const [dispatch,      setDispatch]      = useState<DispatchEntity | null>(null);
  const [active,        setActive]        = useState(driver?.active ?? false);
  const [activating,    setActivating]    = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(driver?.active ?? false);
  const didInitialFetch = useRef(false);

  const fetchDispatch = useCallback(async () => {
    if (!token || !active) return;
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
  }, [token, active]);

  useEffect(() => {
    fetchDispatch();
    const interval = setInterval(fetchDispatch, 5000);
    return () => clearInterval(interval);
  }, [fetchDispatch]);

  // Resume tracking on mount if driver is already active (e.g. app restarted)
  const didResume = useRef(false);
  useEffect(() => {
    if (didResume.current || !token || !active) return;
    didResume.current = true;
    startDriverTracking(token).catch((e) => console.log('[home] resume tracking error', e));
  }, [token, active]);

  const handleActivate = useCallback(async () => {
    if (!token) return;
    setActivating(true);
    try {
      await activateDriver(token);
      setActive(true);
      startDriverTracking(token).catch((e) => console.log('[home] startDriverTracking error', e));
    } catch (e) {
      console.log('[home] activate error', e);
    } finally {
      setActivating(false);
    }
  }, [token]);

  const handleDeactivate = useCallback(async () => {
    if (!token) return;
    if (dispatch) {
      Alert.alert(
        'Entrega em andamento',
        'Conclua a entrega atual antes de se desativar.',
        [{ text: 'OK' }],
      );
      return;
    }
    setActivating(true);
    try {
      await deactivateDriver(token);
      setActive(false);
      setDispatch(null);
      stopDriverTracking().catch((e) => console.log('[home] stopDriverTracking error', e));
    } catch (e) {
      console.log('[home] deactivate error', e);
    } finally {
      setActivating(false);
    }
  }, [token]);

  return (
    <HomeScreen
      dispatch={dispatch}
      active={active}
      activating={activating}
      loading={loadingInitial}
      onActivate={handleActivate}
      onDeactivate={handleDeactivate}
      onShowHistory={() => router.push('/entregas')}
    />
  );
}
