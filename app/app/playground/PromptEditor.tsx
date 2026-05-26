import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../src/constants/Typography';
import { Radius, Spacing } from '../../src/constants/Spacing';
import type { AiMode } from '../../src/services/aiTutor';
import type { PlaygroundParams, PromptPreset } from '../../src/stores/playgroundStore';

interface PromptEditorProps {
  mode: AiMode;
  systemPrompt: string;
  userPrompt: string;
  params: PlaygroundParams;
  presets: Record<string, PromptPreset>;
  onSystemPrompt: (value: string) => void;
  onUserPrompt: (value: string) => void;
  onParams: (value: Partial<PlaygroundParams>) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  colors: any;
}

export function PromptEditor({ mode, systemPrompt, userPrompt, params, presets, onSystemPrompt, onUserPrompt, onParams, onSavePreset, onLoadPreset, onDeletePreset, colors }: PromptEditorProps) {
  const [presetName, setPresetName] = useState('');
  const disabled = mode === 'proxy';

  return (
    <View style={[styles.panel, { backgroundColor: colors.paper2, borderColor: colors.hair }]}> 
      <View>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Prompt lab</Text>
        <Text style={[Typography.heading, { color: colors.ink }]}>System + user prompt</Text>
      </View>

      {disabled && (
        <View style={[styles.notice, { backgroundColor: colors.accentSoft }]}> 
          <Ionicons name="lock-closed-outline" size={16} color={colors.accentInk} />
          <Text style={[Typography.bodySmall, { color: colors.accentInk }]}>System prompt is set by the server in Proxy mode.</Text>
        </View>
      )}

      <TextArea
        label="System prompt"
        value={systemPrompt}
        onChangeText={onSystemPrompt}
        editable={!disabled}
        minHeight={132}
        colors={colors}
      />
      <TextArea
        label="User prompt"
        value={userPrompt}
        onChangeText={onUserPrompt}
        editable
        minHeight={160}
        colors={colors}
      />

      <View style={styles.knobs}>
        <Knob label="Temperature" value={params.temperature} min={0} max={2} step={0.1} onChange={(temperature) => onParams({ temperature })} colors={colors} />
        <Knob label="Max tokens" value={params.maxTokens} min={16} max={4096} step={128} onChange={(maxTokens) => onParams({ maxTokens: Math.round(maxTokens) })} colors={colors} />
        <Knob label="Top P" value={params.topP} min={0} max={1} step={0.05} onChange={(topP) => onParams({ topP })} colors={colors} />
      </View>

      <View style={[styles.presets, { borderColor: colors.hair }]}> 
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Presets</Text>
        <View style={styles.presetSaveRow}>
          <TextInput
            value={presetName}
            onChangeText={setPresetName}
            placeholder="Preset name"
            placeholderTextColor={colors.ink4}
            style={[styles.input, { color: colors.ink, borderColor: colors.hair, backgroundColor: colors.paper }]}
          />
          <TouchableOpacity
            onPress={() => {
              onSavePreset(presetName);
              setPresetName('');
            }}
            style={[styles.saveBtn, { backgroundColor: colors.ink }]}
          >
            <Text style={[Typography.buttonSmall, { color: colors.paper }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.presetList}>
          {Object.keys(presets).map((name) => (
            <View key={name} style={[styles.presetChip, { borderColor: colors.hair, backgroundColor: colors.paper }]}> 
              <TouchableOpacity onPress={() => onLoadPreset(name)}>
                <Text style={[Typography.monoSmall, { color: colors.ink }]}>{name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeletePreset(name)} hitSlop={8}>
                <Ionicons name="close" size={14} color={colors.ink4} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function TextArea({ label, value, onChangeText, editable, minHeight, colors }: { label: string; value: string; onChangeText: (value: string) => void; editable: boolean; minHeight: number; colors: any }) {
  return (
    <View style={styles.field}>
      <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline
        textAlignVertical="top"
        style={[styles.textarea, { minHeight, color: colors.ink, borderColor: colors.hair, backgroundColor: editable ? colors.paper : colors.paper2, opacity: editable ? 1 : 0.65 }]}
      />
    </View>
  );
}

function Knob({ label, value, min, max, step, onChange, colors }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; colors: any }) {
  const percent = ((value - min) / (max - min)) * 100;
  const bump = (direction: 1 | -1) => onChange(Math.min(max, Math.max(min, Number((value + direction * step).toFixed(2)))));
  return (
    <View style={[styles.knob, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
      <View style={styles.knobHeader}>
        <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>{label}</Text>
        <Text style={[Typography.monoSmall, { color: colors.ink }]}>{value}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.hair }]}> 
        <View style={[styles.trackFill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity onPress={() => bump(-1)}><Ionicons name="remove-circle-outline" size={20} color={colors.ink3} /></TouchableOpacity>
        <TouchableOpacity onPress={() => bump(1)}><Ionicons name="add-circle-outline" size={20} color={colors.ink3} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: Radius.xxxl, padding: Spacing.xxl, gap: Spacing.lg },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.xl, padding: Spacing.lg },
  field: { gap: Spacing.sm },
  textarea: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, fontFamily: Typography.bodyMedium.fontFamily, fontSize: 14, outlineStyle: 'none' } as any,
  knobs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  knob: { flex: 1, minWidth: 160, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md },
  knobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: Radius.circle, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: Radius.circle },
  stepper: { flexDirection: 'row', justifyContent: 'space-between' },
  presets: { borderTopWidth: 1, paddingTop: Spacing.lg, gap: Spacing.md },
  presetSaveRow: { flexDirection: 'row', gap: Spacing.md },
  input: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, outlineStyle: 'none' } as any,
  saveBtn: { borderRadius: Radius.xl, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  presetList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetChip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
