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
import { getNextDispatch, DispatchEntity, DispatchOrder } from '@/lib/dispatch-api';

// ─── Design tokens ───────────────────────────────────────────────────────────
const D = {
  bg: '#0a0807',
  surf: '#181310',
  surf2: '#1e1812',
  surf3: '#2a211b',
  line: 'rgba(250,245,238,0.09)',
  text: '#faf5ee',
  dim: 'rgba(250,245,238,0.58)',
  faint: 'rgba(250,245,238,0.28)',
  zippy: '#ff3d14',
  green: '#34d39a',
  yellow: '#f5c518',
};

const SANS = 'Geist_400Regular';
const SANS_M = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B = 'Geist_700Bold';
const MONO = 'GeistMono_400Regular';

// ─── ZippyMark (same as login screen) ────────────────────────────────────────
function ZippyMark({ size = 32 }: { size?: number }) {
  const s = size / 100;
  const cx = 50 * s;
  const cy = 60 * s;

  const Arc = ({
    radius,
    strokeWidth,
  }: {
    radius: number;
    strokeWidth: number;
  }) => {
    const diameter = radius * 2;
    const containerH = radius;
    const offset = radius - cx;
    return (
      <View
        style={{
          position: 'absolute',
          left: cx - radius,
          top: cy - radius,
          width: diameter,
          height: containerH,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: diameter,
            height: diameter,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: D.text,
          }}
        />
      </View>
    );
  };

  return (
    <View style={{ width: size, height: size }}>
      <Arc radius={32 * s} strokeWidth={6 * s} />
      <Arc radius={22 * s} strokeWidth={8 * s} />
      {/* White square */}
      <View
        style={{
          position: 'absolute',
          left: 41 * s,
          top: 51 * s,
          width: 18 * s,
          height: 18 * s,
          borderRadius: 4 * s,
          backgroundColor: D.text,
        }}
      />
    </View>
  );
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9, duration: 0, useNativeDriver: true }),
        ]),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: D.green,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: D.green }} />
    </View>
  );
}

// ─── Shimmer loading card ─────────────────────────────────────────────────────
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

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });

  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: 6, backgroundColor: D.text, opacity }, style]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 }}>
      <ShimmerBlock w="60%" h={22} />
      <ShimmerBlock w="90%" h={14} />
      <ShimmerBlock w="75%" h={14} />
      <View style={{ height: 12 }} />
      <ShimmerBlock w="100%" h={90} />
      <ShimmerBlock w="100%" h={60} />
      <ShimmerBlock w="100%" h={60} />
    </View>
  );
}

// ─── SwipeDeliver ─────────────────────────────────────────────────────────────
const THUMB = 52;
const SWIPE_PAD = 4;

