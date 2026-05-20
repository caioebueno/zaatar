import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, type Driver } from '@/context/auth';
import { sendOtp, verifyOtp } from '@/lib/driver-api';

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
};

const SANS = 'Geist_400Regular';
const SANS_M = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const SANS_B = 'Geist_700Bold';
const MONO = 'GeistMono_400Regular';
const MONO_M = 'GeistMono_500Medium';
const MONO_SB = 'GeistMono_600SemiBold';
const MONO_B = 'GeistMono_700Bold';

type Country = { code: string; dialCode: string; flag: string; name: string; mask: string };

const COUNTRIES: Country[] = [
  { code: 'BR', dialCode: '55',  flag: '🇧🇷', name: 'Brasil', mask: '(##) #####-####'  },
  { code: 'US', dialCode: '1',   flag: '🇺🇸', name: 'United States', mask: '(###) ###-####'  },
  { code: 'CA', dialCode: '1',   flag: '🇨🇦', name: 'Canada', mask: '(###) ###-####'  },
  { code: 'MX', dialCode: '52',  flag: '🇲🇽', name: 'México', mask: '## #### ####'  },
  { code: 'AR', dialCode: '54',  flag: '🇦🇷', name: 'Argentina', mask: '(###) ###-####'  },
  { code: 'CL', dialCode: '56',  flag: '🇨🇱', name: 'Chile', mask: '# #### ####'  },
  { code: 'CO', dialCode: '57',  flag: '🇨🇴', name: 'Colombia', mask: '### ### ####'  },
  { code: 'PE', dialCode: '51',  flag: '🇵🇪', name: 'Perú', mask: '### ### ###'  },
  { code: 'VE', dialCode: '58',  flag: '🇻🇪', name: 'Venezuela', mask: '(###) ###-####'  },
  { code: 'EC', dialCode: '593', flag: '🇪🇨', name: 'Ecuador', mask: '## ### ####'  },
  { code: 'BO', dialCode: '591', flag: '🇧🇴', name: 'Bolivia', mask: '# ### ####'  },
  { code: 'PY', dialCode: '595', flag: '🇵🇾', name: 'Paraguay', mask: '### ### ###'  },
  { code: 'UY', dialCode: '598', flag: '🇺🇾', name: 'Uruguay', mask: '## ### ####'  },
  { code: 'PT', dialCode: '351', flag: '🇵🇹', name: 'Portugal', mask: '### ### ###'  },
  { code: 'ES', dialCode: '34',  flag: '🇪🇸', name: 'España', mask: '### ### ###'  },
  { code: 'FR', dialCode: '33',  flag: '🇫🇷', name: 'France', mask: '# ## ## ## ##'  },
  { code: 'DE', dialCode: '49',  flag: '🇩🇪', name: 'Deutschland', mask: '### #######'  },
  { code: 'IT', dialCode: '39',  flag: '🇮🇹', name: 'Italia', mask: '### ### ####'  },
  { code: 'GB', dialCode: '44',  flag: '🇬🇧', name: 'United Kingdom', mask: '#### ######'  },
  { code: 'NL', dialCode: '31',  flag: '🇳🇱', name: 'Netherlands', mask: '# #### ####'  },
  { code: 'BE', dialCode: '32',  flag: '🇧🇪', name: 'Belgium', mask: '### ## ## ##'  },
  { code: 'SE', dialCode: '46',  flag: '🇸🇪', name: 'Sweden', mask: '##-### ## ##'  },
  { code: 'NO', dialCode: '47',  flag: '🇳🇴', name: 'Norway', mask: '### ## ###'  },
  { code: 'DK', dialCode: '45',  flag: '🇩🇰', name: 'Denmark', mask: '## ## ## ##'  },
  { code: 'PL', dialCode: '48',  flag: '🇵🇱', name: 'Poland', mask: '### ### ###'  },
  { code: 'RU', dialCode: '7',   flag: '🇷🇺', name: 'Russia', mask: '(###) ###-##-##'  },
  { code: 'TR', dialCode: '90',  flag: '🇹🇷', name: 'Turkey', mask: '### ### ## ##'  },
  { code: 'IL', dialCode: '972', flag: '🇮🇱', name: 'Israel', mask: '##-###-####'  },
  { code: 'SA', dialCode: '966', flag: '🇸🇦', name: 'Saudi Arabia', mask: '## ### ####'  },
  { code: 'AE', dialCode: '971', flag: '🇦🇪', name: 'UAE', mask: '## ### ####'  },
  { code: 'EG', dialCode: '20',  flag: '🇪🇬', name: 'Egypt', mask: '### #### ###'  },
  { code: 'NG', dialCode: '234', flag: '🇳🇬', name: 'Nigeria', mask: '### ### ####'  },
  { code: 'ZA', dialCode: '27',  flag: '🇿🇦', name: 'South Africa', mask: '## ### ####'  },
  { code: 'KE', dialCode: '254', flag: '🇰🇪', name: 'Kenya', mask: '### ### ###'  },
  { code: 'IN', dialCode: '91',  flag: '🇮🇳', name: 'India', mask: '##### #####'  },
  { code: 'PK', dialCode: '92',  flag: '🇵🇰', name: 'Pakistan', mask: '### ### ####'  },
  { code: 'BD', dialCode: '880', flag: '🇧🇩', name: 'Bangladesh', mask: '####-######'  },
  { code: 'CN', dialCode: '86',  flag: '🇨🇳', name: 'China', mask: '### #### ####'  },
  { code: 'JP', dialCode: '81',  flag: '🇯🇵', name: 'Japan', mask: '###-####-####'  },
  { code: 'KR', dialCode: '82',  flag: '🇰🇷', name: 'South Korea', mask: '###-####-####'  },
  { code: 'SG', dialCode: '65',  flag: '🇸🇬', name: 'Singapore', mask: '#### ####'  },
  { code: 'MY', dialCode: '60',  flag: '🇲🇾', name: 'Malaysia', mask: '##-#### ####'  },
  { code: 'ID', dialCode: '62',  flag: '🇮🇩', name: 'Indonesia', mask: '###-####-####'  },
  { code: 'PH', dialCode: '63',  flag: '🇵🇭', name: 'Philippines', mask: '### ### ####'  },
  { code: 'TH', dialCode: '66',  flag: '🇹🇭', name: 'Thailand', mask: '##-###-####'  },
  { code: 'VN', dialCode: '84',  flag: '🇻🇳', name: 'Vietnam', mask: '### ### ####'  },
  { code: 'AU', dialCode: '61',  flag: '🇦🇺', name: 'Australia', mask: '#### ### ###'  },
];

