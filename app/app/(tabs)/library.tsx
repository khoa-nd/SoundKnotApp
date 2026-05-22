// ── Sound Knot V2 — Library Screen
// Saved phrases & vocabulary from transcript bookmarks and AI tutor generation.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import {
  useSavedPhrasesStore,
  type SavedPhrase,
  type SavedPhraseKind,
} from '../../src/stores/savedPhrasesStore';
import { formatTimestamp } from '../../src/services/transcript';

const TABS: { key: SavedPhraseKind; label: string }[] = [
  { key: 'phrase', label: 'Phrases' },
  { key: 'vocabulary', label: 'Vocabulary' },
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
];

type TimeFilter = 'all' | 'yesterday' | 'last7';

export default function LibraryScreen() {
  const colors = useTheme();
  const { phrases, hydrated, load, remove } = useSavedPhrasesStore();
  const [activeTab, setActiveTab] = useState<SavedPhraseKind>('phrase');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SavedPhrase | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<SavedPhraseKind, number> = { phrase: 0, vocabulary: 0 };
    let ai = 0;
    let video = 0;
    for (const p of phrases) {
      c[p.kind] += 1;
      if (isAiCurated(p)) ai += 1;
      else video += 1;
    }
    return { ...c, ai, video };
  }, [phrases]);

  const visible = useMemo(
    () =>
      phrases
        .filter((p) => p.kind === activeTab)
        .filter((p) => matchesTimeFilter(p, timeFilter))
        .filter((p) => matchesSearch(p, searchQuery))
        .sort((a, b) => b.createdAt - a.createdAt),
    [phrases, activeTab, timeFilter, searchQuery]
  );

  const trimmedSearch = searchQuery.trim();

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setToastMessage(null);
      });
    }, 1800);
  };

  const openVideo = (item: SavedPhrase) => {
    if (isAiCurated(item)) return;
    setSelectedItem(null);
    router.push({
      pathname: '/listen',
      params: { videoId: item.videoId, start: String(item.start) },
    });
  };

  const copyItem = async (item: SavedPhrase) => {
    await Clipboard.setStringAsync(item.text);
    showToast('Copied saved item');
  };

  const deleteItem = async (item: SavedPhrase) => {
    setSelectedItem(null);
    await remove(item.id);
    showToast('Deleted saved item');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <View style={styles.headerBlock}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Saved knowledge</Text>
        <Text style={[Typography.headingLarge, { color: colors.ink, marginTop: Spacing.xs }]}>Library</Text>
        <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm }]}>
          {counts.phrase} phrases · {counts.vocabulary} words · {counts.ai} AI-curated
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.paper2, borderColor: colors.hair }]}> 
        <Ionicons name="search-outline" size={16} color={colors.ink4} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search saved items..."
          placeholderTextColor={colors.ink4}
          style={[styles.searchInput, { color: colors.ink }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!searchQuery && (
        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.ink4} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabBar, { borderColor: colors.hair }]}> 
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
              style={[styles.tab, { backgroundColor: active ? colors.ink : 'transparent' }]}
            >
              <Text style={[Typography.button, { color: active ? colors.paper : colors.ink2 }]}>{t.label}</Text>
              <Text style={[Typography.monoSmall, { color: active ? colors.paper : colors.ink4, marginLeft: Spacing.sm }]}> 
                {counts[t.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterRow}>
        {TIME_FILTERS.map((filter) => {
          const active = timeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setTimeFilter(filter.key)}
              activeOpacity={0.7}
              style={[styles.filterChip, { borderColor: colors.hair, backgroundColor: active ? colors.accentSoft : colors.paper }]}
            >
              <Text style={[Typography.monoSmall, { color: active ? colors.accentInk : colors.ink3 }]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hydrated ? null : visible.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}> 
            <Ionicons name={trimmedSearch ? 'search-outline' : 'bookmark-outline'} size={28} color={colors.ink4} />
            <Text style={[Typography.heading, { color: colors.ink2, marginTop: Spacing.md, textAlign: 'center' }]}> 
              {trimmedSearch ? 'No matches' : 'Nothing here yet'}
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm, textAlign: 'center' }]}> 
              {trimmedSearch
                ? 'Try a different word, video title, or time filter.'
                : activeTab === 'phrase'
                  ? 'Save transcript lines or AI phrases to build this list.'
                  : 'Save AI keywords to build vocabulary.'}
            </Text>
          </View>
        ) : (
          visible.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              colors={colors}
              kindLabel={activeTab === 'phrase' ? 'Phrase' : 'Vocabulary'}
              onOpen={() => openVideo(item)}
              onCopy={() => copyItem(item)}
              onDelete={() => deleteItem(item)}
              onDetails={() => setSelectedItem(item)}
            />
          ))
        )}
        <View style={{ height: 64 }} />
      </ScrollView>

      <Modal visible={selectedItem !== null} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setSelectedItem(null)}>
          <Pressable style={[styles.menuSheet, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
            {selectedItem && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.sourcePill, { backgroundColor: isAiCurated(selectedItem) ? colors.accentSoft : colors.paper2 }]}> 
                    <Ionicons
                      name={isAiCurated(selectedItem) ? 'sparkles-outline' : 'play-circle-outline'}
                      size={14}
                      color={isAiCurated(selectedItem) ? colors.accentInk : colors.ink3}
                    />
                    <Text style={[Typography.monoSmall, { color: isAiCurated(selectedItem) ? colors.accentInk : colors.ink3 }]}> 
                      {isAiCurated(selectedItem) ? 'AI-curated' : 'From video'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedItem(null)} hitSlop={8} activeOpacity={0.7}>
                    <Ionicons name="close-outline" size={22} color={colors.ink3} />
                  </TouchableOpacity>
                </View>
                <ParsedSavedText item={selectedItem} colors={colors} expanded />
                <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.lg }]} numberOfLines={2}>
                  {itemMeta(selectedItem)}
                </Text>
                <View style={[styles.menuDivider, { backgroundColor: colors.hair }]} />
                {!isAiCurated(selectedItem) && (
                  <ActionButton icon="play-circle-outline" label="Open at timestamp" color={colors.ink} onPress={() => openVideo(selectedItem)} />
                )}
                <ActionButton icon="copy-outline" label="Copy text" color={colors.ink} onPress={() => copyItem(selectedItem)} />
                <ActionButton icon="trash-outline" label="Delete" color={colors.negative} onPress={() => deleteItem(selectedItem)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {!!toastMessage && (
        <Animated.View style={[styles.toast, { backgroundColor: colors.ink, opacity: toastOpacity }]}> 
          <Text style={[Typography.monoSmall, { color: colors.paper }]}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function SavedItemCard({
  item,
  colors,
  kindLabel,
  onOpen,
  onCopy,
  onDelete,
  onDetails,
}: {
  item: SavedPhrase;
  colors: any;
  kindLabel: string;
  onOpen: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onDetails: () => void;
}) {
  const ai = isAiCurated(item);
  const veryLong = isVeryLongContent(item.text);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.paper2, borderColor: colors.hair }]}
      activeOpacity={0.78}
      onPress={onDetails}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.kindBadge, { backgroundColor: colors.paper, borderColor: colors.hair }]}> 
            <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>{kindLabel}</Text>
          </View>
          <View style={[styles.sourcePill, { backgroundColor: ai ? colors.accentSoft : colors.paper }]}> 
            <Ionicons name={ai ? 'sparkles-outline' : 'play-circle-outline'} size={13} color={ai ? colors.accentInk : colors.ink4} />
            <Text style={[Typography.monoSmall, { color: ai ? colors.accentInk : colors.ink4 }]}>{ai ? 'AI-curated' : 'Video'}</Text>
          </View>
        </View>
        {veryLong && (
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              onDetails();
            }}
            hitSlop={8}
            activeOpacity={0.6}
          >
            <Ionicons name="expand-outline" size={18} color={colors.ink3} />
          </TouchableOpacity>
        )}
      </View>

      <ParsedSavedText item={item} colors={colors} />

      <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.md }]} numberOfLines={1}>
        {itemMeta(item)}
      </Text>

      <View style={styles.cardActions}>
        {!ai && <IconAction icon="play-outline" label="Open" color={colors.ink3} onPress={onOpen} />}
        <IconAction icon="copy-outline" label="Copy" color={colors.ink3} onPress={onCopy} />
        <IconAction icon="trash-outline" label="Delete" color={colors.negative} onPress={onDelete} />
      </View>
    </TouchableOpacity>
  );
}

