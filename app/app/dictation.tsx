// ── Sound Knot V2 — Dictation Screen
// Recall attempts list + text/voice input + check-all diff
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { Chip } from '../src/components/ui/Chip';
import { useSavedPhrasesStore, type SavedPhrase } from '../src/stores/savedPhrasesStore';
import { formatTimestamp } from '../src/services/transcript';

interface Recall {
  id: number;
  type: 'text' | 'voice';
  text: string;
}

interface DiffResult {
  accuracy: number;
  correct: number;
  missed: number;
  diff: { text: string; status: 'correct' | 'missed' | 'extra' }[];
}

// Word-level diff algorithm
function checkRecall(userText: string, targetText: string): DiffResult {
  const u = userText
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const t = targetText.split(/\s+/);

  const diff: { text: string; status: 'correct' | 'missed' | 'extra' }[] = [];
  let ui = 0;
  let correct = 0;
  let missed = 0;

  for (let i = 0; i < t.length; i++) {
    const tw = t[i];
    const twClean = tw.toLowerCase().replace(/[.,!?;:]/g, '');
    const uw = u[ui];

    if (uw === twClean) {
      diff.push({ text: tw, status: 'correct' });
      correct++;
      ui++;
    } else if (u[ui + 1] === twClean) {
      diff.push({ text: u[ui], status: 'extra' });
      diff.push({ text: tw, status: 'correct' });
      correct++;
      ui += 2;
    } else if (
      uw &&
      twClean.length >= 4 &&
      uw.length >= 4 &&
      uw.slice(0, 4) === twClean.slice(0, 4)
    ) {
      diff.push({ text: tw, status: 'correct' });
      correct++;
      ui++;
    } else {
      diff.push({ text: tw, status: 'missed' });
      missed++;
    }
  }

  const accuracy = Math.round((correct / Math.max(1, t.length)) * 100);
  return { diff, accuracy, correct, missed };
}

const FALLBACK_TARGET =
  "For sixty years we wrote software that ran on CPUs and the architecture of that software was shaped by the architecture of the processor.";

interface RecallTarget {
  id: string;
  text: string;
  kind: 'phrase' | 'vocabulary';
  start?: number;
  source: 'saved' | 'fallback';
}