function formatPhoneDisplay(apiPhone: string, dialCode: string): string {
  const local = apiPhone.startsWith(dialCode) ? apiPhone.slice(dialCode.length) : apiPhone;
  return `+${dialCode} ${local}`;
}

// Applies a mask pattern (# = digit slot) to raw digit string.
// Stops as soon as digits are exhausted — no trailing separators.
function applyMask(rawDigits: string, mask: string): string {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits) return '';
  let result = '';
  let di = 0;
  for (let mi = 0; mi < mask.length && di < digits.length; mi++) {
    if (mask[mi] === '#') {
      result += digits[di++];
    } else {
      result += mask[mi];
    }
  }
  return result;
}

function maskMaxDigits(mask: string): number {
  return mask.split('').filter(c => c === '#').length;
}

/* ── PULSING RING ─────────────────────────────────────────────── */
function PulsingRing({ size, borderRadius, delay = 0 }: {
  size: number; borderRadius: number; delay?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    let stopped = false;
    let timeout: ReturnType<typeof setTimeout>;

    const pulse = () => {
      if (stopped) return;
      scale.setValue(1);
      opacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.5, duration: 2700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2700, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !stopped) pulse();
      });
    };

    timeout = setTimeout(pulse, delay);
    return () => {
      stopped = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius,
        borderWidth: 1,
        borderColor: 'rgba(255,61,20,0.24)',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/* ── ZIPPY MARK ───────────────────────────────────────────────── */
function ZippyMark({ size = 54 }: { size?: number }) {
  const s = size / 100;
  // Arc centers in SVG (100×100) are at (50, 60)
  const arcCx = 50 * s;
  const arcCy = 60 * s;
  // Outer arc: radius 32, stroke 6, opacity 0.25
  const outerR = 32 * s;
  const outerStroke = Math.max(1, 6 * s);
  // Inner arc: radius 22, stroke 8, opacity 0.55
  const innerR = 22 * s;
  const innerStroke = Math.max(1, 8 * s);
  // White square: 18×18 at (41, 51), rx 4
  const sqSize = 18 * s;
  const sqX = 41 * s;
  const sqY = 51 * s;
  const sqRx = 4 * s;

  return (
    <View style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      backgroundColor: D.zippy,
      overflow: 'hidden',
    }}>
      {/* Outer arc — clip circle at equator to show top-half ∩ */}
      <View style={{
        position: 'absolute',
        width: outerR * 2, height: outerR,
        overflow: 'hidden',
        top: arcCy - outerR, left: arcCx - outerR,
      }}>
        <View style={{
          width: outerR * 2, height: outerR * 2,
          borderRadius: outerR,
          borderWidth: outerStroke,
          borderColor: 'rgba(255,255,255,0.25)',
          backgroundColor: 'transparent',
        }} />
      </View>
      {/* Inner arc */}
      <View style={{
        position: 'absolute',
        width: innerR * 2, height: innerR,
        overflow: 'hidden',
        top: arcCy - innerR, left: arcCx - innerR,
      }}>
        <View style={{
          width: innerR * 2, height: innerR * 2,
          borderRadius: innerR,
          borderWidth: innerStroke,
          borderColor: 'rgba(255,255,255,0.55)',
          backgroundColor: 'transparent',
        }} />
      </View>
      {/* White dot square */}
      <View style={{
        position: 'absolute',
        width: sqSize, height: sqSize,
        borderRadius: sqRx,
        backgroundColor: '#fff',
        top: sqY, left: sqX,
      }} />
    </View>
  );
}