function SwipeDeliver({ onDelivered, resetKey }: { onDelivered: () => void; resetKey: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const maxXRef = useRef(0);
  const xAnim = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);

  // Sync maxX whenever trackWidth changes
  useEffect(() => {
    maxXRef.current = Math.max(0, trackWidth - THUMB - SWIPE_PAD * 2);
  }, [trackWidth]);

  // Reset on new stop
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

  // Fill track width: PAD + THUMB + drag offset
  const fillWidth = xAnim.interpolate({
    inputRange: [0, Math.max(1, trackWidth)],
    outputRange: [SWIPE_PAD + THUMB, SWIPE_PAD + THUMB + Math.max(1, trackWidth)],
    extrapolate: 'clamp',
  });

  // Idle label fades out as user drags
  const idleLabelOpacity = xAnim.interpolate({
    inputRange: [0, Math.max(1, maxXRef.current) * 0.42],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        swipeStyles.track,
        {
          backgroundColor: done ? 'rgba(52,211,154,0.18)' : 'rgba(52,211,154,0.09)',
          borderColor: done ? 'rgba(52,211,154,0.40)' : 'rgba(52,211,154,0.20)',
        },
      ]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {/* Green fill */}
      <Animated.View pointerEvents="none" style={[swipeStyles.fill, { width: fillWidth }]} />

      {/* Idle label */}
      <Animated.View
        pointerEvents="none"
        style={[swipeStyles.labelWrap, { opacity: done ? 0 : idleLabelOpacity }]}
      >
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

      {/* Draggable thumb */}
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
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(52,211,154,0.13)',
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  idleLabel: {
    fontFamily: SANS_B,
    fontSize: 13,
    color: D.green,
    letterSpacing: -0.1,
  },
  doneLabel: {
    fontFamily: SANS_B,
    fontSize: 14,
    color: D.green,
    letterSpacing: -0.1,
  },
  thumb: {
    position: 'absolute',
    left: SWIPE_PAD,
    top: SWIPE_PAD,
    width: THUMB,
    height: 52 - SWIPE_PAD * 2,
    borderRadius: 10,
    backgroundColor: 'rgba(52,211,154,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(52,211,154,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── ConfirmOverlay ───────────────────────────────────────────────────────────
function ConfirmOverlay({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, confirmStyles.overlay, { opacity }]}>
      <Animated.View style={[confirmStyles.circle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={52} color="#fff" />
      </Animated.View>
      <Text style={confirmStyles.text}>Entregue!</Text>
    </Animated.View>
  );
}

const confirmStyles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(10,8,7,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: D.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  text: {
    color: D.text,
    fontSize: 28,
    fontFamily: SANS_B,
  },
});

// ─── RouteComplete ────────────────────────────────────────────────────────────
function RouteComplete({
  dispatch,
  onClose,
}: {
  dispatch: DispatchEntity;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
  }, []);

  const totalItems = dispatch.orders.reduce(
    (acc, o) => acc + o.orderProducts.reduce((s, p) => s + p.quantity, 0),
    0
  );
  const totalFees = dispatch.orders.reduce(
    (acc, o) => acc + (o.deliveryAddress?.deliveryFee ?? 0),
    0
  );

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: D.bg, zIndex: 200 }]}>
      <ScrollView
        contentContainerStyle={[
          routeStyles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Animated.View style={[routeStyles.iconCircle, { transform: [{ scale }] }]}>
          <Ionicons name="flag" size={42} color="#fff" />
        </Animated.View>
        <Text style={routeStyles.title}>Rota concluída!</Text>
        <Text style={routeStyles.subtitle}>
          {dispatch.orders.length} entrega{dispatch.orders.length !== 1 ? 's' : ''} realizada
          {dispatch.orders.length !== 1 ? 's' : ''}
        </Text>

        <View style={routeStyles.statsRow}>
          <View style={routeStyles.stat}>
            <Text style={routeStyles.statValue}>{dispatch.orders.length}</Text>
            <Text style={routeStyles.statLabel}>Pedidos</Text>
          </View>
          <View style={routeStyles.statDivider} />
          <View style={routeStyles.stat}>
            <Text style={routeStyles.statValue}>{totalItems}</Text>
            <Text style={routeStyles.statLabel}>Itens</Text>
          </View>
          <View style={routeStyles.statDivider} />
          <View style={routeStyles.stat}>
            <Text style={routeStyles.statValue}>
              {dispatch.estimatedRoundTripDurationMinutes ?? '–'} min
            </Text>
            <Text style={routeStyles.statLabel}>Estimativa</Text>
          </View>
        </View>

        {totalFees > 0 && (
          <View style={routeStyles.feeRow}>
            <Text style={routeStyles.feeLabel}>Taxa de entrega total</Text>
            <Text style={routeStyles.feeValue}>
              R$ {(totalFees / 100).toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}

        <TouchableOpacity style={routeStyles.doneBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={routeStyles.doneBtnText}>Aguardar próximo despacho</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const routeStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: D.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: D.text, fontSize: 26, fontFamily: SANS_B, textAlign: 'center' },
  subtitle: { color: D.dim, fontSize: 16, textAlign: 'center', marginBottom: 8 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surf,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 0,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: D.text, fontSize: 22, fontFamily: SANS_B },
  statLabel: { color: D.dim, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: D.line },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    backgroundColor: D.surf,
    borderRadius: 12,
    padding: 16,
  },
  feeLabel: { color: D.dim, fontSize: 14 },
  feeValue: { color: D.green, fontSize: 16, fontFamily: MONO },
  doneBtn: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: D.zippy,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: SANS_B },
});

