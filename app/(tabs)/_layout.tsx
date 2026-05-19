// ── Sound Knot V2 — 3-tab bottom navigation
// Home | Library | Profile
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing } from '../../src/constants/Spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  home: { focused: 'home', default: 'home-outline' },
  library: { focused: 'book', default: 'book-outline' },
  progress: { focused: 'person-circle', default: 'person-circle-outline' },
};

function TabIcon({ route, focused, color }: { route: string; focused: boolean; color: string }) {
  const icons = TAB_ICONS[route];
  if (!icons) return null;
  return (
    <View style={styles.tabItem}>
      <Ionicons name={focused ? icons.focused : icons.default} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.hair,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 80,
          paddingBottom: 20,
          paddingTop: Spacing.md,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink4,
        tabBarLabelStyle: {
          fontFamily: Typography.marker.fontFamily,
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon route="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused, color }) => <TabIcon route="library" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon route="progress" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
