import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../src/constants/Typography';
import { Radius, Spacing } from '../../src/constants/Spacing';
import { fetchGeminiModels, fetchOpenRouterModels, GEMINI_MODELS, type AiProvider, type GeminiModel, type OpenRouterModel } from '../../src/services/aiTutor';

interface ModelPickerProps {
  provider: AiProvider;
  apiKey: string;
  selected: string[];
  cachedOpenRouterModels: OpenRouterModel[] | null;
  onToggle: (id: string) => void;
  onCacheOpenRouter: (models: OpenRouterModel[] | null) => void;
  colors: any;
}

type CatalogItem = {
  id: string;
  name?: string;
  description?: string;
  free: boolean;
  promptPerM: number | null;
  completionPerM: number | null;
};

const FALLBACK_GEMINI: CatalogItem[] = GEMINI_MODELS.map((id) => ({
  id,
  name: id,
  description: 'Curated Gemini model',
  free: false,
  promptPerM: null,
  completionPerM: null,
}));

export function ModelPicker({ provider, apiKey, selected, cachedOpenRouterModels, onToggle, onCacheOpenRouter, colors }: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [cheapOnly, setCheapOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiModels, setGeminiModels] = useState<GeminiModel[] | null>(null);

  useEffect(() => {
    if (provider !== 'gemini' || !apiKey || geminiModels) return;
    let cancelled = false;
    setLoading(true);
    fetchGeminiModels(apiKey)
      .then((models) => {
        if (!cancelled) setGeminiModels(models);
      })
      .catch(() => {
        if (!cancelled) setGeminiModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiKey, geminiModels, provider]);

  useEffect(() => {
    if (provider !== 'openrouter' || cachedOpenRouterModels || !apiKey) return;
    refreshOpenRouter();
  }, [provider, cachedOpenRouterModels, apiKey]);

  const items = useMemo(() => {
    const base: CatalogItem[] = provider === 'gemini'
      ? (geminiModels?.length
        ? geminiModels.map((model) => ({
            id: model.id,
            name: model.displayName ?? model.id,
            description: model.description,
            free: false,
            promptPerM: null,
            completionPerM: null,
          }))
        : FALLBACK_GEMINI)
      : (cachedOpenRouterModels ?? []).map((model) => ({
          id: model.id,
          name: model.name ?? model.id,
          description: `${model.context_length ?? 'unknown'} context`,
          free: model.id.endsWith(':free'),
          promptPerM: model.pricing?.prompt ? Number(model.pricing.prompt) * 1_000_000 : null,
          completionPerM: model.pricing?.completion ? Number(model.pricing.completion) * 1_000_000 : null,
        }));

    const q = query.trim().toLowerCase();
    return base
      .filter((item) => !q || item.id.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q))
      .filter((item) => !freeOnly || item.free)
      .filter((item) => !cheapOnly || (item.promptPerM != null && item.promptPerM <= 1))
      .slice(0, 120);
  }, [cachedOpenRouterModels, cheapOnly, freeOnly, geminiModels, provider, query]);

  async function refreshOpenRouter() {
    if (!apiKey) {
      setError('Add an OpenRouter key in AI Settings first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const models = await fetchOpenRouterModels(apiKey);
      onCacheOpenRouter(models);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      onCacheOpenRouter(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.panel, { backgroundColor: colors.paper2, borderColor: colors.hair }]}> 
      <View style={styles.headerRow}>
        <View>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Model picker</Text>
          <Text style={[Typography.heading, { color: colors.ink }]}>Selected {selected.length}/10</Text>
        </View>
        {provider === 'openrouter' && (
          <TouchableOpacity style={[styles.smallButton, { borderColor: colors.hair }]} onPress={refreshOpenRouter}>
            <Ionicons name="refresh-outline" size={15} color={colors.ink} />
            <Text style={[Typography.monoSmall, { color: colors.ink }]}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
        <Ionicons name="search-outline" size={16} color={colors.ink4} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search model id or name..."
          placeholderTextColor={colors.ink4}
          style={[styles.searchInput, { color: colors.ink }]}
        />
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="Free tier only" active={freeOnly} onPress={() => setFreeOnly(!freeOnly)} colors={colors} />
        <FilterChip label="≤ $1/M tokens" active={cheapOnly} onPress={() => setCheapOnly(!cheapOnly)} colors={colors} />
      </View>

      {!!error && <Text style={[Typography.bodySmall, { color: colors.negative }]}>{error}</Text>}
      {loading && <ActivityIndicator size="small" color={colors.accent} />}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onToggle(item.id)}
              style={[styles.modelRow, { backgroundColor: active ? colors.ink : colors.paper, borderColor: active ? colors.ink : colors.hair }]}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: active ? colors.paper : colors.ink }]} numberOfLines={1}>{item.name ?? item.id}</Text>
                <Text style={[Typography.monoSmall, { color: active ? colors.inkInverse : colors.ink4 }]} numberOfLines={1}>{item.id}</Text>
                <Text style={[Typography.monoSmall, { color: active ? colors.inkInverse2 : colors.ink3 }]} numberOfLines={1}>
                  {item.free ? 'free tier' : item.promptPerM == null ? 'pricing unknown' : `~$${item.promptPerM.toFixed(2)}/M prompt`}
                </Text>
              </View>
              <Ionicons name={active ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={active ? colors.paper : colors.ink4} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, { borderColor: colors.hair, backgroundColor: active ? colors.accentSoft : colors.paper }]}>
      <Text style={[Typography.monoSmall, { color: active ? colors.accentInk : colors.ink3 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: Radius.xxxl, padding: Spacing.xxl, gap: Spacing.lg, minHeight: 520 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.lg },
  smallButton: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  searchBox: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  searchInput: { flex: 1, fontFamily: Typography.bodyMedium.fontFamily, fontSize: 14, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  list: { flex: 1 },
  listContent: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  modelRow: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
