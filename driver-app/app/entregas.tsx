import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { listDriverDispatches, DispatchEntity } from '@/lib/dispatch-api';

const D = {
  bg:     '#0a0807',
  surf:   '#181310',
  surf2:  '#1e1812',
  line:   'rgba(250,245,238,0.09)',
  text:   '#faf5ee',
  dim:    'rgba(250,245,238,0.68)',
  faint:  'rgba(250,245,238,0.48)',
  vfaint: 'rgba(250,245,238,0.28)',
  zippy:  '#ff3d14',
  green:  '#34d39a',
  amber:  '#f2b338',
};

const SANS   = 'Geist_400Regular';
const SANS_B = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO   = 'GeistMono_400Regular';
const MONO_B = 'GeistMono_700Bold';

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

function PastDeliveryRow({ delivery }: { delivery: PastDelivery }) {
  const isLate  = delivery.status === 'late';
  const actual  = delivery.actualMin ?? 0;
  const eta     = delivery.etaMin ?? actual;
  const delta   = actual - eta;
  const early   = delta < 0;
  const fillPct = Math.min(100, Math.round((actual / Math.max(eta, actual, 1)) * 100));
  const etaPct  = Math.round((eta / Math.max(eta, actual, 1)) * 100);

  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, isLate ? rowStyles.iconAmber : rowStyles.iconGreen]}>
        <Ionicons name={isLate ? 'time-outline' : 'checkmark-outline'} size={16} color={isLate ? D.amber : D.green} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text style={rowStyles.customer} numberOfLines={1}>
            {delivery.customer}{delivery.extraCount > 0 ? ` +${delivery.extraCount}` : ''}
          </Text>
          {delivery.actualMin !== null && (
            <View style={[rowStyles.badge, isLate ? rowStyles.badgeAmber : rowStyles.badgeGreen]}>
              <Text style={[rowStyles.badgeText, { color: isLate ? D.amber : D.green }]}>
                {actual}m {isLate ? `(+${delta}m)` : early ? `(${delta}m)` : '(no prazo)'}
              </Text>
            </View>
          )}
        </View>
        {delivery.actualMin !== null && (
          <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(250,245,238,0.06)', marginBottom: 5 }}>
            <View style={{ position: 'absolute', top: -2, bottom: -2, left: `${etaPct}%` as any, width: 1.5, borderRadius: 1, backgroundColor: 'rgba(250,245,238,0.25)' }} />
            <View style={{ height: '100%', borderRadius: 2, width: `${fillPct}%`, backgroundColor: isLate ? D.amber : early ? D.green : D.dim, opacity: 0.7 }} />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={rowStyles.address} numberOfLines={1}>{delivery.address}</Text>
          <Text style={rowStyles.time}>{delivery.etaMin !== null ? `ETA ${delivery.etaMin}m · ` : ''}{delivery.at}</Text>
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

const FILTERS = [
  { id: 'today', label: 'Hoje' },
  { id: 'week',  label: 'Semana' },
  { id: 'month', label: 'Mês' },
] as const;

export default function EntregasScreen() {
  const { token } = useAuth();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();

  const [filter,  setFilter]  = useState<'today' | 'week' | 'month'>('today');
  const [rows,    setRows]    = useState<PastDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const { start, end } = dateRangeFor(filter);
    listDriverDispatches(token, start, end)
      .then(dispatches => {
        const mapped = dispatches
          .map(mapDispatchToPast)
          .filter((d): d is PastDelivery => d !== null)
          .sort((a, b) => b.at.localeCompare(a.at));
        setRows(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, filter]);

  const withTime  = rows.filter(d => d.actualMin !== null);
  const avgActual = withTime.length
    ? Math.round(withTime.reduce((s, d) => s + d.actualMin!, 0) / withTime.length)
    : null;
  const avgEta = withTime.filter(d => d.etaMin !== null).length
    ? Math.round(withTime.filter(d => d.etaMin !== null).reduce((s, d) => s + d.etaMin!, 0) / withTime.filter(d => d.etaMin !== null).length)
    : null;
  const onTimePct = rows.length
    ? Math.round((rows.filter(d => d.status !== 'late').length / rows.length) * 100)
    : null;
  const fastest = withTime.length ? Math.min(...withTime.map(d => d.actualMin!)) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entregas</Text>
        <Text style={styles.headerCount}>{loading ? '…' : `${rows.length} registros`}</Text>
      </View>

      {/* Summary stats */}
      <View style={[styles.summaryCard, { marginHorizontal: 18, marginBottom: 14 }]}>
        {[
          { label: 'Tempo médio', value: avgActual !== null ? `${avgActual}m` : '—', sub: avgEta !== null ? `ETA ${avgEta}m` : '—', color: D.text },
          { label: 'No prazo',    value: onTimePct !== null ? `${onTimePct}%` : '—', sub: rows.length ? `${rows.filter(d => d.status !== 'late').length}/${rows.length}` : '—', color: onTimePct !== null ? (onTimePct >= 80 ? D.green : D.amber) : D.faint },
          { label: 'Mais rápida', value: fastest !== null ? `${fastest}m` : '—', sub: FILTERS.find(f => f.id === filter)?.label ?? '', color: D.dim },
        ].map(({ label, value, sub, color }, i) => (
          <View key={label} style={[{ flex: 1, alignItems: 'center' }, i > 0 && { borderLeftWidth: 1, borderLeftColor: D.line }]}>
            <Text style={[styles.summaryValue, { color }]}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summarySub}>{sub}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 18, gap: 6, marginBottom: 6 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterTab, filter === f.id && styles.filterTabActive]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, { color: filter === f.id ? '#fff' : D.dim }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <ActivityIndicator color={D.zippy} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 48, gap: 10 }}>
            <Ionicons name="bag-outline" size={36} color={D.faint} />
            <Text style={{ fontFamily: SANS, fontSize: 14, color: D.faint }}>Nenhuma entrega no período</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((d, i) => (
              <View key={d.id} style={i < rows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: D.line } : undefined}>
                <PastDeliveryRow delivery={d} />
              </View>
            ))}
            {avgActual !== null && (
              <View style={styles.avgFooter}>
                <Text style={styles.avgLabel}>Tempo médio</Text>
                <Text style={styles.avgValue}>{avgActual} min</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: D.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14, paddingTop: 8 },
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
