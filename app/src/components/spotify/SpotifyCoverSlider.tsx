import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpotifyCover } from './SpotifyCover';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import type { UserVideo } from '../../types';

const COVER_SIZE = 160;

type Props = {
  title: string;
  videos: UserVideo[];
  onPress: (video: UserVideo) => void;
  aspectRatio?: number;
};

export function SpotifyCoverSlider({ title, videos, onPress, aspectRatio = 1 }: Props) {
  const colors = useTheme();

  if (videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={{ width: COVER_SIZE }}
            onPress={() => onPress(video)}
            activeOpacity={0.85}
          >
            <SpotifyCover
              imageUrl={video.thumbnail_url}
              size={COVER_SIZE}
              aspectRatio={aspectRatio}
            />
            <View style={styles.coverTitleRow}>
              <Ionicons name="logo-youtube" size={10} color="#FF0000" style={styles.ytIcon} />
              <Text style={[styles.coverTitle, { color: colors.ink }]} numberOfLines={1}>
                {video.title ?? 'Untitled'}
              </Text>
            </View>
            <Text style={[styles.coverSubtitle, { color: colors.ink3 }]} numberOfLines={1}>
              {video.channel ?? 'YouTube'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.heading,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  scrollView: {
    flexGrow: 0,
    marginHorizontal: -Spacing.screen,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.lg,
  },
  coverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ytIcon: {
    marginRight: 4,
  },
  coverTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  coverSubtitle: {
    ...Typography.monoSmall,
    fontWeight: '600',
    marginTop: 2,
  },
});
