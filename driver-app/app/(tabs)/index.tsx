import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { getNextDispatch, activateDriver, deactivateDriver, DispatchEntity, DispatchOrder } from '@/lib/dispatch-api';
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
const SANS_M  = 'Geist_500Medium';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_B  = 'GeistMono_700Bold';

// ─── Mock past deliveries ────────────────────────────────────────────────────
const PAST = [
  { id: 4829, customer: 'Caio Bueno',     address: '16419 Happy Eagle Dr',  distKm: 2.4, etaMin: 8,  actualMin: 7,  at: '22:14', status: 'delivered' },
  { id: 4826, customer: 'Marina Costa',   address: 'R. das Flores, 445',    distKm: 3.1, etaMin: 14, actualMin: 13, at: '21:38', status: 'delivered' },
  { id: 4821, customer: 'Lucas Ferreira', address: 'Av. Central, 1802',     distKm: 5.8, etaMin: 26, actualMin: 38, at: '20:55', status: 'late' },
  { id: 4818, customer: 'Ana Souza',      address: 'Rua Ipiranga, 88',      distKm: 1.9, etaMin: 7,  actualMin: 6,  at: '20:12', status: 'delivered' },
  { id: 4812, customer: 'Pedro Maia',     address: 'Alameda Santos, 321',   distKm: 4.2, etaMin: 18, actualMin: 17, at: '19:40', status: 'delivered' },
  { id: 4807, customer: 'Julia Nunes',    address: 'R. Augusta, 654',       distKm: 2.0, etaMin: 9,  actualMin: 9,  at: '18:58', status: 'delivered' },
];

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
const orderTotal = (o: DispatchOrder) =>
  o.orderProducts.reduce((s, p) => s + p.fullAmount, 0);

function paymentLabel(m: string) {
  if (m === 'cash') return 'Dinheiro';
  if (m === 'card') return 'Cartão';
  return m;
}

