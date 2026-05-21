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
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Chip } from '../../src/components/ui/Chip';
import { homeService } from '../../src/services/home';
import { videoService } from '../../src/services/videos';
import type { HomeData, UserVideo } from '../../src/types';

export default function HomeScreen() {
  const colors = useTheme();
  const [urlValue, setUrlValue] = useState('');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      router.push({ pathname: '/listen', params: { videoId: vid } });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = (item: UserVideo) => {
    Alert.alert(
      'Remove video?',
      `"${item.title ?? 'Untitled'}" will be removed from your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const prev = videos;
            setVideos(prev.filter((v) => v.id !== item.id));
            try {
              await videoService.remove(item.id);
            } catch {
              setVideos(prev);
            }
          },
        },
      ],
    );
  };

  const streak = homeData?.progress?.current_streak ?? 0;

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

        {/* Your videos */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Your videos</Text>
          {!loading && videos.length > 0 && (
            <Text style={[Typography.marker, { color: colors.ink4 }]}>
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.massive }}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : videos.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              No videos yet. Paste a YouTube URL above to add your first one.
            </Text>
          </View>
        ) : (
          <View style={styles.contentList}>
            {videos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.contentCard, { borderTopColor: colors.hair }]}
                onPress={() =>
                  router.push({
                    pathname: '/listen',
                    params: { videoId: item.youtube_video_id, userVideoId: item.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={[styles.contentThumb, { backgroundColor: colors.paper2 }]}>
                  {item.thumbnail_url ? (
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      style={{ width: 64, height: 64, borderRadius: Radius.md }}
                    />
                  ) : (
                    <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>▶</Text>
                  )}
                </View>
                <View style={styles.contentInfo}>
                  <Text style={[Typography.bodyMedium, { fontWeight: '500' }]} numberOfLines={1}>
                    {item.title ?? 'Untitled'}
                  </Text>
                  <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.xs }]}>
                    {item.channel ?? 'Unknown channel'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmRemove(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.contentRemove}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={18} color={colors.ink4} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  emptyBox: {
    padding: Spacing.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  contentList: {},
  contentCard: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  contentThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  contentInfo: { flex: 1 },
  contentRemove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
