import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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

// ─── Zappy tokens (dark) ──────────────────────────────────────────────────────
const Z = {
  bg:       '#191919',
  surface:  '#252525',
  elevated: '#2F2F2F',
  border:   'rgba(255,255,255,0.094)',
  divider:  'rgba(255,255,255,0.055)',
  fg1:      '#F1F1F1',
  fg2:      '#9B9B9B',
  fg3:      '#B4B4B4',
  brand:    '#FF3D14',
  brandHover: '#D93411',
  success:  '#22C55E',
  error:    '#EF4444',
};

const SANS    = 'Geist_400Regular';
const SANS_M  = 'Geist_500Medium';
const SANS_SB = 'Geist_600SemiBold';
const MONO    = 'GeistMono_400Regular';
const MONO_M  = 'GeistMono_500Medium';

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

function applyMask(rawDigits: string, mask: string): string {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits) return '';
  let result = '';
  let di = 0;
  for (let mi = 0; mi < mask.length && di < digits.length; mi++) {
    if (mask[mi] === '#') result += digits[di++];
    else result += mask[mi];
  }
  return result;
}

function maskMaxDigits(mask: string): number {
  return mask.split('').filter((c) => c === '#').length;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const active = !disabled && !loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!active}
      activeOpacity={0.9}
      style={{
        width: '100%', height: 52, borderRadius: 8,
        backgroundColor: active ? Z.brand : Z.elevated,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : (
        <Text style={{ fontFamily: SANS_M, fontSize: 16, color: active ? '#fff' : Z.fg3 }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

// ─── Country picker ───────────────────────────────────────────────────────────
function CountryPicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (c: Country) => void }) {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const q = search.trim().toLowerCase();
  const list = q
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q.replace('+', '')))
    : COUNTRIES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ height: '78%', backgroundColor: Z.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: Z.border, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Z.divider }}>
            <Text style={{ flex: 1, fontFamily: SANS_SB, fontSize: 17, color: Z.fg1 }}>Selecione o país</Text>
            <TouchableOpacity onPress={() => { setSearch(''); onClose(); }} style={{ width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={20} color={Z.fg2} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, backgroundColor: Z.surface, borderWidth: 1, borderColor: Z.border, borderRadius: 8 }}>
              <Ionicons name="search" size={16} color={Z.fg3} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar país ou código"
                placeholderTextColor={Z.fg3}
                style={{ flex: 1, fontFamily: SANS, fontSize: 15, color: Z.fg1 }}
              />
            </View>
          </View>
          <FlatList
            data={list}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setSearch(''); onSelect(item); onClose(); }}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Z.divider }}
              >
                <Text style={{ fontSize: 20 }}>{item.flag}</Text>
                <Text style={{ flex: 1, fontFamily: SANS_M, fontSize: 15, color: Z.fg1 }}>{item.name}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 14, color: Z.fg3 }}>+{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Step 1: phone ────────────────────────────────────────────────────────────
function PhoneStep({ onNext }: { onNext: (apiPhone: string, dialCode: string) => void }) {
  const [country, setCountry] = useState<Country>(COUNTRIES.find((c) => c.code === 'US')!);
  const [phone, setPhone] = useState(''); // raw digits
  const [pickerVisible, setPickerVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);

  const maxDigits = maskMaxDigits(country.mask);
  const ok = phone.length >= maxDigits;
  const apiPhone = `${country.dialCode}${phone}`;

  const submit = () => {
    if (!ok) return;
    Keyboard.dismiss();
    // Go to the code screen immediately — the SMS is sent in the background from
    // the OTP step, so the input appears instantly instead of waiting on the
    // network round-trip (which is what left the screen blank on TestFlight).
    onNext(apiPhone, country.dialCode);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, opacity: fade }]}>
        <View style={{ paddingTop: 28 }}>
          <Text style={{ fontFamily: MONO_M, fontSize: 17, color: Z.fg1, letterSpacing: -0.3 }}>Zappy</Text>
        </View>

        <View style={{ flex: 1, paddingTop: 40 }}>
          <Text style={styles.h1}>Entrar para dirigir</Text>
          <Text style={styles.subtitle}>Digite seu telefone. Enviaremos um código de 6 dígitos por SMS.</Text>

          <View style={{ marginTop: 40 }}>
            <Label>Número de telefone</Label>
            <View style={[styles.phoneRow, { borderColor: error ? Z.error : focused ? Z.brand : Z.border }]}>
              <TouchableOpacity
                style={styles.countryChip}
                onPress={() => { Keyboard.dismiss(); setPickerVisible(true); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16 }}>{country.flag}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 15, color: Z.fg2 }}>+{country.dialCode}</Text>
                <Ionicons name="chevron-down" size={12} color={Z.fg3} />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                keyboardType="phone-pad"
                placeholder={country.mask.replace(/#/g, '0')}
                placeholderTextColor={Z.fg3}
                value={applyMask(phone, country.mask)}
                onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, maxDigits)); setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </View>
            <Text style={styles.errorText}>{error || ' '}</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <PrimaryButton label="Enviar código" onPress={submit} disabled={!ok} />
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </Animated.View>

      <CountryPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={(c) => { setCountry(c); setPhone(''); }} />
    </KeyboardAvoidingView>
  );
}