function openMaps(addr: NonNullable<DispatchOrder['deliveryAddress']>) {
  const q = `${addr.street} ${addr.number}, ${addr.city}`;
  const ios = `maps://?q=${encodeURIComponent(q)}`;
  const android = `geo:0,0?q=${encodeURIComponent(q)}`;
  Linking.openURL(Platform.OS === 'ios' ? ios : android)
    .catch(() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(q)}`));
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
  const total      = orderTotal(order);
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

// ─── PastDeliveryRow ──────────────────────────────────────────────────────────
function PastDeliveryRow({ delivery }: { delivery: typeof PAST[0] }) {
  const isLate  = delivery.status === 'late';
  const delta   = delivery.actualMin - delivery.etaMin;
  const early   = delta < 0;
  const fillPct = Math.min(100, Math.round((delivery.actualMin / Math.max(delivery.etaMin, delivery.actualMin)) * 100));
  const etaPct  = Math.round((delivery.etaMin / Math.max(delivery.etaMin, delivery.actualMin, 1)) * 100);

  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, isLate ? rowStyles.iconAmber : rowStyles.iconGreen]}>
        <Ionicons name={isLate ? 'time-outline' : 'checkmark-outline'} size={16} color={isLate ? D.amber : D.green} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text style={rowStyles.customer} numberOfLines={1}>{delivery.customer}</Text>
          <View style={[rowStyles.badge, isLate ? rowStyles.badgeAmber : rowStyles.badgeGreen]}>
            <Text style={[rowStyles.badgeText, { color: isLate ? D.amber : D.green }]}>
              {delivery.actualMin}m {isLate ? `(+${delta}m)` : early ? `(${delta}m)` : '(no prazo)'}
            </Text>
          </View>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(250,245,238,0.06)', marginBottom: 5 }}>
          <View style={{ position: 'absolute', top: -2, bottom: -2, left: `${etaPct}%` as any, width: 1.5, borderRadius: 1, backgroundColor: 'rgba(250,245,238,0.25)' }} />
          <View style={{ height: '100%', borderRadius: 2, width: `${fillPct}%`, backgroundColor: isLate ? D.amber : early ? D.green : D.dim, opacity: 0.7 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={rowStyles.address} numberOfLines={1}>{delivery.address}</Text>
          <Text style={rowStyles.time}>ETA {delivery.etaMin}m · {delivery.at}</Text>
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  icon:       { width: 36, height: 36, borderRadius: 10, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  iconGreen:  { backgroundColor: 'rgba(52,211,154,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,154,0.16)' },
  iconAmber:  { backgroundColor: 'rgba(242,179,56,0.10)', borderWidth: 1, borderColor: 'rgba(242,179,56,0.22)' },
  customer:   { fontSize: 13, fontFamily: SANS_B, color: D.text, letterSpacing: -0.2, flex: 1, marginRight: 8 },
  badge:      { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1 },
  badgeGreen: { backgroundColor: 'rgba(52,211,154,0.09)', borderColor: 'rgba(52,211,154,0.20)' },
  badgeAmber: { backgroundColor: 'rgba(242,179,56,0.09)', borderColor: 'rgba(242,179,56,0.20)' },
  badgeText:  { fontFamily: MONO_B, fontSize: 10 },
  address:    { fontSize: 11, fontFamily: SANS, color: D.faint, flex: 1, marginRight: 8 },
  time:       { fontFamily: MONO, fontSize: 9.5, color: D.vfaint },
});

// ─── PastDeliveriesScreen ─────────────────────────────────────────────────────
function PastDeliveriesScreen({ onBack }: { onBack: () => void }) {
  const insets     = useSafeAreaInsets();
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');
  const FILTERS = [{ id: 'today', label: 'Hoje' }, { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mês' }] as const;

  const avgActual = Math.round(PAST.reduce((s, d) => s + d.actualMin, 0) / PAST.length);
  const avgEta    = Math.round(PAST.reduce((s, d) => s + d.etaMin, 0) / PAST.length);
  const onTimePct = Math.round((PAST.filter(d => d.status !== 'late').length / PAST.length) * 100);
  const fastest   = Math.min(...PAST.map(d => d.actualMin));

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: D.bg }]}>
      <View style={[pastStyles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={pastStyles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>
        <Text style={pastStyles.headerTitle}>Entregas</Text>
        <Text style={pastStyles.headerCount}>{PAST.length} registros</Text>
      </View>

      <View style={[pastStyles.summaryCard, { marginHorizontal: 18, marginBottom: 14 }]}>
        {[
          { label: 'Tempo médio', value: `${avgActual}m`, sub: `ETA ${avgEta}m`, color: D.text },
          { label: 'No prazo',    value: `${onTimePct}%`, sub: `${PAST.filter(d => d.status !== 'late').length}/${PAST.length}`, color: onTimePct >= 80 ? D.green : D.amber },
          { label: 'Mais rápida', value: `${fastest}m`,   sub: 'hoje',           color: D.dim },
        ].map(({ label, value, sub, color }, i) => (
          <View key={label} style={[{ flex: 1, alignItems: 'center' }, i > 0 && { borderLeftWidth: 1, borderLeftColor: D.line }]}>
            <Text style={[pastStyles.summaryValue, { color }]}>{value}</Text>
            <Text style={pastStyles.summaryLabel}>{label}</Text>
            <Text style={pastStyles.summarySub}>{sub}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 18, gap: 6, marginBottom: 6 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[pastStyles.filterTab, filter === f.id && pastStyles.filterTabActive]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.8}
          >
            <Text style={[pastStyles.filterTabText, { color: filter === f.id ? '#fff' : D.dim }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={pastStyles.list}>
          {PAST.map((d, i) => (
            <View key={d.id} style={i < PAST.length - 1 ? { borderBottomWidth: 1, borderBottomColor: D.line } : undefined}>
              <PastDeliveryRow delivery={d} />
            </View>
          ))}
          <View style={pastStyles.avgFooter}>
            <Text style={pastStyles.avgLabel}>Tempo médio do dia</Text>
            <Text style={pastStyles.avgValue}>{avgActual} min</Text>
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const pastStyles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, fontSize: 18, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },
  headerCount:  { fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: D.faint },
  summaryCard:  { backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row' },
  summaryValue: { fontSize: 20, fontFamily: SANS_EB, letterSpacing: -0.7, lineHeight: 22, marginBottom: 3 },
  summaryLabel: { fontFamily: MONO_B, fontSize: 8.5, letterSpacing: 1.0, textTransform: 'uppercase', color: D.faint, marginBottom: 2 },
  summarySub:   { fontSize: 10, fontFamily: SANS, color: D.vfaint },
  filterTab:    { flex: 1, height: 34, borderRadius: 9, backgroundColor: D.surf, alignItems: 'center', justifyContent: 'center' },
  filterTabActive: { backgroundColor: D.zippy },
  filterTabText:{ fontSize: 12.5, fontFamily: SANS_B, letterSpacing: -0.1 },
  list:         { backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 16, marginHorizontal: 18, marginTop: 8, overflow: 'hidden' },
  avgFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: D.surf2 },
  avgLabel:     { fontFamily: MONO_B, fontSize: 9.5, letterSpacing: 1.0, textTransform: 'uppercase', color: D.faint },
  avgValue:     { fontSize: 16, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.4 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen({
  dispatch, active, activating, onActivate, onDeactivate,
}: {
  dispatch: DispatchEntity | null;
  active: boolean;
  activating: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
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
          <View style={homeStyles.bellBtn}>
            <Ionicons name="notifications-outline" size={16} color={D.dim} />
            {dispatch && active && (
              <View style={homeStyles.bellDot} />
            )}
          </View>
          <View style={homeStyles.avatar}>
            <Text style={homeStyles.avatarText}>{initial}</Text>
          </View>
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
          {!active
            ? <ActivateCard onActivate={onActivate} loading={activating} />
            : dispatch
              ? <ActiveDeliveryCard dispatch={dispatch} onNavigate={() => router.push('/delivery')} />
              : <WaitingCard />
          }
        </View>

      </ScrollView>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  topNav:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 12 },
  greeting:    { fontFamily: MONO_B, fontSize: 9.5, letterSpacing: 1.8, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  driverName:  { fontSize: 20, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.6 },
  bellBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, alignItems: 'center', justifyContent: 'center' },
  bellDot:     { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 2, backgroundColor: D.zippy, borderWidth: 1.5, borderColor: D.bg },
  avatar:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,61,20,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,61,20,0.24)', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontFamily: SANS_EB, fontSize: 14, color: D.zippy, letterSpacing: -0.3 },
  sectionKicker: { fontFamily: MONO_B, fontSize: 9.5, letterSpacing: 1.8, textTransform: 'uppercase', color: D.faint, marginBottom: 9 },
});

// ─── Root export ──────────────────────────────────────────────────────────────
export default function DriverHome() {
  const { token, driver } = useAuth();
  const [dispatch,  setDispatch]  = useState<DispatchEntity | null>(null);
  const [active,    setActive]    = useState(driver?.active ?? false);
  const [activating, setActivating] = useState(false);
  const [screen,     setScreen]     = useState<'home' | 'past'>('home');

  const fetchDispatch = useCallback(async () => {
    if (!token || !active) return;
    try {
      const data = await getNextDispatch(token);
      setDispatch(data);
    } catch {
      // keep previous on error
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

  if (screen === 'past') {
    return <PastDeliveriesScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      dispatch={dispatch}
      active={active}
      activating={activating}
      onActivate={handleActivate}
      onDeactivate={handleDeactivate}
    />
  );
}
