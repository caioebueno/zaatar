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

import * as Location from 'expo-location';

import { useAuth } from '@/context/auth';
import { getNextDispatch, startDelivery, markOrderDelivered, DispatchEntity, DispatchOrder } from '@/lib/dispatch-api';
import { startRouteTracking, stopRouteTracking } from '@/lib/route-tracking';

// ─── Design tokens ───────────────────────────────────────────────────────────
const D = {
  bg:    '#0a0807',
  surf:  '#181310',
  surf2: '#1e1812',
  surf3: '#2a211b',
  line:  'rgba(250,245,238,0.09)',
  text:  '#faf5ee',
  dim:   'rgba(250,245,238,0.58)',
  faint: 'rgba(250,245,238,0.32)',
  zippy: '#ff3d14',
  green: '#34d39a',
  amber: '#f2b338',
};

const orderTotal = (o: DispatchOrder) =>
  o.orderProducts.reduce((s, p) => s + p.fullAmount, 0);

const SANS    = 'Geist_400Regular';
const SANS_M  = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_B  = 'GeistMono_700Bold';

// ─── ZippyMark ────────────────────────────────────────────────────────────────
function ZippyMark({ size = 24 }: { size?: number }) {
  const s = size / 100;
  const cx = 50 * s;
  const cy = 60 * s;

  return (
    <View style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      backgroundColor: D.zippy,
      overflow: 'hidden',
    }}>
      {/* Outer arc */}
      <View style={{
        position: 'absolute',
        left: cx - 32 * s, top: cy - 32 * s,
        width: 64 * s, height: 32 * s,
        overflow: 'hidden',
      }}>
        <View style={{
          width: 64 * s, height: 64 * s, borderRadius: 32 * s,
          borderWidth: 6 * s, borderColor: 'rgba(255,255,255,0.25)',
        }} />
      </View>
      {/* Inner arc */}
      <View style={{
        position: 'absolute',
        left: cx - 22 * s, top: cy - 22 * s,
        width: 44 * s, height: 22 * s,
        overflow: 'hidden',
      }}>
        <View style={{
          width: 44 * s, height: 44 * s, borderRadius: 22 * s,
          borderWidth: 8 * s, borderColor: 'rgba(255,255,255,0.55)',
        }} />
      </View>
      {/* White square */}
      <View style={{
        position: 'absolute',
        left: 41 * s, top: 51 * s,
        width: 18 * s, height: 18 * s,
        borderRadius: 4 * s,
        backgroundColor: '#fff',
      }} />
    </View>
  );
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function PulseDot() {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    let stopped = false;
    const pulse = () => {
      if (stopped) return;
      scale.setValue(1);
      opacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(scale,   { toValue: 2.6, duration: 1800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,   duration: 1800, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished && !stopped) pulse(); });
    };
    pulse();
    return () => { stopped = true; };
  }, []);

  return (
    <View style={{ width: 7, height: 7, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: D.green,
        opacity,
        transform: [{ scale }],
      }} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: D.green }} />
    </View>
  );
}

// ─── Shimmer loading ──────────────────────────────────────────────────────────
function ShimmerBlock({ w, h, style }: { w: number | string; h: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.22] });
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: 7, backgroundColor: D.text, opacity }, style]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 22, gap: 14 }}>
      <ShimmerBlock w="45%" h={10} />
      <ShimmerBlock w="70%" h={32} />
      <View style={{ height: 6 }} />
      <ShimmerBlock w="100%" h={80} />
      <ShimmerBlock w="100%" h={64} />
      <ShimmerBlock w="100%" h={54} />
    </View>
  );
}

