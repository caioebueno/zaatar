import {
  View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { getColors, getInitials, F } from '../../constants/Colors';
import { useChats } from '../../context/chats';

function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function fmtHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function relativeOrderTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const C = getColors(useColorScheme());
  const { chats } = useChats();

  const order = useMemo(() => chats.find(c => c.id === id)?.order ?? null, [chats, id]);

  if (!order) {
    router.back();
    return null;
  }

  const cardBg = C.mode === 'dark' ? 'rgba(250,245,238,0.05)' : C.paper;
  const heroBg = C.mode === 'dark' ? 'rgba(250,245,238,0.07)' : C.paperSink;
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const orderNum = order.number ?? order.id.slice(0, 6);

  const sc = (() => {
    if (order.canceled) return { label: 'Canceled', bg: C.needsBg, fg: C.needsFg, dot: C.needs };
    const s = order.status.toLowerCase();
    if (s === 'delivered') return { label: 'Delivered', bg: C.liveBg, fg: C.liveFg, dot: C.live };
    if (s === 'en_route' || s === 'in_transit') return { label: 'On the way', bg: C.liveBg, fg: C.liveFg, dot: C.live };
    if (s === 'preparing' || s === 'accepted') return {
      label: capitalize(s),
      bg: C.mode === 'dark' ? 'rgba(255,90,53,0.10)' : 'rgba(255,61,20,0.08)',
      fg: C.orange, dot: C.orange,
    };
    if (s === 'placed' || s === 'pending') return {
      label: capitalize(s),
      bg: C.mode === 'dark' ? 'rgba(245,197,35,0.18)' : 'rgba(200,160,20,0.10)',
      fg: C.mode === 'dark' ? '#f5c523' : '#7a6000',
      dot: C.mode === 'dark' ? '#f5c523' : '#c8a000',
    };
    return { label: capitalize(order.status) || 'Pending', bg: C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink, fg: C.muted, dot: C.muted };
  })();

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: C.cream }]} edges={['bottom']}>
      {/* Grabber */}
      <View style={s.grabberRow}>
        <View style={[s.grabber, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.25)' : 'rgba(22,18,15,0.18)' }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTitle}>
          <Text style={[s.headerOrder, { color: C.ink, fontFamily: F.bold }]}>Order</Text>
          <Text style={[s.headerNum, { color: C.muted, fontFamily: F.monoMedium }]}>#{orderNum}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <Text style={[s.doneBtn, { color: C.muted, fontFamily: F.monoSemibold }]}>DONE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Status hero ── */}
        <View style={[s.heroCard, { backgroundColor: heroBg, borderColor: C.hairline }]}>
          <View style={s.heroLeft}>
            <View style={s.heroStatusRow}>
              <View style={[s.heroDot, { backgroundColor: sc.dot }]} />
              <Text style={[s.heroStatusText, { color: sc.fg, fontFamily: F.semibold }]}>{sc.label}</Text>
            </View>
            <Text style={[s.heroSub, { color: C.muted, fontFamily: F.monoRegular }]}>
              {capitalize(order.status)} {fmtHHMM(order.createdAt)} · {relativeOrderTime(order.createdAt)}
            </Text>
          </View>
          <View style={s.heroRight}>
            <Text style={[s.heroType, { color: C.faint, fontFamily: F.monoSemibold }]}>
              {order.orderType.toUpperCase()}
            </Text>
            <Text style={[s.heroPrice, { color: C.ink, fontFamily: F.bold }]}>
              {fmtCents(order.totalCents)}
            </Text>
          </View>
        </View>

        {/* ── Customer ── */}
        {!!order.customer.name && (
          <>
            <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>CUSTOMER</Text>
            <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline }]}>
              <View style={s.customerRow}>
                <View style={[s.customerAvatar, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.10)' : C.paperSink }]}>
                  <Text style={[s.customerAvatarText, { color: C.ink, fontFamily: F.semibold }]}>
                    {getInitials(order.customer.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.customerName, { color: C.ink, fontFamily: F.semibold }]}>{order.customer.name}</Text>
                  {!!order.customer.phone && (
                    <Text style={[s.customerPhone, { color: C.muted, fontFamily: F.monoRegular }]}>{order.customer.phone}</Text>
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── Items ── */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>ITEMS · {totalQty}</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline }]}>
          {order.items.map((item, i) => (
            <View key={i}>
              <View style={s.itemRow}>
                <View style={[s.itemQtyBadge, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.10)' : C.paperSink }]}>
                  <Text style={[s.itemQtyNum, { color: C.ink2, fontFamily: F.monoSemibold }]}>{item.quantity}</Text>
                  <Text style={[s.itemQtyX, { color: C.faint, fontFamily: F.monoRegular }]}>×</Text>
                </View>
                <Text style={[s.itemName, { color: C.ink, fontFamily: F.regular }]} numberOfLines={2}>{item.productName}</Text>
                <Text style={[s.itemPrice, { color: C.ink, fontFamily: F.monoMedium }]}>{fmtCents(item.lineTotalCents)}</Text>
              </View>
              {i < order.items.length - 1 && <View style={[s.itemSep, { backgroundColor: C.hairlineSoft }]} />}
            </View>
          ))}
        </View>

        {/* ── Total ── */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>TOTAL</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline }]}>
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>Subtotal</Text>
            <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>{fmtCents(order.subtotalCents)}</Text>
          </View>
          {order.deliveryFeeCents > 0 && (
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>Delivery fee</Text>
              <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>{fmtCents(order.deliveryFeeCents)}</Text>
            </View>
          )}
          {order.tipAmountCents > 0 && (
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>
                Tip{order.tipPercent > 0 ? ` (${order.tipPercent}%)` : ''}
              </Text>
              <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>{fmtCents(order.tipAmountCents)}</Text>
            </View>
          )}
          <View style={[s.totalRow, { borderTopColor: C.hairline }]}>
            <Text style={[s.totalLabel, { color: C.ink, fontFamily: F.semibold }]}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.totalBigPrice, { color: C.ink, fontFamily: F.bold }]}>{fmtCents(order.totalCents)}</Text>
              <Text style={[s.paidBy, { color: C.muted, fontFamily: F.monoRegular }]}>
                Paid by {capitalize(order.paymentMethod)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: cardBg, borderColor: C.hairline }]} activeOpacity={0.7}>
            <Text style={[s.actionText, { color: C.ink, fontFamily: F.semibold }]}>Open in POS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: cardBg, borderColor: C.hairline }]} activeOpacity={0.7}>
            <Text style={[s.actionText, { color: C.ink, fontFamily: F.semibold }]}>Share receipt</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={[s.footer, { color: C.faint, fontFamily: F.monoSemibold }]}>
          END OF ORDER #{orderNum}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  grabberRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  grabber: { width: 36, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  headerOrder: { fontSize: 26, letterSpacing: -0.6, includeFontPadding: false },
  headerNum: { fontSize: 16, letterSpacing: 0.2, includeFontPadding: false },
  doneBtn: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', includeFontPadding: false },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDot: { width: 10, height: 10, borderRadius: 5 },
  heroStatusText: { fontSize: 18, letterSpacing: -0.2, includeFontPadding: false },
  heroSub: { fontSize: 11, letterSpacing: 0.3, includeFontPadding: false },
  heroRight: { alignItems: 'flex-end', gap: 2 },
  heroType: { fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false },
  heroPrice: { fontSize: 26, letterSpacing: -0.5, includeFontPadding: false },

  sectionLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
    includeFontPadding: false, marginBottom: 8,
  },
  card: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { fontSize: 14, letterSpacing: -0.2, includeFontPadding: false },
  customerName: { fontSize: 15, letterSpacing: -0.2, includeFontPadding: false },
  customerPhone: { fontSize: 12, letterSpacing: 0.2, marginTop: 2, includeFontPadding: false },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemQtyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 1,
    width: 36, height: 36, borderRadius: 8, justifyContent: 'center',
  },
  itemQtyNum: { fontSize: 13, letterSpacing: 0, includeFontPadding: false },
  itemQtyX: { fontSize: 11, letterSpacing: 0, includeFontPadding: false },
  itemName: { flex: 1, fontSize: 14, lineHeight: 19, letterSpacing: -0.1 },
  itemPrice: { fontSize: 14, letterSpacing: 0, includeFontPadding: false },
  itemSep: { height: StyleSheet.hairlineWidth, marginLeft: 44 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 13.5, letterSpacing: -0.1, includeFontPadding: false },
  priceValue: { fontSize: 13.5, letterSpacing: 0, includeFontPadding: false },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, marginTop: 6, paddingTop: 12,
  },
  totalLabel: { fontSize: 16, letterSpacing: -0.2, includeFontPadding: false },
  totalBigPrice: { fontSize: 28, letterSpacing: -0.5, includeFontPadding: false },
  paidBy: { fontSize: 11, letterSpacing: 0.4, marginTop: 2, includeFontPadding: false },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 15, alignItems: 'center' },
  actionText: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },

  footer: {
    textAlign: 'center', fontSize: 10,
    letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false,
  },
});
