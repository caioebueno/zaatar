import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/auth';
import {
  SIMULATION_ROUTE_GPX,
  SimStatus,
  onSimStatus,
  startSimulation,
  stopSimulation,
} from '@/lib/gpx-simulator';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const SANS    = 'Geist_400Regular';
const SANS_M  = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_B  = 'GeistMono_700Bold';

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <Text style={styles.sectionHeader}>{label}</Text>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────
type RowProps = {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
  last?: boolean;
};

function SettingsRow({
  icon, iconColor, iconBg, label, value, onPress, chevron = true, danger, disabled, last,
}: RowProps) {
  const textColor = danger ? D.zippy : D.text;
  const ic  = iconColor ?? (danger ? D.zippy : D.dim);
  const ibg = iconBg ?? (danger ? 'rgba(255,61,20,0.12)' : D.surf3);
  const ibc = iconBg ?? (danger ? 'rgba(255,61,20,0.22)' : D.line);

  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast, disabled && styles.rowDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={!onPress || disabled}
    >
      <View style={[styles.rowIcon, { backgroundColor: ibg, borderColor: ibc }]}>
        <Ionicons name={icon as any} size={16} color={ic} />
      </View>
      <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {chevron && onPress && !disabled ? (
          <Ionicons name="chevron-forward" size={14} color={D.faint} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────
function ToggleRow({
  icon, iconColor, iconBg, label, value, onToggle, disabled, last,
}: {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const ic  = iconColor ?? D.dim;
  const ibg = iconBg ?? D.surf3;

  return (
    <View style={[styles.row, last && styles.rowLast, disabled && styles.rowDisabled]}>
      <View style={[styles.rowIcon, { backgroundColor: ibg, borderColor: D.line }]}>
        <Ionicons name={icon as any} size={16} color={ic} />
      </View>
      <Text style={[styles.rowLabel, { color: D.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
        trackColor={{ false: D.surf3, true: 'rgba(52,211,154,0.35)' }}
        thumbColor={value ? D.green : D.faint}
        ios_backgroundColor={D.surf3}
        style={{ marginLeft: 'auto' }}
      />
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// ─── formatPhone ─────────────────────────────────────────────────────────────
function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  // Brazil: +55 or 55 prefix + DDD(2) + 8 or 9 digits = 12 or 13 digits
  if ((digits.startsWith('55')) && (digits.length === 12 || digits.length === 13)) {
    const local = digits.slice(2);
    const ddd = local.slice(0, 2);
    const num = local.slice(2);
    if (num.length === 9) return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
    if (num.length === 8) return `+55 (${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  }
  // US/Canada: +1 or 1 prefix + 10 digits = 11 digits
  if (digits.startsWith('1') && digits.length === 11) {
    const local = digits.slice(1);
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return raw;
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { driver, logout } = useAuth();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [soundEnabled,   setSoundEnabled]   = useState(true);
  const [vibration,      setVibration]      = useState(true);
  const [showMap,        setShowMap]        = useState(true);
  const [simFast,   setSimFast]   = useState(false);
  const [simStatus, setSimStatus] = useState<SimStatus>({ running: false, current: 0, total: 0 });

  useEffect(() => onSimStatus(setSimStatus), []);

  const initial   = driver?.name?.[0]?.toUpperCase() ?? '?';
  const firstName = driver?.name?.split(' ')[0] ?? '';
  const lastName  = driver?.name?.split(' ').slice(1).join(' ') ?? '';

  const handleSimToggle = async () => {
    if (simStatus.running) { stopSimulation(); return; }
    const err = await startSimulation(SIMULATION_ROUTE_GPX, simFast ? 500 : 10_000);
    if (err) Alert.alert('Simulação', err);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: D.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Driver profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{firstName}{lastName ? ` ${lastName}` : ''}</Text>
            <Text style={styles.profilePhone}>{formatPhone(driver?.phone)}</Text>
          </View>
        </View>

        {/* ── Conta ── */}
        <SectionHeader label="Conta" />
        <Card>
          <SettingsRow
            icon="person-outline"
            label="Nome"
            value={driver?.name ?? '—'}
            chevron={false}
            disabled
          />
          <SettingsRow
            icon="call-outline"
            label="Telefone"
            value={formatPhone(driver?.phone)}
            chevron={false}
            disabled
            last
          />
        </Card>

        {/* ── Notificações ── */}
        <SectionHeader label="Notificações" />
        <Card>
          <ToggleRow
            icon="volume-medium-outline"
            iconColor="rgba(250,245,238,0.58)"
            label="Sons"
            value={soundEnabled}
            onToggle={setSoundEnabled}
            disabled
          />
          <ToggleRow
            icon="phone-portrait-outline"
            iconColor="rgba(250,245,238,0.58)"
            label="Vibração"
            value={vibration}
            onToggle={setVibration}
            disabled
            last
          />
        </Card>

        {/* ── Navegação ── */}
        <SectionHeader label="Navegação" />
        <Card>
          <ToggleRow
            icon="map-outline"
            iconColor="rgba(250,245,238,0.58)"
            label="Mostrar mapa na entrega"
            value={showMap}
            onToggle={setShowMap}
            disabled
            last
          />
        </Card>

        {/* ── Permissões ── */}
        <SectionHeader label="Permissões" />
        <Card>
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor="#4f8ef7"
            iconBg="rgba(79,142,247,0.10)"
            label="Localização & segundo plano"
            onPress={() => router.push('/permissions')}
            last
          />
        </Card>

        {/* ── Suporte ── */}
        <SectionHeader label="Suporte" />
        <Card>
          <SettingsRow
            icon="help-circle-outline"
            label="Central de ajuda"
            onPress={() => {}}
            disabled
          />
          <SettingsRow
            icon="chatbubble-outline"
            label="Falar com suporte"
            onPress={() => {}}
            disabled
            last
          />
        </Card>

        {/* ── Desenvolvedor ── */}
        <SectionHeader label="Desenvolvedor" />
        <Card>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(130,80,255,0.12)', borderColor: 'rgba(130,80,255,0.22)' }]}>
              <Ionicons name="navigate-circle-outline" size={16} color="#8250ff" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowLabel, { color: D.text }]}>Simular Rota (GPX)</Text>
              {simStatus.total > 0 && (
                <Text style={styles.rowValue}>
                  {simStatus.running ? `${simStatus.current} / ${simStatus.total} pontos` : 'Concluído'}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Switch
                value={simFast}
                onValueChange={v => { if (!simStatus.running) setSimFast(v); }}
                disabled={simStatus.running}
                trackColor={{ false: D.surf3, true: 'rgba(130,80,255,0.35)' }}
                thumbColor={simFast ? '#8250ff' : D.faint}
                ios_backgroundColor={D.surf3}
              />
              <Text style={{ fontFamily: MONO, fontSize: 9, color: D.faint, marginRight: 4 }}>
                {simFast ? '500ms' : '10s'}
              </Text>
              <TouchableOpacity
                style={[simDevStyles.btn, simStatus.running && simDevStyles.btnStop]}
                onPress={handleSimToggle}
                activeOpacity={0.75}
              >
                <Text style={[simDevStyles.btnText, simStatus.running && { color: D.zippy }]}>
                  {simStatus.running ? 'Parar' : 'Iniciar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* ── Sair ── */}
        <View style={{ height: 8 }} />
        <Card>
          <SettingsRow
            icon="log-out-outline"
            label="Sair da conta"
            onPress={handleLogout}
            chevron={false}
            danger
            last
          />
        </Card>

        {/* Version */}
        <Text style={styles.version}>Zippy Driver · v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(250,245,238,0.09)',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },

  scroll: { paddingHorizontal: 18, paddingTop: 20, gap: 6 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: D.surf,
    borderWidth: 1, borderColor: D.line,
    borderRadius: 18, padding: 16,
    marginBottom: 6,
  },
  avatarLarge: {
    width: 52, height: 52, borderRadius: 15, flexShrink: 0,
    backgroundColor: 'rgba(255,61,20,0.14)',
    borderWidth: 1.5, borderColor: 'rgba(255,61,20,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLargeText: { fontFamily: SANS_EB, fontSize: 20, color: D.zippy, letterSpacing: -0.5 },
  profileName:  { fontSize: 16, fontFamily: SANS_B, color: D.text, letterSpacing: -0.3, marginBottom: 3 },
  profilePhone: { fontFamily: MONO, fontSize: 12, color: D.dim },

  sectionHeader: {
    fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: D.faint,
    marginTop: 12, marginBottom: 4, marginLeft: 4,
  },

  card: {
    backgroundColor: D.surf,
    borderWidth: 1, borderColor: D.line,
    borderRadius: 16, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(250,245,238,0.09)',
  },
  rowLast:     { borderBottomWidth: 0 },
  rowDisabled: { opacity: 0.38 },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: SANS_M },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowValue: { fontFamily: MONO, fontSize: 12, color: D.faint },

  version: {
    fontFamily: MONO, fontSize: 10, color: 'rgba(250,245,238,0.18)',
    textAlign: 'center', letterSpacing: 0.8, marginTop: 20,
  },
});

const simDevStyles = StyleSheet.create({
  btn: {
    height: 28, borderRadius: 8, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(130,80,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(130,80,255,0.30)',
  },
  btnStop: {
    backgroundColor: 'rgba(255,61,20,0.10)',
    borderColor: 'rgba(255,61,20,0.25)',
  },
  btnText: { fontFamily: SANS_SB, fontSize: 12, color: '#8250ff' },
});
