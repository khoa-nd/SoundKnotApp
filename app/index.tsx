// ── Sound Knot V2 — Entry redirect with auth check
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useTheme } from '../src/constants/theme';

export default function Index() {
  const colors = useTheme();
  const { restoreSession, isAuthenticated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.paper }]}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 }}>
          SoundKnot
        </Text>
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
