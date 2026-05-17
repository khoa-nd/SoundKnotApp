// ── Sound Knot V2 — Listen Screen
// YouTube embed + scrolling transcript + Recall / Show-Hide toggle
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';

// Mock transcript data
const SEGMENT = {
  lines: [
    { t: '0:12', text: 'For sixty years we wrote software that ran on CPUs and the architecture of that software was shaped by the architecture of the processor.' },
    { t: '0:24', text: 'We built abstractions that made sense for sequential, deterministic computation.' },
    { t: '0:32', text: 'Now we have to relearn how to compute starting from the silicon up.' },
    { t: '0:40', text: 'The fundamental assumptions we made about how programs execute no longer hold.' },
    { t: '0:50', text: 'We are moving from a world of precise, repeatable calculations to one of probabilistic inference.' },
    { t: '1:02', text: 'This shift is as profound as the transition from vacuum tubes to transistors.' },
    { t: '1:12', text: 'And it requires us to rethink everything we thought we knew about software engineering.' },
    { t: '1:22', text: 'The GPU is not just a faster CPU — it is a fundamentally different model of computation.' },
    { t: '1:34', text: 'When you write code for a GPU, you are thinking in terms of thousands of parallel threads.' },
  ],
};

export default function ListenScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { videoId } = useLocalSearchParams<{ videoId?: string }>();
  const [transcriptHidden, setTranscriptHidden] = useState(false);
  const recallCount = 0;

  const vid = videoId ?? 'dQw4w9WgcQ';

  const videoHeight = ((width - Spacing.screen * 2) * 9) / 16;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[Typography.markerLarge, { color: colors.ink }]}>✕ End</Text>
        </TouchableOpacity>
        <Text style={[Typography.monoSmall, { color: colors.ink3, letterSpacing: 0.6 }]}>
          DAY 03 · {recallCount} RECALL{String(recallCount) !== '1' ? 'S' : ''}
        </Text>
      </View>

      {/* YouTube Video Placeholder */}
      <View style={{ paddingHorizontal: Spacing.screen, paddingTop: Spacing.xxl }}>
        <View
          style={{
            width: '100%',
            height: videoHeight,
            borderRadius: Radius.xl,
            backgroundColor: '#000',
            borderWidth: 1,
            borderColor: colors.hair,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[Typography.mono, { color: colors.ink3 }]}>
            youtube.com/watch?v={vid}
          </Text>
          <Text style={[Typography.marker, { color: colors.ink4, marginTop: Spacing.md }]}>
            YouTube player placeholder
          </Text>
        </View>

        <View style={styles.videoMeta}>
          <Text
            style={[Typography.body, { color: colors.ink, fontWeight: '500', flex: 1 }]}
            numberOfLines={1}
          >
            How AI Learned to Think — Lex Fridman Podcast
          </Text>
          <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>42:18</Text>
        </View>
      </View>

      {/* Transcript */}
      <ScrollView
        style={styles.transcriptScroll}
        contentContainerStyle={{ padding: Spacing.screen, paddingTop: Spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.transcriptHeader}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Transcript</Text>
          <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>
            {transcriptHidden ? 'HIDDEN' : `${SEGMENT.lines.length} LINES`}
          </Text>
        </View>

        {transcriptHidden ? (
          <View style={[styles.transcriptHiddenBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              Listen without reading. Tap the eye icon to reveal.
            </Text>
          </View>
        ) : (
          SEGMENT.lines.map((line, i) => (
            <View
              key={i}
              style={[
                styles.transcriptLine,
                { borderTopColor: colors.hair2 },
                i === 0 && { borderTopWidth: 0 },
              ]}
            >
              <Text style={[Typography.monoSmall, styles.transcriptTime, { color: colors.ink4 }]}>
                {line.t}
              </Text>
              <Text style={[Typography.bodyLarge, { color: colors.ink2, flex: 1 }]}>
                {line.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
        <TouchableOpacity
          style={[styles.recallBtn, { backgroundColor: colors.ink }]}
          onPress={() => router.push('/dictation')}
          activeOpacity={0.7}
        >
          <Text style={[Typography.button, { color: colors.paper }]}>Recall →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.eyeBtn, { borderColor: colors.hair }]}
          onPress={() => setTranscriptHidden(!transcriptHidden)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, color: colors.ink }}>
            {transcriptHidden ? '👁' : '👁‍🗨'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.lg,
  },
  transcriptScroll: { flex: 1 },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  transcriptHiddenBox: {
    padding: Spacing.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  transcriptLine: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  transcriptTime: { paddingTop: 6, minWidth: 38 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  recallBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
