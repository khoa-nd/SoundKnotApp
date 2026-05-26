import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Radius, Spacing } from '../src/constants/Spacing';
import { useAuthStore } from '../src/stores/authStore';
import { useAiSettingsStore } from '../src/stores/aiSettingsStore';
import { usePlaygroundStore } from '../src/stores/playgroundStore';
import { startPlaygroundRun } from '../src/services/playgroundRun';
import { buildFullTranscript, type AiContext } from '../src/services/aiTutor';
import { usePreprocessedTranscriptStore } from '../src/stores/preprocessedTranscriptStore';
import { videoService } from '../src/services/videos';
import { transcriptApi } from '../src/services/transcriptApi';
import type { UserVideo } from '../src/types';
import { ModelPicker } from './playground/ModelPicker';
import { PromptEditor } from './playground/PromptEditor';
import { RunBar } from './playground/RunBar';
import { ResultGrid } from './playground/ResultGrid';

export default function PlaygroundScreen() {
  const colors = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { settings, hydrated: settingsHydrated, load: loadSettings } = useAiSettingsStore();
  const playground = usePlaygroundStore();
  const transcriptsHydrated = usePreprocessedTranscriptStore((s) => s.hydrated);
  const getCachedTranscript = usePreprocessedTranscriptStore((s) => s.getTranscript);
  const setCachedTranscript = usePreprocessedTranscriptStore((s) => s.setTranscript);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [videoContext, setVideoContext] = useState<AiContext | undefined>();
  const [transcriptMessage, setTranscriptMessage] = useState<string | null>(null);
  const [libraryVideos, setLibraryVideos] = useState<UserVideo[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!playground.hydrated) playground.load();
  }, [playground]);

  useEffect(() => {
    if (!settingsHydrated) loadSettings();
  }, [loadSettings, settingsHydrated]);

  useEffect(() => {
    if (Platform.OS === 'web' && playground.hydrated && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, playground.hydrated]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isAuthenticated) return;
    let cancelled = false;
    videoService
      .list()
      .then((res) => { if (!cancelled) setLibraryVideos(res.videos); })
      .catch((err) => { if (!cancelled) setLibraryError(err?.message ?? String(err)); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const preprocessedVideos = libraryVideos ?? [];

  const selectedModels = playground.selectedModels[playground.provider] ?? [];
  const apiKey = settings.provider === playground.provider ? settings.apiKey : '';
  const totalCost = useMemo(() => {
    if (!playground.lastRun) return null;
    return Object.values(playground.lastRun.results).reduce((sum, result) => sum + (result.cost ?? 0), 0);
  }, [playground.lastRun]);

  const canRun = selectedModels.length > 0 && !running && (playground.mode === 'proxy' || !!apiKey);
  const disabledMessage = selectedModels.length === 0
    ? 'Select at least one model.'
    : playground.mode === 'direct' && !apiKey
      ? `Add a ${playground.provider === 'gemini' ? 'Gemini' : 'OpenRouter'} key in AI Settings.`
      : null;

  const run = async () => {
    if (!canRun) return;
    setRunning(true);
    setRunMessage(null);
    try {
      await startPlaygroundRun({
        provider: playground.provider,
        mode: playground.mode,
        models: selectedModels,
        systemPrompt: playground.systemPrompt,
        userPrompt: playground.userPrompt,
        params: playground.params,
        apiKey,
        context: videoContext,
        openRouterModels: playground.cachedOpenRouterModels,
        onSnapshot: playground.setLastRun,
      });
    } catch (error: any) {
      setRunMessage(error?.message ?? String(error));
    } finally {
      setRunning(false);
    }
  };

  const selectPreprocessedVideo = async (video: UserVideo) => {
    const id = video.youtube_video_id;
    const cached = getCachedTranscript(id);
    if (cached) {
      setVideoContext({ videoId: id, fullTranscript: buildFullTranscript(cached) });
      setTranscriptMessage(`Loaded ${cached.length} cached transcript lines from ${video.title ?? id}.`);
      return;
    }

    setLoadingVideoId(id);
    setTranscriptMessage(null);
    try {
      const lines = await transcriptApi.get(id);
      if (!lines) {
        setVideoContext(undefined);
        setTranscriptMessage('No transcript on server yet. Open this video on the mobile app to preprocess it, then reload here.');
        return;
      }
      setCachedTranscript(id, lines);
      setVideoContext({ videoId: id, fullTranscript: buildFullTranscript(lines) });
      setTranscriptMessage(`Loaded ${lines.length} transcript lines from server for ${video.title ?? id}.`);
    } catch (error: any) {
      setVideoContext(undefined);
      setTranscriptMessage(error?.message ?? String(error));
    } finally {
      setLoadingVideoId(null);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.paper }]}>
        <Ionicons name="desktop-outline" size={36} color={colors.ink4} />
        <Text style={[Typography.headingLarge, { color: colors.ink }]}>Web only</Text>
        <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>Model Playground is a developer web surface. Open it in the browser at /playground.</Text>
      </SafeAreaView>
    );
  }

  if (!playground.hydrated || !settingsHydrated || !transcriptsHydrated) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.paper }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>Developer surface</Text>
            <Text style={[styles.title, { color: colors.ink }]}>Model Playground</Text>
            <Text style={[Typography.bodyMedium, { color: colors.ink3, maxWidth: 720 }]}>Fan out one prompt across selected Gemini or OpenRouter models. Compare replies, latency, token usage, and estimated cost.</Text>
          </View>
          <TouchableOpacity style={[styles.settingsLink, { borderColor: colors.hair, backgroundColor: colors.paper2 }]} onPress={() => router.push('/ai-settings' as any)}>
            <Ionicons name="key-outline" size={16} color={colors.ink} />
            <Text style={[Typography.buttonSmall, { color: colors.ink }]}>AI Settings</Text>
          </TouchableOpacity>
        </View>

        <RunBar
          provider={playground.provider}
          mode={playground.mode}
          selectedCount={selectedModels.length}
          totalCost={totalCost}
          message={runMessage ?? disabledMessage}
          canRun={canRun}
          running={running}
          onProvider={playground.setProvider}
          onMode={playground.setMode}
          onRun={run}
          colors={colors}
        />

        <View style={[styles.videoBox, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>Video context</Text>
            <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>
              YouTube blocks transcript fetch from browsers. Pick a video from your library — transcripts are loaded from the server cache (preprocess on the mobile app first if not yet available).
            </Text>
          </View>

          {libraryError ? (
            <Text style={[Typography.monoSmall, { color: colors.negative }]}>{libraryError}</Text>
          ) : libraryVideos === null ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : preprocessedVideos.length === 0 ? (
            <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>
              No videos in your library yet. Add one from the mobile app's Home screen.
            </Text>
          ) : (
            <View style={styles.videoList}>
              {preprocessedVideos.map((video) => {
                const active = videoContext?.videoId === video.youtube_video_id;
                const loading = loadingVideoId === video.youtube_video_id;
                return (
                  <TouchableOpacity
                    key={video.id}
                    onPress={() => selectPreprocessedVideo(video)}
                    disabled={loading}
                    activeOpacity={0.75}
                    style={[
                      styles.videoCard,
                      {
                        borderColor: active ? colors.ink : colors.hair,
                        backgroundColor: active ? colors.paper : colors.paper2,
                      },
                    ]}
                  >
                    {video.thumbnail_url ? (
                      <Image source={{ uri: video.thumbnail_url }} style={styles.videoThumb} />
                    ) : (
                      <View style={[styles.videoThumb, { backgroundColor: colors.hair }]} />
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[Typography.bodyMedium, { color: colors.ink }]} numberOfLines={2}>
                        {video.title ?? video.youtube_video_id}
                      </Text>
                      {!!video.channel && (
                        <Text style={[Typography.bodySmall, { color: colors.ink3 }]} numberOfLines={1}>{video.channel}</Text>
                      )}
                    </View>
                    {loading
                      ? <ActivityIndicator size="small" color={colors.ink} />
                      : active && <Ionicons name="checkmark-circle" size={20} color={colors.ink} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!transcriptMessage && (
            <Text style={[Typography.monoSmall, { color: videoContext ? colors.positive : colors.negative }]}>{transcriptMessage}</Text>
          )}
        </View>

        <View style={styles.columns}>
          <View style={styles.leftCol}>
            <ModelPicker
              provider={playground.provider}
              apiKey={apiKey}
              selected={selectedModels}
              cachedOpenRouterModels={playground.cachedOpenRouterModels}
              onToggle={(id) => playground.toggleModel(playground.provider, id)}
              onCacheOpenRouter={playground.setCachedOpenRouterModels}
              colors={colors}
            />
          </View>
          <View style={styles.rightCol}>
            <PromptEditor
              mode={playground.mode}
              systemPrompt={playground.systemPrompt}
              userPrompt={playground.userPrompt}
              params={playground.params}
              presets={playground.presets}
              onSystemPrompt={playground.setSystemPrompt}
              onUserPrompt={playground.setUserPrompt}
              onParams={playground.setParams}
              onSavePreset={playground.savePreset}
              onLoadPreset={playground.loadPreset}
              onDeletePreset={playground.deletePreset}
              colors={colors}
            />
            <View style={{ marginTop: Spacing.xxl }}>
              <ResultGrid snapshot={playground.lastRun} selectedModels={selectedModels} colors={colors} />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.massive, gap: Spacing.xxl, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.massive, gap: Spacing.lg },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.xxl },
  title: { fontFamily: Typography.hero.fontFamily, fontSize: 44, lineHeight: 50, letterSpacing: -1.2 },
  settingsLink: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  columns: { flexDirection: 'row', gap: Spacing.xxl, alignItems: 'flex-start' },
  leftCol: { width: 420 },
  rightCol: { flex: 1, minWidth: 0 },
  videoBox: { borderWidth: 1, borderRadius: Radius.xxxl, padding: Spacing.xxl, gap: Spacing.lg },
  videoList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  videoCard: { width: 320, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  videoThumb: { width: 80, height: 45, borderRadius: Radius.md, backgroundColor: '#000' },
});
