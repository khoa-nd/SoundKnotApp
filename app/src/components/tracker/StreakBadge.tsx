import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface StreakBadgeProps {
  streak: number;
  longestStreak: number;
}

export function StreakBadge({ streak, longestStreak }: StreakBadgeProps) {
  let badgeLabel = '';
  let badgeColor: string = Colors.textMuted;

  if (streak >= 100) {
    badgeLabel = 'Century';
    badgeColor = Colors.master;
  } else if (streak >= 30) {
    badgeLabel = 'Monthly';
    badgeColor = Colors.advanced;
  } else if (streak >= 7) {
    badgeLabel = 'Weekly';
    badgeColor = Colors.intermediate;
  } else if (streak >= 3) {
    badgeLabel = 'Building';
    badgeColor = Colors.accent;
  }

  return (
    <View style={[styles.container, { borderColor: badgeColor }]}>
      <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
        <Text style={styles.fireIcon}>🔥</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.streakValue}>{streak} days</Text>
        <Text style={styles.streakLabel}>
          {badgeLabel ? `${badgeLabel} streak` : 'Keep going!'}
        </Text>
        {longestStreak > 0 && (
          <Text style={styles.longest}>Best: {longestStreak} days</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireIcon: { fontSize: 24 },
  info: {},
  streakValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  longest: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
