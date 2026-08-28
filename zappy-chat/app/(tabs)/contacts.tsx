import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getColors, F } from '../../constants/Colors';

export default function ChannelsScreen() {
  const C = getColors(useColorScheme());
  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.cream }]} edges={['top']}>
      <View style={s.center}>
        <Text style={[s.title, { color: C.ink, fontFamily: F.bold }]}>Channels</Text>
        <Text style={[s.sub, { color: C.muted, fontFamily: F.regular }]}>WhatsApp · Instagram · SMS</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, letterSpacing: -0.5 },
  sub: { fontSize: 15 },
});
