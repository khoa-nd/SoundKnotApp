// ── Sound Knot V2 — Library Screen
// User's saved videos from API
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { videoService } from '../../src/services/videos';
import type { UserVideo } from '../../src/types';

export default function LibraryScreen() {
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      videoService
        .list()
        .then((data) => {
          if (!cancelled) setVideos(data.videos);
        })
        .catch(() => {
          // silently fail
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }, [])
  );

  const filtered = videos.filter((item) => {
    if (search && !(item.title ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Your videos</Text>
          <Text style={[Typography.headingLarge, { marginTop: Spacing.xs }]}>Library</Text>
        </View>

        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.paper2,
              borderColor: colors.hair,
              color: colors.ink,
            },
            Typography.mono,
          ]}
          placeholder="Search library…"
          placeholderTextColor={colors.ink4}
          value={search}
          onChangeText={setSearch}
        />

        {/* Content list */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.massive }}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              {videos.length === 0
                ? 'No videos yet. Go to Home and paste a YouTube URL to add one.'
                : 'No matching videos.'}
            </Text>
          </View>
        ) : (
          <View style={styles.contentList}>
            {filtered.map((item) => (
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
  header: { marginBottom: Spacing.xxl },
  searchInput: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.xl,
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
});
