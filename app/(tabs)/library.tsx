// ── Sound Knot V2 — Library Screen
// Saved phrases & vocabulary the learner has bookmarked from the Listen screen.
// Two vertical tabs: Phrase | Vocabulary. Backed by savedPhrasesStore.
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  { key: 'phrase', label: 'Phrase' },
  { key: 'vocabulary', label: 'Vocabulary' },
];

export default function LibraryScreen() {
  const colors = useTheme();
  const { phrases, hydrated, load, remove, setKind } = useSavedPhrasesStore();
  const [activeTab, setActiveTab] = useState<SavedPhraseKind>('phrase');
  const [actionFor, setActionFor] = useState<SavedPhrase | null>(null);

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

  const visible = useMemo(
    () =>
      phrases
        .filter((p) => p.kind === activeTab)
        .sort((a, b) => b.createdAt - a.createdAt),
    [phrases, activeTab]
  );

  const counts = useMemo(() => {
    const c: Record<SavedPhraseKind, number> = { phrase: 0, vocabulary: 0 };
    for (const p of phrases) c[p.kind] += 1;
    return c;
  }, [phrases]);

  const otherKind: SavedPhraseKind = activeTab === 'phrase' ? 'vocabulary' : 'phrase';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <View style={styles.headerBlock}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Saved from videos</Text>
        <Text style={[Typography.headingLarge, { marginTop: Spacing.xs }]}>Library</Text>
      </View>

      <View style={[styles.tabBar, { borderColor: colors.hair }]}>
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? colors.ink : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  Typography.button,
                  { color: active ? colors.paper : colors.ink2 },
                ]}
              >
                {t.label}
              </Text>
              <Text
                style={[
                  Typography.monoSmall,
                  {
                    color: active ? colors.paper : colors.ink4,
                    marginLeft: Spacing.sm,
                  },
                ]}
              >
                {counts[t.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!hydrated ? null : visible.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
            <Ionicons name="bookmark-outline" size={28} color={colors.ink4} />
            <Text
              style={[
                Typography.heading,
                { color: colors.ink2, marginTop: Spacing.md, textAlign: 'center' },
              ]}
            >
              Nothing here yet
            </Text>
            <Text
              style={[
                Typography.bodySmall,
                { color: colors.ink3, marginTop: Spacing.sm, textAlign: 'center' },
              ]}
            >
              {activeTab === 'phrase'
                ? 'Tap the bookmark next to any transcript line to save it as a phrase.'
                : 'Move a saved item here to build your personal vocabulary list.'}
            </Text>
          </View>
        ) : (
          visible.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, { borderTopColor: colors.hair }]}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/listen',
                  params: { videoId: item.videoId },
                })
              }
              onLongPress={() => setActionFor(item)}
              delayLongPress={350}
            >
              <View style={styles.rowBody}>
                <Text style={[Typography.bodyMedium, { color: colors.ink }]}>
                  {item.text}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="play-circle-outline" size={14} color={colors.ink4} />
                  <Text
                    style={[
                      Typography.monoSmall,
                      { color: colors.ink4, marginLeft: Spacing.xs },
                    ]}
                    numberOfLines={1}
                  >
                    {formatTimestamp(item.start)} · {item.videoTitle ?? 'Saved video'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setActionFor(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.kebab}
                activeOpacity={0.6}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink3} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={actionFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionFor(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setActionFor(null)}>
          <Pressable
            style={[styles.menuSheet, { backgroundColor: colors.paper, borderColor: colors.hair }]}
          >
            {actionFor && (
              <>
                <Text style={[Typography.marker, { color: colors.ink4 }]}>SAVED ITEM</Text>
                <Text
                  style={[Typography.bodyMedium, { color: colors.ink, marginTop: Spacing.sm }]}
                  numberOfLines={3}
                >
                  "{actionFor.text}"
                </Text>
                <View style={[styles.menuDivider, { backgroundColor: colors.hair }]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    const target = actionFor;
                    setActionFor(null);
                    await setKind(target.id, otherKind);
                    setActiveTab(otherKind);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color={colors.ink2} />
                  <Text
                    style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.lg }]}
                  >
                    Move to {otherKind === 'phrase' ? 'Phrase' : 'Vocabulary'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const target = actionFor;
                    setActionFor(null);
                    router.push({
                      pathname: '/listen',
                      params: { videoId: target.videoId },
                    });
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="play-circle-outline" size={18} color={colors.ink2} />
                  <Text
                    style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.lg }]}
                  >
                    Open video
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    const target = actionFor;
                    setActionFor(null);
                    await remove(target.id);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.negative} />
                  <Text
                    style={[
                      Typography.bodyMedium,
                      { color: colors.negative, marginLeft: Spacing.lg },
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setActionFor(null)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-outline" size={18} color={colors.ink3} />
                  <Text
                    style={[
                      Typography.bodyMedium,
                      { color: colors.ink2, marginLeft: Spacing.lg },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg },
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
  scroll: { flex: 1 },
  content: { padding: Spacing.screen, paddingTop: Spacing.xl },
  emptyBox: {
    padding: Spacing.massive,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
  },
  rowBody: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  kebab: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
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
  menuDivider: { height: 1, marginVertical: Spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
});
