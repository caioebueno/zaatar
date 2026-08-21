import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  PanResponder,
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
import { getNextDispatch, startDelivery, markOrderDelivered, DispatchEntity, DispatchOrder } from '@/lib/dispatch-api';
import { startDeliveryActivity, endDeliveryActivity } from '@/lib/live-activity';
import { calculateOrderTotal } from '@/utils/orderTotal';

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
  brandHover: '#D93411',
  volt:     '#FFD600',
  success:  '#22C55E',
};

const SANS    = 'Geist_400Regular';
const SANS_M  = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_M  = 'GeistMono_500Medium';
const MONO_B  = 'GeistMono_700Bold';

const money = (cents: number) => 'R$ ' + (cents / 100).toFixed(2).replace('.', ',');

// ─── Data helpers ─────────────────────────────────────────────────────────────
function orderNumber(order: DispatchOrder, idx: number): string {
  return order.number ?? String(idx + 1);
}

function volumes(order: DispatchOrder): number {
  return order.orderProducts.reduce((s, op) => s + op.quantity, 0);
}

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    CREDIT_CARD: 'Cartão',
    DEBIT_CARD: 'Débito',
    CASH: 'Dinheiro',
    PIX: 'Pix',
    CARD: 'Cartão',
  };
  return map[method] ?? method;
}

function addressLine(addr: NonNullable<DispatchOrder['deliveryAddress']>): string {
  const main = `${addr.street}, ${addr.number}`
    + (addr.numberComplement ? ` / ${addr.numberComplement}` : '')
    + (addr.complement ? ` — ${addr.complement}` : '');
  return `${main} · ${addr.city}, ${addr.state}`;
}

