import {
  View, Text, TextInput, StyleSheet, useColorScheme,
  TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getColors, F } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import { searchAddresses, createCustomerAddress, type AddressSuggestion } from '../../lib/api';
import { emitNewAddress } from '../../lib/addressEvents';

export default function AddAddressScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const C = getColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const { token, businessId } = useAuth();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      if (!token) return;
      setSearching(true);
      try {
        const results = await searchAddresses(token, businessId, query);
        setSuggestions(results);
      } catch {}
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, token, businessId]);

  async function handleSave() {
    if (!selected || !token || !customerId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createCustomerAddress(token, businessId, customerId, {
        description: selected.display_name,
        street: selected.address.road ?? '',
        number: selected.address.house_number ?? '',
        city: selected.address.city ?? '',
        state: selected.address.state ?? '',
        zipCode: selected.address.postcode ?? '',
        lat: String(selected.lat),
        lng: String(selected.lon),
        complement: notes.trim() || null,
      });
      emitNewAddress(created);
      router.back();
    } catch (err: any) {
      const reason = err?.data?.reason;
      if (reason === 'OUTSIDE_DELIVERY_COVERAGE_AREA') {
        setSaveError('This address is outside our delivery area.');
      } else {
        setSaveError('Could not save address. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  const bg = C.cream;
  const cardBg = C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paper;
  const inputBg = C.mode === 'dark' ? 'rgba(250,245,238,0.06)' : C.paperSink;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: C.hairline }]}>
        <Text style={[s.title, { color: C.ink, fontFamily: F.bold }]}>Add address</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={[s.cancel, { color: C.muted, fontFamily: F.monoSemibold }]}>CANCEL</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {selected ? (
            /* ── Selected address ── */
            <>
              <View style={[s.selectedCard, { backgroundColor: cardBg, borderColor: C.orange }]}>
                <View style={[s.selectedIcon, { backgroundColor: C.orange + '22' }]}>
                  <Ionicons name="location" size={18} color={C.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.selectedPrimary, { color: C.ink, fontFamily: F.semibold }]} numberOfLines={2}>
                    {selected.display_name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)} hitSlop={12}>
                  <Ionicons name="close" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>
                OBSERVATION FOR THE DRIVER · <Text style={{ color: C.faint }}>OPTIONAL</Text>
              </Text>
              <View style={[s.notesBox, { backgroundColor: inputBg, borderColor: C.hairline }]}>
                <TextInput
                  style={[s.notesInput, { color: C.ink, fontFamily: F.regular }]}
                  placeholder="Buzzer 3, leave at door, gate code, floor…"
                  placeholderTextColor={C.faint}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  submitBehavior="newline"
                />
              </View>

              {saveError && (
                <Text style={[s.errorText, { color: '#e53935', fontFamily: F.regular }]}>{saveError}</Text>
              )}
            </>
          ) : (
            /* ── Search ── */
            <>
              <View style={[s.searchBar, { backgroundColor: inputBg, borderColor: C.hairline }]}>
                <Ionicons name="search" size={16} color={C.faint} />
                <TextInput
                  style={[s.searchInput, { color: C.ink, fontFamily: F.regular }]}
                  placeholder="Search address"
                  placeholderTextColor={C.faint}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  returnKeyType="search"
                />
                {searching && <ActivityIndicator size="small" color={C.orange} />}
                {!searching && query.length > 0 && (
                  <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={C.faint} />
                  </TouchableOpacity>
                )}
              </View>

              {suggestions.length > 0 && (
                <>
                  <Text style={[s.sectionLabel, { color: C.faint, fontFamily: F.monoSemibold }]}>SUGGESTED NEARBY</Text>
                  {suggestions.map((item, idx) => (
                    <View key={item.id}>
                      <TouchableOpacity
                        style={s.suggestionRow}
                        onPress={() => setSelected(item)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.suggestionIcon, { backgroundColor: inputBg }]}>
                          <Ionicons name="location-outline" size={18} color={C.muted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.suggestionPrimary, { color: C.ink, fontFamily: F.regular }]} numberOfLines={1}>
                            {item.display_name}
                          </Text>
                          {item.address.city && (
                            <Text style={[s.suggestionSecondary, { color: C.muted, fontFamily: F.monoRegular }]} numberOfLines={1}>
                              {item.address.city}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      {idx < suggestions.length - 1 && (
                        <View style={[s.divider, { backgroundColor: C.hairlineSoft }]} />
                      )}
                    </View>
                  ))}
                </>
              )}

              {query.length >= 3 && !searching && suggestions.length === 0 && (
                <Text style={[s.emptyText, { color: C.faint, fontFamily: F.monoRegular }]}>No results found</Text>
              )}
            </>
          )}
        </ScrollView>

        {/* ── Save button ── */}
        <View style={[s.bottomBar, { borderTopColor: C.hairline, backgroundColor: bg, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: selected ? C.orange : C.mode === 'dark' ? 'rgba(250,245,238,0.08)' : C.paperSink }]}
            onPress={handleSave}
            disabled={!selected || saving}
            activeOpacity={0.82}
          >
            {saving
              ? <ActivityIndicator color={selected ? C.cream : C.faint} />
              : <Text style={[s.saveBtnText, { color: selected ? C.cream : C.faint, fontFamily: F.semibold }]}>Save address</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, letterSpacing: -0.4, includeFontPadding: false },
  cancel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },

  content: { paddingHorizontal: 16, paddingTop: 20 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, includeFontPadding: false },

  sectionLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
    includeFontPadding: false, marginBottom: 10,
  },

  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
  },
  suggestionIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  suggestionPrimary: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
  suggestionSecondary: { fontSize: 12, letterSpacing: 0.2, marginTop: 2, includeFontPadding: false },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 50 },

  emptyText: {
    textAlign: 'center', fontSize: 13, letterSpacing: 0.2,
    marginTop: 40, includeFontPadding: false,
  },

  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 24,
  },
  selectedIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  selectedPrimary: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },

  notesBox: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 120,
  },
  notesInput: { fontSize: 14, lineHeight: 22, includeFontPadding: false, textAlignVertical: 'top' },

  errorText: { fontSize: 13, letterSpacing: -0.1, marginTop: 10, includeFontPadding: false },

  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16, paddingTop: 12,
  },
  saveBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },
});
