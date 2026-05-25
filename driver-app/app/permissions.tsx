import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
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
import * as Location from 'expo-location';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
const SANS_SB = 'Geist_600SemiBold';
const SANS_B  = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO    = 'GeistMono_400Regular';
const MONO_B  = 'GeistMono_700Bold';

// ─── Types ────────────────────────────────────────────────────────────────────
type PermStatus = 'granted' | 'always' | 'while_using' | 'denied' | 'undetermined';

// ─── ZippyMark ────────────────────────────────────────────────────────────────
function ZippyMark({ size = 24 }: { size?: number }) {
  const s = size / 100;
  const cx = 50 * s;
  const cy = 60 * s;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: D.zippy, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: cx - 32 * s, top: cy - 32 * s, width: 64 * s, height: 32 * s, overflow: 'hidden' }}>
        <View style={{ width: 64 * s, height: 64 * s, borderRadius: 32 * s, borderWidth: 6 * s, borderColor: 'rgba(255,255,255,0.25)' }} />
      </View>
      <View style={{ position: 'absolute', left: cx - 22 * s, top: cy - 22 * s, width: 44 * s, height: 22 * s, overflow: 'hidden' }}>
        <View style={{ width: 44 * s, height: 44 * s, borderRadius: 22 * s, borderWidth: 8 * s, borderColor: 'rgba(255,255,255,0.55)' }} />
      </View>
      <View style={{ position: 'absolute', left: 41 * s, top: 51 * s, width: 18 * s, height: 18 * s, borderRadius: 4 * s, backgroundColor: '#fff' }} />
    </View>
  );
}