/* ── COUNTRY PICKER MODAL ────────────────────────────────────── */
function CountryPickerModal({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search.replace('+', ''))
      )
    : COUNTRIES;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[pickerStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>Selecionar país</Text>
          <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={18} color={D.dim} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={pickerStyles.searchRow}>
          <Ionicons name="search-outline" size={16} color={D.faint} />
          <TextInput
            style={pickerStyles.searchInput}
            placeholder="Buscar país ou código…"
            placeholderTextColor={D.faint}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={D.faint} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={c => c.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item); onClose(); }}
              style={[pickerStyles.row, item.code === selected.code && pickerStyles.rowSelected]}
              activeOpacity={0.65}
            >
              <Text style={pickerStyles.flag}>{item.flag}</Text>
              <Text style={pickerStyles.countryName}>{item.name}</Text>
              <Text style={pickerStyles.dialCode}>+{item.dialCode}</Text>
              {item.code === selected.code && (
                <Ionicons name="checkmark" size={16} color={D.zippy} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: D.line, marginLeft: 56 }} />
          )}
        />
      </View>
    </Modal>
  );
}

/* ── CTA BUTTON ───────────────────────────────────────────────── */
function CTABtn({ label, onPress, disabled, loading }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean;
}) {
  const active = !disabled && !loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!active}
      activeOpacity={0.88}
      style={[styles.ctaBtn, active ? styles.ctaBtnActive : styles.ctaBtnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Text style={[styles.ctaBtnLabel, !active && { color: D.faint }]}>{label}</Text>
          {active && <Ionicons name="arrow-forward" size={16} color="#fff" />}
        </>
      )}
    </TouchableOpacity>
  );
}

