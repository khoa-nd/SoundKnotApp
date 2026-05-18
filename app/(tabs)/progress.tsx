// ── Sound Knot V2 — Progress Screen
// Streak stats + 12-week heatmap + listening indicators + per-segment mastery
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Knot } from '../../src/components/ui/Knot';
import { ProgressBar } from '../../src/components/ui/ProgressBar';

// Mock 12-week heatmap (84 days)
const PRACTICE_GRID = Array.from({ length: 84 }, (_, i) => {
  if (i === 83) return 2; // today
  if (i > 70) return Math.random() > 0.3 ? 2 : 1;
  if (i > 50) return Math.random() > 0.5 ? 2 : Math.random() > 0.5 ? 1 : 0;
  return Math.random() > 0.7 ? 1 : 0;
});

const RECENT_ITEMS = [
  { id: '1', title: 'How LLMs Actually Learn — Gradient Descent Intuition', pass: 3, mastery: 0.62 },
  { id: '2', title: 'The Future of Programming Languages', pass: 2, mastery: 0.45 },
  { id: '3', title: 'Quantum Computing Explained in 20 Minutes', pass: 1, mastery: 0.28 },
  { id: '4', title: 'Deep Dive: How Transformers Changed NLP', pass: 4, mastery: 0.81 },
];

export default function ProgressScreen() {
  const colors = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Your practice</Text>
          <Text style={[Typography.headingLarge, { marginTop: Spacing.xs }]}>Progress</Text>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <StatCard label="Current streak" value="12" unit="days" accent colors={colors} />
          <StatCard label="Longest" value="23" unit="days" colors={colors} />
          <StatCard label="Segments" value="14" unit="active" colors={colors} />
          <StatCard label="Minutes" value="284" unit="total" colors={colors} />
        </View>

        {/* 12-week heatmap */}
        <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>Last 12 weeks</Text>
        <View style={[styles.heatmapCard, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
          <View style={styles.heatmapGrid}>
            {PRACTICE_GRID.map((v, i) => {
              const isToday = i === PRACTICE_GRID.length - 1;
              let bg: string;
              if (v === 2 && isToday) bg = colors.accent;
              else if (v === 2) bg = colors.ink;
              else if (v === 1) bg = colors.ink4;
              else bg = colors.hair;
              return (
                <View
                  key={i}
                  style={[styles.heatmapCell, { backgroundColor: bg }]}
                />
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>JAN 29</Text>
            <View style={styles.legendSquares}>
              <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>less</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.hair }]} />
              <View style={[styles.legendDot, { backgroundColor: colors.ink4 }]} />
              <View style={[styles.legendDot, { backgroundColor: colors.ink }]} />
              <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>more</Text>
            </View>
            <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>APR 23</Text>
          </View>
        </View>

        {/* Listening indicators */}
        <View style={styles.indicatorsSection}>
          <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>
            Listening indicators · last 30 days
          </Text>
          <IndicatorRow label="First-listen accuracy" from={38} to={62} unit="%" colors={colors} />
          <IndicatorRow label="Transcript dependence" from={82} to={41} unit="%" inverted colors={colors} />
          <IndicatorRow label="Avg replays per line" from={5.2} to={2.8} unit="×" inverted decimals colors={colors} />
          <IndicatorRow label="Dictation word accuracy" from={58} to={79} unit="%" colors={colors} />
        </View>

        {/* Per-segment mastery */}
        <View style={styles.masterySection}>
          <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>
            Active knots · mastery
          </Text>
          {RECENT_ITEMS.map((item) => (
            <View
              key={item.id}
              style={[styles.masteryItem, { borderTopColor: colors.hair }]}
            >
              <Knot size={32} progress={item.mastery} mastery={item.mastery} pass={item.pass} subdued={0.3} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodySmall, { fontWeight: '500' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <ProgressBar progress={item.mastery} style={{ marginTop: Spacing.sm }} />
              </View>
              <Text style={[Typography.markerLarge, { color: colors.ink3, minWidth: 36, textAlign: 'right' }]}>
                {Math.round(item.mastery * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
  colors,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: accent ? colors.ink : colors.paper2,
          borderColor: accent ? colors.ink : colors.hair,
        },
      ]}
    >
      <Text
        style={[
          Typography.marker,
          {
            color: accent ? colors.inkInverse : colors.ink4,
            marginBottom: Spacing.sm,
          },
        ]}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs }}>
        <Text style={[Typography.monoStat, { color: accent ? colors.paper : colors.ink }]}>{value}</Text>
        <Text style={[Typography.marker, { color: accent ? colors.inkInverse : colors.ink3 }]}>
          {unit}
        </Text>
      </View>
      {accent && (
        <View style={{ marginTop: Spacing.lg, flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <View
              key={i}
              style={{ flex: 1, height: 6, borderRadius: 1, backgroundColor: colors.accent, opacity: 0.9 }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function IndicatorRow({
  label,
  from,
  to,
  unit,
  inverted,
  decimals,
  colors,
}: {
  label: string;
  from: number;
  to: number;
  unit: string;
  inverted?: boolean;
  decimals?: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  const delta = to - from;
  const improved = inverted ? delta < 0 : delta > 0;
  const fmt = (v: number) => (decimals ? v.toFixed(1) : String(Math.round(v)));

  return (
    <View style={[styles.indicatorRow, { borderTopColor: colors.hair }]}>
      <View style={styles.indicatorHeader}>
        <Text style={[Typography.bodySmall, { color: colors.ink2 }]}>{label}</Text>
        <View style={styles.indicatorValues}>
          <Text style={[Typography.markerLarge, { color: colors.ink4 }]}>{fmt(from)}{unit}</Text>
          <Text style={[Typography.markerLarge, { color: colors.ink4 }]}>→</Text>
          <Text style={[Typography.markerLarge, { color: colors.ink, fontWeight: '500', fontSize: 14 }]}>
            {fmt(to)}{unit}
          </Text>
          <View style={[styles.indicatorDelta, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
            <Text style={[Typography.monoSmall, { color: improved ? colors.positive : colors.negative }]}>
              {delta > 0 ? '+' : ''}{fmt(delta)}{unit}
            </Text>
          </View>
        </View>
      </View>
      {/* Sparkline */}
      <View style={styles.sparkline}>
        {Array.from({ length: 30 }, (_, i) => {
          const p = i / 29;
          const val = from + delta * p + Math.sin(i * 0.9) * Math.abs(delta) * 0.12;
          const normMax = Math.max(from, to) * 1.15;
          const h = (val / normMax) * 100;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(10, h)}%`,
                backgroundColor: i > 25 ? colors.ink : colors.ink4,
                opacity: i > 25 ? 1 : 0.35,
                borderRadius: 1,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen },
  header: { marginBottom: Spacing.xxl },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%',
    padding: Spacing.xxl,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  heatmapCard: {
    padding: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xxl,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatmapCell: {
    width: `${100 / 7 - 0.4}%`,
    aspectRatio: 1,
    borderRadius: Radius.xs,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  legendSquares: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  indicatorsSection: { marginTop: Spacing.massive },
  indicatorRow: {
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  indicatorValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  indicatorDelta: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  sparkline: {
    marginTop: Spacing.md,
    height: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  masterySection: { marginTop: Spacing.massive },
  masteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
  },
});
