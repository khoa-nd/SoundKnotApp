// ── Sound Knot V2 — Home Screen
// Paste YouTube URL → auto-navigate to Listen
// Today card + Recent knots + tab bar: Practice | Library | Progress
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Knot } from '../../src/components/ui/Knot';
import { Chip } from '../../src/components/ui/Chip';

// Mock data
const RECENT_ITEMS = [
  { id: '1', title: 'How LLMs Actually Learn — Gradient Descent Intuition', channel: '3Blue1Brown', segment: 'Seg 3', pass: 3, mastery: 0.62, lastPracticed: '2h ago' },
  { id: '2', title: 'The Future of Programming Languages', channel: 'Lex Fridman Podcast', segment: 'Seg 1', pass: 2, mastery: 0.45, lastPracticed: 'Yesterday' },
  { id: '3', title: 'Quantum Computing Explained in 20 Minutes', channel: 'Veritasium', segment: 'Seg 2', pass: 1, mastery: 0.28, lastPracticed: '2 days ago' },
  { id: '4', title: 'Deep Dive: How Transformers Changed NLP', channel: 'Andrej Karpathy', segment: 'Seg 1', pass: 4, mastery: 0.81, lastPracticed: '3 days ago' },
];

export default function HomeScreen() {
  const colors = useTheme();
  const [urlValue, setUrlValue] = useState('');
  const active = RECENT_ITEMS[0];
  const rest = RECENT_ITEMS.slice(1);

  const extractYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : 'dQw4w9WgcQ';
  };

  const submitUrl = () => {
    const vid = extractYouTubeId(urlValue.trim() || 'https://youtube.com/watch?v=sample');
    router.push({ pathname: '/listen', params: { videoId: vid } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date + Streak */}
        <View style={styles.dateRow}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Sound Knot · Practice</Text>
          <Chip label="12 day streak" dotColor={colors.accent} />
        </View>

        {/* Hero text */}
        <View style={styles.heroSection}>
          <Text style={[Typography.titleLarge, { color: colors.ink3 }]}>Bring in a video.</Text>
          <Text style={[Typography.titleLarge, Typography.serifItalic]}>Work the knot.</Text>
        </View>

        {/* URL Input */}
        <View style={styles.urlRow}>
          <TextInput
            style={[
              styles.urlInput,
              {
                backgroundColor: colors.paper2,
                borderColor: colors.hair,
                color: colors.ink,
              },
              Typography.mono,
            ]}
            placeholder="Paste a YouTube URL…"
            placeholderTextColor={colors.ink4}
            value={urlValue}
            onChangeText={setUrlValue}
            onSubmitEditing={submitUrl}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.urlSubmit,
              { backgroundColor: urlValue ? colors.ink : colors.ink4 },
            ]}
            onPress={submitUrl}
            activeOpacity={0.7}
          >
            <Text style={[Typography.bodyMedium, { color: colors.paper, fontSize: 16 }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Hint chips */}
        <View style={styles.hintRow}>
          <Chip label="Paste link" />
          <Chip label="or use clipboard" />
        </View>

        {/* Today section */}
        <View style={styles.todaySection}>
          <View style={styles.sectionHeader}>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>Today</Text>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>1 / 4 complete</Text>
          </View>

          <TouchableOpacity
            style={[styles.todayCard, { backgroundColor: colors.paper2, borderColor: colors.hair }]}
            onPress={() => router.push('/listen')}
            activeOpacity={0.7}
          >
            <Knot size={64} progress={0.45} mastery={active.mastery} pass={active.pass} />
            <View style={styles.todayInfo}>
              <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.xs }]}>
                Pass {active.pass} · {active.segment}
              </Text>
              <Text
                style={[Typography.bodyMedium, { flexShrink: 1 }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {active.title}
              </Text>
              <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.sm }]}>
                {active.channel}
              </Text>
              {/* Mastery dots */}
              <View style={styles.masteryDots}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={{
                      height: 3,
                      flex: 1,
                      borderRadius: 2,
                      backgroundColor: i < Math.round(active.mastery * 5) ? colors.ink : colors.hair,
                    }}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.ink }]}
            onPress={() => router.push('/listen')}
            activeOpacity={0.7}
          >
            <Text style={[Typography.button, { color: colors.paper }]}>▶ Continue · 3 min</Text>
          </TouchableOpacity>
        </View>

        {/* Recent knots */}
        <View style={styles.recentSection}>
          <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>Recent knots</Text>
          {rest.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.recentItem, { borderTopColor: colors.hair }]}
              onPress={() => router.push('/listen')}
              activeOpacity={0.7}
            >
              <Knot size={40} progress={item.mastery} mastery={item.mastery} pass={item.pass} subdued={0.3} />
              <View style={styles.recentInfo}>
                <Text style={[Typography.bodySmall, { fontWeight: '500' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[Typography.monoSmall, { color: colors.ink4, marginTop: Spacing.xs }]}>
                  {item.segment} · pass {item.pass} · {item.lastPracticed}
                </Text>
              </View>
              <Text style={[Typography.markerLarge, { color: colors.ink3 }]}>
                {Math.round(item.mastery * 100)}%
              </Text>
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroSection: { marginTop: Spacing.xl, marginBottom: Spacing.xxxl },
  urlRow: { position: 'relative', marginBottom: Spacing.md },
  urlInput: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    paddingRight: 52,
  },
  urlSubmit: {
    position: 'absolute',
    right: 6,
    top: 6,
    bottom: 6,
    width: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxxl },
  todaySection: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  todayCard: {
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  todayInfo: { flex: 1 },
  masteryDots: { marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.xs },
  continueBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSection: {},
  recentItem: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  recentInfo: { flex: 1 },
});