/* ── PHONE STEP ───────────────────────────────────────────────── */
function PhoneStep({ onNext }: { onNext: (apiPhone: string, dialCode: string) => void }) {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES.find(c => c.code === 'US')!);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const digits = phone; // stored as raw digits only
  const maxDigits = maskMaxDigits(country.mask);
  const ok = digits.length >= maxDigits;
  const apiPhone = `${country.dialCode}${digits}`;

  const submit = async () => {
    if (!ok || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    console.log('[login] phone submit — raw digits:', digits, '| dialCode:', country.dialCode, '| apiPhone:', apiPhone);
    try {
      await sendOtp(apiPhone);
      onNext(apiPhone, country.dialCode);
    } catch {
      setError('Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[
        styles.step,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        { opacity: fadeAnim },
      ]}>
        {/* Logo zone */}
        <View style={styles.logoZone}>
          <View style={{ position: 'relative', width: 54, height: 54, marginBottom: 18, alignItems: 'center', justifyContent: 'center' }}>
            <PulsingRing size={54} borderRadius={54 * 0.22} delay={0} />
            <PulsingRing size={54} borderRadius={54 * 0.22} delay={900} />
            <ZippyMark size={54} />
          </View>
          <Text style={styles.portalLabel}>Portal do Motorista</Text>
        </View>

        {/* Form */}
        <View style={{ flex: 1 }}>
          <Text style={styles.headline}>Bem-vindo de volta.</Text>

          <Text style={styles.fieldLabel}>Número de Telefone</Text>

          <View style={[styles.phoneRow, focused && styles.phoneRowFocused]}>
            <TouchableOpacity
              style={styles.countryCode}
              onPress={() => { Keyboard.dismiss(); setPickerVisible(true); }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 17 }}>{country.flag}</Text>
              <Text style={styles.ccText}>+{country.dialCode}</Text>
              <Ionicons name="chevron-down" size={12} color={D.faint} />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              keyboardType="phone-pad"
              placeholder={country.mask.replace(/#/g, '0')}
              placeholderTextColor="rgba(250,245,238,0.20)"
              value={applyMask(phone, country.mask)}
              onChangeText={(v) => {
                const raw = v.replace(/\D/g, '').slice(0, maxDigits);
                setPhone(raw);
                setError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={submit}
              returnKeyType="send"
            />
          </View>

          <CountryPickerModal
            visible={pickerVisible}
            selected={country}
            onSelect={(c) => { setCountry(c); setPhone(''); }}
            onClose={() => setPickerVisible(false)}
          />

          {error
            ? <Text style={styles.errorText}>{error}</Text>
            : <Text style={styles.hintText}>Um código de 6 dígitos será enviado por SMS.</Text>
          }

          <CTABtn label="Enviar Código" onPress={submit} disabled={!ok} loading={loading} />

          <View style={styles.noAccountRow}>
            <View style={{ width: 32, height: 1, backgroundColor: D.line }} />
            <Text style={styles.noAccountText}>Não tem conta? Fale com seu gestor de frota.</Text>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/* ── OTP STEP ─────────────────────────────────────────────────── */
function OtpCursor() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 2, height: 26, borderRadius: 1, backgroundColor: D.zippy, opacity }} />;
}

function OTPStep({ phone, dialCode, onBack, onVerified }: {
  phone: string;
  dialCode: string;
  onBack: () => void;
  onVerified: (driver: Driver, token: string) => void;
}) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [focused, setFocused] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);
  const hiddenRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    const t = setTimeout(() => hiddenRef.current?.focus(), 120);
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => { clearTimeout(t); clearInterval(timer); };
  }, []);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const verify = async (d = digits) => {
    const code = d.join('');
    if (code.length < 6 || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setErrMsg('');
    try {
      const result = await verifyOtp(phone, code);
      onVerified(result.driver, result.accessToken);
    } catch (e: any) {
      const reason = e?.data?.reason;
      const remaining = e?.data?.remainingAttempts;
      if (reason === 'OTP_NOT_FOUND_OR_EXPIRED') {
        setErrMsg('Código expirado — reenvie o código.');
      } else if (reason === 'OTP_INVALID') {
        setErrMsg(`Código inválido${remaining != null ? ` — ${remaining} tentativas restantes` : ''}.`);
      } else if (e?.status === 404) {
        setErrMsg('Motorista não encontrado.');
      } else {
        setErrMsg('Erro ao verificar. Tente novamente.');
      }
      shake();
      setDigits(Array(6).fill(''));
      setTimeout(() => hiddenRef.current?.focus(), 80);
    } finally {
      setLoading(false);
    }
  };

  const onHiddenChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('') as string[];
    cleaned.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    setErrMsg('');
    if (cleaned.length === 6) verify(next);
  };

  const resend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await sendOtp(phone);
      setCountdown(30);
      setErrMsg('');
    } catch {
      setErrMsg('Não foi possível reenviar. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  const all = digits.every(d => d !== '');
  const hasErr = !!errMsg;
  const activeBox = digits.findIndex(d => d === '');
  const cursorBox = activeBox === -1 ? 5 : activeBox;

  const boxStyle = (i: number) => [
    styles.otpBox,
    hasErr && styles.otpBoxErr,
    !hasErr && digits[i] ? styles.otpBoxFilled : null,
    focused && i === cursorBox && !hasErr && styles.otpBoxActive,
  ];

  return (
    <Animated.View style={[
      styles.step,
      { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      { opacity: fadeAnim },
    ]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={17} color={D.dim} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, paddingTop: 10 }}>
        <View style={styles.smsIconBadge}>
          <Ionicons name="chatbubble-outline" size={21} color={D.green} />
        </View>

        <Text style={[styles.headline, { fontSize: 29, marginBottom: 9 }]}>Verifique seu SMS.</Text>
        <Text style={[styles.subline, { marginBottom: 34 }]}>
          Código enviado para{' '}
          <Text style={styles.phoneDisplay}>{formatPhoneDisplay(phone, dialCode)}</Text>
        </Text>

        {/* OTP boxes 3 — 3 */}
        <TouchableOpacity activeOpacity={1} onPress={() => hiddenRef.current?.focus()}>
          <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
            {[0, 1, 2].map(i => (
              <View key={i} style={boxStyle(i)}>
                {digits[i]
                  ? <Text style={[styles.otpDigit, hasErr && { color: D.zippy }]}>{digits[i]}</Text>
                  : focused && i === cursorBox ? <OtpCursor /> : null}
              </View>
            ))}

            <View style={styles.otpDash}>
              <View style={{ width: 7, height: 1.5, borderRadius: 1, backgroundColor: D.faint }} />
            </View>

            {[3, 4, 5].map(i => (
              <View key={i} style={boxStyle(i)}>
                {digits[i]
                  ? <Text style={[styles.otpDigit, hasErr && { color: D.zippy }]}>{digits[i]}</Text>
                  : focused && i === cursorBox ? <OtpCursor /> : null}
              </View>
            ))}
          </Animated.View>
        </TouchableOpacity>

        {/* Hidden input that captures all typing and paste */}
        <TextInput
          ref={hiddenRef}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, top: 0, left: 0 }}
          value={digits.join('')}
          maxLength={6}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          onChangeText={onHiddenChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          caretHidden
        />

        <Text style={[styles.otpError, { opacity: hasErr ? 1 : 0 }]}>
          {errMsg || ' '}
        </Text>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Reenviar em <Text style={styles.countdownNum}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={resend} disabled={resending}>
              <Text style={[styles.resendText, resending && { opacity: 0.5 }]}>
                {resending ? 'Enviando…' : 'Reenviar código →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <CTABtn label="Verificar Código" onPress={() => verify()} disabled={!all} loading={loading} />
      </View>
    </Animated.View>
  );
}

/* ── SUCCESS STEP ─────────────────────────────────────────────── */
function SuccessStep({ driverName, onDone }: { driverName: string; onDone: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.58)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[
      styles.successContainer,
      { paddingBottom: insets.bottom + 24, opacity: fadeAnim },
    ]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 10, position: 'relative', width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
        <PulsingRing size={84} borderRadius={42} delay={0} />
        <PulsingRing size={84} borderRadius={42} delay={780} />
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={38} color={D.green} />
        </View>
      </Animated.View>

      <Text style={[styles.headline, { textAlign: 'center', fontSize: 34 }]}>Tudo certo!</Text>
      <Text style={[styles.subline, { textAlign: 'center' }]}>
        Bom ter você de volta,{' '}
        <Text style={{ fontFamily: SANS_B, color: D.text }}>{driverName}</Text>.
      </Text>

      <View style={styles.loadingChip}>
        <ActivityIndicator color={D.faint} size="small" />
        <Text style={styles.loadingText}>Buscando sua rota…</Text>
      </View>
    </Animated.View>
  );
}

