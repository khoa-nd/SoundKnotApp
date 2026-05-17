import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ProgressBar } from '../ui/ProgressBar';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onRateChange: () => void;
  onBookmark: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RATE_OPTIONS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function PlaybackControls({
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  playbackRate,
  onTogglePlay,
  onSeekForward,
  onSeekBackward,
  onRateChange,
  onBookmark,
}: AudioPlayerControlsProps) {
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressSection}>
        <ProgressBar progress={progress} color={Colors.accent} showGlow />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>-{formatTime(Math.max(0, duration - currentTime))}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onRateChange} style={styles.rateButton}>
          <Text style={styles.rateText}>{playbackRate}x</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSeekBackward} style={styles.secondaryButton}>
          <Text style={styles.secondaryIcon}>⏪</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onTogglePlay} style={styles.playButton}>
          <Text style={styles.playIcon}>{isBuffering ? '⏳' : isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSeekForward} style={styles.secondaryButton}>
          <Text style={styles.secondaryIcon}>⏩</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBookmark} style={styles.rateButton}>
          <Text style={styles.rateText}>🔖</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressSection: { marginBottom: 16 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 24 },
  secondaryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryIcon: { fontSize: 20 },
  rateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  rateText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