// ─── SectionLabel ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PermStatus }) {
  const map: Record<PermStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    granted:      { label: 'Permitido',       color: D.green, bg: 'rgba(52,211,154,0.09)',  border: 'rgba(52,211,154,0.22)', dot: D.green },
    always:       { label: 'Sempre ativo',    color: D.green, bg: 'rgba(52,211,154,0.09)',  border: 'rgba(52,211,154,0.22)', dot: D.green },
    while_using:  { label: 'Somente ao usar', color: D.amber, bg: 'rgba(242,179,56,0.09)', border: 'rgba(242,179,56,0.24)', dot: D.amber },
    denied:       { label: 'Negado',          color: D.zippy, bg: 'rgba(255,61,20,0.09)',  border: 'rgba(255,61,20,0.26)',  dot: D.zippy },
    undetermined: { label: 'Não solicitado',  color: D.faint, bg: 'rgba(250,245,238,0.05)', border: 'rgba(250,245,238,0.12)', dot: D.faint },
  };
  const c = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[styles.badgeDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── StepsList ────────────────────────────────────────────────────────────────
function StepsList({ steps, accent }: { steps: string[]; accent: string }) {
  return (
    <View style={[styles.stepsList, { borderColor: D.line }]}>
      {steps.map((step, i) => (
        <View key={i} style={[styles.stepRow, i < steps.length - 1 && { borderBottomWidth: 1, borderBottomColor: D.line }]}>
          <View style={[styles.stepNum, { backgroundColor: accent + '14', borderColor: accent + '30' }]}>
            <Text style={[styles.stepNumText, { color: accent }]}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── PermissionCard ──────────────────────────────────────────────────────────
type CardProps = {
  icon: string;
  label: string;
  required?: boolean;
  sublabel: string;
  status: PermStatus;
  issueDesc?: string;
  steps?: string[];
  onRequest?: () => void;
  requesting?: boolean;
};

function PermissionCard({
  icon, label, required, sublabel, status, issueDesc, steps, onRequest, requesting,
}: CardProps) {
  const isOk      = status === 'granted' || status === 'always';
  const isPartial = status === 'while_using';
  const isDenied  = status === 'denied';
  const isUndet   = status === 'undetermined';
  const hasIssue  = !isOk;

  const accent      = isDenied ? D.zippy : isPartial ? D.amber : isUndet ? D.amber : D.green;
  const cardBg      = isOk ? D.surf : isDenied ? 'rgba(255,61,20,0.04)' : 'rgba(242,179,56,0.04)';
  const cardBorder  = isOk ? D.line : isDenied ? 'rgba(255,61,20,0.24)' : 'rgba(242,179,56,0.22)';
  const iconBg      = isOk ? D.surf3 : isDenied ? 'rgba(255,61,20,0.09)' : 'rgba(242,179,56,0.09)';
  const iconBorder  = isOk ? D.line  : isDenied ? 'rgba(255,61,20,0.20)' : 'rgba(242,179,56,0.20)';
  const iconColor   = isOk ? D.faint : accent;

  const ctaLabel = isPartial ? 'Alterar para Sempre Permitir'
    : isUndet ? (requesting ? 'Solicitando…' : 'Solicitar Permissão')
    : 'Abrir Configurações';

  const handleCta = () => {
    if (isUndet && onRequest) { onRequest(); return; }
    Linking.openSettings();
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Main row */}
      <View style={styles.cardRow}>
        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: iconBg, borderColor: iconBorder }]}>
          <Ionicons name={icon as any} size={16} color={iconColor} />
          {required && hasIssue && (
            <View style={[styles.cardIconDot, { backgroundColor: accent, borderColor: D.bg }]} />
          )}
        </View>

        {/* Label + sublabel */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
          </View>
          {sublabel ? <Text style={styles.cardSublabel} numberOfLines={2}>{sublabel}</Text> : null}
        </View>

        {/* Status badge */}
        <StatusBadge status={status} />
      </View>

      {/* Issue panel */}
      {hasIssue && issueDesc && (
        <>
          <View style={[styles.cardDivider, { backgroundColor: cardBorder }]} />
          <View style={styles.issuePanel}>
            <Text style={styles.issueDesc}>{issueDesc}</Text>
            {steps && steps.length > 0 && (
              <StepsList steps={steps} accent={accent} />
            )}
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: accent + '14', borderColor: accent + '40' }]}
              onPress={handleCta}
              activeOpacity={0.75}
              disabled={requesting}
            >
              <Ionicons
                name={isUndet ? 'shield-checkmark-outline' : 'open-outline'}
                size={13}
                color={accent}
              />
              <Text style={[styles.ctaText, { color: accent }]}>{ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ─── HealthBanner ─────────────────────────────────────────────────────────────
function HealthBanner({
  notif, location, bgLocation,
}: { notif: PermStatus; location: PermStatus; bgLocation: PermStatus }) {
  const locOk  = location   === 'granted';
  const bgOk   = bgLocation === 'always';
  const ntfOk  = notif      === 'granted';
  const allOk  = locOk && bgOk && ntfOk;
  const issues = [!ntfOk, !locOk, !bgOk].filter(Boolean).length;
  const critical = !locOk || bgLocation === 'denied';
  const granted  = 3 - issues;

  if (allOk) {
    return (
      <View style={[styles.banner, { backgroundColor: 'rgba(52,211,154,0.07)', borderColor: 'rgba(52,211,154,0.18)' }]}>
        <View style={[styles.bannerIcon, { backgroundColor: 'rgba(52,211,154,0.12)', borderColor: 'rgba(52,211,154,0.22)' }]}>
          <Ionicons name="checkmark" size={14} color={D.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: D.green }]}>Tudo certo</Text>
          <Text style={styles.bannerSub}>Todas as permissões estão ativas</Text>
        </View>
        <Text style={[styles.bannerCount, { color: D.green }]}>3/3</Text>
      </View>
    );
  }

  const color = critical ? D.zippy : D.amber;
  const bg    = critical ? 'rgba(255,61,20,0.07)'  : 'rgba(242,179,56,0.07)';
  const bdr   = critical ? 'rgba(255,61,20,0.20)'  : 'rgba(242,179,56,0.20)';
  const ibg   = critical ? 'rgba(255,61,20,0.12)'  : 'rgba(242,179,56,0.12)';
  const ibdr  = critical ? 'rgba(255,61,20,0.22)'  : 'rgba(242,179,56,0.22)';

  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: bdr }]}>
      <View style={[styles.bannerIcon, { backgroundColor: ibg, borderColor: ibdr }]}>
        <Ionicons name="warning-outline" size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color }]}>
          {critical ? 'Ação necessária' : 'Funcionalidade limitada'}
        </Text>
        <Text style={styles.bannerSub}>
          {issues === 1 ? '1 permissão precisa' : `${issues} permissões precisam`} de atenção
        </Text>
      </View>
      <Text style={[styles.bannerCount, { color }]}>{granted}/3</Text>
    </View>
  );
}