// ─── NextCard ─────────────────────────────────────────────────────────────────
function NextCard({ order, idx }: { order: DispatchOrder; idx: number }) {
  const addr = order.deliveryAddress;
  return (
    <View style={nextStyles.card}>
      <View style={nextStyles.badge}>
        <Text style={nextStyles.badgeText}>{idx + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={nextStyles.name} numberOfLines={1}>
          {order.customer?.name ?? 'Cliente'}
        </Text>
        {addr && (
          <Text style={nextStyles.addr} numberOfLines={1}>
            {addr.street}, {addr.number}
          </Text>
        )}
      </View>
    </View>
  );
}

const nextStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: D.surf2,
    borderRadius: 12,
    marginBottom: 8,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: D.surf3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: D.dim, fontSize: 13, fontFamily: SANS_SB },
  name: { color: D.text, fontSize: 14, fontFamily: SANS_SB },
  addr: { color: D.dim, fontSize: 12, marginTop: 2 },
});

// ─── ItemsAccordion ───────────────────────────────────────────────────────────
function ItemsAccordion({ order }: { order: DispatchOrder }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={accordionStyles.container}>
      <TouchableOpacity
        style={accordionStyles.header}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.75}
      >
        <Text style={accordionStyles.title}>
          Itens ({order.orderProducts.reduce((s, p) => s + p.quantity, 0)})
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={D.dim} />
      </TouchableOpacity>
      {open &&
        order.orderProducts.map(op => (
          <View key={op.id} style={accordionStyles.item}>
            <Text style={accordionStyles.qty}>{op.quantity}×</Text>
            <View style={{ flex: 1 }}>
              <Text style={accordionStyles.name}>{op.product.name}</Text>
              {op.selectedModifierGroupItems.length > 0 && (
                <Text style={accordionStyles.mods} numberOfLines={2}>
                  {op.selectedModifierGroupItems.map(m => m.name).join(', ')}
                </Text>
              )}
              {op.comments ? (
                <Text style={accordionStyles.comments}>"{op.comments}"</Text>
              ) : null}
            </View>
            {op.product.price !== null && (
              <Text style={accordionStyles.price}>
                R$ {((op.product.price * op.quantity) / 100).toFixed(2).replace('.', ',')}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}

const accordionStyles = StyleSheet.create({
  container: {
    backgroundColor: D.surf2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: D.text, fontSize: 14, fontFamily: SANS_SB },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  qty: { color: D.zippy, fontSize: 14, fontFamily: SANS_B, minWidth: 24 },
  name: { color: D.text, fontSize: 14 },
  mods: { color: D.dim, fontSize: 12, marginTop: 2 },
  comments: { color: D.faint, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  price: { color: D.dim, fontSize: 13, fontFamily: MONO },
});

// ─── PaymentRow ───────────────────────────────────────────────────────────────
function paymentLabel(method: string, paid: boolean): string {
  const map: Record<string, string> = {
    CREDIT_CARD: 'Cartão de crédito',
    DEBIT_CARD: 'Cartão de débito',
    CASH: 'Dinheiro',
    PIX: 'Pix',
  };
  const label = map[method] ?? method;
  return paid ? `${label} (pago)` : label;
}

// ─── Open maps helper ─────────────────────────────────────────────────────────
function openMaps(addr: NonNullable<DispatchOrder['deliveryAddress']>) {
  const query = encodeURIComponent(
    `${addr.street} ${addr.number}, ${addr.city}, ${addr.state}, ${addr.zipCode}`
  );
  const ios = `maps://maps.apple.com/?q=${query}`;
  const android = `geo:0,0?q=${query}`;
  const url = Platform.OS === 'ios' ? ios : android;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://maps.google.com/?q=${query}`)
  );
}

// ─── Open WhatsApp helper ─────────────────────────────────────────────────────
function openWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, '');
  Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
}

// ─── DeliveryContent ──────────────────────────────────────────────────────────
function DeliveryContent({
  dispatch,
  stopIdx,
  onDelivered,
}: {
  dispatch: DispatchEntity;
  stopIdx: number;
  onDelivered: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const insets = useSafeAreaInsets();

  const sorted = [...dispatch.orders].sort(
    (a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex
  );
  const order = sorted[stopIdx];
  if (!order) return null;

  const addr = order.deliveryAddress;
  const phone = order.customer?.phone ?? null;
  const paid = !!order.paidAt;
  const upNext = sorted.slice(stopIdx + 1);

  const handleSwipe = () => setConfirming(true);
  const handleConfirmDone = () => {
    setConfirming(false);
    setSwipeKey(k => k + 1);
    onDelivered();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          deliveryStyles.scrollContent,
          { paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress strip */}
        <View style={deliveryStyles.progressStrip}>
          <View style={deliveryStyles.dots}>
            {sorted.map((_, i) => (
              <View
                key={i}
                style={[
                  deliveryStyles.dot,
                  i < stopIdx && deliveryStyles.dotDone,
                  i === stopIdx && deliveryStyles.dotActive,
                ]}
              />
            ))}
          </View>
          <Text style={deliveryStyles.stopLabel}>
            Parada {stopIdx + 1} de {sorted.length}
          </Text>
        </View>

        {/* Customer name */}
        <Text style={deliveryStyles.customerName}>
          {order.customer?.name ?? 'Cliente'}
        </Text>

        {/* Address card */}
        {addr && (
          <TouchableOpacity
            style={deliveryStyles.addrCard}
            onPress={() => openMaps(addr)}
            activeOpacity={0.8}
          >
            <View style={deliveryStyles.addrIconWrap}>
              <Ionicons name="location" size={20} color={D.zippy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={deliveryStyles.addrMain}>
                {addr.street}, {addr.number}
                {addr.complement ? ` — ${addr.complement}` : ''}
              </Text>
              <Text style={deliveryStyles.addrSub}>
                {addr.city}, {addr.state} · {addr.zipCode}
              </Text>
              {addr.deliveryFee !== undefined && addr.deliveryFee > 0 && (
                <Text style={deliveryStyles.deliveryFee}>
                  Taxa: R$ {(addr.deliveryFee / 100).toFixed(2).replace('.', ',')}
                </Text>
              )}
            </View>
            <Ionicons name="open-outline" size={16} color={D.faint} />
          </TouchableOpacity>
        )}

        {/* Payment */}
        <View style={deliveryStyles.paymentRow}>
          <Ionicons
            name={paid ? 'card' : 'cash-outline'}
            size={18}
            color={paid ? D.green : D.yellow}
          />
          <Text style={[deliveryStyles.paymentText, { color: paid ? D.green : D.yellow }]}>
            {paymentLabel(order.paymentMethod, paid)}
          </Text>
          {order.tipAmount !== undefined && order.tipAmount > 0 && (
            <Text style={deliveryStyles.tip}>
              + R$ {(order.tipAmount / 100).toFixed(2).replace('.', ',')} gorjeta
            </Text>
          )}
        </View>

        {/* Items */}
        <ItemsAccordion order={order} />

        {/* Next stops */}
        {upNext.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={deliveryStyles.sectionTitle}>Próximas paradas</Text>
            {upNext.map((o, i) => (
              <NextCard key={o.id} order={o} idx={stopIdx + 1 + i} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom sticky actions */}
      <View style={[deliveryStyles.bottomBar, { paddingBottom: insets.bottom + 13 }]}>
        {/* Row 1 — full-width nav button */}
        {addr && (
          <TouchableOpacity
            style={deliveryStyles.navBtn}
            onPress={() => openMaps(addr)}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={deliveryStyles.navBtnText}>Iniciar Navegação</Text>
          </TouchableOpacity>
        )}
        {/* Row 2 — WA + swipe side by side */}
        <View style={deliveryStyles.actionRow}>
          {phone && (
            <TouchableOpacity
              style={deliveryStyles.waBtn}
              onPress={() => openWhatsApp(phone)}
              activeOpacity={0.82}
            >
              <Ionicons name="logo-whatsapp" size={21} color={D.green} />
            </TouchableOpacity>
          )}
          <SwipeDeliver onDelivered={handleSwipe} resetKey={swipeKey} />
        </View>
      </View>

      {confirming && <ConfirmOverlay onDone={handleConfirmDone} />}
    </View>
  );
}

const deliveryStyles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  progressStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: D.surf3,
  },
  dotDone: { backgroundColor: D.green },
  dotActive: { backgroundColor: D.zippy, width: 20 },
  stopLabel: { color: D.dim, fontSize: 13 },
  customerName: { color: D.text, fontSize: 22, fontFamily: SANS_B, marginBottom: 4 },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: D.surf,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: D.line,
  },
  addrIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: D.surf3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrMain: { color: D.text, fontSize: 14, fontFamily: SANS_M, flexShrink: 1 },
  addrSub: { color: D.dim, fontSize: 12, marginTop: 2 },
  deliveryFee: { color: D.faint, fontSize: 12, marginTop: 4 },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: D.surf,
    borderRadius: 12,
    padding: 14,
  },
  paymentText: { fontSize: 14, fontFamily: SANS_M, flex: 1 },
  tip: { color: D.green, fontSize: 12, fontFamily: MONO },
  sectionTitle: { color: D.dim, fontSize: 13, fontFamily: SANS_SB, marginBottom: 6 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: D.surf,
    paddingTop: 13,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: D.line,
    gap: 10,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  navBtn: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: D.zippy,
    borderRadius: 16,
    shadowColor: D.zippy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  navBtnText: { color: '#fff', fontSize: 16, fontFamily: SANS_B, letterSpacing: -0.1 },
  waBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surf3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: D.line,
    flexShrink: 0,
  },
});

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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Ionicons name="time-outline" size={48} color={D.faint} />
      <Text style={{ color: D.dim, fontSize: 16 }}>Aguardando despacho…</Text>
      <TouchableOpacity
        style={noDispStyles.refreshBtn}
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
        <Text style={noDispStyles.refreshText}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const noDispStyles = StyleSheet.create({
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: D.surf3,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  refreshText: { color: D.text, fontSize: 14, fontFamily: SANS_M },
});

// ─── Main DeliveryScreen ──────────────────────────────────────────────────────
export default function DeliveryScreen() {
  const { token, driver } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dispatch, setDispatch] = useState<DispatchEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopIdx, setStopIdx] = useState(0);
  const [routeDone, setRouteDone] = useState(false);

  const fetchDispatch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNextDispatch(token);
      setDispatch(data);
      setStopIdx(0);
      setRouteDone(false);
    } catch {
      // keep previous dispatch on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDispatch();
  }, []);

  const handleDelivered = () => {
    if (!dispatch) return;
    const sorted = [...dispatch.orders].sort(
      (a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex
    );
    if (stopIdx + 1 >= sorted.length) {
      setRouteDone(true);
    } else {
      setStopIdx(i => i + 1);
    }
  };

  const handleRouteClose = () => {
    setRouteDone(false);
    setDispatch(null);
    fetchDispatch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Nav bar */}
      <View
        style={[
          navStyles.bar,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity
          style={navStyles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={D.text} />
        </TouchableOpacity>

        <View style={navStyles.logoGroup}>
          <ZippyMark size={28} />
          <Text style={navStyles.logoText}>Zippy</Text>
          <PulseDot />
        </View>

        {driver && (
          <View style={navStyles.driverChip}>
            <Text style={navStyles.driverChipText} numberOfLines={1}>
              {driver.name.split(' ')[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Body */}
      {loading && !dispatch ? (
        <LoadingSkeleton />
      ) : !dispatch ? (
        <NoDispatch onRefresh={fetchDispatch} loading={loading} />
      ) : (
        <DeliveryContent
          dispatch={dispatch}
          stopIdx={stopIdx}
          onDelivered={handleDelivered}
        />
      )}

      {routeDone && dispatch && (
        <RouteComplete dispatch={dispatch} onClose={handleRouteClose} />
      )}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(250,245,238,0.09)',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(250,245,238,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoText: { color: D.text, fontSize: 17, fontFamily: SANS_B, letterSpacing: -0.3 },
  driverChip: {
    backgroundColor: D.surf3,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 90,
  },
  driverChipText: { color: D.dim, fontSize: 13, fontFamily: SANS_M },
});
