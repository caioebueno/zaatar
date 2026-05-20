import { useEffect } from 'react';
import '@/lib/route-tracking';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
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

import { AuthProvider, useAuth } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!token && !onLogin) {
      const t = setTimeout(() => router.replace('/login'), 0);
      return () => clearTimeout(t);
    }
    if (token && onLogin) {
      const t = setTimeout(() => router.replace('/(tabs)'), 0);
      return () => clearTimeout(t);
    }
  }, [token, loading, segments]);

  const isNavigationReady = !loading && (token ? segments[0] !== 'login' : segments[0] === 'login');

  if (!isNavigationReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0807', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ff3d14" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="location-permission" options={{ headerShown: false }} />
      <Stack.Screen name="delivery" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="entregas" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
