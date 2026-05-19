// ── Sound Knot V2 — Home Screen
// Paste YouTube URL → auto-navigate to Listen
// Today card + Recent knots + tab bar: Practice | Library | Progress
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Knot } from '../../src/components/ui/Knot';
import { Chip } from '../../src/components/ui/Chip';
import { homeService } from '../../src/services/home';
import { videoService } from '../../src/services/videos';
import type { HomeData, PracticeSession } from '../../src/types';

export default function HomeScreen() {
  const colors = useTheme();
  const [urlValue, setUrlValue] = useState('');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      homeService
        .fetch()
        .then((data) => {
          if (!cancelled) setHomeData(data);
        })
        .catch(() => {
          // silently fail — show empty state
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }, [])
  );

  const extractYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const submitUrl = async () => {
    const vid = extractYouTubeId(urlValue.trim());
    if (!vid) return;

    setSubmitting(true);
    try {
      const { video } = await videoService.add({ youtube_video_id: vid });
      setUrlValue('');
      router.push({ pathname: '/listen', params: { videoId: vid, userVideoId: video.id } });
    } catch {
      // fallback: navigate without persisting
      router.push({ pathname: '/listen', params: { videoId: vid } });
    } finally {
      setSubmitting(false);
    }
  };

  const streak = homeData?.progress?.current_streak ?? 0;
  const recentKnots = homeData?.recentKnots ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date + Streak */}
        <View style={styles.dateRow}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Sound Knot · Practice</Text>
          {streak > 0 && <Chip label={`${streak} day streak`} dotColor={colors.accent} />}
        </View>

        {/* Hero text */}
        <View style={styles.heroSection}>
          <Text style={[Typography.titleLarge, { color: colors.ink3 }]}>Bring in a video.</Text>
          <Text style={[Typography.titleLarge, Typography.serifItalic]}>Work the knot.</Text>
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
              <Text style={[Typography.bodyMedium, { color: colors.paper, fontSize: 16 }]}>→</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hint chips */}
        <View style={styles.hintRow}>
          <Chip label="Paste link" />
          <Chip label="or use clipboard" />
        </View>

        {/* Recent videos / sessions */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.massive }}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : recentKnots.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.marker, { color: colors.ink4 }]}>Recent videos / sessions</Text>
              <Text style={[Typography.marker, { color: colors.ink4 }]}>
                {recentKnots.length} session{recentKnots.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {recentKnots.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.recentItem, { borderTopColor: colors.hair }]}
                onPress={() =>
                  router.push({
                    pathname: '/listen',
                    params: {
                      videoId: item.user_videos?.youtube_video_id ?? '',
                      userVideoId: item.video_id,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <Knot size={40} progress={item.mastery} mastery={item.mastery} pass={item.pass} subdued={0.3} />
                <View style={styles.recentInfo}>
                  <Text style={[Typography.bodySmall, { fontWeight: '500' }]} numberOfLines={1}>
                    {item.user_videos?.title ?? 'Untitled'}
                  </Text>
                  <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.xs }]}>
                    {item.segment ?? 'Seg 1'} · pass {item.pass}
                  </Text>
                </View>
                <Text style={[Typography.markerLarge, { color: colors.ink3 }]}>
                  {Math.round(item.mastery * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.marker, { color: colors.ink4 }]}>Recent videos / sessions</Text>
            </View>
            <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
              <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
                No sessions yet. Paste a YouTube URL above to start your first session.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroSection: { marginTop: Spacing.xl, marginBottom: Spacing.xxxl },
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
  todaySection: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  todayCard: {
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  todayInfo: { flex: 1 },
  masteryDots: { marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.xs },
  continueBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: Spacing.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  recentSection: {},
  recentItem: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  recentInfo: { flex: 1 },
});
