import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import type { UserVideo } from '../../types';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 200;

type Props = {
  title: string;
  videos: UserVideo[];
  onPress: (video: UserVideo) => void;
};

export function RankedSlider({ title, videos, onPress }: Props) {
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
        {videos.map((video, index) => (
          <TouchableOpacity
            key={video.id}
            style={styles.card}
            onPress={() => onPress(video)}
            activeOpacity={0.85}
          >
            <View style={styles.imageWrapper}>
              {video.thumbnail_url ? (
                <Image source={{ uri: video.thumbnail_url }} style={styles.image} />
              ) : (
                <View style={[styles.placeholder, { backgroundColor: colors.paper2 }]}>
                  <Ionicons name="musical-notes" size={32} color="rgba(255,255,255,0.15)" />
                </View>
              )}
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Ionicons name="logo-youtube" size={10} color="#FF0000" style={styles.ytIcon} />
                <Text style={[styles.videoTitle, { color: colors.ink }]} numberOfLines={2}>
                  {video.title ?? 'Untitled'}
                </Text>
              </View>
            </View>
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
  card: {
    width: CARD_WIDTH,
  },
  imageWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingTop: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytIcon: {
    marginRight: 4,
  },
  videoTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
});