export default function DictationScreen() {
  const colors = useTheme();
  const { videoId, userVideoId } = useLocalSearchParams<{ videoId?: string; userVideoId?: string }>();
  const [draft, setDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordedSec, setRecordedSec] = useState(0);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<DiffResult[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  const { phrases, hydrated: phrasesHydrated, load: loadPhrases } = useSavedPhrasesStore();

  useEffect(() => {
    if (!phrasesHydrated) loadPhrases();
  }, [phrasesHydrated, loadPhrases]);

  // Targets for this video — saved phrases first, then vocabulary, fallback to demo line.
  const targets = useMemo<RecallTarget[]>(() => {
    const forVideo = videoId
      ? phrases.filter((p) => p.videoId === videoId)
      : ([] as SavedPhrase[]);
    const phraseTargets = forVideo
      .filter((p) => p.kind === 'phrase')
      .sort((a, b) => a.start - b.start)
      .map((p) => ({
        id: p.id,
        text: p.text,
        kind: 'phrase' as const,
        start: p.start,
        source: 'saved' as const,
      }));
    const vocabTargets = forVideo
      .filter((p) => p.kind === 'vocabulary')
      .sort((a, b) => a.start - b.start)
      .map((p) => ({
        id: p.id,
        text: p.text,
        kind: 'vocabulary' as const,
        start: p.start,
        source: 'saved' as const,
      }));
    const all = [...phraseTargets, ...vocabTargets];
    if (all.length > 0) return all;
    return [
      {
        id: 'fallback',
        text: FALLBACK_TARGET,
        kind: 'phrase',
        source: 'fallback',
      },
    ];
  }, [phrases, videoId]);

  // Keep an active target. Default to the first when targets load.
  useEffect(() => {
    if (!activeTargetId && targets.length > 0) {
      setActiveTargetId(targets[0].id);
    } else if (activeTargetId && !targets.some((t) => t.id === activeTargetId)) {
      setActiveTargetId(targets[0]?.id ?? null);
    }
  }, [targets, activeTargetId]);

  const activeTarget =
    targets.find((t) => t.id === activeTargetId) ?? targets[0] ?? null;
  const targetText = activeTarget?.text ?? FALLBACK_TARGET;

  // Simulate recording timer
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setRecordedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const submitDraft = (type: 'text' | 'voice' = 'text', overrideText?: string) => {
    const text = (overrideText ?? draft).trim();
    if (!text) return;
    setRecalls((prev) => [...prev, { id: Date.now(), type, text }]);
    setDraft('');
    setRecordedSec(0);
    setRecording(false);
  };

  const stopRecording = () => {
    if (recordedSec > 0) {
      submitDraft('voice', targetText.slice(0, 60) + '…');
    } else {
      setRecording(false);
    }
  };

  const checkAll = () => {
    const res = recalls.map((r) => checkRecall(r.text, targetText));
    setResults(res);
    setChecked(true);
  };

  const resetSession = () => {
    setRecalls([]);
    setResults([]);
    setChecked(false);
    setDraft('');
    setRecordedSec(0);
    setRecording(false);
  };

  const selectTarget = (id: string) => {
    if (id === activeTargetId) return;
    setActiveTargetId(id);
    resetSession();
  };

  const avgAccuracy = results.length
    ? Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[Typography.markerLarge, { color: colors.ink2 }]}>← Listen</Text>
        </TouchableOpacity>
        <Text style={[Typography.monoSmall, { color: colors.ink3, letterSpacing: 0.6 }]}>
            {recalls.length} RECALL{String(recalls.length) !== '1' ? 'S' : ''}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Recall</Text>
        <Text style={[Typography.heading, { color: colors.ink2, marginTop: Spacing.xs }]}>
          {checked ? (
            <>
              Compare against{' '}
              <Text style={[Typography.serifItalic, { color: colors.ink4 }]}>what was said.</Text>
            </>
          ) : (
            <>
              Type or speak{' '}
              <Text style={[Typography.serifItalic, { color: colors.ink4 }]}>what you just heard.</Text>
            </>
          )}
        </Text>
      </View>

      {/* Saved phrases & vocabulary picker */}
      {targets.length > 0 && targets[0].source === 'saved' && (
        <View style={styles.targetsBlock}>
          <View style={styles.targetsHeader}>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>From this video</Text>
            <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>
              {targets.length} ITEM{targets.length === 1 ? '' : 'S'}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.targetsScroll}
          >
            {targets.map((t) => {
              const active = t.id === activeTargetId;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => selectTarget(t.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.targetCard,
                    {
                      backgroundColor: active ? colors.paper2 : colors.paper,
                      borderColor: active ? colors.ink4 : colors.hair,
                    },
                  ]}
                >
                  <View style={styles.targetMetaRow}>
                    <Ionicons
                      name={t.kind === 'vocabulary' ? 'book-outline' : 'chatbubble-ellipses-outline'}
                      size={12}
                      color={colors.ink4}
                    />
                    <Text style={[Typography.monoSmall, { color: colors.ink4, marginLeft: 4, textTransform: 'uppercase' }]}>
                      {t.kind}
                    </Text>
                    {typeof t.start === 'number' && (
                      <Text style={[Typography.monoSmall, { color: colors.ink4, marginLeft: 'auto' }]}>
                        {formatTimestamp(t.start)}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      Typography.bodySmall,
                      { color: active ? colors.ink2 : colors.ink3, marginTop: Spacing.sm },
                    ]}
                    numberOfLines={3}
                  >
                    {t.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Active target preview */}
      {activeTarget && (
        <View style={[styles.activeTarget, { borderColor: colors.hair, backgroundColor: colors.paper2 }]}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>
            Target {activeTarget.kind === 'vocabulary' ? '(vocabulary)' : '(phrase)'}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.ink2, marginTop: Spacing.xs }]} numberOfLines={3}>
            {activeTarget.text}
          </Text>
        </View>
      )}

      {/* Recalls list */}
      <ScrollView
        style={styles.recallsScroll}
        contentContainerStyle={{ padding: Spacing.screen, paddingTop: Spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {recalls.length === 0 && !checked && (
          <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              No recalls yet. Add one below — text or voice.
            </Text>
          </View>
        )}

        {recalls.map((r, i) => {
          const result = checked ? results[i] : null;
          return (
            <View
              key={r.id}
              style={[styles.recallCard, { backgroundColor: colors.paper2, borderColor: colors.hair }]}
            >
              <View style={styles.recallHeader}>
                <Text style={[Typography.marker, { color: colors.ink4 }]}>
                  Recall {i + 1} · {r.type}
                </Text>
                {result && (
                  <Text style={[Typography.markerLarge, { color: colors.ink2, fontWeight: '500' }]}>
                    {result.accuracy}% match
                  </Text>
                )}
              </View>

              <Text style={[Typography.bodyMedium, { color: colors.ink3 }]}>
                {result
                  ? result.diff.map((d, j) => (
                      <Text
                        key={j}
                        style={{
                          color:
                            d.status === 'correct'
                              ? colors.positive
                              : d.status === 'missed'
                                ? colors.negative
                                : colors.ink4,
                          textDecorationLine:
                            d.status === 'missed'
                              ? 'underline'
                              : d.status === 'extra'
                                ? 'line-through'
                                : 'none',
                        }}
                      >
                        {d.text}{' '}
                      </Text>
                    ))
                  : r.text}
              </Text>

              {result && (
                <View style={styles.resultChips}>
                  <Chip label={`${result.missed} missed`} dotColor={colors.negative} />
                  <Chip label={`${result.correct} correct`} dotColor={colors.ink3} />
                </View>
              )}
            </View>
          );
        })}

        {checked && (
          <View style={[styles.averageCard, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
            <Text style={[Typography.marker, { color: colors.ink4 }]}>Session average</Text>
            <Text style={[Typography.monoDisplay, { color: colors.ink2, marginTop: Spacing.xs }]}>
              {avgAccuracy}% match
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.ink3, marginTop: Spacing.xs }]}>
              across {recalls.length} recall{String(recalls.length) !== '1' ? 's' : ''}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom input dock */}
      {!checked ? (
        <View style={[styles.bottomDock, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
          {recording ? (
            <View style={[styles.recordingBar, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
              <View style={[styles.recDot, { backgroundColor: colors.negative }]} />
              {/* Waveform bars */}
              <View style={styles.waveform}>
                {Array.from({ length: 28 }, (_, i) => {
                  const h = 0.3 + Math.abs(Math.sin(i * 0.4 + recordedSec * 0.5)) * 0.7;
                  return (
                    <View
                      key={i}
                      style={{
                        height: `${h * 100}%`,
                        flex: 1,
                        backgroundColor: colors.ink3,
                        borderRadius: 1,
                      }}
                    />
                  );
                })}
              </View>
              <Text style={[Typography.markerLarge, { color: colors.ink3 }]}>
                {String(Math.floor(recordedSec / 60)).padStart(2, '0')}:
                {String(recordedSec % 60).padStart(2, '0')}
              </Text>
              <TouchableOpacity
                style={[styles.recStopBtn, { backgroundColor: colors.ink2 }]}
                onPress={stopRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={18} color={colors.paper} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.paper2, borderColor: colors.hair, color: colors.ink2 }]}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a recall…"
                placeholderTextColor={colors.ink4}
                onSubmitEditing={() => submitDraft('text')}
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: colors.hair }]}
                onPress={() => setRecording(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="mic-outline" size={22} color={colors.ink2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: draft.trim() ? colors.ink2 : colors.ink4, borderWidth: 0 }]}
                onPress={() => submitDraft('text')}
                disabled={!draft.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-forward" size={20} color={colors.paper} />
              </TouchableOpacity>
            </View>
          )}

          {/* Action row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.hair }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[Typography.buttonSmall, { color: colors.ink2 }]}>← Listen again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.ink2 }]}
              onPress={checkAll}
              disabled={recalls.length === 0}
              activeOpacity={0.7}
            >
              <Text style={[Typography.buttonSmall, { color: colors.paper }]}>Check all ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.bottomDock, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.hair }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[Typography.buttonSmall, { color: colors.ink2 }]}>← Listen again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.ink2 }]}
              onPress={() =>
                router.push({
                  pathname: '/finished',
                  params: {
                    userVideoId: userVideoId ?? '',
                    recallsCount: String(recalls.length),
                    averageAccuracy: String(avgAccuracy),
                  },
                })
              }
              activeOpacity={0.7}
            >
              <Text style={[Typography.buttonSmall, { color: colors.paper }]}>Finish session ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  titleSection: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl },
  targetsBlock: {
    paddingTop: Spacing.xl,
  },
  targetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  targetsScroll: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  targetCard: {
    width: 220,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  targetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTarget: {
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  recallsScroll: { flex: 1 },
  emptyBox: {
    padding: Spacing.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  recallCard: {
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  recallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  resultChips: { marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  averageCard: {
    marginTop: Spacing.xxl,
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  bottomDock: {
    borderTopWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 52,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  recStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxl,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 52,
    maxHeight: 120,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: { borderWidth: 0 },
});
