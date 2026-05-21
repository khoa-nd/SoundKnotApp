import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../ui/Card';

interface StatsGridProps {
  totalHours: number;
  streak: number;
  sessionsCompleted: number;
  todayMinutes: number;
  level: string;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  if (h >= 1000) return `${(h / 1000).toFixed(1)}K`;
  return h.toString();
}

export function StatsGrid({
  totalHours,
  streak,
  sessionsCompleted,
  todayMinutes,
  level,
}: StatsGridProps) {
  return (
    <View style={styles.grid}>
      <Card style={styles.statCard}>
        <Text style={styles.statValue}>{formatHours(totalHours)}</Text>
        <Text style={styles.statLabel}>Total Hours</Text>
      </Card>

      <Card style={styles.statCard}>
        <Text style={[styles.statValue, { color: Colors.warning }]}>{streak}</Text>
        <Text style={styles.statLabel}>Day Streak</Text>
      </Card>

      <Card style={styles.statCard}>
        <Text style={styles.statValue}>{sessionsCompleted}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </Card>

      <Card style={styles.statCard}>
        <Text style={[styles.statValue, { color: Colors.accent }]}>
          {todayMinutes}
        </Text>
        <Text style={styles.statLabel}>Min Today</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
