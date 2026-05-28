// ── Sound Knot V2 — Library Screen
// Video library with Spotify-style covers
import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing } from '../../src/constants/Spacing';
import { videoService } from '../../src/services/videos';
import { SpotifyCoverList } from '../../src/components/spotify/SpotifyCoverList';
import type { UserVideo } from '../../src/types';

export default function LibraryScreen() {
  const colors = useTheme();
  const [videos, setVideos] = useState<UserVideo[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      videoService.list().catch(() => ({ videos: [] as UserVideo[] }))
        .then((lib) => {
          if (!cancelled) setVideos(lib?.videos ?? []);
        });
      return () => { cancelled = true; };
    }, [])
  );

  const navigateToVideo = (v: UserVideo) =>
    router.push({ pathname: '/listen', params: { videoId: v.youtube_video_id, userVideoId: v.id } });

  const deleteVideo = useCallback(async (v: UserVideo) => {
    const previous = videos;
    setVideos((curr) => curr.filter((it) => it.id !== v.id));
    try {
      await videoService.remove(v.id);
    } catch (err) {
      console.warn('Failed to delete video', err);
      setVideos(previous);
      Alert.alert('Could not delete', 'Please try again in a moment.');
    }
  }, [videos]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <View style={styles.headerBlock}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Your collection</Text>
        <Text style={[Typography.headingLarge, { color: colors.ink, marginTop: Spacing.xs }]}>Library</Text>
        <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm }]}>
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quote */}
        <View style={styles.quoteBlock}>
          <View style={[styles.quoteBorder, { backgroundColor: colors.ink4 }]} />
          <View style={styles.quoteTextBlock}>
            <Text style={[Typography.bodySmall, { color: colors.ink4, fontStyle: 'italic' }]}>
              "Language is best taught when it is being used to transmit messages, not when it is explicitly taught for conscious learning."
            </Text>
            <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.xs }]}>
              — Stephen D. Krashen
            </Text>
          </View>
        </View>

        {/* Video sliders */}
        {videos.length > 0 && (
          <SpotifyCoverList
            title="All Videos"
            videos={videos}
            onPress={navigateToVideo}
            onDelete={deleteVideo}
          />
        )}

        <View style={{ height: 64 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen, paddingTop: Spacing.xl },
  quoteBlock: {
    flexDirection: 'row',
    marginBottom: Spacing.xxl,
  },
  quoteBorder: {
    width: 2,
    borderRadius: 1,
    marginRight: Spacing.lg,
  },
  quoteTextBlock: {
    flex: 1,
  },
});
