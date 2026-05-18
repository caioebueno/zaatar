import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
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
  amber: '#f2b338',
};

const SANS = 'Geist_400Regular';
const SANS_B = 'Geist_700Bold';
const SANS_EB = 'Geist_800ExtraBold';
const MONO = 'GeistMono_400Regular';
const MONO_B = 'GeistMono_700Bold';

// ─── ZippyMark (view-based, no SVG) ──────────────────────────────────────────
function ZippyMark({ size = 24 }: { size?: number }) {
  const s = size / 100;
  const cx = 50 * s;
  const cy = 60 * s;

  return (
    <View style={{ width: size, height: size }}>
      {/* Outer arc */}
      <View
        style={{
          position: 'absolute',
          left: cx - 32 * s,
          top: cy - 32 * s,
          width: 64 * s,
          height: 32 * s,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 64 * s,
            height: 64 * s,
            borderRadius: 32 * s,
            borderWidth: 6 * s,
            borderColor: D.text,
          }}
        />
      </View>
      {/* Inner arc */}
      <View
        style={{
          position: 'absolute',
          left: cx - 22 * s,
          top: cy - 22 * s,
          width: 44 * s,
          height: 22 * s,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 44 * s,
            height: 44 * s,
            borderRadius: 22 * s,
            borderWidth: 8 * s,
            borderColor: D.text,
          }}
        />
      </View>
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

// ─── Pulsing ring ─────────────────────────────────────────────────────────────
function PulsingRing({ size, color, delay }: { size: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stopped = { current: false };
    const run = () => {
      if (stopped.current) return;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 2100, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        ]),
      ]).start(() => {
        anim.setValue(0);
        run();
      });
    };
    run();
    return () => { stopped.current = true; };
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.5, 0.3, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity,
        transform: [{ scale }],
        alignSelf: 'center',
      }}
    />
  );
}

// ─── Radar hero ───────────────────────────────────────────────────────────────
function RadarHero() {
  const SIZE = 200;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3600,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Dot positions + colors scattered around the rings
  const dots: { x: number; y: number; r: number; color: string; delay: number }[] = [
    { x: 100, y: 42,  r: 3.5, color: D.zippy, delay: 0 },
    { x: 148, y: 72,  r: 3,   color: D.amber, delay: 400 },
    { x: 58,  y: 88,  r: 2.5, color: D.green, delay: 700 },
    { x: 130, y: 115, r: 3,   color: D.amber, delay: 200 },
    { x: 68,  y: 120, r: 2.5, color: D.zippy, delay: 1000 },
    { x: 150, y: 140, r: 3.5, color: D.green, delay: 550 },
    { x: 42,  y: 152, r: 3,   color: D.amber, delay: 850 },
  ];

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Concentric rings */}
      {[40, 70, 100, 130, 160].map(r => (
        <View
          key={r}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            borderWidth: r === 100 ? 1.5 : 1,
            borderColor: r === 100 ? 'rgba(255,61,20,0.12)' : 'rgba(250,245,238,0.04)',
            borderStyle: r === 100 ? 'solid' : 'dashed',
          }}
        />
      ))}

      {/* Rotating sweep line */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 2,
          height: 96,
          bottom: SIZE / 2,
          left: SIZE / 2 - 1,
          transformOrigin: 'bottom',
          transform: [{ rotate }],
          backgroundColor: 'rgba(255,61,20,0.5)',
        }}
      />

      {/* Dots */}
      {dots.map((dot, i) => (
        <PingDot key={i} x={dot.x} y={dot.y} r={dot.r} color={dot.color} delay={dot.delay} />
      ))}

      {/* Active rings around center */}
      <PulsingRing size={36} color={D.zippy} delay={0} />
      <PulsingRing size={36} color={D.zippy} delay={900} />

      {/* Center pin — diamond (square rotated 45°) */}
      <View
        style={{
          position: 'absolute',
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: D.zippy,
          transform: [{ rotate: '45deg' }],
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: D.zippy,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.55,
          shadowRadius: 10,
          elevation: 8,
          top: SIZE / 2 - 22,
        }}
      />
      {/* Center icon (on top of diamond, not rotated) */}
      <View style={{ position: 'absolute', top: SIZE / 2 - 22, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="locate" size={13} color="#fff" />
      </View>
    </View>
  );
}

function PingDot({ x, y, r, color, delay }: { x: number; y: number; r: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.15, duration: 1100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: color,
        left: x - r,
        top: y - r,
        opacity: 0.85,
        transform: [{ scale: anim }],
      }}
    />
  );
}

