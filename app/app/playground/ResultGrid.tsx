import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../src/constants/Typography';
import { Radius, Spacing } from '../../src/constants/Spacing';
import type { RunSnapshot } from '../../src/stores/playgroundStore';

export function ResultGrid({ snapshot, selectedModels, colors }: { snapshot: RunSnapshot | null; selectedModels: string[]; colors: any }) {
  if (!snapshot) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.paper2, borderColor: colors.hair }]}> 
        <Ionicons name="analytics-outline" size={28} color={colors.ink4} />
        <Text style={[Typography.heading, { color: colors.ink }]}>No run yet</Text>
        <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>Pick models, tune prompt, then run one prompt across all selected models.</Text>
      </View>
    );
  }

  const totalCost = Object.values(snapshot.results).reduce((sum, result) => sum + (result.cost ?? 0), 0);
  return (
    <View style={styles.wrapper}>
      <View style={styles.summaryRow}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Results · {snapshot.mode} · {snapshot.provider}</Text>
        <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>Total ~${totalCost.toFixed(5)}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {selectedModels.map((model) => (
          <ResultCard key={model} model={model} result={snapshot.results[model]} colors={colors} />
        ))}
      </ScrollView>
    </View>
  );
}

function ResultCard({ model, result, colors }: { model: string; result: RunSnapshot['results'][string] | undefined; colors: any }) {
  const status = result?.status ?? 'pending';
  const statusColor = status === 'done' ? colors.positive : status === 'error' ? colors.negative : colors.accent;
  return (
    <View style={[styles.card, { backgroundColor: colors.paper2, borderColor: colors.hair }]}> 
      <View style={styles.cardHeader}>
        <Text style={[Typography.bodyMedium, { color: colors.ink, flex: 1 }]} numberOfLines={2}>{model}</Text>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.metrics}>
        <Metric label="latency" value={result?.latencyMs == null ? '—' : `${result.latencyMs}ms`} colors={colors} />
        <Metric label="tokens" value={result?.usage ? `${result.usage.promptTokens}/${result.usage.completionTokens}` : '—'} colors={colors} />
        <Metric label="cost" value={result?.cost == null ? '—' : `~$${result.cost.toFixed(5)}`} colors={colors} />
      </View>
      <ScrollView style={styles.replyBox}>
        {status === 'error' ? (
          <Text style={[Typography.bodySmall, { color: colors.negative }]}>{result?.error}</Text>
        ) : status === 'pending' ? (
          <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>Waiting for reply...</Text>
        ) : (
          <Text style={[Typography.bodySmall, { color: colors.ink, lineHeight: 19 }]}>{result?.reply}</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
      <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>{label}</Text>
      <Text style={[Typography.monoSmall, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.lg },
  grid: { gap: Spacing.lg, paddingBottom: Spacing.md },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.xxxl, padding: Spacing.massive, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  card: { width: 360, minHeight: 430, borderWidth: 1, borderRadius: Radius.xxxl, padding: Spacing.xxl, gap: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 10, height: 10, borderRadius: Radius.circle },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 92 },
  replyBox: { maxHeight: 280 },
});
