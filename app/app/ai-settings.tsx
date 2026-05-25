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
import {
  GEMINI_MODELS,
  chat,
  describeMode,
  fetchOpenRouterModels,
} from '../src/services/aiTutor';

export default function AiSettingsScreen() {
  const colors = useTheme();
  const { settings, hydrated, load, setMode, setProvider, setModel, setApiKey } = useAiSettingsStore();
  const [keyDraft, setKeyDraft] = useState('');
  // Default to plain text so paste affordances (long-press, AutoFill strip) work
  // reliably across iOS / Android / web. User can tap the eye to mask.
  const [showKey, setShowKey] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // OpenRouter live-catalog state. Loaded only when provider==='openrouter' and a key is present.
  const [orModels, setOrModels] = useState<Array<{ id: string; name?: string; pricing?: { prompt?: string; completion?: string } }>>([]);
  const [orModelsLoading, setOrModelsLoading] = useState(false);
  const [orModelsError, setOrModelsError] = useState<string | null>(null);
  const [orFilter, setOrFilter] = useState('');
  const [orFreeOnly, setOrFreeOnly] = useState(false);

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

  useEffect(() => {
    setKeyDraft(settings.apiKey);
  }, [settings.apiKey]);

  // Fetch the live OpenRouter catalog when relevant. Re-runs when the key changes.
  useEffect(() => {
    if (settings.provider !== 'openrouter') {
      setOrModels([]);
      setOrModelsError(null);
      return;
    }
    const key = keyDraft.trim() || settings.apiKey;
    if (!key) {
      setOrModels([]);
      setOrModelsError(null);
      return;
    }
    let cancelled = false;
    setOrModelsLoading(true);
    setOrModelsError(null);
    fetchOpenRouterModels(key)
      .then((list) => {
        if (cancelled) return;
        setOrModels(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setOrModelsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setOrModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settings.provider, settings.apiKey, keyDraft]);

  const onSaveKey = async () => {
    await setApiKey(keyDraft.trim());
  };

  const visibleOrModels = (() => {
    const q = orFilter.trim().toLowerCase();
    return orModels.filter((m) => {
      if (orFreeOnly && !m.id.endsWith(':free')) return false;
      if (!q) return true;
      return m.id.toLowerCase().includes(q) || (m.name?.toLowerCase().includes(q) ?? false);
    });
  })();

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
              { label: 'Direct', value: 'direct' },
            ]}
            value={settings.mode}
            onChange={(v) => setMode(v as 'proxy' | 'direct')}
          />
          <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.md }]}>
            {settings.mode === 'proxy'
              ? 'The app sends prompts to api.soundknot.app and the server forwards them. Your device never holds the API key. Only Gemini is wired through the proxy today.'
              : settings.provider === 'openrouter'
                ? 'The app calls OpenRouter directly using the key you paste below. OpenRouter brokers requests to many model providers from one key.'
                : 'The app calls Google Gemini directly using the key you paste below.'}
          </Text>
        </Section>

        {/* Provider */}
        <Section title="Provider" colors={colors}>
          <SegmentRow
            colors={colors}
            options={[
              { label: 'Gemini', value: 'gemini' },
              { label: 'OpenRouter', value: 'openrouter' },
            ]}
            value={settings.provider}
            onChange={(v) => {
              if (settings.mode !== 'direct' && v === 'openrouter') {
                Alert.alert(
                  'OpenRouter is direct-only',
                  'Switch Mode to Direct to use OpenRouter. The backend proxy currently supports Gemini only.',
                );
                return;
              }
              setProvider(v as 'gemini' | 'openrouter');
            }}
          />
          {settings.provider === 'openrouter' && (
            <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.md }]}>
              Voice input is not supported on OpenRouter — type your question, or switch back to Gemini for voice.
            </Text>
          )}
        </Section>

        {/* Model — branches on provider */}
        <Section title="Model" colors={colors}>
          {settings.provider === 'gemini' ? (
            GEMINI_MODELS.map((m) => {
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
            })
          ) : !keyDraft.trim() && !settings.apiKey ? (
            <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>
              Paste your OpenRouter key below to load the available models.
            </Text>
          ) : orModelsLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <ActivityIndicator size="small" color={colors.ink3} />
              <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>Loading OpenRouter catalog…</Text>
            </View>
          ) : orModelsError ? (
            <Text style={[Typography.bodySmall, { color: colors.negative }]}>{orModelsError}</Text>
          ) : (
            <>
              {/* Filter + free-only toggle */}
              <View style={[styles.keyRow, { borderColor: colors.hair, backgroundColor: colors.paper2, marginBottom: Spacing.md }]}>
                <TextInput
                  style={[styles.keyInput, { color: colors.ink }]}
                  value={orFilter}
                  onChangeText={setOrFilter}
                  placeholder="Filter (e.g. claude, llama, mistral)"
                  placeholderTextColor={colors.ink4}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.modelRow, { borderColor: colors.hair, backgroundColor: orFreeOnly ? colors.ink : colors.paper }]}
                onPress={() => setOrFreeOnly((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[Typography.bodyMedium, { color: orFreeOnly ? colors.paper : colors.ink, flex: 1 }]}>
                  Free models only (:free)
                </Text>
                {orFreeOnly && <Ionicons name="checkmark" size={18} color={colors.paper} />}
              </TouchableOpacity>

              {visibleOrModels.length === 0 ? (
                <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.md }]}>
                  No models match this filter.
                </Text>
              ) : (
                <View style={{ marginTop: Spacing.md, maxHeight: 360 }}>
                  <ScrollView nestedScrollEnabled>
                    {visibleOrModels.slice(0, 200).map((m) => {
                      const selected = settings.model === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.modelRow,
                            { borderColor: selected ? colors.ink : colors.hair, backgroundColor: selected ? colors.ink : colors.paper },
                          ]}
                          onPress={() => setModel(m.id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[Typography.bodyMedium, { color: selected ? colors.paper : colors.ink }]}>{m.id}</Text>
                            {!!m.name && m.name !== m.id && (
                              <Text style={[Typography.bodySmall, { color: selected ? colors.paper : colors.ink3, marginTop: 2 }]}>
                                {m.name}
                              </Text>
                            )}
                          </View>
                          {selected && <Ionicons name="checkmark" size={18} color={colors.paper} />}
                        </TouchableOpacity>
                      );
                    })}
                    {visibleOrModels.length > 200 && (
                      <Text style={[Typography.bodySmall, { color: colors.ink3, padding: Spacing.md }]}>
                        Showing first 200 of {visibleOrModels.length}. Refine the filter to narrow.
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
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
              placeholder={settings.provider === 'openrouter' ? 'Paste OpenRouter token here' : 'Paste Gemini token here'}
              placeholderTextColor={colors.ink4}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              // `oneTimeCode` disables iOS Passwords AutoFill on this field so the
              // standard long-press Paste menu shows instead of the AutoFill chip.
              // Counterintuitive but documented behavior on iOS 17+.
              textContentType="oneTimeCode"
              keyboardType="default"
              onBlur={onSaveKey}
            />
            <TouchableOpacity onPress={() => setShowKey((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink3} />
            </TouchableOpacity>
          </View>
          <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm }]}>
            Stored in AsyncStorage on this device only. Get a key at{' '}
            {settings.provider === 'openrouter' ? 'openrouter.ai/keys.' : 'aistudio.google.com.'}
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
