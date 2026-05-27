import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import type { UserVideo } from '../../types';

type Props = {
  title: string;
  videos: UserVideo[];
  onPress: (video: UserVideo) => void;
};

function copyLink(video: UserVideo) {
  Clipboard.setStringAsync(`https://www.youtube.com/watch?v=${video.youtube_video_id}`);
}

export function SpotifyCoverList({ title, videos, onPress }: Props) {
  const colors = useTheme();

  if (videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
      <View style={styles.list}>
        {videos.map((video, index) => (
          <TouchableOpacity
            key={video.id}
            style={[styles.row, { borderBottomColor: colors.hair }]}
            activeOpacity={0.7}
            onPress={() => onPress(video)}
          >
            <Text style={[styles.indexText, { color: colors.ink4 }]}>{index + 1}</Text>
            <View style={styles.thumb}>
              {video.thumbnail_url ? (
                <Image source={{ uri: video.thumbnail_url }} style={styles.thumbImage} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.3)" />
                </View>
              )}
            </View>
            <View style={styles.textBlock}>
              <View style={styles.titleRow}>
                <Ionicons name="logo-youtube" size={10} color="#FF0000" style={styles.ytIcon} />
                <Text style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
                  {video.title ?? 'Untitled'}
                </Text>
              </View>
              <Text style={[styles.itemSubtitle, { color: colors.ink3 }]} numberOfLines={1}>
                {video.channel ?? 'YouTube'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); copyLink(video); }}
              hitSlop={8}
              activeOpacity={0.6}
            >
              <Ionicons name="link-outline" size={20} color={colors.ink4} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.heading,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
  },
  indexText: {
    ...Typography.monoSmall,
    width: 20,
    textAlign: 'center',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytIcon: {
    marginRight: 4,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
  itemSubtitle: {
    ...Typography.monoSmall,
    fontWeight: '600',
  },
});