function ParsedSavedText({ item, colors, expanded = false }: { item: SavedPhrase; colors: any; expanded?: boolean }) {
  const parsed = parseSavedItemText(item.text);

  return (
    <View style={[styles.parsedTextBlock, expanded && styles.parsedTextBlockExpanded]}>
      <Text style={[styles.savedTitle, { color: colors.ink }]} numberOfLines={expanded ? undefined : 4}>
        {parsed.title}
      </Text>
      {!!parsed.explanation && (
        <Text style={[styles.savedExplanation, { color: colors.ink2 }]} numberOfLines={expanded ? undefined : 4}>
          {parsed.explanation}
        </Text>
      )}
      {!!parsed.example && (
        <Text style={[styles.savedExample, { color: colors.ink3 }]} numberOfLines={expanded ? undefined : 3}>
          {parsed.example}
        </Text>
      )}
    </View>
  );
}

function IconAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={(event: GestureResponderEvent) => {
        event.stopPropagation();
        onPress();
      }}
      style={styles.iconAction}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={17} color={color} />
    </TouchableOpacity>
  );
}

function ActionButton({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.65}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[Typography.bodyMedium, { color, marginLeft: Spacing.lg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function isAiCurated(item: SavedPhrase): boolean {
  return item.source === 'ai' || item.start > 86400;
}

function itemMeta(item: SavedPhrase): string {
  if (isAiCurated(item)) return `AI-curated${item.videoTitle ? ` · ${item.videoTitle}` : ''}`;
  return `${formatTimestamp(item.start)} · ${item.videoTitle ?? 'Saved video'}`;
}

function matchesTimeFilter(item: SavedPhrase, filter: TimeFilter): boolean {
  if (filter === 'all') return true;

  const created = new Date(item.createdAt);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 24 * 60 * 60 * 1000;

  if (filter === 'yesterday') {
    return created.getTime() >= startYesterday && created.getTime() < startToday;
  }

  return created.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
}

function isVeryLongContent(text: string): boolean {
  const clean = text.trim();
  const sentenceCount = clean.split(/[.!?]+\s+/).filter(Boolean).length;
  return clean.length > 420 || sentenceCount > 5;
}

function parseSavedItemText(text: string): { title: string; explanation: string; example: string } {
  const clean = text.replace(/\s+/g, ' ').trim();
  const exampleMatch = clean.match(/\b(?:Transcript|Example)\s*:\s*["“]?(.+?)["”]?$/i);
  const beforeExample = exampleMatch ? clean.slice(0, exampleMatch.index).trim() : clean;
  const example = exampleMatch?.[1]?.trim() ?? '';
  const separator = beforeExample.indexOf(' - ');

  if (separator < 0) return { title: beforeExample, explanation: '', example };

  return {
    title: beforeExample.slice(0, separator).trim(),
    explanation: beforeExample.slice(separator + 3).trim(),
    example,
  };
}

function matchesSearch(item: SavedPhrase, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.text,
    item.videoTitle,
    item.videoChannel,
    item.kind,
    isAiCurated(item) ? 'ai curated ai-curated' : 'video transcript',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 14,
    paddingVertical: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
    padding: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.lg,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen, paddingTop: Spacing.xl, gap: Spacing.lg },
  emptyBox: {
    padding: Spacing.massive,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.xxxl,
    padding: Spacing.xl,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  kindBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  parsedTextBlock: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  parsedTextBlockExpanded: {
    marginTop: Spacing.lg,
  },
  savedTitle: {
    fontFamily: Typography.headingSmall.fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  savedExplanation: {
    fontFamily: Typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  savedExample: {
    fontFamily: Typography.bodySmall.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 37, 34, 0.45)',
    justifyContent: 'flex-end',
    padding: Spacing.screen,
  },
  menuSheet: {
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  menuDivider: { height: 1, marginVertical: Spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  toast: {
    position: 'absolute',
    left: Spacing.screen,
    right: Spacing.screen,
    bottom: Spacing.xxxl,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
