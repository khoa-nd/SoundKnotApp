import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { KeyPhrase } from '../../types';
import { Colors } from '../../constants/Colors';
import { ProgressBar } from '../ui/ProgressBar';

interface PhraseRepeaterProps {
  phrase: KeyPhrase;
  isActive: boolean;
  isPlaying: boolean;
  repeatCount: number;
  playbackRate: number;
  onPlay: () => void;
  onRecord: () => void;
  onSpeedChange: (rate: number) => void;
}

export function PhraseRepeater({
  phrase,
  isActive,
  isPlaying,
  repeatCount,
  playbackRate,
  onPlay,
  onRecord,
  onSpeedChange,
}: PhraseRepeaterProps) {
  return (
    <View style={[styles.container, isActive && styles.active]}>
      <Text style={styles.phraseText}>{phrase.original}</Text>
      {phrase.translation && (
        <Text style={styles.translation}>{phrase.translation}</Text>
      )}

      <ProgressBar
        progress={phrase.masteryLevel / 100}
        color={Colors.success}
        backgroundColor={Colors.borderLight}
        height={4}
        style={styles.masteryBar}
      />

      <View style={styles.controls}>
        <View style={styles.repeatInfo}>
          <Text style={styles.repeatCount}>{repeatCount}x</Text>
          <Text style={styles.repeatLabel}>repetitions</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onPlay} style={styles.playBtn}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRecord} style={styles.recordBtn}>
            <Text style={styles.recordIcon}>🎤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.speedRow}>
        {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
          <TouchableOpacity
            key={rate}
            onPress={() => onSpeedChange(rate)}
            style={[styles.speedBtn, playbackRate === rate && styles.speedBtnActive]}
          >
            <Text
              style={[styles.speedText, playbackRate === rate && styles.speedTextActive]}
            >
              {rate}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  active: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  phraseText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 4,
  },
  translation: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginBottom: 12,
  },
  masteryBar: { marginBottom: 16 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  repeatInfo: {
    alignItems: 'center',
  },
  repeatCount: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  repeatLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 18 },
  recordBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIcon: { fontSize: 18 },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  speedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  speedBtnActive: {
    backgroundColor: Colors.primary,
  },
  speedText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  speedTextActive: {
    color: Colors.text,
  },
});
