// ── Sound Knot V2 — Finished Screen
// Knot motif + session stats summary + persist session to API
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { Knot } from '../src/components/ui/Knot';
import { useSessionStore } from '../src/stores/sessionStore';

export default function FinishedScreen() {
  const colors = useTheme();
  const { userVideoId, recallsCount, averageAccuracy, listenedSeconds } = useLocalSearchParams<{
    userVideoId?: string;
    recallsCount?: string;
    averageAccuracy?: string;
    listenedSeconds?: string;
  }>();

  const saveSession = useSessionStore((s) => s.saveSession);
  const saved = useRef(false);

  const recalls = parseInt(recallsCount || '0', 10);
  const accuracy = parseInt(averageAccuracy || '0', 10);
  const seconds = parseInt(listenedSeconds || '0', 10);

  // Persist the practice session on mount
  useEffect(() => {
    if (saved.current || !userVideoId) return;
    saved.current = true;
    saveSession({
      video_id: userVideoId,
      accuracy: accuracy / 100,
      listened_seconds: seconds,
      pass: recalls,
      mastery: accuracy / 100,
    });
  }, [userVideoId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <View style={styles.heroSection}>
        <Knot size={200} progress={1} mastery={accuracy / 100} pass={recalls} accentColor={colors.accent} />

        <Text style={[Typography.marker, { color: colors.accentInk, marginTop: Spacing.xxl }]}>
          Session complete
        </Text>

        <View style={styles.heroText}>
          <Text style={[Typography.hero, { color: colors.ink3 }]}>Small gain.</Text>
          <Text style={[Typography.hero, Typography.serifItalic]}>Counted.</Text>
        </View>

        {/* Stats summary */}
        <View style={[styles.statsCard, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
          <StatRow
            label="Recalls captured"
            value={String(recalls)}
            delta={`+${recalls}`}
            good
            colors={colors}
          />
          <StatRow
            label="Average match"
            value={`${accuracy}%`}
            delta={accuracy > 0 ? `+${accuracy}` : '0'}
            good={accuracy > 50}
            colors={colors}
          />
        </View>
      </View>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { borderTopColor: colors.hair }]}>
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: colors.ink }]}
          onPress={() => router.replace('/(tabs)/home')}
          activeOpacity={0.7}
        >
          <Text style={[Typography.button, { color: colors.paper }]}>Return home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  delta,
  good,
  colors,
}: {
  label: string;
  value: string;
  delta: string;
  good: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.statRow, { borderTopColor: colors.hair2 }]}>
      <Text style={[Typography.bodySmall, { color: colors.ink2 }]}>{label}</Text>
      <View style={styles.statValue}>
        <Text style={[Typography.markerLarge, { fontWeight: '500', color: colors.ink }]}>{value}</Text>
        <View style={[styles.deltaChip, { backgroundColor: colors.paper, borderColor: colors.hair }]}>
          <Text
            style={[
              Typography.monoSmall,
              { color: good ? colors.positive : colors.negative },
            ]}
          >
            {delta}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.massive,
  },
  heroText: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  statsCard: {
    marginTop: Spacing.huge,
    width: '100%',
    maxWidth: 320,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  deltaChip: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: Spacing.screen,
    paddingBottom: Spacing.xxxl,
  },
  homeBtn: {
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