// ─── Reason row ───────────────────────────────────────────────────────────────
function ReasonRow({
  iconName,
  title,
  desc,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <View style={s.reasonRow}>
      <View style={s.reasonIcon}>
        <Ionicons name={iconName} size={17} color={D.zippy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.reasonTitle}>{title}</Text>
        <Text style={s.reasonDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── In-app primer dialog (shown before system prompt) ────────────────────────
function PrimerDialog({
  onAllow,
  onDeny,
}: {
  onAllow: () => void;
  onDeny: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, s.dialogOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[s.dialogCard, { transform: [{ scale: scaleAnim }] }]}>
        {/* Header */}
        <View style={s.dialogHeader}>
          <View style={s.dialogAppIcon}>
            <ZippyMark size={28} />
          </View>
          <Text style={s.dialogTitle}>
            Permitir que "Zippy" acesse sua localização?
          </Text>
          <Text style={s.dialogBody}>
            O app Zippy usa sua localização em segundo plano para monitorar e distribuir rotas mesmo quando o app não está aberto.
          </Text>
        </View>

        {/* Map preview strip */}
        <View style={s.mapStrip}>
          {/* Grid */}
          {[0, 1, 2, 3, 4].map(i => (
            <View key={`h${i}`} style={[s.mapGridH, { top: i * 22 }]} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <View key={`v${i}`} style={[s.mapGridV, { left: i * 38 }]} />
          ))}
          {/* Route dots */}
          <View style={[s.mapDot, { left: 14, top: 60, backgroundColor: D.green }]} />
          <View style={[s.mapDot, { right: 14, top: 34, backgroundColor: D.zippy }]} />
          <Text style={s.mapLabel}>Em segundo plano</Text>
        </View>

        <View style={s.dialogDivider} />

        {/* Buttons */}
        <TouchableOpacity style={s.dialogBtnPrimary} onPress={onAllow} activeOpacity={0.75}>
          <Text style={s.dialogBtnPrimaryText}>Sempre Permitir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dialogBtnSecondary} onPress={onDeny} activeOpacity={0.75}>
          <Text style={s.dialogBtnSecondaryText}>Não Permitir</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Denied state ─────────────────────────────────────────────────────────────
function DeniedState({ onRetry }: { onRetry: () => void }) {
  const steps: [string, string][] = [
    ['1', Platform.OS === 'ios' ? 'Abra as Configurações do iPhone' : 'Abra as Configurações do dispositivo'],
    ['2', Platform.OS === 'ios' ? 'Toque em Privacidade → Localização' : 'Toque em Aplicativos → Zippy → Permissões'],
    ['3', 'Encontre "Zippy" na lista'],
    ['4', 'Selecione "Sempre"'],
  ];

  return (
    <ScrollView
      contentContainerStyle={s.deniedContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Warning badge */}
      <View style={s.warningBadge}>
        <Ionicons name="warning" size={28} color={D.amber} />
      </View>

      <Text style={s.deniedTitle}>Permissão Negada</Text>

      <Text style={s.deniedBody}>
        A localização em segundo plano é{' '}
        <Text style={{ fontFamily: SANS_B, color: D.text }}>obrigatória</Text>
        {' '}para receber e completar entregas com o Zippy.
      </Text>

      {/* Instructions card */}
      <View style={s.instructionCard}>
        <Text style={s.instructionLabel}>Como ativar manualmente</Text>
        {steps.map(([num, text], i) => (
          <View key={num}>
            <View style={s.instructionRow}>
              <View style={s.instructionNum}>
                <Text style={s.instructionNumText}>{num}</Text>
              </View>
              <Text style={s.instructionText}>{text}</Text>
            </View>
            {i < steps.length - 1 && <View style={s.instructionDivider} />}
          </View>
        ))}
      </View>

      {/* Retry / settings CTA */}
      <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.82}>
        <Ionicons name="refresh" size={15} color={D.dim} />
        <Text style={s.retryBtnText}>Verificar Permissão</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.settingsBtn}
        onPress={() => Linking.openSettings()}
        activeOpacity={0.82}
      >
        <Ionicons name="settings-outline" size={15} color={D.zippy} />
        <Text style={s.settingsBtnText}>Abrir Configurações</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Activating state ─────────────────────────────────────────────────────────
function ActivatingState({ onDone }: { onDone: () => void }) {
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.activatingWrap}>
      {/* Pulsing green rings */}
      <View style={s.activatingRings}>
        <PulsingRing size={80} color={D.green} delay={0} />
        <PulsingRing size={80} color={D.green} delay={700} />
        <PulsingRing size={80} color={D.green} delay={1400} />
        <Animated.View
          style={[
            s.activatingCircle,
            { transform: [{ scale: checkScale }], opacity: checkOpacity },
          ]}
        >
          <Ionicons name="checkmark" size={34} color={D.green} />
        </Animated.View>
      </View>

      <Text style={s.activatingTitle}>Localização ativa.</Text>
      <Text style={s.activatingBody}>
        Monitoramento em segundo plano ligado. Você está pronto para receber rotas.
      </Text>

      <View style={s.loadingChip}>
        <SpinnerView />
        <Text style={s.loadingChipText}>Carregando painel…</Text>
      </View>
    </View>
  );
}

function SpinnerView() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 720, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="refresh" size={16} color={D.faint} />
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
type ScreenState = 'request' | 'dialog' | 'checking' | 'denied' | 'activating';

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('request');

  // Skip screen if already granted
  useEffect(() => {
    Location.getBackgroundPermissionsAsync().then(({ granted }) => {
      if (granted) router.replace('/(tabs)');
    });
  }, []);

  // Re-check when app returns to foreground — catches:
  //   Android 11+: system redirects to Settings, function returns before user acts
  //   iOS: deferred "Always Allow" prompt shown later as notification
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active') return;
      const { granted } = await Location.getBackgroundPermissionsAsync();
      if (granted) setState('activating');
    });
    return () => sub.remove();
  }, []);

  const requestPermission = useCallback(async () => {
    setState('checking');
    try {
      // iOS requires foreground to be granted before it will show the
      // background ("Always Allow") prompt.
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted) {
        setState('denied');
        return;
      }
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.granted) {
        setState('activating');
      } else {
        // iOS: user chose "When In Use" — must change to "Always" in Settings.
        // Android 11+: system redirected to Settings without blocking.
        // AppState listener will catch it when the user returns.
        setState('denied');
      }
    } catch {
      setState('denied');
    }
  }, []);

  const handlePrimerAllow = () => {
    requestPermission();
  };

  const handlePrimerDeny = () => {
    setState('denied');
  };

  const handleRetry = useCallback(async () => {
    const { granted } = await Location.getBackgroundPermissionsAsync();
    if (granted) {
      setState('activating');
    } else {
      setState('request');
    }
  }, []);

  const handleDone = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (state === 'activating') {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <GridTexture />
        <ActivatingState onDone={handleDone} />
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <GridTexture />

      {/* Top logo pill */}
      <View style={s.logoPill}>
        <ZippyMark size={22} />
        <Text style={s.logoPillText}>Portal do Motorista</Text>
      </View>

      {state === 'denied' ? (
        <DeniedState onRetry={handleRetry} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.heroWrap}>
            <RadarHero />
          </View>

          {/* Mandatory badge */}
          <View style={s.badgeWrap}>
            <View style={s.mandatoryBadge}>
              <Ionicons name="information-circle" size={12} color={D.zippy} />
              <Text style={s.mandatoryBadgeText}>Permissão Obrigatória</Text>
            </View>
          </View>

          {/* Headline */}
          <Text style={s.headline}>Ative a localização{'\n'}
            <Text style={s.headlineAccent}>em segundo plano.</Text>
          </Text>

          <Text style={s.subline}>
            Para distribuir rotas e registrar entregas, o Zippy precisa monitorar sua posição mesmo com o app fechado.
          </Text>

          {/* Reason rows */}
          <View style={s.reasonCard}>
            <ReasonRow
              iconName="send"
              title="Distribuição automática"
              desc="Novas entregas chegam no momento certo com base na sua posição atual."
            />
            <View style={s.reasonDivider} />
            <ReasonRow
              iconName="time"
              title="ETA em tempo real"
              desc="Restaurante e cliente veem o progresso ao vivo e recebem alertas precisos."
            />
            <View style={s.reasonDivider} />
            <ReasonRow
              iconName="lock-closed"
              title="Privacidade garantida"
              desc="Dados de localização nunca são vendidos ou compartilhados fora da Zippy."
            />
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={requestPermission}
            activeOpacity={0.88}
            disabled={state === 'checking'}
          >
            <Ionicons name="location" size={17} color="#fff" />
            <Text style={s.ctaBtnText}>Ativar Localização</Text>
          </TouchableOpacity>

          {/* Privacy note */}
          <Text style={s.privacyNote}>
            Apenas "Sempre Permitir" habilita todas as funções.
          </Text>
        </ScrollView>
      )}

      {/* In-app primer dialog */}
      {state === 'dialog' && (
        <PrimerDialog onAllow={handlePrimerAllow} onDeny={handlePrimerDeny} />
      )}
    </View>
  );
}

