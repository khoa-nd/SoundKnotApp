// ── Sound Knot V2 — Home Screen
// Paste YouTube URL → auto-navigate to Listen
// Hero + URL input + user's video library
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Chip } from '../../src/components/ui/Chip';
import { HighlightCover } from '../../src/components/spotify/HighlightCover';
import { SpotifyCoverSlider } from '../../src/components/spotify/SpotifyCoverSlider';
import { RankedSlider } from '../../src/components/spotify/RankedSlider';
import { homeService } from '../../src/services/home';
import { videoService } from '../../src/services/videos';
import { INITIAL_PREPROCESS_STEPS, preprocessService, type PreprocessStep, type PreprocessStepId } from '../../src/services/preprocess';
import { usePreprocessedTranscriptStore } from '../../src/stores/preprocessedTranscriptStore';
import type { HomeData, UserVideo } from '../../src/types';

const FEATURED_VIDEO: UserVideo = {
  id: 'featured',
  user_id: '',
  youtube_video_id: 'C6ioLFXAMVE',
  title: 'How to Improve Your Communication Skills | Matt Abrahams & Dr. Andrew Huberman',
  channel: 'Huberman Lab Clips',
  thumbnail_url: 'https://i.ytimg.com/vi/C6ioLFXAMVE/maxresdefault.jpg',
  added_at: '',
};

export default function HomeScreen() {
  const colors = useTheme();
  const [urlValue, setUrlValue] = useState('');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preprocessSteps, setPreprocessSteps] = useState<PreprocessStep[]>(INITIAL_PREPROCESS_STEPS);
  const [preprocessError, setPreprocessError] = useState<string | null>(null);
  const setPreprocessedTranscript = usePreprocessedTranscriptStore((s) => s.setTranscript);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([
        homeService.fetch().catch(() => null),
        videoService.list().catch(() => ({ videos: [] as UserVideo[] })),
      ])
        .then(([home, lib]) => {
          if (cancelled) return;
          if (home) setHomeData(home);
          setVideos(lib?.videos ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }, [])
  );

  const submitUrl = async () => {
    if (!urlValue.trim()) return;

    setSubmitting(true);
    setPreprocessError(null);
    setPreprocessSteps(INITIAL_PREPROCESS_STEPS);

    const updateStep = (id: PreprocessStepId, status: PreprocessStep['status'], detail?: string) => {
      setPreprocessSteps((steps) =>
        steps.map((step) => (step.id === id ? { ...step, status, detail } : step)),
      );
    };

    try {
      const prepared = await preprocessService.prepareYoutubeUrl(urlValue, updateStep);
      setPreprocessedTranscript(prepared.videoId, prepared.lines);
      const { video } = await videoService.add({ youtube_video_id: prepared.videoId });
      setUrlValue('');
      router.push({ pathname: '/listen', params: { videoId: prepared.videoId, userVideoId: video.id } });
    } catch (err: any) {
      setPreprocessError(err?.message ?? 'Could not prepare this video.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero text */}
        <View style={styles.heroSection}>
          <Text style={[Typography.titleLarge, { color: colors.ink3, fontWeight: '400' }]}>
            Bring in a <Text style={{ fontWeight: '800' }}>sound</Text>.
          </Text>
          <Text style={[Typography.titleLarge, { color: colors.ink3, fontWeight: '400' }]}>
            Work the <Text style={{ fontWeight: '800' }}>knot</Text>.
          </Text>
        </View>

        {/* URL Input */}
        <View style={styles.urlRow}>
          <TextInput
            style={[
              styles.urlInput,
              {
                backgroundColor: colors.paper2,
                borderColor: colors.hair,
                color: colors.ink,
              },
              Typography.mono,
            ]}
            placeholder="Paste a YouTube URL…"
            placeholderTextColor={colors.ink4}
            value={urlValue}
            onChangeText={setUrlValue}
            onSubmitEditing={submitUrl}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.urlSubmit,
              { backgroundColor: urlValue ? colors.ink : colors.ink4 },
            ]}
            onPress={submitUrl}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.paper} />
            ) : (
              <Ionicons name="sparkles-outline" size={18} color={colors.paper} />
            )}
          </TouchableOpacity>
        </View>

        {/* Hint chips */}
        <View style={styles.hintRow}>
          <Chip label="Paste link" />
          <Chip label="or use clipboard" />
          {urlValue.length > 0 && (
            <TouchableOpacity onPress={() => setUrlValue('')} activeOpacity={0.7}>
              <Chip
                label="Clear"
                icon={<Ionicons name="close-circle-outline" size={14} color={colors.negative} />}
              />
            </TouchableOpacity>
          )}
        </View>

        {!loading && videos.length > 0 && (
          <SpotifyCoverSlider
            title="Recent Videos"
            videos={videos}
            onPress={(v) => router.push({ pathname: '/listen', params: { videoId: v.youtube_video_id, userVideoId: v.id } })}
          />
        )}

        <HighlightCover
          video={FEATURED_VIDEO}
          onPress={(v) => router.push({ pathname: '/listen', params: { videoId: v.youtube_video_id } })}
        />

        {!loading && videos.length > 0 && (
          <RankedSlider
            title="Trending Videos"
            videos={videos}
            onPress={(v) => router.push({ pathname: '/listen', params: { videoId: v.youtube_video_id, userVideoId: v.id } })}
          />
        )}

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.massive }}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
        {!loading && videos.length === 0 && (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              No videos yet. Paste a YouTube URL above to add your first one.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={submitting || !!preprocessError} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.progressCard, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
            <Text style={[Typography.headingSmall, { color: colors.ink }]}>Preparing practice</Text>
            <Text style={[Typography.bodySmall, { color: colors.ink4, marginTop: Spacing.sm }]}>Checking the link, transcript, and AI split before opening practice.</Text>
            <View style={styles.stepList}>
              {preprocessSteps.map((step) => (
                <View key={step.id} style={styles.stepRow}>
                  <View style={[styles.stepIcon, { borderColor: colors.hair, backgroundColor: step.status === 'done' ? colors.ink : colors.paper2 }]}> 
                    {step.status === 'running' ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : step.status === 'done' ? (
                      <Ionicons name="checkmark" size={14} color={colors.paper} />
                    ) : step.status === 'failed' ? (
                      <Ionicons name="close" size={14} color={colors.accent} />
                    ) : (
                      <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>·</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodySmall, { color: colors.ink }]}>{step.label}</Text>
                    {!!step.detail && <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: 2 }]}>{step.detail}</Text>}
                  </View>
                </View>
              ))}
            </View>
            {!!preprocessError && (
              <>
                <Text style={[Typography.bodySmall, { color: colors.accent, marginTop: Spacing.lg }]}>{preprocessError}</Text>
                <TouchableOpacity
                  style={[styles.dismissBtn, { backgroundColor: colors.ink }]}
                  onPress={() => setPreprocessError(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.button, { color: colors.paper }]}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen },
  heroSection: { marginTop: -13, marginBottom: Spacing.xxxl },
  urlRow: { position: 'relative', marginBottom: Spacing.md },
  urlInput: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    paddingRight: 52,
  },
  urlSubmit: {
    position: 'absolute',
    right: 6,
    top: 6,
    bottom: 6,
    width: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxxl },
  emptyBox: {
    padding: Spacing.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: Spacing.screen,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: Radius.xxxl,
    padding: Spacing.xxl,
  },
  stepList: {
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtn: {
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