function openMaps(addr: NonNullable<DispatchOrder['deliveryAddress']>) {
  const query = encodeURIComponent(`${addr.street} ${addr.number}, ${addr.city}, ${addr.state}, ${addr.zipCode}`);
  const ios = `maps://maps.apple.com/?q=${query}`;
  const android = `geo:0,0?q=${query}`;
  Linking.openURL(Platform.OS === 'ios' ? ios : android)
    .catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function openWhatsApp(phone: string) {
  Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`).catch(() => {});
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[primStyles.label, style]}>{children}</Text>;
}

function OrderTag({ n, tone = 'neutral' }: { n: string; tone?: 'neutral' | 'volt' }) {
  const volt = tone === 'volt';
  return (
    <View style={{
      backgroundColor: volt ? 'rgba(255,214,0,0.14)' : 'rgba(255,255,255,0.10)',
      borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
    }}>
      <Text style={{ fontFamily: MONO_M, fontSize: 12, color: volt ? Z.volt : Z.fg1 }}>Pedido {n}</Text>
    </View>
  );
}

function ItemRow({ qty, name, alert }: { qty: number; name: string; alert: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ fontFamily: MONO, fontSize: 14, color: alert ? Z.volt : Z.fg3, minWidth: 24 }}>{qty}×</Text>
      <Text style={{ flex: 1, fontFamily: SANS_M, fontSize: 15, color: Z.fg1 }}>{name}</Text>
      {alert && <Ionicons name="alert-circle" size={15} color={Z.volt} />}
    </View>
  );
}

const primStyles = StyleSheet.create({
  label: {
    fontFamily: SANS_M, fontSize: 12, color: Z.fg3,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
});

// ─── PayBadge (inline, for upcoming cards) ────────────────────────────────────
function PayBadge({ paid, total, method }: { paid: boolean; total: number; method: string }) {
  return (
    <View style={{
      alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
      backgroundColor: paid ? 'rgba(34,197,94,0.12)' : 'rgba(255,214,0,0.14)',
      borderWidth: 1, borderColor: paid ? 'rgba(34,197,94,0.32)' : 'rgba(255,214,0,0.34)',
      borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5,
    }}>
      <Text style={{ fontFamily: SANS_SB, fontSize: 13, color: paid ? Z.success : Z.volt }}>
        {paid ? 'Pago' : `Cobrar ${money(total)} · ${method}`}
      </Text>
    </View>
  );
}

// ─── Swipe to deliver ─────────────────────────────────────────────────────────
const THUMB = 48;
const SWIPE_PAD = 4;
const TRACK_BORDER = 1;

function SwipeDeliver({ onDelivered, resetKey }: { onDelivered: () => void; resetKey: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const maxXRef = useRef(0);
  const xAnim = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    maxXRef.current = Math.max(0, trackWidth - TRACK_BORDER * 2 - THUMB - SWIPE_PAD * 2);
  }, [trackWidth]);

  useEffect(() => {
    doneRef.current = false;
    setDone(false);
    xAnim.setValue(0);
  }, [resetKey]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    Animated.timing(xAnim, { toValue: maxXRef.current, duration: 120, useNativeDriver: false }).start(() => {
      setDone(true);
      setTimeout(onDelivered, 460);
    });
  }, [onDelivered]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !doneRef.current,
      onMoveShouldSetPanResponder: () => !doneRef.current,
      onPanResponderMove: (_, gs) => {
        if (doneRef.current) return;
        const x = Math.max(0, Math.min(gs.dx, maxXRef.current));
        xAnim.setValue(x);
        if (maxXRef.current > 0 && x / maxXRef.current >= 0.87) finish();
      },
      onPanResponderRelease: (_, gs) => {
        if (doneRef.current) return;
        if (gs.dx < maxXRef.current * 0.87) {
          Animated.spring(xAnim, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const fillWidth = xAnim.interpolate({
    inputRange: [0, Math.max(1, trackWidth)],
    outputRange: [SWIPE_PAD + THUMB, SWIPE_PAD + THUMB + Math.max(1, trackWidth)],
    extrapolate: 'clamp',
  });
  const idleOpacity = xAnim.interpolate({
    inputRange: [0, Math.max(1, maxXRef.current) * 0.42],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[swipeStyles.track, {
        backgroundColor: done ? 'rgba(34,197,94,0.16)' : Z.elevated,
        borderColor: done ? 'rgba(34,197,94,0.35)' : Z.border,
      }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View pointerEvents="none" style={[swipeStyles.fill, { width: fillWidth }]} />

      <Animated.View pointerEvents="none" style={[swipeStyles.labelWrap, { opacity: done ? 0 : idleOpacity }]}>
        <Text style={swipeStyles.idleLabel}>Deslize para entregar</Text>
      </Animated.View>

      {done && (
        <View pointerEvents="none" style={[swipeStyles.labelWrap, { paddingLeft: 40 }]}>
          <Text style={swipeStyles.doneLabel}>Confirmando entrega</Text>
        </View>
      )}

      {!done && (
        <Animated.View
          style={[swipeStyles.thumb, { transform: [{ translateX: xAnim }] }]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
        </Animated.View>
      )}
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  track: { flex: 1, height: 48, borderRadius: 8, borderWidth: TRACK_BORDER, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(34,197,94,0.12)' },
  labelWrap: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  idleLabel: { fontFamily: SANS_M, fontSize: 15, color: Z.fg1 },
  doneLabel: { fontFamily: SANS_SB, fontSize: 15, color: Z.success },
  thumb: {
    position: 'absolute', left: SWIPE_PAD, top: SWIPE_PAD, bottom: SWIPE_PAD,
    width: THUMB, alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, backgroundColor: Z.success,
  },
});

// ─── ConfirmOverlay ───────────────────────────────────────────────────────────
function ConfirmOverlay({ customer, onDone }: { customer: string; onDone: () => void }) {
  const circleScale = useRef(new Animated.Value(0.55)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(circleScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, confirmStyles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[confirmStyles.circle, { transform: [{ scale: circleScale }] }]}>
        <Ionicons name="checkmark" size={40} color={Z.success} />
      </Animated.View>
      <Animated.Text style={[confirmStyles.title, { transform: [{ translateY: slideAnim }] }]}>Entregue!</Animated.Text>
      <Animated.Text style={[confirmStyles.customer, { transform: [{ translateY: slideAnim }] }]}>{customer}</Animated.Text>
      <Animated.Text style={[confirmStyles.next, { transform: [{ translateY: slideAnim }] }]}>
        Próxima entrega em breve…
      </Animated.Text>
    </Animated.View>
  );
}

const confirmStyles = StyleSheet.create({
  overlay: { backgroundColor: Z.bg, zIndex: 100, alignItems: 'center', justifyContent: 'center', gap: 14 },
  circle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: Z.fg1, fontSize: 30, fontFamily: SANS_EB, letterSpacing: -0.9 },
  customer: { color: Z.fg2, fontSize: 15, fontFamily: SANS },
  next: { color: Z.fg3, fontSize: 11, fontFamily: MONO_M, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 },
});

// ─── Attention list (pickup checklist, grouped by order) ──────────────────────
function AttentionList({ orders, baseIdx }: { orders: DispatchOrder[]; baseIdx: number }) {
  const groups = orders
    .map((o, i) => ({ order: o, idx: baseIdx + i, attn: o.orderProducts.filter((op) => op.product.alertDriver) }))
    .filter((g) => g.attn.length > 0);
  if (!groups.length) return null;

  return (
    <View style={attStyles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="alert-circle" size={16} color={Z.volt} />
        <Text style={{ flex: 1, fontFamily: SANS_SB, fontSize: 16, color: Z.volt }}>
          Retirar na loja antes de sair
        </Text>
      </View>
      <View style={{ height: 14 }} />
      <View style={{ gap: 12 }}>
        {groups.map((g) => (
          <View key={g.order.id} style={attStyles.group}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <OrderTag n={orderNumber(g.order, g.idx)} tone="volt" />
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: SANS, fontSize: 14, color: Z.fg2 }}>
                {g.order.customer?.name ?? 'Cliente'}
              </Text>
            </View>
            {g.attn.map((op) => (
              <View key={op.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: MONO, fontSize: 14, color: Z.volt, minWidth: 24 }}>{op.quantity}×</Text>
                <Text style={{ flex: 1, fontFamily: SANS_M, fontSize: 15, color: Z.fg1 }}>{op.product.name}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const attStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,214,0,0.06)', borderWidth: 1, borderColor: 'rgba(255,214,0,0.30)',
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  group: { backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 8, padding: 12, gap: 8 },
});

// ─── Current order items ──────────────────────────────────────────────────────
function ItemsList({ order, n }: { order: DispatchOrder; n: string }) {
  return (
    <View style={[cardStyles.section, { marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <OrderTag n={n} />
        <Text style={{ flex: 1, fontFamily: SANS_SB, fontSize: 15, color: Z.fg1 }}>Itens da entrega atual</Text>
      </View>
      <View style={{ gap: 10 }}>
        {order.orderProducts.map((op) => (
          <ItemRow key={op.id} qty={op.quantity} name={op.product.name} alert={!!op.product.alertDriver} />
        ))}
      </View>
      <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Z.divider }}>
        <Text style={{ fontFamily: MONO, fontSize: 13, color: Z.fg3 }}>{volumes(order)} volumes</Text>
      </View>
    </View>
  );
}

// ─── Dispatch payment summary ─────────────────────────────────────────────────
function DispatchSummary({ order, n }: { order: DispatchOrder; n: string }) {
  const paid = !!order.paidAt;
  return (
    <View style={[cardStyles.section, {
      marginBottom: 20,
      borderColor: paid ? Z.border : 'rgba(255,214,0,0.30)',
    }]}>
      <Label style={{ marginBottom: 6 }}>Pagamento · Pedido {n}</Label>
      {paid ? (
        <Text style={{ fontFamily: SANS_B, fontSize: 24, color: Z.fg2, letterSpacing: -0.6 }}>
          Pago · nada a receber
        </Text>
      ) : (
        <>
          <Text style={{ fontFamily: SANS_B, fontSize: 30, color: Z.volt, letterSpacing: -0.75 }}>
            {money(calculateOrderTotal(order))}
          </Text>
          <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.fg2, marginTop: 4 }}>
            Receber do cliente em {paymentLabel(order.paymentMethod)}
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Upcoming orders ──────────────────────────────────────────────────────────
function UpcomingList({ orders, baseIdx }: { orders: DispatchOrder[]; baseIdx: number }) {
  if (!orders.length) return null;
  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Text style={{ fontFamily: SANS_B, fontSize: 20, color: Z.fg1, letterSpacing: -0.4 }}>Próximos pedidos</Text>
        <View style={upStyles.count}>
          <Text style={{ fontFamily: MONO_B, fontSize: 14, color: Z.fg1 }}>{orders.length}</Text>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        {orders.map((o, i) => {
          const addr = o.deliveryAddress;
          const hasAttn = o.orderProducts.some((op) => op.product.alertDriver);
          return (
            <View key={o.id} style={upStyles.card}>
              <View style={upStyles.header}>
                <OrderTag n={orderNumber(o, baseIdx + i)} tone={hasAttn ? 'volt' : 'neutral'} />
                <Text numberOfLines={1} style={{ flex: 1, fontFamily: SANS_SB, fontSize: 15, color: Z.fg1 }}>
                  {o.customer?.name ?? 'Cliente'}
                </Text>
              </View>
              {addr && (
                <TouchableOpacity style={upStyles.addr} onPress={() => openMaps(addr)} activeOpacity={0.75}>
                  <Ionicons name="location" size={15} color={Z.brand} style={{ marginTop: 3 }} />
                  <Text style={{ flex: 1, fontFamily: SANS, fontSize: 14, lineHeight: 21, color: Z.fg1 }}>
                    {addressLine(addr)}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={Z.fg3} style={{ marginTop: 3 }} />
                </TouchableOpacity>
              )}
              <View style={{ padding: 16, gap: 10 }}>
                {o.orderProducts.map((op) => (
                  <ItemRow key={op.id} qty={op.quantity} name={op.product.name} alert={!!op.product.alertDriver} />
                ))}
                <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: Z.divider }}>
                  <PayBadge paid={!!o.paidAt} total={calculateOrderTotal(o)} method={paymentLabel(o.paymentMethod)} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const upStyles = StyleSheet.create({
  count: {
    minWidth: 26, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: Z.elevated, borderWidth: 1, borderColor: Z.border, alignItems: 'center',
  },
  card: { backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 12, overflow: 'hidden' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Z.elevated, borderBottomWidth: 1, borderBottomColor: Z.border,
  },
  addr: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Z.divider,
  },
});

const cardStyles = StyleSheet.create({
  section: { backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 12, padding: 16 },
});

// ─── Route complete ───────────────────────────────────────────────────────────
function RouteComplete({ orders, onDismiss }: { orders: DispatchOrder[]; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const total = orders.reduce((s, o) => s + calculateOrderTotal(o), 0);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 20, flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={rcStyles.badge}>
            <Ionicons name="flash" size={22} color="#fff" />
          </View>
          <Text style={{ fontFamily: SANS_EB, fontSize: 30, color: Z.fg1, letterSpacing: -0.75, marginBottom: 6 }}>
            Rota concluída
          </Text>
          <Text style={{ fontFamily: SANS, fontSize: 16, color: Z.fg2 }}>
            {orders.length} de {orders.length} entregas realizadas.
          </Text>
        </View>

        <View style={cardStyles.section}>
          <Label style={{ marginBottom: 6 }}>Total do despacho</Label>
          <Text style={{ fontFamily: SANS_EB, fontSize: 28, color: Z.fg1, letterSpacing: -0.7 }}>{money(total)}</Text>
        </View>

        <View style={{ backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 12, overflow: 'hidden' }}>
          {orders.map((o, i) => (
            <View key={o.id} style={[rcStyles.row, i ? { borderTopWidth: 1, borderTopColor: Z.divider } : null]}>
              <Ionicons name="checkmark" size={15} color={Z.success} />
              <Text style={{ flex: 1, fontFamily: SANS_M, fontSize: 15, color: Z.fg1 }}>{o.customer?.name ?? 'Cliente'}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 13, color: Z.fg3 }}>Pedido {orderNumber(o, i)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[rcStyles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={rcStyles.doneBtn} onPress={onDismiss} activeOpacity={0.88}>
          <Text style={{ fontFamily: SANS_SB, fontSize: 16, color: '#fff' }}>Concluir</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const rcStyles = StyleSheet.create({
  badge: { width: 44, height: 44, borderRadius: 8, backgroundColor: Z.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: Z.chrome, borderTopWidth: 1, borderTopColor: Z.border },
  doneBtn: { height: 48, borderRadius: 8, backgroundColor: Z.brand, alignItems: 'center', justifyContent: 'center' },
});

// ─── No dispatch / loading ────────────────────────────────────────────────────
function NoDispatch({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) return;
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear })).start();
  }, [loading]);
  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
      <Ionicons name="time-outline" size={48} color={Z.fg3} />
      <Text style={{ color: Z.fg2, fontSize: 16, fontFamily: SANS, textAlign: 'center' }}>Aguardando despacho…</Text>
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Z.elevated,
          borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: Z.border,
        }}
        onPress={onRefresh}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="refresh" size={18} color={Z.fg1} />
        </Animated.View>
        <Text style={{ color: Z.fg1, fontSize: 14, fontFamily: SANS_M }}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Active delivery content ──────────────────────────────────────────────────
function DeliveryContent({
  dispatch, onMarkDelivered, onDeliveryConfirmed, onStartDelivery,
}: {
  dispatch: DispatchEntity;
  onMarkDelivered: () => Promise<void>;
  onDeliveryConfirmed: () => void;
  onStartDelivery: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const insets = useSafeAreaInsets();

  const sorted = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const activeIdx = sorted.findIndex((o) => !o.deliveredAt);

  useEffect(() => { setSwipeKey((k) => k + 1); }, [activeIdx]);

  if (activeIdx < 0) return null;
  const order = sorted[activeIdx];
  const addr = order.deliveryAddress;
  const phone = order.customer?.phone ?? null;
  const n = orderNumber(order, activeIdx);
  const started = !!dispatch.startedDeliveryAt;
  const eta = order.estimatedDeliveryDurationMinutes ?? dispatch.estimatedDeliveryDurationMinutes ?? null;
  const upcoming = sorted.slice(activeIdx + 1);

  const handleSwipe = async () => {
    if (delivering) return;
    setDelivering(true);
    try {
      await onMarkDelivered();
      setConfirming(true);
    } catch {
      setSwipeKey((k) => k + 1);
    } finally {
      setDelivering(false);
    }
  };
  const handleConfirmDone = () => {
    setConfirming(false);
    setSwipeKey((k) => k + 1);
    onDeliveryConfirmed();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pickup checklist — spans every remaining order in the dispatch */}
        <AttentionList orders={sorted.slice(activeIdx)} baseIdx={activeIdx} />

        {/* Current stop */}
        <View style={{ marginBottom: 20 }}>
          <Label style={{ marginBottom: 8 }}>Entrega atual · Pedido {n}</Label>
          <Text style={{ fontFamily: SANS_EB, fontSize: 30, color: Z.fg1, letterSpacing: -0.75, lineHeight: 36, marginBottom: 12 }}>
            {order.customer?.name ?? 'Cliente'}
          </Text>
          {addr && (
            <TouchableOpacity style={cardStyles.section} onPress={() => openMaps(addr)} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Ionicons name="location" size={16} color={Z.brand} style={{ marginTop: 3 }} />
                <Text style={{ flex: 1, fontFamily: SANS_M, fontSize: 15, lineHeight: 22, color: Z.fg1 }}>{addressLine(addr)}</Text>
                <Ionicons name="chevron-forward" size={16} color={Z.fg3} style={{ marginTop: 3 }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Z.divider }}>
                <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.brand }}>Abrir no mapa</Text>
                {eta != null && <Text style={{ fontFamily: MONO, fontSize: 13, color: Z.fg3 }}>{eta} min</Text>}
              </View>
            </TouchableOpacity>
          )}
        </View>

        <ItemsList order={order} n={n} />
        <DispatchSummary order={order} n={n} />
        <UpcomingList orders={upcoming} baseIdx={activeIdx + 1} />
      </ScrollView>

      {/* Actions */}
      <View style={[bottomStyles.bar, { paddingBottom: insets.bottom + 16 }]}>
        {!started ? (
          <TouchableOpacity style={bottomStyles.navBtn} onPress={onStartDelivery} activeOpacity={0.88}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={bottomStyles.navBtnText}>Iniciar entrega</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {addr && (
                <TouchableOpacity style={[bottomStyles.navBtn, { flex: 1 }]} onPress={() => openMaps(addr)} activeOpacity={0.88}>
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={bottomStyles.navBtnText}>Navegar</Text>
                </TouchableOpacity>
              )}
              {phone && (
                <TouchableOpacity style={bottomStyles.waBtn} onPress={() => openWhatsApp(phone)} activeOpacity={0.82}>
                  <Ionicons name="logo-whatsapp" size={20} color={Z.fg1} />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <SwipeDeliver onDelivered={handleSwipe} resetKey={swipeKey} />
            </View>
          </>
        )}
      </View>

      {confirming && (
        <ConfirmOverlay customer={order.customer?.name ?? 'Cliente'} onDone={handleConfirmDone} />
      )}
    </View>
  );
}

const bottomStyles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: Z.chrome, borderTopWidth: 1, borderTopColor: Z.border },
  navBtn: {
    height: 48, borderRadius: 8, backgroundColor: Z.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  navBtnText: { fontFamily: SANS_SB, fontSize: 16, color: '#fff' },
  waBtn: {
    width: 48, height: 48, borderRadius: 8, backgroundColor: Z.elevated,
    borderWidth: 1, borderColor: Z.border, alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DeliveryScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dispatch, setDispatch] = useState<DispatchEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedOrders, setCompletedOrders] = useState<DispatchOrder[] | null>(null);

  const fetchDispatch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNextDispatch(token);
      setDispatch(data);
    } catch {
      // keep previous on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDispatch(); }, []);

  const pendingOrderRef = useRef<DispatchOrder | null>(null);

  const handleMarkDelivered = useCallback(async () => {
    if (!dispatch || !token) return;
    const order = dispatch.orders.find((o) => !o.deliveredAt);
    if (!order) return;
    await markOrderDelivered(token, order.id);
    pendingOrderRef.current = order;
  }, [dispatch, token]);

  const handleDeliveryConfirmed = useCallback(() => {
    const order = pendingOrderRef.current;
    pendingOrderRef.current = null;
    if (!order || !dispatch) return;
    const deliveredAt = new Date().toISOString();
    const updatedOrders = dispatch.orders.map((o) => (o.id === order.id ? { ...o, deliveredAt } : o));
    setDispatch((prev) => (prev ? { ...prev, orders: updatedOrders } : prev));
    if (updatedOrders.every((o) => !!o.deliveredAt)) {
      endDeliveryActivity();
      setCompletedOrders(updatedOrders);
      setDispatch(null);
    }
  }, [dispatch]);

  const handleStartDelivery = useCallback(async () => {
    if (!token || !dispatch) return;
    try {
      const { startedDeliveryAt } = await startDelivery(token, dispatch.id);
      setDispatch((prev) => (prev ? { ...prev, startedDeliveryAt } : prev));
      const sorted = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
      const first = sorted[0];
      const eta = dispatch.estimatedDeliveryDurationMinutes ?? first?.estimatedDeliveryDurationMinutes ?? 0;
      const addr = first?.deliveryAddress;
      startDeliveryActivity({
        deliveryId: dispatch.id,
        customerName: first?.customer?.name ?? 'Cliente',
        address: addr ? `${addr.street}, ${addr.number}` : '',
        etaMinutes: eta,
        startedAt: new Date(startedDeliveryAt).getTime(),
      });
    } catch {
      // ignore
    }
  }, [token, dispatch]);

  // Top-bar center label reflects the current state.
  let center = 'Entrega';
  if (completedOrders) {
    center = 'Rota finalizada';
  } else if (dispatch) {
    const total = dispatch.orders.length;
    const stop = dispatch.orders.filter((o) => !!o.deliveredAt).length + 1;
    center = `Parada ${Math.min(stop, total)}/${total}`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Z.bg }}>
      {/* Top bar */}
      <View style={[topStyles.bar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={topStyles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Z.fg2} />
        </TouchableOpacity>
        <Text style={topStyles.center}>{center}</Text>
      </View>

      {/* Body */}
      {completedOrders ? (
        <RouteComplete orders={completedOrders} onDismiss={() => { setCompletedOrders(null); fetchDispatch(); }} />
      ) : loading && !dispatch ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cube-outline" size={40} color={Z.fg3} />
        </View>
      ) : !dispatch ? (
        <NoDispatch onRefresh={fetchDispatch} loading={loading} />
      ) : (
        <DeliveryContent
          dispatch={dispatch}
          onMarkDelivered={handleMarkDelivered}
          onDeliveryConfirmed={handleDeliveryConfirmed}
          onStartDelivery={handleStartDelivery}
        />
      )}
    </View>
  );
}

const topStyles = StyleSheet.create({
  bar: {
    flexShrink: 0, paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Z.chrome, borderBottomWidth: 1, borderBottomColor: Z.border,
  },
  backBtn: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, fontFamily: MONO, fontSize: 13, color: Z.fg2 },
});
