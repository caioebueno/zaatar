import { Tabs } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, F } from '../../constants/Colors';
import type { ColorValue } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  color,
  badge,
}: {
  name: IconName;
  focused: boolean;
  color: ColorValue;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IconName)}
        size={22}
        color={color as string}
      />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const C = getColors(useColorScheme());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.cream,
          borderTopColor: C.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 72,
          paddingBottom: 8,
          paddingTop: 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: F.monoSemibold,
          fontSize: 8,
          letterSpacing: 0,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarActiveTintColor: C.tabActive,
        tabBarInactiveTintColor: C.tabInactive,
        tabBarItemStyle: {
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="flash" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="contacts"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#ff3d14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: F.monoBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#faf5ee',
  },
});
