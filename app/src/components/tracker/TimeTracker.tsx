import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface TimeTrackerProps {
  elapsed: number;
  formattedElapsed: string;
  isTracking: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  contentTitle?: string;
}

export function TimeTracker({
  elapsed,
  formattedElapsed,
  isTracking,
  onStart,
  onPause,
  onStop,
  contentTitle,
}: TimeTrackerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>
          {isTracking ? 'Currently listening' : 'Ready to listen'}
        </Text>
        <Text style={styles.timerValue}>{formattedElapsed}</Text>
        {contentTitle && (
          <Text style={styles.contentTitle} numberOfLines={1}>
            {contentTitle}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        {!isTracking ? (
          <TouchableOpacity onPress={onStart} style={styles.startBtn}>
            <Text style={styles.startText}>Start Session</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={onPause} style={styles.pauseBtn}>
              <Text style={styles.controlText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onStop} style={styles.stopBtn}>
              <Text style={styles.controlText}>End</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerValue: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  contentTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  startBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopBtn: {
    flex: 1,
    backgroundColor: Colors.error + '30',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  controlText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
