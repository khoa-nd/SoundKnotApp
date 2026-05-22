// ── Sound Knot V2 — AI Tutor Settings Screen
// Configure mode (proxy/direct), provider, model, and API key.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { useAiSettingsStore } from '../src/stores/aiSettingsStore';
import { GEMINI_MODELS, chat, describeMode } from '../src/services/aiTutor';

export default function AiSettingsScreen() {
  const colors = useTheme();
  const { settings, hydrated, load, setMode, setModel, setApiKey } = useAiSettingsStore();
  const [keyDraft, setKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

  useEffect(() => {
    setKeyDraft(settings.apiKey);
  }, [settings.apiKey]);

  const onSaveKey = async () => {
    await setApiKey(keyDraft.trim());
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await chat({
        messages: [{ role: 'user', content: 'Say "ok" if you can read this.' }],
        settings: { ...settings, apiKey: keyDraft.trim() },
      });
      setTestResult({ ok: true, message: res.reply.slice(0, 120) });
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message ?? String(err) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      >
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={[Typography.headingSmall, { color: colors.ink }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>AI SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[Typography.heading, { marginBottom: Spacing.xs }]}>AI Tutor</Text>
        <Text style={[Typography.bodySmall, { color: colors.ink3, marginBottom: Spacing.massive }]}>
          {describeMode(settings)}
        </Text>

        {/* Mode */}
        <Section title="Mode" colors={colors}>
          <SegmentRow
            colors={colors}
            options={[
              { label: 'Backend proxy', value: 'proxy' },
              { label: 'Direct (Gemini)', value: 'direct' },
            ]}
            value={settings.mode}
            onChange={(v) => setMode(v as 'proxy' | 'direct')}
          />
          <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.md }]}>
            {settings.mode === 'proxy'
              ? 'The app sends prompts to api.soundknot.app and the server forwards them. Your device never holds the API key.'
              : 'The app calls Google Gemini directly using the key you paste below. Useful before the backend proxy is live.'}
          </Text>
        </Section>

        {/* Provider (single option for now, but laid out for future expansion) */}
        <Section title="Provider" colors={colors}>
          <View style={[styles.staticPill, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.ink2} />
            <Text style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.md }]}>
              Google Gemini
            </Text>
          </View>
        </Section>

        {/* Model */}
        <Section title="Model" colors={colors}>
          {GEMINI_MODELS.map((m) => {
            const selected = settings.model === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modelRow,
                  { borderColor: selected ? colors.ink : colors.hair, backgroundColor: selected ? colors.ink : colors.paper },
                ]}
                onPress={() => setModel(m)}
                activeOpacity={0.7}
              >
                <Text style={[Typography.bodyMedium, { color: selected ? colors.paper : colors.ink, flex: 1 }]}>{m}</Text>
                {selected && <Ionicons name="checkmark" size={18} color={colors.paper} />}
              </TouchableOpacity>
            );
          })}
        </Section>

        {/* API key — only meaningful for direct mode */}
        <Section
          title={settings.mode === 'direct' ? 'API key (required)' : 'API key (only used in Direct mode)'}
          colors={colors}
        >
          <View style={[styles.keyRow, { borderColor: colors.hair, backgroundColor: colors.paper2 }]}>
            <TextInput
              style={[styles.keyInput, { color: colors.ink }]}
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="Paste your Gemini API key"
              placeholderTextColor={colors.ink4}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={onSaveKey}
            />
            <TouchableOpacity onPress={() => setShowKey((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink3} />
            </TouchableOpacity>
          </View>
          <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm }]}>
            Stored in AsyncStorage on this device only. Get a key at aistudio.google.com.
          </Text>
        </Section>

        {/* Test button */}
        <TouchableOpacity
          style={[styles.testBtn, { backgroundColor: colors.ink, opacity: testing ? 0.6 : 1 }]}
          onPress={onTest}
          disabled={testing}
          activeOpacity={0.7}
        >
          {testing ? (
            <ActivityIndicator size="small" color={colors.paper} />
          ) : (
            <Text style={[Typography.button, { color: colors.paper }]}>Test connection</Text>
          )}
        </TouchableOpacity>

        {testResult && (
          <View
            style={[
              styles.testResult,
              {
                borderColor: testResult.ok ? colors.positive : colors.negative,
                backgroundColor: testResult.ok ? 'rgba(0,137,123,0.08)' : 'rgba(229,57,53,0.08)',
              },
            ]}
          >
            <Text style={[Typography.marker, { color: testResult.ok ? colors.positive : colors.negative }]}>
              {testResult.ok ? 'OK' : 'FAILED'}
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.ink2, marginTop: Spacing.sm }]}>
              {testResult.message}
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, colors, children }: { title: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.massive }}>
      <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.md }]}>{title}</Text>
      {children}
    </View>
  );
}

function SegmentRow({
  colors,
  options,
  value,
  onChange,
}: {
  colors: any;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={[styles.segmentRow, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.segmentBtn, selected && { backgroundColor: colors.ink }]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[Typography.buttonSmall, { color: selected ? colors.paper : colors.ink2 }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.sm,
  },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  body: { padding: Spacing.screen, paddingTop: Spacing.xxl },
  segmentRow: { flexDirection: 'row', borderRadius: Radius.pill, borderWidth: 1, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: Radius.pill },
  staticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xxxl,
  },
  keyInput: {
    flex: 1,
    paddingVertical: Spacing.xl,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 14,
  },
  eyeBtn: { padding: Spacing.sm },
  testBtn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  testResult: {
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
});