// ─── Step 2: code ─────────────────────────────────────────────────────────────
function OTPStep({ phone, dialCode, onBack, onVerified }: {
  phone: string;
  dialCode: string;
  onBack: () => void;
  onVerified: (driver: Driver, token: string) => void;
}) {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);
  const hiddenRef = useRef<TextInput>(null);
  const sentRef = useRef(false);
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    const t = setTimeout(() => hiddenRef.current?.focus(), 140);
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    // Send the code in the background so this screen renders instantly. The guard
    // avoids a double send (e.g. StrictMode remount).
    if (!sentRef.current) {
      sentRef.current = true;
      sendOtp(phone).catch(() => setError('Não foi possível enviar o código. Toque em reenviar.'));
    }
    return () => { clearTimeout(t); clearInterval(timer); };
  }, []);

  const verify = async (value = code) => {
    if (value.length < 6 || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(phone, value);
      onVerified(result.driver, result.accessToken);
    } catch (e: any) {
      const reason = e?.data?.reason;
      const remaining = e?.data?.remainingAttempts;
      if (reason === 'OTP_NOT_FOUND_OR_EXPIRED') setError('Código expirado — reenvie o código.');
      else if (reason === 'OTP_INVALID') setError(`Código inválido${remaining != null ? ` — ${remaining} tentativas restantes` : ''}.`);
      else if (e?.status === 404) setError('Motorista não encontrado.');
      else setError('Erro ao verificar. Tente novamente.');
      setCode('');
      setTimeout(() => hiddenRef.current?.focus(), 80);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    setError('');
    if (cleaned.length === 6) verify(cleaned);
  };

  const resend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await sendOtp(phone);
      setCountdown(30);
      setError('');
    } catch {
      setError('Não foi possível reenviar. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  const focusIdx = focused ? Math.min(code.length, 5) : -1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, opacity: fade }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Z.fg2} />
          <Text style={{ fontFamily: SANS_M, fontSize: 14, color: Z.fg2 }}>Voltar</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, paddingTop: 26 }}>
          <Text style={styles.h1}>Digite seu código</Text>
          <Text style={styles.subtitle}>
            Enviado para <Text style={{ fontFamily: MONO, fontSize: 14, color: Z.fg1 }}>+{phone}</Text>
          </Text>

          <Pressable onPress={() => hiddenRef.current?.focus()} style={{ marginTop: 40, position: 'relative' }}>
            <View style={{ flexDirection: 'row', gap: 8 }} pointerEvents="none">
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpCell,
                    { borderColor: error ? Z.error : focusIdx === i ? Z.brand : Z.border },
                  ]}
                >
                  <Text style={{ fontFamily: MONO_M, fontSize: 22, color: error ? Z.error : Z.fg1 }}>{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
            {/* Invisible but focusable input over the cells — captures typing, paste and SMS autofill. */}
            <TextInput
              ref={hiddenRef}
              value={code}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              caretHidden
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[StyleSheet.absoluteFill, { opacity: 0 }]}
            />
          </Pressable>

          <Text style={styles.errorText}>{error || ' '}</Text>

          <View style={{ marginTop: 4 }}>
            {countdown > 0 ? (
              <Text style={{ fontFamily: SANS, fontSize: 13, color: Z.fg3 }}>
                Reenviar em <Text style={{ fontFamily: MONO, color: Z.fg2 }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resend} disabled={resending}>
                <Text style={{ fontFamily: SANS_M, fontSize: 13, color: Z.brand, opacity: resending ? 0.5 : 1 }}>
                  {resending ? 'Enviando…' : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 28 }}>
            <PrimaryButton label="Confirmar" onPress={() => verify()} disabled={code.length < 6} loading={loading} />
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3: success ──────────────────────────────────────────────────────────
function SuccessStep({ driverName, onDone }: { driverName: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
    ]).start();
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', opacity: fade }]}>
      <Animated.View style={[styles.successBadge, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={24} color={Z.success} />
      </Animated.View>
      <Text style={[styles.h1, { marginTop: 28 }]}>Você entrou</Text>
      <Text style={styles.subtitle}>Bem-vindo, {driverName || 'motorista'}. Carregando sua rota.</Text>
      <View style={{ marginTop: 32 }}>
        <ActivityIndicator color={Z.fg2} />
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('1');
  const [driverName, setDriverName] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleVerified = async (driver: Driver, token: string) => {
    await login(token, driver);
    setDriverName(driver.name);
    setStep('success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Z.bg }}>
      <StatusBar style="light" />
      {step === 'phone' && (
        <PhoneStep onNext={(p, dc) => { setPhone(p); setDialCode(dc); setStep('otp'); }} />
      )}
      {step === 'otp' && (
        <OTPStep phone={phone} dialCode={dialCode} onBack={() => setStep('phone')} onVerified={handleVerified} />
      )}
      {step === 'success' && (
        <SuccessStep driverName={driverName} onDone={() => router.replace('/location-permission')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Z.bg, paddingHorizontal: 24 },
  h1: { fontFamily: SANS_SB, fontSize: 29, color: Z.fg1, letterSpacing: -0.7, lineHeight: 35, marginBottom: 10 },
  subtitle: { fontFamily: SANS, fontSize: 15, color: Z.fg2, lineHeight: 22 },
  label: { fontFamily: SANS_M, fontSize: 12, color: Z.fg3, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', height: 50,
    backgroundColor: Z.surface, borderRadius: 6, borderWidth: 1,
  },
  countryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: '100%',
    paddingLeft: 14, paddingRight: 12, borderRightWidth: 1, borderRightColor: Z.divider,
  },
  phoneInput: { flex: 1, height: '100%', paddingHorizontal: 14, fontFamily: MONO, fontSize: 15, color: Z.fg1 },
  errorText: { minHeight: 20, marginTop: 8, fontFamily: SANS, fontSize: 13, color: Z.error },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14 },
  otpCell: {
    flex: 1, height: 60, backgroundColor: Z.surface, borderRadius: 6, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  successBadge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.24)', alignItems: 'center', justifyContent: 'center',
  },
});