// ─── Grid texture background ──────────────────────────────────────────────────
function GridTexture() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {Array.from({ length: 14 }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * 42,
            height: 1,
            backgroundColor: 'rgba(250,245,238,0.028)',
          }}
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: i * 42,
            width: 1,
            backgroundColor: 'rgba(250,245,238,0.028)',
          }}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: D.bg,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 12,
    zIndex: 1,
  },
  logoPillText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: D.faint,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    gap: 0,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  mandatoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,61,20,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,20,0.22)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  mandatoryBadgeText: {
    fontFamily: MONO_B,
    fontSize: 10,
    color: D.zippy,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: SANS_EB,
    fontSize: 28,
    color: D.text,
    letterSpacing: -1.1,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 6,
  },
  headlineAccent: {
    fontFamily: SANS_EB,
    fontSize: 28,
    letterSpacing: -1.1,
    lineHeight: 32,
    color: D.zippy,
  },
  subline: {
    fontFamily: SANS,
    fontSize: 14,
    color: D.dim,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  reasonCard: {
    backgroundColor: D.surf,
    borderWidth: 1,
    borderColor: D.line,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,61,20,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,20,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  reasonTitle: {
    fontFamily: SANS_B,
    fontSize: 14,
    color: D.text,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  reasonDesc: {
    fontFamily: SANS,
    fontSize: 12,
    color: D.dim,
    lineHeight: 18,
  },
  reasonDivider: {
    height: 1,
    backgroundColor: D.line,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 56,
    borderRadius: 16,
    backgroundColor: D.zippy,
    marginBottom: 12,
    shadowColor: D.zippy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaBtnText: {
    fontFamily: SANS_B,
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.1,
  },
  privacyNote: {
    fontFamily: MONO,
    fontSize: 10,
    color: D.faint,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingBottom: 16,
  },

  // Dialog
  dialogOverlay: {
    backgroundColor: 'rgba(10,8,7,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    zIndex: 80,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: 'rgba(44,38,32,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(250,245,238,0.12)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  dialogHeader: {
    padding: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },
  dialogAppIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: D.zippy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontFamily: SANS_B,
    fontSize: 17,
    color: D.text,
    letterSpacing: -0.3,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 9,
  },
  dialogBody: {
    fontFamily: SANS,
    fontSize: 13,
    color: D.dim,
    lineHeight: 20,
    textAlign: 'center',
  },
  mapStrip: {
    marginHorizontal: 14,
    marginBottom: 16,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: D.surf2,
    borderWidth: 1,
    borderColor: D.line,
    position: 'relative',
  },
  mapGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(250,245,238,0.06)',
  },
  mapGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(250,245,238,0.06)',
  },
  mapDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  mapLabel: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1.2,
    color: D.faint,
    textTransform: 'uppercase',
  },
  dialogDivider: {
    height: 1,
    backgroundColor: D.line,
  },
  dialogBtnPrimary: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: D.line,
  },
  dialogBtnPrimaryText: {
    fontFamily: SANS_B,
    fontSize: 17,
    color: D.zippy,
    letterSpacing: -0.1,
  },
  dialogBtnSecondary: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dialogBtnSecondaryText: {
    fontFamily: SANS,
    fontSize: 17,
    color: D.dim,
    letterSpacing: -0.1,
  },

  // Denied
  deniedContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 14,
  },
  warningBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(242,179,56,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(242,179,56,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedTitle: {
    fontFamily: SANS_EB,
    fontSize: 26,
    color: D.text,
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  deniedBody: {
    fontFamily: SANS,
    fontSize: 14,
    color: D.dim,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionCard: {
    width: '100%',
    backgroundColor: D.surf,
    borderWidth: 1,
    borderColor: D.line,
    borderRadius: 14,
    padding: 16,
  },
  instructionLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1.8,
    color: D.faint,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,61,20,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,20,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionNumText: {
    fontFamily: MONO_B,
    fontSize: 11,
    color: D.zippy,
  },
  instructionText: {
    fontFamily: SANS,
    fontSize: 13,
    color: D.dim,
    lineHeight: 18,
    flex: 1,
  },
  instructionDivider: {
    height: 1,
    backgroundColor: D.line,
    marginVertical: 11,
  },
  retryBtn: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: D.surf3,
    borderWidth: 1.5,
    borderColor: 'rgba(250,245,238,0.12)',
    borderRadius: 16,
  },
  retryBtnText: {
    fontFamily: SANS_B,
    fontSize: 15,
    color: D.text,
    letterSpacing: -0.1,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  settingsBtnText: {
    fontFamily: SANS_B,
    fontSize: 14,
    color: D.zippy,
  },

  // Activating
  activatingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  activatingRings: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activatingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52,211,154,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(52,211,154,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activatingTitle: {
    fontFamily: SANS_EB,
    fontSize: 28,
    color: D.text,
    letterSpacing: -1.1,
    textAlign: 'center',
  },
  activatingBody: {
    fontFamily: SANS,
    fontSize: 14,
    color: D.dim,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: D.surf,
    borderWidth: 1,
    borderColor: D.line,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  loadingChipText: {
    fontFamily: MONO,
    fontSize: 11,
    color: D.faint,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
