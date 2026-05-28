import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import type { UserVideo } from '../../types';

type Props = {
  video: UserVideo;
  onPress: (video: UserVideo) => void;
};

export function HighlightCover({ video, onPress }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.ink }]}>Today's Pick</Text>
      <TouchableOpacity
        style={[styles.card, { borderColor: colors.hair }]}
        onPress={() => onPress(video)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          {video.thumbnail_url ? (
            <Image source={{ uri: video.thumbnail_url }} style={styles.image} />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.paper2 }]}>
              <Ionicons name="musical-notes" size={48} color="rgba(255,255,255,0.15)" />
            </View>
          )}
          <View style={styles.overlay} />
          <View style={styles.playButton}>
            <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Ionicons name="logo-youtube" size={14} color="#FF0000" style={styles.ytIcon} />
            <Text style={[styles.title, { color: colors.ink }]} numberOfLines={2}>
              {video.title ?? 'Untitled'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  label: {
    ...Typography.heading,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(29, 185, 84, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingTop: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytIcon: {
    marginRight: 5,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
});
