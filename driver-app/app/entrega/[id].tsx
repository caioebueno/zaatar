import React, { useState } from 'react';
import {
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

import { getSelectedEntrega } from '@/lib/entrega-store';
import { calculateOrderTotal } from '@/utils/orderTotal';
import type { DispatchEntity, DispatchOrder } from '@/lib/dispatch-api';

/* ── TOKENS (exact match from design) ───────────────────────── */
const D = {
  bg:     '#0a0807',
  surf:   '#181310',
  surf2:  '#1e1812',
  surf3:  '#2a211b',
  line:   'rgba(250,245,238,0.08)',
  lineS:  'rgba(250,245,238,0.13)',
  text:   '#faf5ee',
  dim:    'rgba(250,245,238,0.58)',
  faint:  'rgba(250,245,238,0.28)',
  vfaint: 'rgba(250,245,238,0.12)',
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
  const query   = encodeURIComponent(`${addr.street} ${addr.number}, ${addr.city}, ${addr.state}`);
  const ios     = `maps://maps.apple.com/?q=${query}`;
  const android = `geo:0,0?q=${query}`;
  Linking.openURL(Platform.OS === 'ios' ? ios : android)
    .catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  Linking.openURL(`https://wa.me/${cleaned}`);
}

function callPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

/* ── SINGLE-ORDER DETAIL (main design) ──────────────────────── */
function SingleOrderDetail({
  dispatch,
  order,
}: {
  dispatch: DispatchEntity;
  order: DispatchOrder;
}) {
  const [reopened, setReopened] = useState(false);

  const addr        = order.deliveryAddress;
  const customer    = order.customer;
  const phone       = customer?.phone ?? null;
  const paid        = !!order.paidAt;
  const amount      = calculateOrderTotal(order);
  const deliveredAt = order.deliveredAt ?? null;
  const startedAt   = dispatch.startedDeliveryAt ?? null;
  const placedAt    = order.createdAt;

  const actualMin = startedAt && deliveredAt ? formatDuration(startedAt, deliveredAt) : null;
  const etaMin    = dispatch.estimatedDeliveryDurationMinutes ?? order.estimatedDeliveryDurationMinutes ?? null;
  const delta     = actualMin !== null && etaMin !== null ? actualMin - etaMin : null;
  const isLate    = delta !== null && delta > 0;

  const prize = order.progressiveDiscountSnapshot?.selectedPrize ?? null;
  const prizeRows = prize
    ? prize.selectedProductCounts.map(pc => ({
        qty:  pc.quantity,
        name: prize.availableProducts.find(p => p.id === pc.productId)?.name ?? pc.productId,
      }))
    : [];

  const allItems: Array<{ qty: number; name: string }> = [
    ...order.orderProducts.map(op => ({ qty: op.quantity, name: op.product.name })),
    ...prizeRows,
  ];

  return (
    <>
      {/* ── Completed status + mistake-recovery hint ── */}
      <View style={[g.statusCard, { borderColor: 'rgba(52,211,154,0.22)' }]}>
        <View style={[g.statusRow, { backgroundColor: 'rgba(52,211,154,0.07)', borderBottomWidth: 1, borderBottomColor: D.line }]}>
          <View style={[g.statusIcon, { backgroundColor: 'rgba(52,211,154,0.14)', borderColor: 'rgba(52,211,154,0.28)' }]}>
            <Ionicons name="checkmark" size={16} color={D.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={g.statusTitle}>
              {reopened ? 'Entrega reaberta' : 'Marcada como entregue'}
            </Text>
            <Text style={g.statusSub}>
              {reopened
                ? 'de volta na sua rota ativa'
                : deliveredAt ? `Hoje · às ${formatTime(deliveredAt)}` : '—'
              }
            </Text>
          </View>
        </View>
        {!reopened && (
          <View style={g.hintRow}>
            <Ionicons name="warning-outline" size={15} color={D.amber} style={{ marginTop: 1 }} />
            <Text style={g.hintText}>
              Marcou por engano? Use as informações abaixo para concluir a entrega e reabra o pedido se ele ainda não saiu.
            </Text>
          </View>
        )}
      </View>

      {/* ── Customer ── */}
      <View>
        <Text style={g.sectionLabel}>Cliente</Text>
        <Text style={g.bigName}>{customer?.name ?? 'Cliente'}</Text>
        {phone && <Text style={g.phoneText}>{phone}</Text>}
      </View>

      {/* ── Call + WhatsApp ── */}
      {phone && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={g.callBtn} onPress={() => callPhone(phone)} activeOpacity={0.85}>
            <Ionicons name="call" size={17} color="#fff" />
            <Text style={g.callBtnText}>Ligar para o cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={g.waBtn}
            onPress={() => openWhatsApp(phone)}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={21} color={D.green} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Full address ── */}
      {addr && (
        <TouchableOpacity onPress={() => openMaps(addr)} activeOpacity={0.85} style={g.addrCard}>
          <View style={g.addrBody}>
            <View style={g.addrIconWrap}>
              <Ionicons name="location" size={16} color={D.zippy} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={g.sectionLabel}>Endereço completo</Text>
              <Text style={g.addrMain}>
                {addr.street}, {addr.number}
                {addr.numberComplement ? ` / ${addr.numberComplement}` : ''}
              </Text>
              {addr.complement ? (
                <Text style={g.addrComplement}>{addr.complement}</Text>
              ) : null}
              <View style={g.addrMeta}>
                <Text style={g.addrMetaText}>{addr.city}, {addr.state}</Text>
                {allItems.length > 0 && (
                  <>
                    <View style={g.metaDot} />
                    <Text style={g.addrMetaText}>
                      {allItems.reduce((s, i) => s + i.qty, 0)} {allItems.reduce((s, i) => s + i.qty, 0) === 1 ? 'item' : 'itens'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <View style={g.addrFooter}>
            <Ionicons name="navigate" size={15} color={D.zippy} />
            <Text style={g.addrFooterText}>Abrir no mapa</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Timeline ── */}
      <View style={g.card}>
        <Text style={[g.sectionLabel, { marginBottom: 13 }]}>Linha do tempo</Text>
        {[
          { label: 'Pedido recebido',       value: formatTime(placedAt),              dot: 'rgba(250,245,238,0.30)', color: D.dim,   last: !deliveredAt },
          deliveredAt ? { label: 'Marcado como entregue', value: formatTime(deliveredAt), dot: D.green, color: D.green, last: true } : null,
        ].filter(Boolean).map((row, i) => row && (
          <View key={i} style={{ flexDirection: 'row', gap: 11 }}>
            <View style={{ alignItems: 'center', flexShrink: 0 }}>
              <View style={[g.timelineDot, { backgroundColor: row.dot }]} />
              {!row.last && <View style={g.timelineLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: row.last ? 0 : 12 }}>
              <Text style={g.timelineLabel}>{row.label}</Text>
              <Text style={[g.timelineValue, { color: row.color }]}>{row.value}</Text>
            </View>
          </View>
        ))}
        {/* Stats pills */}
        {(actualMin !== null || etaMin !== null) && (
          <View style={[g.pillRow, { marginTop: 8 }]}>
            {actualMin !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>Duração</Text>
                <Text style={g.pillValue}>{actualMin} min</Text>
              </View>
            )}
            {etaMin !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>ETA</Text>
                <Text style={[g.pillValue, { color: D.dim }]}>{etaMin} min</Text>
              </View>
            )}
            {delta !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>{isLate ? 'Atrasada' : 'No prazo'}</Text>
                <Text style={[g.pillValue, { color: isLate ? D.amber : D.green }]}>
                  {delta > 0 ? `+${delta}m` : delta < 0 ? `${delta}m` : '0m'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Order items + total ── */}
      <View style={[g.card, { padding: 0, overflow: 'hidden' }]}>
        <View style={g.itemsHeader}>
          <Text style={g.itemsHeaderText}>Itens do pedido</Text>
          <View style={g.itemsCountBadge}>
            <Text style={g.itemsCountText}>{allItems.length}</Text>
          </View>
        </View>
        {allItems.map((item, i) => (
          <View
            key={i}
            style={[g.itemRow, i < allItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: D.line }]}
          >
            <View style={g.qtyBadge}>
              <Text style={g.qtyText}>{item.qty}×</Text>
            </View>
            <Text style={g.itemName}>{item.name}</Text>
          </View>
        ))}
        <View style={g.totalRow}>
          <View>
            <Text style={g.totalMethod}>Total · {paymentLabel(order.paymentMethod)}</Text>
            <Text style={g.totalAmount}>R$ {(amount / 100).toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={[g.paidBadge, {
            backgroundColor: paid ? 'rgba(52,211,154,0.12)' : 'rgba(242,179,56,0.12)',
            borderColor:     paid ? 'rgba(52,211,154,0.24)' : 'rgba(242,179,56,0.24)',
          }]}>
            <View style={[g.paidDot, { backgroundColor: paid ? D.green : D.amber }]} />
            <Text style={[g.paidText, { color: paid ? D.green : D.amber }]}>
              {paid ? 'Pago' : 'A cobrar'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Reopen action ── */}
      <View>
        <TouchableOpacity
          onPress={() => setReopened(true)}
          disabled={reopened}
          activeOpacity={0.85}
          style={[g.reopenBtn, reopened && g.reopenBtnDone]}
        >
          <Ionicons
            name={reopened ? 'checkmark' : 'arrow-undo'}
            size={16}
            color={reopened ? D.green : D.text}
          />
          <Text style={[g.reopenBtnText, { color: reopened ? D.green : D.text }]}>
            {reopened ? 'Entrega reaberta na rota' : 'Reabrir entrega'}
          </Text>
        </TouchableOpacity>
        <Text style={g.reopenHint}>
          {reopened
            ? 'O pedido voltou para a sua lista de entregas ativas.'
            : 'Marcou como entregue sem querer? Reabra para devolvê-la à sua rota.'
          }
        </Text>
      </View>
    </>
  );
}

/* ── MULTI-ORDER DETAIL ──────────────────────────────────────── */
function MultiOrderDetail({
  dispatch,
  orders,
}: {
  dispatch: DispatchEntity;
  orders: DispatchOrder[];
}) {
  const startedAt = dispatch.startedDeliveryAt ?? null;
  const lastDeliveredAt = orders.reduce<string | null>((max, o) => {
    if (!o.deliveredAt) return max;
    return !max || o.deliveredAt > max ? o.deliveredAt : max;
  }, null);
  const totalCents     = orders.reduce((s, o) => s + calculateOrderTotal(o), 0);
  const deliveredCount = orders.filter(o => !!o.deliveredAt).length;
  const allDone        = deliveredCount === orders.length;

  const actualMin = startedAt && lastDeliveredAt ? formatDuration(startedAt, lastDeliveredAt) : null;
  const etaMin    = dispatch.estimatedDeliveryDurationMinutes ?? null;
  const delta     = actualMin !== null && etaMin !== null ? actualMin - etaMin : null;
  const isLate    = delta !== null && delta > 0;

  return (
    <>
      {/* ── Status card ── */}
      <View style={[g.statusCard, { borderColor: allDone ? 'rgba(52,211,154,0.22)' : 'rgba(242,179,56,0.22)' }]}>
        <View style={[g.statusRow, {
          backgroundColor: allDone ? 'rgba(52,211,154,0.07)' : 'rgba(242,179,56,0.07)',
          borderRadius: 14,
        }]}>
          <View style={[g.statusIcon, {
            backgroundColor: allDone ? 'rgba(52,211,154,0.14)' : 'rgba(242,179,56,0.14)',
            borderColor:     allDone ? 'rgba(52,211,154,0.28)' : 'rgba(242,179,56,0.28)',
          }]}>
            <Ionicons name={allDone ? 'checkmark' : 'time-outline'} size={16} color={allDone ? D.green : D.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={g.statusTitle}>
              {allDone ? 'Rota concluída' : `${deliveredCount}/${orders.length} entregues`}
            </Text>
            <Text style={g.statusSub}>
              {lastDeliveredAt
                ? `Última às ${formatTime(lastDeliveredAt)}`
                : startedAt ? `Saída às ${formatTime(startedAt)}` : '—'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* ── Timeline stats ── */}
      {(actualMin !== null || etaMin !== null) && (
        <View style={g.card}>
          <Text style={[g.sectionLabel, { marginBottom: 13 }]}>Linha do tempo</Text>
          {startedAt && (
            <View style={{ flexDirection: 'row', gap: 11, marginBottom: lastDeliveredAt ? 0 : 0 }}>
              <View style={{ alignItems: 'center', flexShrink: 0 }}>
                <View style={[g.timelineDot, { backgroundColor: 'rgba(250,245,238,0.30)' }]} />
                {lastDeliveredAt && <View style={g.timelineLine} />}
              </View>
              <View style={{ flex: 1, paddingBottom: lastDeliveredAt ? 12 : 0 }}>
                <Text style={g.timelineLabel}>Saída para entregas</Text>
                <Text style={[g.timelineValue, { color: D.dim }]}>{formatTime(startedAt)}</Text>
              </View>
            </View>
          )}
          {lastDeliveredAt && (
            <View style={{ flexDirection: 'row', gap: 11 }}>
              <View style={{ alignItems: 'center', flexShrink: 0 }}>
                <View style={[g.timelineDot, { backgroundColor: D.green }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={g.timelineLabel}>Última entrega</Text>
                <Text style={[g.timelineValue, { color: D.green }]}>{formatTime(lastDeliveredAt)}</Text>
              </View>
            </View>
          )}
          <View style={[g.pillRow, { marginTop: 8 }]}>
            {actualMin !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>Duração</Text>
                <Text style={g.pillValue}>{actualMin} min</Text>
              </View>
            )}
            {etaMin !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>ETA</Text>
                <Text style={[g.pillValue, { color: D.dim }]}>{etaMin} min</Text>
              </View>
            )}
            {delta !== null && (
              <View style={g.pill}>
                <Text style={g.pillLabel}>{isLate ? 'Atrasada' : 'No prazo'}</Text>
                <Text style={[g.pillValue, { color: isLate ? D.amber : D.green }]}>
                  {delta > 0 ? `+${delta}m` : delta < 0 ? `${delta}m` : '0m'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Order cards ── */}
      {orders.map((order, i) => (
        <MultiOrderCard key={order.id} order={order} index={i} startedAt={startedAt} />
      ))}

      {/* ── Route total ── */}
      <View style={[g.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View>
          <Text style={g.sectionLabel}>Total da rota</Text>
          <Text style={g.totalAmount}>R$ {(totalCents / 100).toFixed(2).replace('.', ',')}</Text>
        </View>
        <Text style={[g.pillValue, { color: D.faint, fontSize: 13 }]}>{orders.length} pedidos</Text>
      </View>
    </>
  );
}

/* ── ORDER CARD (multi-order view) ──────────────────────────── */
function MultiOrderCard({
  order,
  index,
  startedAt,
}: {
  order: DispatchOrder;
  index: number;
  startedAt: string | null | undefined;
}) {
  const addr        = order.deliveryAddress;
  const paid        = !!order.paidAt;
  const amount      = calculateOrderTotal(order);
  const deliveredAt = order.deliveredAt ?? null;
  const phone       = order.customer?.phone ?? null;

  const prize = order.progressiveDiscountSnapshot?.selectedPrize ?? null;
  const prizeRows = prize
    ? prize.selectedProductCounts.map(pc => ({
        qty:  pc.quantity,
        name: prize.availableProducts.find(p => p.id === pc.productId)?.name ?? pc.productId,
      }))
    : [];

  const allItems: Array<{ qty: number; name: string }> = [
    ...order.orderProducts.map(op => ({ qty: op.quantity, name: op.product.name })),
    ...prizeRows,
  ];

  return (
    <View style={[g.card, { padding: 0, overflow: 'hidden' }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, paddingBottom: 12 }}>
        <View style={g.indexBadge}>
          <Text style={g.indexNum}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontFamily: SANS_B, color: D.text, letterSpacing: -0.1 }} numberOfLines={1}>
            {order.customer?.name ?? 'Cliente'}
          </Text>
          {addr && (
            <Text style={{ fontSize: 11, fontFamily: SANS, color: D.faint, marginTop: 1 }}>
              {addr.street}, {addr.number}
              {addr.numberComplement ? ` / ${addr.numberComplement}` : ''}
              {addr.complement ? ` — ${addr.complement}` : ''}
            </Text>
          )}
        </View>
        {deliveredAt ? (
          <View style={g.deliveredBadge}>
            <Ionicons name="checkmark" size={11} color={D.green} />
            <Text style={[g.badgeText, { color: D.green }]}>Entregue</Text>
          </View>
        ) : (
          <View style={[g.deliveredBadge, { backgroundColor: 'rgba(242,179,56,0.10)', borderColor: 'rgba(242,179,56,0.22)' }]}>
            <Text style={[g.badgeText, { color: D.amber }]}>Pendente</Text>
          </View>
        )}
      </View>

      <View style={g.divider} />

      {/* Items */}
      <View style={{ gap: 5, padding: 14, paddingVertical: 10 }}>
        {allItems.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: MONO_B, fontSize: 11, color: D.faint, width: 26 }}>{item.qty}×</Text>
            <Text style={{ fontSize: 13, fontFamily: SANS_M, color: D.dim, flex: 1 }} numberOfLines={1}>{item.name}</Text>
          </View>
        ))}
      </View>

      <View style={g.divider} />

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingTop: 10 }}>
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: D.faint, letterSpacing: 0.4 }}>{paymentLabel(order.paymentMethod)} · {paid ? 'Pago' : 'A cobrar'}</Text>
          <Text style={{ fontSize: 17, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 }}>R$ {(amount / 100).toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {phone && (
            <TouchableOpacity style={g.iconBtn} onPress={() => callPhone(phone)} activeOpacity={0.8}>
              <Ionicons name="call-outline" size={15} color={D.dim} />
            </TouchableOpacity>
          )}
          {addr && (
            <TouchableOpacity style={g.iconBtn} onPress={() => openMaps(addr)} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={16} color={D.dim} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

/* ── ROOT SCREEN ─────────────────────────────────────────────── */
export default function EntregaDetailScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const dispatch = getSelectedEntrega();

  if (!dispatch) {
    return (
      <View style={[sc.screen, { paddingTop: insets.top }]}>
        <View style={sc.header}>
          <TouchableOpacity style={sc.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={16} color={D.dim} />
          </TouchableOpacity>
          <Text style={sc.headerTitle}>Detalhes da entrega</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: SANS, fontSize: 14, color: D.faint }}>Entrega não encontrada</Text>
        </View>
      </View>
    );
  }

  const sorted   = [...dispatch.orders].sort((a, b) => a.dispatchOrderIndex - b.dispatchOrderIndex);
  const isSingle = sorted.length === 1;
  const shortId  = dispatch.id.slice(-6).toUpperCase();

  return (
    <View style={[sc.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={sc.header}>
        <TouchableOpacity style={sc.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={sc.headerTitle}>Detalhes da entrega</Text>
        </View>
        <Text style={sc.headerId}>#{shortId}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[sc.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isSingle
          ? <SingleOrderDetail dispatch={dispatch} order={sorted[0]} />
          : <MultiOrderDetail dispatch={dispatch} orders={sorted} />
        }
      </ScrollView>
    </View>
  );
}

/* ── SHARED STYLES ───────────────────────────────────────────── */
const g = StyleSheet.create({
  /* status card */
  statusCard: {
    backgroundColor: D.surf, borderWidth: 1,
    borderRadius: 16, overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    padding: 12,
  },
  statusIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: { fontSize: 13.5, fontFamily: SANS_B, color: D.text, letterSpacing: -0.2 },
  statusSub:   { fontFamily: MONO, fontSize: 10, color: D.faint, letterSpacing: 0.4, marginTop: 2 },
  hintRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, paddingHorizontal: 15 },
  hintText:    { flex: 1, fontSize: 12, fontFamily: SANS, color: D.dim, lineHeight: 18 },

  /* typography */
  sectionLabel: { fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: D.faint, marginBottom: 5 },
  bigName:      { fontSize: 26, fontFamily: SANS_EB, color: D.text, letterSpacing: -1, lineHeight: 30, marginTop: 4 },
  phoneText:    { fontFamily: MONO, fontSize: 12.5, color: D.dim, letterSpacing: 0.1, marginTop: 3 },

  /* call/wa */
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    height: 52, borderRadius: 14, backgroundColor: D.zippy,
  },
  callBtnText: { fontSize: 15, fontFamily: SANS_B, color: '#fff', letterSpacing: -0.2 },
  waBtn: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    backgroundColor: D.surf3, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },

  /* address card */
  addrCard:      { backgroundColor: D.surf, borderWidth: 1, borderColor: D.line, borderRadius: 16, overflow: 'hidden' },
  addrBody:      { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13 },
  addrIconWrap: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    backgroundColor: 'rgba(255,61,20,0.11)', borderWidth: 1, borderColor: 'rgba(255,61,20,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  addrMain:       { fontSize: 14, fontFamily: SANS_B, color: D.text, lineHeight: 20, marginTop: 5 },
  addrComplement: { fontSize: 12, fontFamily: SANS, color: D.dim, lineHeight: 18, marginTop: 5 },
  addrMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  addrMetaText:   { fontFamily: MONO, fontSize: 11, color: D.faint },
  metaDot:        { width: 2, height: 2, borderRadius: 1, backgroundColor: D.faint },
  addrFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 11, borderTopWidth: 1, borderTopColor: D.line, backgroundColor: D.surf2,
  },
  addrFooterText: { fontSize: 13, fontFamily: SANS_B, color: D.zippy, letterSpacing: -0.1 },

  /* shared card */
  card: {
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    borderRadius: 16, padding: 15,
  },

  /* timeline */
  timelineDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  timelineLine:  { width: 2, flex: 1, minHeight: 20, backgroundColor: D.line, marginTop: 3, marginBottom: 3 },
  timelineLabel: { fontSize: 13, fontFamily: SANS_B, color: D.text },
  timelineValue: { fontFamily: MONO, fontSize: 11.5, marginTop: 2 },

  /* pills */
  pillRow:  { flexDirection: 'row', gap: 8 },
  pill:     { flex: 1, backgroundColor: D.surf2, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 },
  pillLabel:{ fontFamily: MONO_B, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  pillValue:{ fontSize: 13, fontFamily: SANS_B, color: D.text, letterSpacing: -0.2 },

  /* items list */
  itemsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: D.line,
  },
  itemsHeaderText: { fontSize: 12, fontFamily: SANS_B, color: D.dim, letterSpacing: -0.1 },
  itemsCountBadge: { backgroundColor: D.surf3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  itemsCountText:  { fontFamily: MONO_B, fontSize: 11, color: D.faint },
  itemRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 15 },
  qtyBadge: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    backgroundColor: 'rgba(255,61,20,0.10)', borderWidth: 1, borderColor: 'rgba(255,61,20,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText:  { fontFamily: MONO_B, fontSize: 11.5, color: D.zippy },
  itemName: { flex: 1, fontSize: 13.5, fontFamily: SANS_M, color: D.text },

  /* total row */
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, paddingHorizontal: 15,
    backgroundColor: D.surf2, borderTopWidth: 1, borderTopColor: D.line,
  },
  totalMethod: { fontFamily: MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: D.faint, marginBottom: 3 },
  totalAmount: { fontSize: 19, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },
  paidBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  paidDot:     { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  paidText:    { fontFamily: MONO_B, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase' },

  /* reopen */
  reopenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    height: 50, borderRadius: 14,
    backgroundColor: D.surf, borderWidth: 1.5, borderColor: D.lineS,
  },
  reopenBtnDone: { backgroundColor: 'rgba(52,211,154,0.10)', borderColor: 'rgba(52,211,154,0.32)' },
  reopenBtnText: { fontSize: 14, fontFamily: SANS_B, letterSpacing: -0.1 },
  reopenHint:    { fontSize: 11, fontFamily: SANS, color: D.faint, textAlign: 'center', lineHeight: 16, marginTop: 8 },

  /* multi-order */
  indexBadge: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    backgroundColor: D.surf3, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
  indexNum:       { fontFamily: MONO_B, fontSize: 13, color: D.faint },
  deliveredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,154,0.10)', borderWidth: 1, borderColor: 'rgba(52,211,154,0.22)',
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0,
  },
  badgeText: { fontFamily: MONO_B, fontSize: 10, letterSpacing: 0.4 },
  divider:   { height: 1, backgroundColor: D.line },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: D.surf2, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
});

const sc = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingBottom: 12, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: D.line,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },
  headerId:    { fontFamily: MONO_B, fontSize: 11, color: D.faint, letterSpacing: 0.6 },
  scroll:      { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
});
