// ── Sound Knot V2 — Root Stack Navigator
// Flow: Home (tabs) → Listen ↔ Dictation → Finished
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { useTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/authStore';
import { usePreprocessedTranscriptStore } from '../src/stores/preprocessedTranscriptStore';

export default function RootLayout() {
  const colors = useTheme();
  const [splashDone, setSplashDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const loadTranscripts = usePreprocessedTranscriptStore((s) => s.load);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    restoreSession().finally(() => setAuthChecked(true));
  }, [restoreSession]);

  useEffect(() => {
    void loadTranscripts();
  }, [loadTranscripts]);

  useEffect(() => {
    if (fontsLoaded) {
      const t = setTimeout(() => setSplashDone(true), 300);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !splashDone || !authChecked) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.paper }]}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 }}>
          SoundKnot
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.paper }]}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listen"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="dictation"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="finished"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ai-tutor"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="ai-settings"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="playground"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
