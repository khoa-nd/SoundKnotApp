// ── Sound Knot V2 — 3-tab bottom navigation
// Practice | Library | Progress
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing } from '../../src/constants/Spacing';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const colors = useTheme();
  const iconMap: Record<string, string> = {
    practice: '🎯',
    library: '🔍',
    progress: '📊',
  };

  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.4 }]}>
        {iconMap[label] ?? '●'}
      </Text>
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
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: Spacing.md,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink4,
        tabBarLabelStyle: {
          fontFamily: Typography.marker.fontFamily,
          fontSize: 9,
          fontWeight: '400',
          letterSpacing: 0.72,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => <TabIcon label="practice" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon label="library" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon label="progress" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 18,
  },
});
