import {
  View, Text, StyleSheet, useColorScheme,
  TouchableOpacity, ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo, useEffect } from 'react';
import { getColors, getInitials, F } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import { useChats } from '../../context/chats';
import { fetchCategories, fetchCustomerAddresses, createOrder, fetchProgressiveDiscount, type CatalogProduct, type DeliveryAddress, type ProgressiveDiscount } from '../../lib/api';
import { mapCategories, setCatalogCache, fmtCents } from '../../lib/catalogUtils';
import { subscribeDraftItem } from '../../lib/draftEvents';
import { subscribeNewAddress } from '../../lib/addressEvents';

// ─── Helpers ──────────────────────────────────────────────────
function formatPhone(raw: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+55') || (digits.startsWith('55') && digits.length >= 12)) {
    const d = digits.startsWith('55') ? digits.slice(2) : digits;
    if (d.length === 11) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (raw.startsWith('+1') || (digits.startsWith('1') && digits.length === 11)) {
    const d = digits.length === 11 ? digits.slice(1) : digits;
    if (d.length === 10) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (raw.startsWith('+44')) {
    const d = digits.slice(2);
    if (d.length === 10) return `+44 ${d.slice(0, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
  }
  if (raw.startsWith('+52')) {
    const d = digits.slice(2);
    if (d.length === 10) return `+52 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (raw.startsWith('+54')) {
    const d = digits.slice(2);
    if (d.length >= 10) return `+54 ${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return raw.startsWith('+') ? raw : `+${digits}`;
}

// ─── Draft types ──────────────────────────────────────────────
type DraftItem = {
  key: string;
  productId: string;
  quantity: number;
  modifierGroupItemIds: string[];
  comments: string | null;
  unitCents: number;
};

// ─── Screen ───────────────────────────────────────────────────
export default function ReviewOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const C = getColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const { token, businessId, branchId } = useAuth();
  const { chats, load, setChatsAndRef } = useChats();

  const chat = useMemo(() => chats.find(c => c.id === id), [chats, id]);
  const intent = chat?.orderIntent ?? null;
  const customerName = chat?.name ?? 'Customer';
  const phone = chat?.phone ?? null;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progressiveDiscount, setProgressiveDiscount] = useState<ProgressiveDiscount>(null);

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  useEffect(() => {
    if (!intent) return;
    setOrderType(intent.type === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY');
    setPaymentMethod(intent.paymentMethod === 'CARD' ? 'CARD' : 'CASH');
    setSelectedAddressId(intent.deliveryAddressId ?? null);
    if (intent.deliveryAddress) {
      setAddresses(prev =>
        prev.some(a => a.id === intent.deliveryAddress!.id)
          ? prev
          : [intent.deliveryAddress!, ...prev],
      );
    }
    setDraftItems(intent.orderProducts.map((op, i) => ({
      key: `${op.productId}-${i}`,
      productId: op.productId,
      quantity: op.quantity,
      modifierGroupItemIds: op.modifierGroupItemIds,
      comments: op.comments,
      unitCents: op.amount != null ? Math.round(op.amount / Math.max(1, op.quantity)) : 0,
    })));
  }, [intent?.id]);

  useEffect(() => {
    if (!token || products.length > 0) return;
    setLoadingCatalog(true);
    fetchCategories(token, businessId)
      .then(res => { const data = mapCategories(res); setCatalogCache(data); setProducts(data.products); })
      .catch(() => {})
      .finally(() => setLoadingCatalog(false));
  }, [token, businessId]);

  useEffect(() => {
    if (products.length === 0) return;
    setDraftItems(prev => prev.map(item => {
      if (item.unitCents !== 0) return item;
      const p = productMap.get(item.productId);
      return p ? { ...item, unitCents: p.price ?? 0 } : item;
    }));
  }, [productMap]);

  useEffect(() => {
    return subscribeDraftItem(payload => {
      setDraftItems(prev => [...prev, { ...payload, key: `add-${Date.now()}` }]);
    });
  }, []);

  useEffect(() => {
    return subscribeNewAddress(addr => {
      setAddresses(prev => prev.some(a => a.id === addr.id) ? prev : [addr, ...prev]);
      setSelectedAddressId(addr.id);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchProgressiveDiscount(token, businessId).then(setProgressiveDiscount).catch(() => {});
  }, [token, businessId]);

  useEffect(() => {
    if (!token || !phone) return;
    setLoadingAddresses(true);
    fetchCustomerAddresses(token, businessId, phone)
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [token, businessId, phone]);

  const selectedAddress = useMemo(
    () => addresses.find(a => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  if (!intent) {
    router.back();
    return null;
  }

  const subtotalCents = draftItems.reduce((s, item) => s + item.unitCents * item.quantity, 0);
  const cardBg = C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paper;

  const activeDiscountStep = progressiveDiscount?.steps
    .filter(s => (s.amount ?? 0) <= subtotalCents)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
  const discountCents = activeDiscountStep
    ? Math.round(subtotalCents * (activeDiscountStep.discount ?? 0) / 100)
    : 0;
  const deliveryFeeCents = orderType === 'DELIVERY' ? (selectedAddress?.deliveryFee ?? 0) : 0;
  const taxCents = Math.round((subtotalCents - discountCents) * 0.065);
  const totalCents = (subtotalCents - discountCents) + deliveryFeeCents + taxCents;

  async function handleCreateOrder() {
    if (!token || !intent || submitting) return;
    setSubmitting(true);
    try {
      const items = draftItems.map((item, idx) => {
        const product = productMap.get(item.productId);
        const modifiers = item.modifierGroupItemIds.map(itemId => {
          const group = product?.modifierGroups.find(g => g.items.some(i => i.id === itemId));
          return group ? { modifierId: group.id, modifierItemId: itemId } : null;
        }).filter((m): m is { modifierId: string; modifierItemId: string } => m !== null);
        return {
          cartId: `item-${idx}`,
          productId: item.productId,
          quantity: item.quantity,
          ...(item.comments ? { description: item.comments } : {}),
          modifiers,
        };
      });
      await createOrder(token, businessId, {
        cart: { items },
        customerId: intent.customerId,
        orderType,
        paymentMethod,
        addressId: orderType === 'DELIVERY' ? selectedAddressId : null,
        language: intent.language ?? undefined,
        branchId: branchId ?? null,
        orderIntentId: intent.id,
      });
      setChatsAndRef(prev => prev.map(c => c.id === id ? { ...c, orderIntent: null } : c));
      load(true);
      router.back();
    } catch {
      // TODO: surface error to user
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <SafeAreaView style={[s.safeArea, { backgroundColor: C.cream }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[s.topBar, { backgroundColor: C.cream, borderBottomColor: C.hairline }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={[s.screenTitle, { color: C.ink, fontFamily: F.bold }]}>Review order</Text>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CUSTOMER */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>CUSTOMER</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.customerAvatar, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.10)' : C.paperSink }]}>
              <Text style={[s.customerAvatarText, { color: C.ink, fontFamily: F.semibold }]}>{getInitials(customerName)}</Text>
            </View>
            <View>
              <Text style={[s.customerName, { color: C.ink, fontFamily: F.semibold }]}>{customerName}</Text>
              <Text style={[s.customerSub, { color: C.muted, fontFamily: F.monoRegular }]}>
                WhatsApp{phone ? ` · ${formatPhone(phone)}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* TYPE */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>TYPE</Text>
        <View style={[s.typeToggle, { backgroundColor: cardBg, borderColor: C.hairline }]}>
          {(['DELIVERY', 'TAKEAWAY'] as const).map(t => {
            const active = orderType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[s.typeBtn, { backgroundColor: active ? C.cream : 'transparent' }, active && s.typeBtnActive]}
                onPress={() => setOrderType(t)}
                activeOpacity={0.8}
              >
                <Text style={[s.typeBtnLabel, { color: active ? C.ink : C.muted, fontFamily: F.semibold }]}>
                  {t === 'DELIVERY' ? 'Delivery' : 'Takeaway'}
                </Text>
                {!active && (
                  <Text style={[s.typeBtnSub, { color: C.faint, fontFamily: F.monoRegular }]}>
                    {t === 'DELIVERY' ? 'To customer' : 'Customer picks up'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DELIVERY ADDRESS */}
        {orderType === 'DELIVERY' && (
          <>
            <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>DELIVERY ADDRESS</Text>
            <TouchableOpacity
              style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline }]}
              onPress={() => setAddressSheetOpen(true)}
              activeOpacity={0.75}
            >
              {selectedAddress ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[s.addrIconWrap, { backgroundColor: C.orange + '22' }]}>
                    <Ionicons name="location" size={18} color={C.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.addrLabel, { color: C.ink, fontFamily: F.semibold }]}>{selectedAddress.number} {selectedAddress.street}, {selectedAddress.city}</Text>
                    <Text style={[s.addrLine, { color: C.muted, fontFamily: F.monoRegular }]} numberOfLines={1}>
                      {fmtCents(selectedAddress.deliveryFee)} delivery fee
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.faint} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="location-outline" size={18} color={C.faint} />
                  <Text style={[s.addrPlaceholder, { color: C.faint, fontFamily: F.regular }]}>Select delivery address</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.faint} style={{ marginLeft: 'auto' }} />
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* PAYMENT */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>PAYMENT</Text>
        <View style={[s.typeToggle, { backgroundColor: cardBg, borderColor: C.hairline }]}>
          {(['CASH', 'CARD'] as const).map(m => {
            const active = paymentMethod === m;
            return (
              <TouchableOpacity
                key={m}
                style={[s.typeBtn, { backgroundColor: active ? C.cream : 'transparent' }, active && s.typeBtnActive]}
                onPress={() => setPaymentMethod(m)}
                activeOpacity={0.8}
              >
                <Text style={[s.typeBtnLabel, { color: active ? C.ink : C.muted, fontFamily: F.semibold }]}>
                  {m === 'CASH' ? 'Cash' : 'Card'}
                </Text>
                {!active && (
                  <Text style={[s.typeBtnSub, { color: C.faint, fontFamily: F.monoRegular }]}>
                    {m === 'CASH' ? 'Pay on delivery' : 'Pay online'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ITEMS */}
        <View style={s.sectionRow}>
          <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold, marginBottom: 0 }]}>ITEMS</Text>
          {loadingCatalog && <ActivityIndicator size="small" color={C.orange} />}
        </View>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline, paddingVertical: 0 }]}>
          {draftItems.map((item, idx) => {
            const product = productMap.get(item.productId);
            const lineCents = item.unitCents * item.quantity;
            return (
              <View key={item.key}>
                <View style={s.itemRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.itemName, { color: C.ink, fontFamily: F.semibold }]} numberOfLines={1}>
                      {product?.name ?? item.productId.slice(0, 12) + '…'}
                    </Text>
                    {!!item.comments && (
                      <Text style={[s.itemComment, { color: C.muted, fontFamily: F.monoRegular }]} numberOfLines={1}>{item.comments}</Text>
                    )}
                    <Text style={[s.itemPriceRow, { color: C.faint, fontFamily: F.monoRegular }]}>
                      {fmtCents(item.unitCents)} each · {fmtCents(lineCents)} total
                    </Text>
                  </View>
                  <View style={{ gap: 8, alignItems: 'flex-end' }}>
                    <View style={s.stepper}>
                      <TouchableOpacity
                        style={[s.stepBtn, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.12)' : C.paperSink }]}
                        onPress={() => setDraftItems(prev => prev.map(i => i.key === item.key ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.stepText, { color: C.ink, fontFamily: F.semibold }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[s.stepQty, { color: C.ink, fontFamily: F.semibold }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[s.stepBtn, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.12)' : C.paperSink }]}
                        onPress={() => setDraftItems(prev => prev.map(i => i.key === item.key ? { ...i, quantity: i.quantity + 1 } : i))}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.stepText, { color: C.ink, fontFamily: F.semibold }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setDraftItems(prev => prev.filter(i => i.key !== item.key))} hitSlop={8} activeOpacity={0.7}>
                      <Text style={[s.removeText, { color: C.faint, fontFamily: F.monoSemibold }]}>REMOVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {idx < draftItems.length - 1 && <View style={[s.sep, { backgroundColor: C.hairlineSoft }]} />}
              </View>
            );
          })}
          {draftItems.length > 0 && <View style={[s.sep, { backgroundColor: C.hairlineSoft }]} />}
          <TouchableOpacity style={s.addItemRow} onPress={() => router.push('/chat/add-item')} activeOpacity={0.7}>
            <Ionicons name="add" size={16} color={C.muted} />
            <Text style={[s.addItemText, { color: C.muted, fontFamily: F.regular }]}>Add item from catalog</Text>
          </TouchableOpacity>
        </View>

        {/* TOTAL */}
        <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>TOTAL</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: C.hairline, marginBottom: 16 }]}>
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>Subtotal</Text>
            <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>{fmtCents(subtotalCents)}</Text>
          </View>
          {discountCents > 0 && (
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: C.orange, fontFamily: F.regular }]}>
                Discount ({activeDiscountStep?.discount}%)
              </Text>
              <Text style={[s.priceValue, { color: C.orange, fontFamily: F.monoRegular }]}>−{fmtCents(discountCents)}</Text>
            </View>
          )}
          {orderType === 'DELIVERY' && (
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>Delivery fee</Text>
              <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>
                {deliveryFeeCents > 0 ? fmtCents(deliveryFeeCents) : '—'}
              </Text>
            </View>
          )}
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { color: C.muted, fontFamily: F.regular }]}>Tax (6.5%)</Text>
            <Text style={[s.priceValue, { color: C.muted, fontFamily: F.monoRegular }]}>{fmtCents(taxCents)}</Text>
          </View>
          <View style={[s.totalRow, { borderTopColor: C.hairline }]}>
            <Text style={[s.totalLabel, { color: C.ink, fontFamily: F.semibold }]}>Total</Text>
            <Text style={[s.totalPrice, { color: C.ink, fontFamily: F.bold }]}>{fmtCents(totalCents)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[s.bottomBar, { borderTopColor: C.hairline, backgroundColor: C.cream, paddingBottom: insets.bottom + 8 }]}>
        {(() => {
          const blocked = submitting || (orderType === 'DELIVERY' && !selectedAddressId);
          return (
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: blocked ? C.faint : C.orange }]}
              activeOpacity={0.82}
              disabled={blocked}
              onPress={handleCreateOrder}
            >
              {submitting
                ? <ActivityIndicator color={C.cream} />
                : <Text style={[s.createBtnText, { color: C.cream, fontFamily: F.semibold }]}>
                    {orderType === 'DELIVERY' && !selectedAddressId ? 'Select a delivery address' : `Create order · ${fmtCents(totalCents)}`}
                  </Text>
              }
            </TouchableOpacity>
          );
        })()}
      </View>
    </SafeAreaView>

    {/* ── Address selector sheet ── */}
    <Modal
      visible={addressSheetOpen}
      onRequestClose={() => setAddressSheetOpen(false)}
      presentationStyle="pageSheet"
      animationType="slide"
    >
      <SafeAreaView style={[s.safeArea, { backgroundColor: C.cream }]} edges={['bottom']}>
        <View style={s.grabberRow}>
          <View style={[s.grabber, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.25)' : 'rgba(22,18,15,0.18)' }]} />
        </View>
        <View style={s.addrSheetHeader}>
          <Text style={[s.addrSheetTitle, { color: C.ink, fontFamily: F.bold }]}>Delivery address</Text>
          <TouchableOpacity onPress={() => setAddressSheetOpen(false)} hitSlop={12}>
            <Text style={[s.addrDoneBtn, { color: C.orange, fontFamily: F.monoSemibold }]}>DONE</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.addrList} showsVerticalScrollIndicator={false}>
          {loadingAddresses ? (
            <ActivityIndicator color={C.orange} style={{ marginTop: 32 }} />
          ) : addresses.length === 0 ? (
            <Text style={[s.addrEmpty, { color: C.faint, fontFamily: F.monoRegular }]}>No saved addresses</Text>
          ) : (
            addresses.map(addr => {
              const selected = addr.id === selectedAddressId;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[s.addrCard, { backgroundColor: cardBg, borderColor: selected ? C.orange : C.hairline }]}
                  onPress={() => { setSelectedAddressId(addr.id); setAddressSheetOpen(false); }}
                  activeOpacity={0.75}
                >
                  <View style={[s.addrRadio, { borderColor: selected ? C.orange : C.hairline }]}>
                    {selected && <View style={[s.addrRadioInner, { backgroundColor: C.orange }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.addrLabel, { color: C.ink, fontFamily: F.semibold }]} numberOfLines={1}>
                      {addr.number} {addr.street}, {addr.city}
                    </Text>
                    {addr.complement && <Text style={[s.addrLine, { color: C.muted, fontFamily: F.regular }]}>{addr.complement}</Text>}
                    {addr.numberComplement && <Text style={[s.addrLine, { color: C.muted, fontFamily: F.regular }]}>{addr.numberComplement}</Text>}
                    <Text style={[s.addrNote, { color: C.orange, fontFamily: F.monoRegular }]}>
                      {fmtCents(addr.deliveryFee)} delivery fee
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[s.addrAddNew, { borderColor: C.orange }]}
            activeOpacity={0.75}
            onPress={() => {
              setAddressSheetOpen(false);
              router.push(`/chat/add-address?customerId=${intent.customerId}`);
            }}
          >
            <View style={[s.addrAddIcon, { backgroundColor: C.orange + '22' }]}>
              <Ionicons name="add" size={18} color={C.orange} />
            </View>
            <Text style={[s.addrAddText, { color: C.orange, fontFamily: F.semibold }]}>Add new address</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 2, flexShrink: 0 },
  screenTitle: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },

  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
    includeFontPadding: false, marginBottom: 8,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },

  customerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  customerAvatarText: { fontSize: 14, letterSpacing: -0.2, includeFontPadding: false },
  customerName: { fontSize: 15, letterSpacing: -0.2, includeFontPadding: false },
  customerSub: { fontSize: 12, letterSpacing: 0.2, marginTop: 2, includeFontPadding: false },

  typeToggle: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 4, gap: 4, marginBottom: 16,
  },
  typeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, gap: 2,
  },
  typeBtnActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  typeBtnLabel: { fontSize: 14, letterSpacing: -0.1, includeFontPadding: false },
  typeBtnSub: { fontSize: 10, letterSpacing: 0.2, includeFontPadding: false },

  addrIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addrLabel: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
  addrLine: { fontSize: 13, letterSpacing: -0.1, marginTop: 2, includeFontPadding: false },
  addrNote: { fontSize: 11.5, letterSpacing: 0.2, marginTop: 2, includeFontPadding: false },
  addrPlaceholder: { fontSize: 14, letterSpacing: -0.1, includeFontPadding: false },

  grabberRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  addrSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
  },
  addrSheetTitle: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },
  addrDoneBtn: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },
  addrList: { paddingHorizontal: 16, paddingBottom: 32 },
  addrEmpty: { textAlign: 'center', fontSize: 13, letterSpacing: 0.2, marginTop: 32, includeFontPadding: false },
  addrCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
  },
  addrRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  addrRadioInner: { width: 10, height: 10, borderRadius: 5 },
  addrAddNew: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14, marginTop: 4,
  },
  addrAddIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addrAddText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  itemName: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
  itemComment: { fontSize: 12, letterSpacing: 0.2, includeFontPadding: false },
  itemPriceRow: { fontSize: 12, letterSpacing: 0.2, marginTop: 2, includeFontPadding: false },
  sep: { height: StyleSheet.hairlineWidth },
  removeText: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', includeFontPadding: false },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addItemText: { fontSize: 14, letterSpacing: -0.1, includeFontPadding: false },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, lineHeight: 22, includeFontPadding: false },
  stepQty: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false, minWidth: 22, textAlign: 'center' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 13.5, letterSpacing: -0.1, includeFontPadding: false },
  priceValue: { fontSize: 13.5, letterSpacing: 0, includeFontPadding: false },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, marginTop: 6, paddingTop: 12,
  },
  totalLabel: { fontSize: 16, letterSpacing: -0.2, includeFontPadding: false },
  totalPrice: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },

  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  createBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },
});
