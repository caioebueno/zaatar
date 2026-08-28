import {
  View, Text, StyleSheet, useColorScheme,
  TouchableOpacity, FlatList, Modal, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo, useEffect } from 'react';
import { getColors, F } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import {
  fetchCategories,
  type CatalogProduct,
  type CatalogCategory,
  type CatalogModifierGroup,
} from '../../lib/api';
import { mapCategories, getCatalogCache, setCatalogCache, fmtCents } from '../../lib/catalogUtils';
import { emitAddItem } from '../../lib/draftEvents';

export default function AddItemScreen() {
  const router = useRouter();
  const C = getColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const { token, businessId } = useAuth();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [catId, setCatId] = useState('all');

  // Modifier drawer state
  const [customizeProduct, setCustomizeProduct] = useState<CatalogProduct | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!token) return;
    const cached = getCatalogCache();
    if (cached) {
      setProducts(cached.products);
      setCategories(cached.categories);
      return;
    }
    setLoading(true);
    fetchCategories(token, businessId)
      .then(res => {
        const data = mapCategories(res);
        setCatalogCache(data);
        setProducts(data.products);
        setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, businessId]);

  useEffect(() => {
    if (customizeProduct) { setSelectedIds([]); setQuantity(1); }
  }, [customizeProduct?.id]);

  const visibleProducts = useMemo(() => {
    let list = products.filter(p => p.visible !== false);
    if (catId !== 'all') list = list.filter(p => p.categoryIds.includes(catId) || p.categoryId === catId);
    return list;
  }, [products, catId]);

  const usedCatIds = new Set(products.flatMap(p => p.categoryIds.length ? p.categoryIds : p.categoryId ? [p.categoryId] : []));
  const visibleCats = categories.filter(c => usedCatIds.has(c.id));

  const cardBg = C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paper;

  function toggleItem(group: CatalogModifierGroup, itemId: string) {
    if (group.type === 'SINGLE') {
      setSelectedIds(prev => prev.filter(id => !group.items.some(i => i.id === id)).concat(itemId));
    } else {
      const max = group.maxSelection ?? Infinity;
      const groupSelected = selectedIds.filter(id => group.items.some(i => i.id === id));
      if (selectedIds.includes(itemId)) {
        setSelectedIds(prev => prev.filter(id => id !== itemId));
      } else if (groupSelected.length < max) {
        setSelectedIds(prev => [...prev, itemId]);
      }
    }
  }

  const unmetGroup = customizeProduct?.modifierGroups.find(g => {
    const min = g.minSelection ?? (g.required ? 1 : 0);
    return selectedIds.filter(id => g.items.some(i => i.id === id)).length < min;
  });
  const modifierTotal = selectedIds.reduce((sum, id) => {
    for (const g of customizeProduct?.modifierGroups ?? []) {
      const it = g.items.find(i => i.id === id);
      if (it?.price) return sum + it.price;
    }
    return sum;
  }, 0);
  const unitCents = (customizeProduct?.price ?? 0) + modifierTotal;
  const totalCents = unitCents * quantity;
  const hintText = unmetGroup
    ? `Pick ${(unmetGroup.minSelection ?? 1) - selectedIds.filter(id => unmetGroup.items.some(i => i.id === id)).length} more ${unmetGroup.title.toLowerCase()} to continue`
    : null;

  return (
    <>
      <SafeAreaView style={[s.safeArea, { backgroundColor: C.cream }]} edges={['top']}>
        <View style={[s.topBar, { backgroundColor: C.cream, borderBottomColor: C.hairline }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={[s.screenTitle, { color: C.ink, fontFamily: F.bold }]}>Add item</Text>
          {loading && <ActivityIndicator size="small" color={C.orange} style={{ marginLeft: 'auto' }} />}
        </View>

        <View style={{ flexShrink: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          {[{ id: 'all', name: 'All' }, ...visibleCats].map(cat => {
            const active = catId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCatId(cat.id)}
                style={[s.chip, { backgroundColor: active ? C.ink : 'transparent', borderColor: active ? C.ink : C.hairline }]}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, { color: active ? C.cream : C.ink2, fontFamily: F.medium }]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </View>

        <FlatList
          data={visibleProducts}
          keyExtractor={p => p.id}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          renderItem={({ item: product }) => {
            const photoUrl = product.photos[0]?.url;
            const hasModifiers = product.modifierGroups.length > 0;
            return (
              <TouchableOpacity
                style={[s.productRow, { backgroundColor: cardBg, borderColor: C.hairline }]}
                onPress={() => {
                  if (hasModifiers) {
                    setCustomizeProduct(product);
                  } else {
                    emitAddItem({ productId: product.id, quantity: 1, modifierGroupItemIds: [], comments: null, unitCents: product.price ?? 0 });
                    router.back();
                  }
                }}
                activeOpacity={0.75}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={s.productThumb} />
                ) : (
                  <View style={[s.productThumb, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.08)' : C.paperSink }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.productName, { color: C.ink, fontFamily: F.semibold }]}>{product.name}</Text>
                  <Text style={[s.productPrice, { color: C.muted, fontFamily: F.monoRegular }]}>
                    {hasModifiers ? `From ${fmtCents(product.price ?? 0)}` : fmtCents(product.price ?? 0)}
                  </Text>
                </View>
                {hasModifiers && (
                  <View style={[s.customizeBadge, { borderColor: C.orange }]}>
                    <Text style={[s.customizeBadgeText, { color: C.orange, fontFamily: F.monoSemibold }]}>CUSTOMIZE</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={15} color={C.faint} />
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>

      {/* ── Modifier drawer ──────────────────────────────────── */}
      <Modal
        visible={!!customizeProduct}
        onRequestClose={() => setCustomizeProduct(null)}
        presentationStyle="pageSheet"
        animationType="slide"
      >
        <SafeAreaView style={[s.safeArea, { backgroundColor: C.cream }]} edges={['bottom']}>
          <View style={s.grabberRow}>
            <View style={[s.grabber, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.25)' : 'rgba(22,18,15,0.18)' }]} />
          </View>
          <View style={s.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[s.sheetSuperLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>CUSTOMIZE</Text>
              <Text style={[s.sheetTitle, { color: C.ink, fontFamily: F.bold }]}>{customizeProduct?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setCustomizeProduct(null)} hitSlop={12}>
              <Text style={[s.cancelBtn, { color: C.muted, fontFamily: F.monoSemibold }]}>CANCEL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {customizeProduct?.modifierGroups.map(group => {
              const min = group.minSelection ?? (group.required ? 1 : 0);
              const max = group.maxSelection;
              const selCount = selectedIds.filter(id => group.items.some(i => i.id === id)).length;
              const countLabel = max ? `${selCount} of ${max}` : `${selCount}`;
              return (
                <View key={group.id} style={{ marginBottom: 24 }}>
                  <View style={s.modGroupHeader}>
                    <Text style={[s.modGroupTitle, { color: C.ink2, fontFamily: F.monoSemibold }]}>{group.title.toUpperCase()}</Text>
                    {(min > 0 || max) && (
                      <Text style={[s.modGroupCount, { color: C.faint, fontFamily: F.monoRegular }]}>{countLabel}</Text>
                    )}
                  </View>
                  {(group.description || (group.type === 'MULTI' && min > 0)) && (
                    <Text style={[s.modGroupHint, { color: C.faint, fontFamily: F.monoRegular }]}>
                      {group.description ?? (min === max ? `Pick exactly ${min}` : `Pick ${min}${max ? `–${max}` : '+'}`)}
                    </Text>
                  )}
                  <View style={[s.modGroupCard, { backgroundColor: cardBg, borderColor: C.hairline }]}>
                    {group.items.map((item, idx) => {
                      const checked = selectedIds.includes(item.id);
                      const isSingle = group.type === 'SINGLE';
                      return (
                        <View key={item.id}>
                          <TouchableOpacity style={s.modItemRow} onPress={() => toggleItem(group, item.id)} activeOpacity={0.7}>
                            <View style={[s.modCheckbox, isSingle ? s.modRadio : {}, { borderColor: checked ? C.orange : C.hairline, backgroundColor: checked ? C.orange : 'transparent' }]}>
                              {checked && <View style={[s.modCheckInner, isSingle ? s.modRadioInner : {}]} />}
                            </View>
                            <Text style={[s.modItemName, { color: C.ink, fontFamily: F.regular }]}>{item.name}</Text>
                            <Text style={[s.modItemPrice, { color: item.price ? C.orange : C.faint, fontFamily: F.monoRegular }]}>
                              {item.price ? `+${fmtCents(item.price)}` : '—'}
                            </Text>
                          </TouchableOpacity>
                          {idx < group.items.length - 1 && <View style={[s.modSep, { backgroundColor: C.hairlineSoft }]} />}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>QUANTITY</Text>
            <View style={[s.modGroupCard, { backgroundColor: cardBg, borderColor: C.hairline, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }]}>
              <Text style={[s.modItemName, { color: C.ink, fontFamily: F.regular }]}>How many</Text>
              <View style={s.stepper}>
                <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={[s.stepBtn, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.12)' : C.paperSink }]} activeOpacity={0.7}>
                  <Text style={[s.stepText, { color: C.ink, fontFamily: F.semibold }]}>−</Text>
                </TouchableOpacity>
                <Text style={[s.stepQty, { color: C.ink, fontFamily: F.semibold }]}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={[s.stepBtn, { backgroundColor: C.mode === 'dark' ? 'rgba(250,245,238,0.12)' : C.paperSink }]} activeOpacity={0.7}>
                  <Text style={[s.stepText, { color: C.ink, fontFamily: F.semibold }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={[s.bottomBar, { borderTopColor: C.hairline, backgroundColor: C.cream, paddingBottom: insets.bottom + 8 }]}>
            {hintText && <Text style={[s.hintText, { color: C.faint, fontFamily: F.monoRegular }]}>{hintText}</Text>}
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: unmetGroup ? C.hairline : C.orange, opacity: unmetGroup ? 0.5 : 1 }]}
              disabled={!!unmetGroup}
              activeOpacity={0.82}
              onPress={() => {
                if (!customizeProduct) return;
                emitAddItem({ productId: customizeProduct.id, quantity, modifierGroupItemIds: selectedIds, comments: null, unitCents });
                setCustomizeProduct(null);
                router.back();
              }}
            >
              <Text style={[s.createBtnText, { color: unmetGroup ? C.muted : C.cream, fontFamily: F.semibold }]}>
                Add to order · {fmtCents(totalCents)}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 2, flexShrink: 0 },
  screenTitle: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },

  chipRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  chip: { flexShrink: 0, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, lineHeight: 18 },

  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8,
  },
  productThumb: { width: 52, height: 52, borderRadius: 10 },
  productName: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
  productPrice: { fontSize: 12.5, letterSpacing: 0.1, marginTop: 3, includeFontPadding: false },
  customizeBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  customizeBadgeText: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },

  grabberRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
  },
  sheetSuperLabel: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false, marginBottom: 2 },
  sheetTitle: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },
  cancelBtn: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', includeFontPadding: false, marginBottom: 8 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, lineHeight: 22, includeFontPadding: false },
  stepQty: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false, minWidth: 22, textAlign: 'center' },

  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  hintText: { textAlign: 'center', fontSize: 12, letterSpacing: 0.2, includeFontPadding: false },
  createBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },

  modGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modGroupTitle: { fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false },
  modGroupCount: { fontSize: 10.5, letterSpacing: 0.4, includeFontPadding: false },
  modGroupHint: { fontSize: 11, letterSpacing: 0.4, marginBottom: 6, includeFontPadding: false },
  modGroupCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  modItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  modCheckbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modRadio: { borderRadius: 10 },
  modCheckInner: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#fff' },
  modRadioInner: { borderRadius: 5 },
  modItemName: { flex: 1, fontSize: 14, letterSpacing: -0.1, includeFontPadding: false },
  modItemPrice: { fontSize: 13, letterSpacing: 0.1, includeFontPadding: false },
  modSep: { height: StyleSheet.hairlineWidth, marginLeft: 46 },
});