// ─── PayBadge ─────────────────────────────────────────────────────────────────
function PayBadge({ paid }: { paid: boolean }) {
  const c  = paid ? D.green : D.amber;
  const bg = paid ? 'rgba(52,211,154,0.13)' : 'rgba(242,179,56,0.13)';
  const br = paid ? 'rgba(52,211,154,0.26)' : 'rgba(242,179,56,0.26)';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: bg,
      borderWidth: 1, borderColor: br,
      borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5,
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      <Text style={{ fontFamily: MONO_B, fontSize: 11, color: c, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {paid ? 'Pago' : 'A cobrar'}
      </Text>
    </View>
  );
}

// ─── SwipeDeliver ─────────────────────────────────────────────────────────────
const THUMB        = 52;
const SWIPE_PAD    = 4;
const TRACK_BORDER = 1.5;

function SwipeDeliver({ onDelivered, resetKey }: { onDelivered: () => void; resetKey: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const maxXRef = useRef(0);
  const xAnim   = useRef(new Animated.Value(0)).current;
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
      setTimeout(onDelivered, 480);
    });
  }, [onDelivered]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !doneRef.current,
      onMoveShouldSetPanResponder:  () => !doneRef.current,
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
        backgroundColor: done ? 'rgba(52,211,154,0.18)' : 'rgba(52,211,154,0.09)',
        borderColor:     done ? 'rgba(52,211,154,0.40)' : 'rgba(52,211,154,0.20)',
      }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View pointerEvents="none" style={[swipeStyles.fill, { width: fillWidth }]} />

      {/* Idle label */}
      <Animated.View pointerEvents="none" style={[swipeStyles.labelWrap, { opacity: done ? 0 : idleOpacity }]}>
        <Text style={swipeStyles.idleLabel}>Deslize para entregar</Text>
        <Ionicons name="chevron-forward" size={14} color={D.green} />
      </Animated.View>

      {/* Done label */}
      {done && (
        <View pointerEvents="none" style={swipeStyles.labelWrap}>
          <Ionicons name="checkmark" size={16} color={D.green} />
          <Text style={swipeStyles.doneLabel}>Entregue!</Text>
        </View>
      )}

      {/* Thumb */}
      {!done && (
        <Animated.View
          style={[swipeStyles.thumb, { transform: [{ translateX: xAnim }] }]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="chevron-forward" size={18} color="rgba(52,211,154,0.9)" />
        </Animated.View>
      )}
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  track: {
    flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
  },
  fill: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(52,211,154,0.13)',
  },
  labelWrap: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  idleLabel: { fontFamily: SANS_B, fontSize: 13, color: D.green, letterSpacing: -0.1 },
  doneLabel: { fontFamily: SANS_B, fontSize: 14, color: D.green, letterSpacing: -0.1 },
  thumb: {
    position: 'absolute', left: SWIPE_PAD, top: SWIPE_PAD, bottom: SWIPE_PAD,
    width: THUMB,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(52,211,154,0.22)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,154,0.46)',
  },
});

// ─── ConfirmOverlay ───────────────────────────────────────────────────────────
function ConfirmOverlay({ customer, onDone }: { customer: string; onDone: () => void }) {
  const circleScale = useRef(new Animated.Value(0.55)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(circleScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 1850);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, confirmStyles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[confirmStyles.circle, { transform: [{ scale: circleScale }] }]}>
        <Ionicons name="checkmark" size={40} color={D.green} />
      </Animated.View>
      <Animated.Text style={[confirmStyles.title, { transform: [{ translateY: slideAnim }] }]}>
        Entregue!
      </Animated.Text>
      <Animated.Text style={[confirmStyles.customer, { transform: [{ translateY: slideAnim }] }]}>
        {customer}
      </Animated.Text>
      <Animated.Text style={[confirmStyles.next, { transform: [{ translateY: slideAnim }] }]}>
        Próxima entrega em breve…
      </Animated.Text>
    </Animated.View>
  );
}

