import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { getColors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} from '@expo-google-fonts/geist-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '../context/auth';
import { RealtimeProvider } from '../context/realtime';
import { ChatsProvider } from '../context/chats';
import { registerPushDevice } from '../lib/api';

SplashScreen.preventAutoHideAsync();

function PushRegistrar() {
  const { token, businessId } = useAuth();

  useEffect(() => {
    if (!token || Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (pushToken) await registerPushDevice(token, businessId, pushToken);
      } catch {
        // best-effort — don't crash the app if push registration fails
      }
    });
  }, [token]);

  return null;
}

function AuthGate() {
  const { token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inLogin = segments[0] === 'login';
    if (!token && !inLogin) {
      router.replace('/login');
    } else if (token && inLogin) {
      router.replace('/(tabs)');
    }
  }, [token, segments]);

  return null;
}

function RootLayoutInner() {
  const { loading: authLoading, token } = useAuth();
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded && !authLoading) SplashScreen.hideAsync();
  }, [fontsLoaded, authLoading]);

  if (!fontsLoaded || authLoading) return null;

  const initialRoute = token ? '(tabs)' : 'login';

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthGate />
      <PushRegistrar />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: getColors(colorScheme).cream } }} initialRouteName={initialRoute}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/review-order" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/add-item" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/add-address" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/order-detail" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ChatsProvider>
          <RootLayoutInner />
        </ChatsProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