// ─── PermissionsScreen ────────────────────────────────────────────────────────
export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // expo-notifications requires a native rebuild — stub as undetermined until then
  const [notif,      setNotif]      = useState<PermStatus>('undetermined');
  const [location,   setLocation]   = useState<PermStatus>('undetermined');
  const [bgLocation, setBgLocation] = useState<PermStatus>('undetermined');
  const [reqLoc,     setReqLoc]     = useState(false);
  const [reqBg,      setReqBg]      = useState(false);

  const checkAll = useCallback(async () => {
    const [fgRes, bgRes] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
    ]);

    const fgStatus: PermStatus =
      fgRes.granted ? 'granted'
        : fgRes.canAskAgain ? 'undetermined'
        : 'denied';
    setLocation(fgStatus);

    const bgStatus: PermStatus =
      bgRes.granted ? 'always'
        : fgRes.granted && bgRes.canAskAgain ? 'while_using'
        : fgRes.granted && !bgRes.canAskAgain ? 'denied'
        : 'undetermined';
    setBgLocation(bgStatus);
  }, []);

  useEffect(() => { checkAll(); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') checkAll();
    });
    return () => sub.remove();
  }, [checkAll]);

  const requestLocation = useCallback(async () => {
    setReqLoc(true);
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      setLocation(res.granted ? 'granted' : res.canAskAgain ? 'undetermined' : 'denied');
      if (res.granted) await checkAll(); // re-check bg state now fg is granted
    } finally { setReqLoc(false); }
  }, [checkAll]);

  const requestBg = useCallback(async () => {
    setReqBg(true);
    try {
      if (location !== 'granted') {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (!fg.granted) { setReqBg(false); return; }
        setLocation('granted');
      }
      const res = await Location.requestBackgroundPermissionsAsync();
      setBgLocation(res.granted ? 'always' : 'while_using');
    } finally { setReqBg(false); }
  }, [location]);

  const NOTIF_STEPS = [
    'Abra as Configurações do iPhone',
    'Toque em "Zippy" na lista de apps',
    'Ative "Permitir Notificações"',
  ];

  const LOC_STEPS = [
    'Abra as Configurações do iPhone',
    'Toque em "Privacidade" → "Localização"',
    'Encontre "Zippy" na lista',
    'Selecione "Enquanto Usa o App"',
  ];

  const BGLOC_ALWAYS_STEPS = [
    'Abra as Configurações do iPhone',
    'Toque em "Privacidade" → "Localização"',
    'Encontre "Zippy" na lista',
    'Selecione "Sempre"',
  ];

  const BGLOC_UPGRADE_STEPS = [
    'Abra as Configurações do iPhone',
    'Toque em "Privacidade" → "Localização"',
    'Encontre "Zippy" na lista',
    'Altere de "Enquanto Usa" para "Sempre"',
  ];

  return (
    <View style={[styles.root, { backgroundColor: D.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={D.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissões</Text>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Health banner */}
        <HealthBanner notif={notif} location={location} bgLocation={bgLocation} />

        {/* Notificações */}
        <View style={styles.section}>
          <SectionLabel>Notificações</SectionLabel>
          <PermissionCard
            icon="notifications-outline"
            label="Notificações"
            sublabel=""
            status={notif}
            required={false}
            issueDesc="Sem notificações ativadas você pode perder avisos de novas rotas, mudanças de pedido e alertas do sistema em tempo real."
            steps={notif === 'denied' ? NOTIF_STEPS : undefined}
            onRequest={() => Linking.openSettings()}
            requesting={false}
          />
        </View>

        {/* Localização */}
        <View style={styles.section}>
          <SectionLabel>Localização</SectionLabel>
          <PermissionCard
            icon="location-outline"
            label="Localização"
            sublabel=""
            status={location}
            required={true}
            issueDesc="A localização é obrigatória para receber e completar entregas. O app não consegue calcular rotas nem distribuir pedidos sem ela."
            steps={location === 'denied' ? LOC_STEPS : undefined}
            onRequest={requestLocation}
            requesting={reqLoc}
          />
        </View>

        {/* Segundo Plano */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <SectionLabel>Segundo Plano</SectionLabel>
          <PermissionCard
            icon="navigate-outline"
            label="Localização em Segundo Plano"
            sublabel=""
            status={bgLocation}
            required={true}
            issueDesc={
              bgLocation === 'while_using'
                ? 'Com "Somente ao usar", a distribuição automática de rotas é interrompida quando o app vai para segundo plano. O ETA do cliente pode ficar desatualizado.'
                : 'Obrigatório para distribuição automática de rotas e rastreamento de ETA em tempo real, mesmo com o app minimizado ou fechado.'
            }
            steps={
              bgLocation === 'while_using' ? BGLOC_UPGRADE_STEPS
                : bgLocation === 'denied' ? BGLOC_ALWAYS_STEPS
                : undefined
            }
            onRequest={requestBg}
            requesting={reqBg}
          />
        </View>

        {/* Verify button */}
        <TouchableOpacity style={styles.verifyBtn} onPress={checkAll} activeOpacity={0.75}>
          <Ionicons name="refresh-outline" size={13} color={D.faint} />
          <Text style={styles.verifyBtnText}>Verificar Permissões</Text>
        </TouchableOpacity>

        {/* Privacy footnote */}
        <Text style={styles.footnote}>
          Dados de localização nunca são vendidos{'\n'}ou compartilhados fora da Zippy.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(250,245,238,0.08)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: SANS_EB, color: D.text, letterSpacing: -0.5 },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  sectionLabel: {
    fontFamily: MONO_B, fontSize: 9, letterSpacing: 2.5,
    textTransform: 'uppercase', color: D.faint,
    marginBottom: 8, marginLeft: 2,
  },

  section: { marginBottom: 16 },

  // ── Health banner ──
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderRadius: 13, padding: 12,
    borderWidth: 1, marginBottom: 20,
  },
  bannerIcon: {
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  bannerTitle: { fontSize: 13, fontFamily: SANS_B, letterSpacing: -0.1 },
  bannerSub:   { fontSize: 11.5, fontFamily: SANS, color: D.dim, marginTop: 1 },
  bannerCount: { fontFamily: MONO_B, fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },

  // ── Permission card ──
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 14, paddingHorizontal: 16,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    position: 'relative',
  },
  cardIconDot: {
    position: 'absolute', top: -3, right: -3,
    width: 9, height: 9, borderRadius: 4.5, borderWidth: 2,
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
  cardLabel:    { fontSize: 14, fontFamily: SANS_SB, color: D.text, letterSpacing: -0.2, flexShrink: 1 },
  cardSublabel: { fontSize: 12, fontFamily: SANS, color: D.dim, lineHeight: 17 },

  requiredTag: {
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, flexShrink: 0,
  },
  requiredTagText: { fontFamily: MONO_B, fontSize: 8, letterSpacing: 1 },

  // ── Status badge ──
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5, flexShrink: 0 },
  badgeText: { fontFamily: MONO_B, fontSize: 9, letterSpacing: 1 },

  cardDivider: { height: 1, opacity: 0.8 },

  issuePanel: { padding: 13, paddingHorizontal: 16, gap: 10 },
  issueDesc:  { fontSize: 12.5, fontFamily: SANS, color: D.dim, lineHeight: 20 },

  // ── Steps list ──
  stepsList: {
    backgroundColor: D.surf, borderRadius: 10, overflow: 'hidden',
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  stepNum: {
    width: 19, height: 19, borderRadius: 5, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  stepNumText: { fontFamily: MONO_B, fontSize: 9 },
  stepText:    { fontSize: 12, fontFamily: SANS, color: D.dim, lineHeight: 17, flex: 1 },

  // ── CTA ──
  cta: {
    width: '100%', height: 44, borderRadius: 11, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontSize: 13, fontFamily: SANS_B, letterSpacing: -0.1 },

  // ── Verify button ──
  verifyBtn: {
    height: 50, borderRadius: 13,
    backgroundColor: D.surf, borderWidth: 1, borderColor: D.line,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  verifyBtnText: { fontSize: 13, fontFamily: SANS_SB, color: D.dim, letterSpacing: -0.1 },

  // ── Footnote ──
  footnote: {
    marginTop: 20, textAlign: 'center',
    fontFamily: MONO, fontSize: 9.5, color: D.vfaint,
    letterSpacing: 0.8, lineHeight: 17,
  },
});
