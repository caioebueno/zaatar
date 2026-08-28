import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, useColorScheme, Modal, Platform, Linking, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getColors, F } from '../../constants/Colors';
import { useAuth } from '../../context/auth';
import { registerPushDevice } from '../../lib/api';

const PREF_PUSH_KEY  = 'zippy.push.enabled';
const PREF_SCOPE_KEY = 'zippy.push.scope';

async function loadPref(key: string, fallback: string): Promise<string> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key) ?? fallback;
    return (await SecureStore.getItemAsync(key)) ?? fallback;
  } catch { return fallback; }
}
async function savePref(key: string, value: string) {
  try {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

// ─── Toggle ───────────────────────────────────────────────────
function ZToggle({ value, onChange, disabled = false, C }: {
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean; C: ReturnType<typeof getColors>;
}) {
  const trackOff = C.mode === 'dark' ? 'rgba(250,245,238,0.18)' : 'rgba(22,18,15,0.18)';
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: trackOff, true: C.live }}
      thumbColor="#fff"
      ios_backgroundColor={trackOff}
    />
  );
}

// ─── Section title ────────────────────────────────────────────
function SectionTitle({ label, C }: { label: string; C: ReturnType<typeof getColors> }) {
  return (
    <Text style={[s.sectionTitle, { color: C.ink2, fontFamily: F.monoSemibold }]}>{label}</Text>
  );
}

// ─── Card ─────────────────────────────────────────────────────
function Card({ children, C }: { children: React.ReactNode; C: ReturnType<typeof getColors> }) {
  return (
    <View style={[s.card, { backgroundColor: C.paper, borderColor: C.hairline }]}>
      {children}
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────
function Row({ label, sub, right, onPress, last, C }: {
  label: string; sub?: React.ReactNode; right?: React.ReactNode;
  onPress?: () => void; last?: boolean; C: ReturnType<typeof getColors>;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairlineSoft }]}
    >
      <View style={s.rowText}>
        <Text style={[s.rowLabel, { color: C.ink, fontFamily: F.medium }]}>{label}</Text>
        {sub != null && (
          typeof sub === 'string'
            ? <Text style={[s.rowSub, { color: C.muted, fontFamily: F.regular }]}>{sub}</Text>
            : <View style={{ marginTop: 3 }}>{sub}</View>
        )}
      </View>
      {right}
    </Wrapper>
  );
}

// ─── Radio option ─────────────────────────────────────────────
function RadioOption({ label, sub, recommended, selected, onPress, last, C }: {
  label: string; sub: string; recommended?: boolean; selected: boolean;
  onPress: () => void; last?: boolean; C: ReturnType<typeof getColors>;
}) {
  const ringIdle = C.mode === 'dark' ? 'rgba(250,245,238,0.25)' : 'rgba(22,18,15,0.25)';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.radioRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairlineSoft }]}
    >
      <View style={[s.radioRing, { borderColor: selected ? C.orange : ringIdle }]}>
        {selected && <View style={[s.radioDot, { backgroundColor: C.orange }]} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.radioLabelRow}>
          <Text style={[s.rowLabel, { color: C.ink, fontFamily: F.medium }]}>{label}</Text>
          {recommended && (
            <View style={[s.recommendedBadge, { backgroundColor: C.liveBg }]}>
              <Text style={[s.recommendedText, { color: C.liveFg, fontFamily: F.monoSemibold }]}>
                Recommended
              </Text>
            </View>
          )}
        </View>
        <Text style={[s.rowSub, { color: C.muted, fontFamily: F.regular }]}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Logout confirm modal ─────────────────────────────────────