const confirmStyles = StyleSheet.create({
  overlay: {
    backgroundColor: D.bg, zIndex: 100,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  circle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(52,211,154,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,154,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { color: D.text, fontSize: 30, fontFamily: SANS_EB, letterSpacing: -0.9 },
  customer: { color: D.dim,  fontSize: 15, fontFamily: SANS },
  next: {
    color: D.faint, fontSize: 11, fontFamily: MONO_B,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6,
  },
});

// ─── RouteComplete ────────────────────────────────────────────────────────────
function RouteComplete({ dispatch, onClose }: { dispatch: DispatchEntity; onClose: () => void }) {
  const insets    = useSafeAreaInsets();
  const popScale  = useRef(new Animated.Value(0.55)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(popScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, []);

  const sorted      = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const totalAmount = sorted.reduce((s, o) => s + orderTotal(o), 0);

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: D.bg, zIndex: 200 }]}>
      <ScrollView
        contentContainerStyle={[
          routeStyles.container,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View style={[routeStyles.iconWrap, { transform: [{ scale: popScale }] }]}>
          <ZippyMark size={38} />
        </Animated.View>

        <Animated.Text style={[routeStyles.title, { opacity: fadeAnim }]}>
          Rota concluída!
        </Animated.Text>
        <Animated.Text style={[routeStyles.subtitle, { opacity: fadeAnim }]}>
          {sorted.length} de {sorted.length} entregas realizadas.
        </Animated.Text>

        {/* Total card */}
        <Animated.View style={[routeStyles.totalCard, { opacity: fadeAnim }]}>
          <Text style={routeStyles.totalLabel}>Total da rota</Text>
          <Text style={routeStyles.totalValue}>
            R$ {(totalAmount / 100).toFixed(2).replace('.', ',')}
          </Text>
        </Animated.View>

        {/* Per-order rows */}
        <Animated.View style={[routeStyles.orderList, { opacity: fadeAnim }]}>
          {sorted.map((o) => (
            <View key={o.id} style={routeStyles.orderRow}>
              <View style={routeStyles.orderCheck}>
                <Ionicons name="checkmark" size={12} color={D.green} />
              </View>
              <Text style={routeStyles.orderName} numberOfLines={1}>
                {o.customer?.name ?? 'Cliente'}
              </Text>
              <Text style={routeStyles.orderAmount}>
                R$ {(orderTotal(o) / 100).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </Animated.View>

        <TouchableOpacity style={routeStyles.doneBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={routeStyles.doneBtnText}>Aguardar próximo despacho</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const routeStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: D.zippy,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title:    { color: D.text, fontSize: 28, fontFamily: SANS_EB, letterSpacing: -1.1, textAlign: 'center' },
  subtitle: { color: D.dim,  fontSize: 15, textAlign: 'center', lineHeight: 22 },
  totalCard: {
    width: '100%', backgroundColor: D.surf,
    borderWidth: 1, borderColor: D.line, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 20,
    alignItems: 'center', marginTop: 8,
  },
  totalLabel: { fontFamily: MONO, fontSize: 10, color: D.faint, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  totalValue: { fontFamily: SANS_EB, fontSize: 28, color: D.text, letterSpacing: -1 },
  orderList: { width: '100%', gap: 8 },
  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: D.surf3,
    borderWidth: 1, borderColor: D.line, borderRadius: 12, gap: 10,
  },
  orderCheck: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: 'rgba(52,211,154,0.14)',
    borderWidth: 1, borderColor: 'rgba(52,211,154,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  orderName:   { flex: 1, fontSize: 13, fontFamily: SANS_SB, color: D.dim },
  orderAmount: { fontFamily: MONO_B, fontSize: 13, color: D.text },
  doneBtn: {
    alignSelf: 'stretch', backgroundColor: D.zippy,
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: D.zippy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26, shadowRadius: 16, elevation: 6,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: SANS_B },
});

// ─── NextCard ─────────────────────────────────────────────────────────────────
function NextCard({ order, sequenceIdx }: { order: DispatchOrder; sequenceIdx: number }) {
  const addr    = order.deliveryAddress;
  const paid    = !!order.paidAt;
  const needsCash = !paid;

  return (
    <View style={nextStyles.card}>
      <View style={nextStyles.badge}>
        <Text style={nextStyles.badgeNum}>{sequenceIdx}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <Text style={nextStyles.name} numberOfLines={1}>
            {order.customer?.name ?? 'Cliente'}
          </Text>
          {needsCash && (
            <Text style={nextStyles.cashBadge}>Cobrar</Text>
          )}
        </View>
        {addr && (
          <Text style={nextStyles.addr} numberOfLines={1}>
            {addr.street}, {addr.number}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <Text style={nextStyles.meta}>{order.paymentMethod}</Text>
        </View>
      </View>
    </View>
  );
}

const nextStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: D.surf,
    borderWidth: 1, borderColor: D.line,
    borderRadius: 14, padding: 13,
  },
  badge: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    backgroundColor: D.surf3, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeNum: { fontFamily: MONO_B, fontSize: 13, color: D.faint },
  name:     { fontSize: 14, fontFamily: SANS_B, color: D.text, letterSpacing: -0.1, flexShrink: 1 },
  addr:     { fontSize: 12, color: D.faint, lineHeight: 18 },
  meta:     { fontFamily: MONO, fontSize: 11, color: D.faint },
  cashBadge: {
    fontFamily: MONO_B, fontSize: 10, color: D.amber,
    backgroundColor: 'rgba(242,179,56,0.12)',
    borderWidth: 1, borderColor: 'rgba(242,179,56,0.24)',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    letterSpacing: 0.7, textTransform: 'uppercase', flexShrink: 0,
  },
});

// ─── ItemsAccordion ───────────────────────────────────────────────────────────
function ItemsAccordion({ order }: { order: DispatchOrder }) {
  const itemCount = order.orderProducts.reduce((s, p) => s + p.quantity, 0);

  return (
    <View style={accordionStyles.container}>
      <View style={accordionStyles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={accordionStyles.title}>Itens do Pedido</Text>
          <View style={accordionStyles.countBadge}>
            <Text style={accordionStyles.countText}>{itemCount}</Text>
          </View>
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: D.line }}>
        {order.orderProducts.map((op, i) => (
          <View
            key={op.id}
            style={[
              accordionStyles.item,
              i < order.orderProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: D.line },
            ]}
          >
            <View style={accordionStyles.qtyBox}>
              <Text style={accordionStyles.qty}>{op.quantity}×</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={accordionStyles.name}>{op.product.name}</Text>
              {op.selectedModifierGroupItems.length > 0 && (
                <Text style={accordionStyles.mods} numberOfLines={2}>
                  {op.selectedModifierGroupItems.map(m => m.name).join(', ')}
                </Text>
              )}
              {op.comments ? (
                <Text style={accordionStyles.comments}>{`"${op.comments}"`}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const accordionStyles = StyleSheet.create({
  container: {
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    borderRadius: 14, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 13,
  },
  title:      { fontSize: 13, fontFamily: SANS_B, color: D.text, letterSpacing: -0.1 },
  countBadge: { backgroundColor: D.surf3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  countText:  { fontFamily: MONO, fontSize: 11, color: D.faint },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 15, paddingVertical: 11,
  },
  qtyBox: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    backgroundColor: 'rgba(255,61,20,0.11)',
    borderWidth: 1, borderColor: 'rgba(255,61,20,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  qty:      { fontFamily: MONO_B, fontSize: 12, color: D.zippy },
  name:     { fontSize: 14, color: D.text, fontFamily: SANS_M },
  mods:     { color: D.dim,  fontSize: 12, marginTop: 2 },
  comments: { color: D.faint, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    CREDIT_CARD: 'Cartão',
    DEBIT_CARD:  'Débito',
    CASH:        'Dinheiro',
    PIX:         'Pix',
    CARD:        'Cartão',
  };
  return map[method] ?? method;
}

function openMaps(addr: NonNullable<DispatchOrder['deliveryAddress']>) {
  const query   = encodeURIComponent(`${addr.street} ${addr.number}, ${addr.city}, ${addr.state}, ${addr.zipCode}`);
  const ios     = `maps://maps.apple.com/?q=${query}`;
  const android = `geo:0,0?q=${query}`;
  Linking.openURL(Platform.OS === 'ios' ? ios : android)
    .catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function openWhatsApp(phone: string) {
  Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`).catch(() => {});
}

// ─── NoDispatch ───────────────────────────────────────────────────────────────
function NoDispatch({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, [loading]);

  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
      <Ionicons name="time-outline" size={48} color={D.faint} />
      <Text style={{ color: D.dim, fontSize: 16, fontFamily: SANS, textAlign: 'center' }}>
        Aguardando despacho…
      </Text>
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: D.surf3, borderRadius: 12,
          paddingHorizontal: 20, paddingVertical: 12,
          borderWidth: 1, borderColor: D.line,
        }}
        onPress={onRefresh}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="refresh" size={18} color={D.text} />
          </Animated.View>
        ) : (
          <Ionicons name="refresh" size={18} color={D.text} />
        )}
        <Text style={{ color: D.text, fontSize: 14, fontFamily: SANS_M }}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── DeliveryContent ──────────────────────────────────────────────────────────
function DeliveryContent({
  dispatch, onDelivered, onStartDelivery,
}: {
  dispatch: DispatchEntity; onDelivered: () => void; onStartDelivery: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [swipeKey,   setSwipeKey]   = useState(0);
  const insets = useSafeAreaInsets();

  const sorted       = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const activeIdx    = sorted.findIndex(o => !o.deliveredAt);
  const order        = sorted[activeIdx];
  if (!order) return null;

  const addr           = order.deliveryAddress;
  const phone          = order.customer?.phone ?? null;
  const paid           = !!order.paidAt;
  const upNext         = sorted.slice(activeIdx + 1);
  const deliveredCount = sorted.filter(o => !!o.deliveredAt).length;
  const remainingKm    = null;

  const handleSwipe = () => setConfirming(true);
  const handleConfirmDone = () => {
    setConfirming(false);
    setSwipeKey(k => k + 1);
    onDelivered();
  };

  const payBg     = paid ? D.surf : 'rgba(242,179,56,0.06)';
  const payBorder = paid ? D.line  : 'rgba(242,179,56,0.22)';

  return (
    <View style={{ flex: 1 }}>
      {/* ── Progress strip ── */}
      <View style={progStyles.strip}>
        {/* Pill indicators */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {sorted.map((o, i) => {
            const past   = !!o.deliveredAt;
            const active = i === activeIdx;
            return (
              <React.Fragment key={i}>
                <View style={{
                  width: active ? 20 : 8, height: 8, borderRadius: 4,
                  backgroundColor: past ? D.green : active ? D.zippy : D.surf3,
                  borderWidth: past || active ? 0 : 1,
                  borderColor: 'rgba(250,245,238,0.14)',
                }} />
                {i < sorted.length - 1 && (
                  <View style={{
                    width: 14, height: 1.5, borderRadius: 1,
                    backgroundColor: past ? D.green : D.surf3,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 12 }}>
          <Text style={progStyles.stopLabel}>
            Parada {deliveredCount + 1} de {sorted.length}
          </Text>
          {remainingKm !== null && (
            <Text style={progStyles.kmLabel}>{remainingKm} km restantes</Text>
          )}
        </View>
      </View>

      {/* ── Scroll content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentStyles.scroll, { paddingBottom: insets.bottom + 180 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Kicker */}
        <Text style={contentStyles.kicker}>Próxima Entrega</Text>

        {/* Customer name */}
        <Text style={contentStyles.customerName}>
          {order.customer?.name ?? 'Cliente'}
        </Text>

        {/* Address card */}
        {addr && (
          <TouchableOpacity
            style={contentStyles.addrCard}
            onPress={() => openMaps(addr)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={17} color={D.zippy} style={{ marginTop: 2, flexShrink: 0 }} />
            <View style={{ flex: 1 }}>
              <Text style={contentStyles.addrMain}>
                {addr.street}, {addr.number}
                {addr.complement ? ` — ${addr.complement}` : ''}
              </Text>
              <Text style={contentStyles.addrSub}>{addr.city}, {addr.state}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={D.faint} style={{ marginTop: 2, flexShrink: 0 }} />
          </TouchableOpacity>
        )}

        {/* Payment card */}
        <View style={[contentStyles.payCard, { backgroundColor: payBg, borderColor: payBorder }]}>
          <View>
            <Text style={contentStyles.payKicker}>
              Valor · {paymentLabel(order.paymentMethod)}
            </Text>
            <Text style={contentStyles.payAmount}>
              R$ {(orderTotal(order) / 100).toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <PayBadge paid={paid} />
        </View>

        {/* Items accordion */}
        <ItemsAccordion order={order} />

        {/* Up next */}
        {upNext.length > 0 && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={contentStyles.sectionKicker}>
              Próximas Entregas ({upNext.length})
            </Text>
            {upNext.map((o, i) => (
              <NextCard key={o.id} order={o} sequenceIdx={deliveredCount + 2 + i} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={[bottomStyles.bar, { paddingBottom: insets.bottom + 13 }]}>
        {!dispatch.startedDeliveryAt ? (
          <TouchableOpacity style={bottomStyles.navBtn} onPress={onStartDelivery} activeOpacity={0.88}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={bottomStyles.navBtnText}>Iniciar entrega</Text>
          </TouchableOpacity>
        ) : (
          <>
            {addr && (
              <TouchableOpacity style={bottomStyles.navBtn} onPress={() => openMaps(addr)} activeOpacity={0.88}>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={bottomStyles.navBtnText}>Iniciar Navegação</Text>
              </TouchableOpacity>
            )}
            <View style={bottomStyles.actionRow}>
              {phone && (
                <TouchableOpacity style={bottomStyles.waBtn} onPress={() => openWhatsApp(phone)} activeOpacity={0.82}>
                  <Ionicons name="logo-whatsapp" size={21} color={D.green} />
                </TouchableOpacity>
              )}
              <SwipeDeliver onDelivered={handleSwipe} resetKey={swipeKey} />
            </View>
          </>
        )}
      </View>

      {confirming && (
        <ConfirmOverlay
          customer={order.customer?.name ?? 'Cliente'}
          onDone={handleConfirmDone}
        />
      )}
    </View>
  );
}

const progStyles = StyleSheet.create({
  strip: {
    height: 42, flexShrink: 0,
    paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: D.surf2,
    borderBottomWidth: 1, borderBottomColor: D.line,
  },
  stopLabel: { fontFamily: MONO_B, fontSize: 11, color: D.dim, letterSpacing: 0.4 },
  kmLabel:   { fontFamily: MONO,   fontSize: 11, color: D.faint },
});

const contentStyles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 20, gap: 10 },
  kicker: {
    fontFamily: MONO_B, fontSize: 10, color: D.faint,
    letterSpacing: 2.4, textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 32, fontFamily: SANS_EB, color: D.text,
    letterSpacing: -1.2, lineHeight: 34, marginBottom: 8,
  },
  addrCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    borderRadius: 14, padding: 14,
  },
  addrMain: { fontSize: 14, fontFamily: SANS_SB, color: D.text, lineHeight: 21, marginBottom: 6 },
  addrSub:  { fontFamily: MONO, fontSize: 11, color: D.dim },
  payCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14, padding: 13,
  },
  payKicker: {
    fontFamily: MONO, fontSize: 10, color: D.faint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5,
  },
  payAmount: { fontSize: 22, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.6 },
  sectionKicker: {
    fontFamily: MONO_B, fontSize: 10, color: D.faint,
    letterSpacing: 2, textTransform: 'uppercase',
  },
});

const bottomStyles = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: D.surf,
    paddingTop: 13, paddingHorizontal: 18,
    borderTopWidth: 1, borderTopColor: D.line,
    gap: 10,
  },
  navBtn: {
    width: '100%', height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: D.zippy,
    shadowColor: D.zippy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26, shadowRadius: 16, elevation: 6,
  },
  navBtnText: { color: '#fff', fontSize: 16, fontFamily: SANS_B, letterSpacing: -0.1 },
  actionRow:  { flexDirection: 'row', gap: 10 },
  waBtn: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    backgroundColor: D.surf3,
    borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DeliveryScreen() {
  const { token, driver } = useAuth();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [dispatch,   setDispatch]   = useState<DispatchEntity | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [routeDone,  setRouteDone]  = useState(false);

  const fetchDispatch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNextDispatch(token);
      setDispatch(data);
      setRouteDone(false);
    } catch {
      // keep previous on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDispatch(); }, []);

  useEffect(() => {
    Location.getBackgroundPermissionsAsync().then(({ granted }) => {
      if (!granted) router.replace('/location-permission');
    });
  }, [router]);

  const handleDelivered = useCallback(async () => {
    if (!dispatch || !token) return;
    const order = dispatch.orders.find(o => !o.deliveredAt);
    if (!order) return;
    await markOrderDelivered(token, order.id).catch(() => {});
    const deliveredAt = new Date().toISOString();
    const updatedOrders = dispatch.orders.map(o =>
      o.id === order.id ? { ...o, deliveredAt } : o
    );
    setDispatch(prev => prev ? { ...prev, orders: updatedOrders } : prev);
    if (updatedOrders.every(o => !!o.deliveredAt)) {
      setRouteDone(true);
    }
  }, [dispatch, token]);

  const handleStartDelivery = useCallback(async () => {
    if (!token || !dispatch) return;
    console.log('[delivery] handleStartDelivery called', dispatch.id);
    try {
      const { startedDeliveryAt } = await startDelivery(token, dispatch.id);
      setDispatch(prev => prev ? { ...prev, startedDeliveryAt } : prev);
      startRouteTracking(token, dispatch.id).catch((e) => console.log('[delivery] startRouteTracking error', e));
    } catch (e) {
      console.log('[delivery] startDelivery error', e);
    }
  }, [token, dispatch]);

  // Resume tracking if dispatch already started (e.g. app reloaded mid-delivery)
  useEffect(() => {
    if (token && dispatch?.startedDeliveryAt && dispatch.id) {
      console.log('[delivery] dispatch already started, resuming route tracking', dispatch.id);
      startRouteTracking(token, dispatch.id).catch((e) => console.log('[delivery] resume tracking error', e));
    }
  }, [token, dispatch?.id, dispatch?.startedDeliveryAt]);

  const handleRouteClose = () => {
    stopRouteTracking().catch(() => {});
    setRouteDone(false);
    setDispatch(null);
    fetchDispatch();
  };

  useEffect(() => () => { stopRouteTracking().catch(() => {}); }, []);

  const driverInitial = driver?.name?.[0]?.toUpperCase() ?? '?';
  const driverFirst   = driver?.name?.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>

      {/* ── Top bar ── */}
      <View style={[topStyles.bar, { paddingTop: insets.top + 13 }]}>
        {/* Back */}
        <TouchableOpacity style={topStyles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>

        {/* Center: logo + live dot */}
        <View style={topStyles.centerGroup}>
          <ZippyMark size={20} />
          <Text style={topStyles.logoText}>Zippy</Text>
          <PulseDot />
        </View>

        {/* Driver chip */}
        {driver && (
          <View style={topStyles.driverChip}>
            <View style={topStyles.driverAvatar}>
              <Text style={topStyles.driverInitial}>{driverInitial}</Text>
            </View>
            <Text style={topStyles.driverName} numberOfLines={1}>{driverFirst}</Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      {loading && !dispatch ? (
        <LoadingSkeleton />
      ) : !dispatch ? (
        <NoDispatch onRefresh={fetchDispatch} loading={loading} />
      ) : (
        <DeliveryContent
          dispatch={dispatch}
          onDelivered={handleDelivered}
          onStartDelivery={handleStartDelivery}
        />
      )}

      {routeDone && dispatch && (
        <RouteComplete dispatch={dispatch} onClose={handleRouteClose} />
      )}
    </View>
  );
}

const topStyles = StyleSheet.create({
  bar: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingBottom: 13,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: D.bg,
    borderBottomWidth: 1, borderBottomColor: D.line,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
  centerGroup: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
  },
  logoText: { fontFamily: SANS_B, fontSize: 15, color: D.text, letterSpacing: -0.3 },
  driverChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    borderRadius: 20, paddingLeft: 6, paddingRight: 11, paddingVertical: 5,
  },
  driverAvatar: {
    width: 20, height: 20, borderRadius: 10, flexShrink: 0,
    backgroundColor: D.zippy, alignItems: 'center', justifyContent: 'center',
  },
  driverInitial: { fontFamily: MONO_B, fontSize: 9, color: '#fff' },
  driverName:    { fontFamily: SANS_B, fontSize: 13, color: D.text },
});
