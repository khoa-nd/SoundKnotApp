import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../src/constants/Typography';
import { Radius, Spacing } from '../../src/constants/Spacing';
import type { AiMode, AiProvider } from '../../src/services/aiTutor';

interface RunBarProps {
  provider: AiProvider;
  mode: AiMode;
  canRun: boolean;
  running: boolean;
  selectedCount: number;
  totalCost: number | null;
  message: string | null;
  onProvider: (provider: AiProvider) => void;
  onMode: (mode: AiMode) => void;
  onRun: () => void;
  colors: any;
}

export function RunBar({ provider, mode, canRun, running, selectedCount, totalCost, message, onProvider, onMode, onRun, colors }: RunBarProps) {
  return (
    <View style={[styles.bar, { backgroundColor: colors.ink }]}> 
      <View style={styles.group}>
        <Toggle label="Gemini" active={provider === 'gemini'} onPress={() => onProvider('gemini')} colors={colors} />
        <Toggle label="OpenRouter" active={provider === 'openrouter'} onPress={() => onProvider('openrouter')} colors={colors} />
      </View>
      <View style={styles.group}>
        <Toggle label="Direct" active={mode === 'direct'} onPress={() => onMode('direct')} colors={colors} />
        <Toggle label="Proxy" active={mode === 'proxy'} onPress={() => onMode('proxy')} colors={colors} />
      </View>
      <View style={styles.statusBlock}>
        <Text style={[Typography.monoSmall, { color: colors.inkInverse }]}>Models {selectedCount}/10</Text>
        <Text style={[Typography.monoSmall, { color: colors.inkInverse2 }]}>Cost {totalCost == null ? '—' : `~$${totalCost.toFixed(5)}`}</Text>
        {!!message && <Text style={[Typography.monoSmall, { color: colors.accent }]} numberOfLines={1}>{message}</Text>}
      </View>
      <TouchableOpacity
        onPress={onRun}
        disabled={!canRun || running}
        style={[styles.runBtn, { backgroundColor: canRun && !running ? colors.accent : colors.ink3 }]}
        activeOpacity={0.75}
      >
        <Ionicons name={running ? 'hourglass-outline' : 'play'} size={16} color={colors.ink} />
        <Text style={[Typography.button, { color: colors.ink }]}>{running ? 'Running' : 'Run'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Toggle({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.toggle, { backgroundColor: active ? colors.paper : 'transparent', borderColor: active ? colors.paper : colors.ink2 }]}>
      <Text style={[Typography.monoSmall, { color: active ? colors.ink : colors.paper }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: Radius.xxxl, padding: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.lg },
  group: { flexDirection: 'row', gap: Spacing.sm },
  toggle: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  statusBlock: { flex: 1, minWidth: 180 },
  runBtn: { minHeight: 42, borderRadius: Radius.pill, paddingHorizontal: Spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
});