/* ── LOGIN SCREEN ─────────────────────────────────────────────── */
export default function LoginScreen() {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('55');
  const [driverName, setDriverName] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleVerified = async (driver: Driver, token: string) => {
    await login(token, driver);
    setDriverName(driver.name);
    setStep('success');
  };

  const handleDone = () => {
    router.replace('/location-permission');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {step === 'phone' && (
        <PhoneStep onNext={(p, dc) => { setPhone(p); setDialCode(dc); setStep('otp'); }} />
      )}
      {step === 'otp' && (
        <OTPStep
          phone={phone}
          dialCode={dialCode}
          onBack={() => setStep('phone')}
          onVerified={handleVerified}
        />
      )}
      {step === 'success' && (
        <SuccessStep driverName={driverName} onDone={handleDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: D.bg,
  },
  step: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoZone: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 52,
  },
  portalLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2.4,
    color: D.faint,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 31,
    fontFamily: SANS_B,
    color: D.text,
    letterSpacing: -1.2,
    lineHeight: 33,
    marginBottom: 9,
  },
  subline: {
    fontSize: 15,
    color: D.dim,
    lineHeight: 24,
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: D.faint,
    textTransform: 'uppercase',
    marginBottom: 9,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surf,
    borderWidth: 1.5,
    borderColor: D.line,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 11,
  },
  phoneRowFocused: {
    borderColor: D.zippy,
    shadowColor: D.zippy,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.11,
    shadowRadius: 8,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 54,
    borderRightWidth: 1,
    borderRightColor: D.line,
  },
  ccText: {
    fontFamily: MONO_SB,
    fontSize: 14,
    color: D.dim,
  },
  phoneInput: {
    flex: 1,
    height: 54,
    paddingHorizontal: 16,
    fontFamily: MONO_M,
    fontSize: 15,
    color: D.text,
    letterSpacing: 0.9,
  },
  hintText: {
    fontFamily: MONO,
    fontSize: 10,
    color: D.faint,
    letterSpacing: 0.6,
    marginBottom: 28,
  },
  errorText: {
    fontFamily: MONO,
    fontSize: 10,
    color: D.zippy,
    letterSpacing: 0.6,
    marginBottom: 28,
  },
  noAccountRow: {
    marginTop: 'auto',
    paddingTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  noAccountText: {
    fontFamily: MONO,
    fontSize: 12,
    color: D.faint,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  ctaBtnActive: {
    backgroundColor: D.zippy,
    shadowColor: D.zippy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaBtnDisabled: {
    backgroundColor: D.surf3,
  },
  ctaBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontFamily: SANS_B,
    letterSpacing: -0.15,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 14,
  },
  backText: {
    fontSize: 14,
    fontFamily: SANS_SB,
    color: D.dim,
  },
  smsIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(52,211,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,154,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  phoneDisplay: {
    fontFamily: MONO_SB,
    fontSize: 13,
    color: D.text,
    letterSpacing: 0.5,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: D.line,
    backgroundColor: D.surf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: 'rgba(250,245,238,0.15)',
    backgroundColor: D.surf2,
  },
  otpBoxErr: {
    borderColor: 'rgba(255,61,20,0.45)',
    backgroundColor: 'rgba(255,61,20,0.06)',
  },
  otpBoxActive: {
    borderColor: D.zippy,
  },
  otpDigit: {
    fontFamily: MONO_B,
    fontSize: 24,
    color: D.text,
  },
  otpDash: {
    width: 14,
    alignItems: 'center',
    flexShrink: 0,
  },
  otpError: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 0.5,
    color: D.zippy,
    minHeight: 18,
    marginBottom: 10,
    transition: 'opacity 180ms',
  } as any,
  resendRow: {
    marginBottom: 28,
  },
  countdownText: {
    fontFamily: MONO,
    fontSize: 11,
    color: D.faint,
    letterSpacing: 0.4,
  },
  countdownNum: {
    color: D.dim,
    fontFamily: MONO_SB,
  },
  resendText: {
    fontFamily: MONO_B,
    fontSize: 11,
    color: D.zippy,
    letterSpacing: 0.3,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 11,
  },
  checkCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(52,211,154,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(52,211,154,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingChip: {
    marginTop: 14,
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
  loadingText: {
    fontFamily: MONO,
    fontSize: 11,
    color: D.faint,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

const pickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.surf,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: D.line,
  },
  title: {
    fontSize: 17,
    fontFamily: SANS_B,
    color: D.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: D.surf3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: D.surf2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: D.line,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: D.text,
    fontFamily: MONO,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: 'rgba(255,61,20,0.06)',
  },
  flag: {
    fontSize: 22,
    width: 32,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    color: D.text,
    fontFamily: SANS_M,
  },
  dialCode: {
    fontFamily: MONO,
    fontSize: 13,
    color: D.dim,
    letterSpacing: 0.3,
  },
});
