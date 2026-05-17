// ── Sound Knot V2 — Library Screen
// Content discovery / browse library
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Chip } from '../../src/components/ui/Chip';

const TOPICS = ['Technology', 'Philosophy', 'Science', 'History', 'Arts', 'Business'];
const LIBRARY_ITEMS = [
  { id: '1', title: 'How LLMs Actually Learn', channel: '3Blue1Brown', duration: '24:18', topics: ['Technology', 'Science'] },
  { id: '2', title: 'The Stoic Philosophy of Marcus Aurelius', channel: 'Philosophy Overdose', duration: '18:42', topics: ['Philosophy', 'History'] },
  { id: '3', title: 'Quantum Computing Explained', channel: 'Veritasium', duration: '20:05', topics: ['Science'] },
  { id: '4', title: 'The History of the Roman Empire', channel: 'Historia Civilis', duration: '32:10', topics: ['History'] },
  { id: '5', title: 'Understanding Modern Art', channel: 'The Art Assignment', duration: '15:30', topics: ['Arts'] },
  { id: '6', title: 'How Startups Actually Work', channel: 'Y Combinator', duration: '28:55', topics: ['Business', 'Technology'] },
];

export default function LibraryScreen() {
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const filtered = LIBRARY_ITEMS.filter((item) => {
    if (activeTopic && !item.topics.includes(activeTopic)) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Discover content</Text>
          <Text style={[Typography.headingLarge, { marginTop: Spacing.xs }]}>Library</Text>
        </View>

        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.paper2,
              borderColor: colors.hair,
              color: colors.ink,
            },
            Typography.mono,
          ]}
          placeholder="Search library…"
          placeholderTextColor={colors.ink4}
          value={search}
          onChangeText={setSearch}
        />

        {/* Topic chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicRow}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[
                styles.topicChip,
                {
                  backgroundColor: activeTopic === topic ? colors.ink : colors.paper2,
                  borderColor: activeTopic === topic ? colors.ink : colors.hair,
                },
              ]}
              onPress={() => setActiveTopic(activeTopic === topic ? null : topic)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  Typography.chip,
                  {
                    color: activeTopic === topic ? colors.paper : colors.ink2,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Segmented filter */}
        <View style={styles.segmentedRow}>
          {['All', 'For You', 'Masters'].map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: seg === 'All' ? colors.ink : 'transparent',
                  borderColor: colors.hair,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  Typography.chip,
                  {
                    color: seg === 'All' ? colors.paper : colors.ink2,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {seg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content list */}
        <View style={styles.contentList}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.contentCard, { borderTopColor: colors.hair }]}
              onPress={() => router.push({ pathname: '/listen', params: { videoId: 'dQw4w9WgcQ' } })}
              activeOpacity={0.7}
            >
              <View style={[styles.contentThumb, { backgroundColor: colors.paper2 }]}>
                <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>▶</Text>
              </View>
              <View style={styles.contentInfo}>
                <Text style={[Typography.bodyMedium, { fontWeight: '500' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.xs }]}>
                  {item.channel} · {item.duration}
                </Text>
                <View style={styles.contentTopics}>
                  {item.topics.map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen },
  header: { marginBottom: Spacing.xxl },
  searchInput: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  topicRow: { marginBottom: Spacing.xl },
  topicChip: {
    marginRight: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  contentList: {},
  contentCard: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
  },
  contentThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentInfo: { flex: 1 },
  contentTopics: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
});
