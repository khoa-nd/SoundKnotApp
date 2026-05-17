import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import type { ContentItem } from '../../types';
import { Colors } from '../../constants/Colors';
import { Tag, LevelTag } from '../ui/Tag';
import { ProgressBar } from '../ui/ProgressBar';

interface ContentCardProps {
  item: ContentItem;
  progress?: number; // 0-1 completion
  onPress: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60}m`
    : `${m} min`;
}

export function ContentCard({ item, progress, onPress }: ContentCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {item.thumbnailUrl && (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      )}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <LevelTag level={item.difficulty} />
          <Text style={styles.duration}>{formatDuration(item.durationSeconds)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.speaker}>{item.speaker}</Text>
        <View style={styles.topicsRow}>
          {item.topics.slice(0, 3).map((topic) => (
            <Tag key={topic} label={topic} variant="outlined" color={Colors.accent} />
          ))}
        </View>
        {progress !== undefined && progress > 0 && (
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} height={3} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.surface,
  },
  info: { padding: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  speaker: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    width: 36,
  },
});