function LogoutConfirm({ visible, onCancel, onConfirm, C }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void; C: ReturnType<typeof getColors>;
}) {
  const insets = useSafeAreaInsets();
  const logoutRed = C.mode === 'dark' ? '#ff5a35' : '#c72a0a';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={onCancel} />
      <View style={[s.confirmSheet, { backgroundColor: C.cream, bottom: insets.bottom + 80 }]}>
        <Text style={[s.confirmTitle, { color: C.ink, fontFamily: F.bold }]}>
          Log out of Zippy?
        </Text>
        <Text style={[s.confirmBody, { color: C.muted, fontFamily: F.regular }]}>
          You'll stop receiving notifications and active chats will return to the bot until another teammate picks up.
        </Text>
        <View style={s.confirmBtns}>
          <TouchableOpacity
            onPress={onCancel}
            style={[s.confirmBtn, { borderWidth: 1, borderColor: C.hairline }]}
            activeOpacity={0.75}
          >
            <Text style={[s.confirmBtnText, { color: C.ink, fontFamily: F.semibold }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[s.confirmBtn, { backgroundColor: logoutRed }]}
            activeOpacity={0.75}
          >
            <Text style={[s.confirmBtnText, { color: '#fff', fontFamily: F.semibold }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function SettingsScreen() {
  const C = getColors(useColorScheme());
  const { agent, token, businessId, logout } = useAuth();

  const [push, setPush]   = useState(false);
  const [permStatus, setPermStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [scope, setScope] = useState<'escalations' | 'all'>('escalations');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    loadPref(PREF_PUSH_KEY, '0').then(v => setPush(v === '1'));
    loadPref(PREF_SCOPE_KEY, 'escalations').then(v => setScope(v as 'escalations' | 'all'));
    if (Platform.OS !== 'web') {
      Notifications.getPermissionsAsync().then(({ status }) => setPermStatus(status as any));
    }
  }, []);

  const registerToken = async () => {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      console.log('[push] token:', pushToken);
      if (token && pushToken) {
        await registerPushDevice(token, businessId, pushToken);
        console.log('[push] registered with API');
      }
    } catch (e) {
      console.warn('[push] registerToken failed:', e);
    }
  };

  const handleTogglePush = async (next: boolean) => {
    if (!next) {
      setPush(false);
      savePref(PREF_PUSH_KEY, '0');
      return;
    }
    if (Platform.OS === 'web') {
      setPush(true);
      savePref(PREF_PUSH_KEY, '1');
      return;
    }
    if (permStatus === 'granted') {
      setPush(true);
      savePref(PREF_PUSH_KEY, '1');
      await registerToken();
      return;
    }
    if (permStatus === 'denied') {
      Alert.alert(
        'Notifications blocked',
        'Open Settings and allow notifications for Zippy.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setPermStatus(status as any);
    if (status === 'granted') {
      setPush(true);
      savePref(PREF_PUSH_KEY, '1');
      await registerToken();
    }
  };
  const handleScope = (v: 'escalations' | 'all') => {
    setScope(v);
    savePref(PREF_SCOPE_KEY, v);
  };

  const initials = agent?.name
    ? agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ZP';

  const logoutBorder = C.mode === 'dark' ? 'rgba(255,90,53,0.32)' : 'rgba(199,42,10,0.30)';
  const logoutText   = C.mode === 'dark' ? '#ffa48a' : '#c72a0a';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.cream }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.bigTitle, { color: C.ink, fontFamily: F.bold }]}>Settings</Text>
          <View style={s.identityRow}>
            <View style={[s.identityAvatar, { backgroundColor: C.ink }]}>
              <Text style={[s.identityInitials, { color: C.cream, fontFamily: F.semibold }]}>
                {initials}
              </Text>
            </View>
            <Text style={[s.identityLabel, { color: C.muted, fontFamily: F.monoRegular }]}>
              {agent?.name ?? 'Agent'} · {agent?.phone ?? '—'}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <SectionTitle label="Notifications" C={C} />
        <Card C={C}>
          <Row
            label="Push notifications"
            sub={
              <View style={s.permRow}>
                <View style={[s.permDot, {
                  backgroundColor: permStatus === 'granted' ? C.live : permStatus === 'denied' ? C.orange : C.faint,
                }]} />
                <Text style={[s.permLabel, { color: C.muted, fontFamily: F.regular }]}>
                  {permStatus === 'granted' ? 'Allowed' : permStatus === 'denied' ? 'Blocked in Settings' : 'Not requested yet'}
                </Text>
              </View>
            }
            right={<ZToggle value={push && permStatus === 'granted'} onChange={handleTogglePush} C={C} />}
            last
            C={C}
          />
        </Card>

        <SectionTitle label="Notify me about" C={C} />
        <Card C={C}>
          <RadioOption
            label="Only when AI can't handle it"
            sub="Alerts when the bot hands off to you or the customer asks for a human. The AI keeps handling everything else silently."
            recommended
            selected={scope === 'escalations'}
            onPress={() => handleScope('escalations')}
            C={C}
          />
          <RadioOption
            label="Every message"
            sub="Notifies you on every new incoming message — even ones the AI is already replying to."
            selected={scope === 'all'}
            onPress={() => handleScope('all')}
            last
            C={C}
          />
        </Card>
        {!push && (
          <Text style={[s.scopeHint, { color: C.faint, fontFamily: F.monoRegular }]}>
            Turn on Push notifications above to start receiving alerts. Your preference is saved either way.
          </Text>
        )}

        {/* Log out */}
        <View style={s.logoutWrap}>
          <TouchableOpacity
            onPress={() => setShowLogout(true)}
            style={[s.logoutBtn, { borderColor: logoutBorder }]}
            activeOpacity={0.75}
          >
            <Text style={[s.logoutText, { color: logoutText, fontFamily: F.semibold }]}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.version, { color: C.faint, fontFamily: F.monoRegular }]}>
          Zippy · v1.0.0 · build 2026.05
        </Text>
      </ScrollView>

      <LogoutConfirm
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => { setShowLogout(false); await logout(); }}
        C={C}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 60 },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  bigTitle: { fontSize: 32, letterSpacing: -1, lineHeight: 36 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  identityAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  identityInitials: { fontSize: 10 },
  identityLabel: { fontSize: 11, letterSpacing: 0.4 },

  // Section
  sectionTitle: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
    fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
    includeFontPadding: false,
  },

  // Card
  card: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, letterSpacing: -0.1 },
  rowSub: { fontSize: 12.5, lineHeight: 17, marginTop: 3 },

  // Permission dot
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  permDot: { width: 6, height: 6, borderRadius: 3 },
  permLabel: { fontSize: 12.5 },

  // Radio
  radioRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  radioRing: {
    marginTop: 2, width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  radioLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  recommendedBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
  },
  recommendedText: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', includeFontPadding: false },

  // Scope hint
  scopeHint: {
    paddingHorizontal: 16, paddingTop: 8,
    fontSize: 10.5, letterSpacing: 0.4, lineHeight: 16, includeFontPadding: false,
  },

  // Log out
  logoutWrap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  logoutBtn: {
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontSize: 15, letterSpacing: -0.1, includeFontPadding: false },

  // Version
  version: {
    textAlign: 'center', paddingVertical: 16,
    fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', includeFontPadding: false,
  },

  // Logout confirm
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.40)', zIndex: 10 },
  confirmSheet: {
    position: 'absolute', left: 16, right: 16, zIndex: 11,
    borderRadius: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.30, shadowRadius: 50, elevation: 20,
  },
  confirmTitle: { fontSize: 18, letterSpacing: -0.4 },
  confirmBody: { fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  confirmBtns: { flexDirection: 'row', gap: 8, marginTop: 16 },
  confirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 14.5, letterSpacing: -0.1, includeFontPadding: false },
});
