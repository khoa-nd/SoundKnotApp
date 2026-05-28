// ── Sound Knot V2 — Listen Screen
// YouTube player (native + web) + interactive transcript with live highlighting
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { fetchTranscript, formatTimestamp, findCurrentLineIndex, type TranscriptLine } from '../src/services/transcript';
import { YoutubePlayerView, type YoutubePlayerHandle } from '../src/components/youtube/YoutubePlayerView';
import { buildTranscriptWindow } from '../src/services/aiTutor';
import { composeVocabulary } from '../src/services/vocabulary';
import { useSavedPhrasesStore } from '../src/stores/savedPhrasesStore';
import { useAiSettingsStore } from '../src/stores/aiSettingsStore';
import { usePreprocessedTranscriptStore } from '../src/stores/preprocessedTranscriptStore';

// ── Component ──

type TranscriptLineRowProps = {
  index: number;
  line: TranscriptLine;
  isCurrent: boolean;
  bookmarked: boolean;
  hair2Color: string;
  inkColor: string;
  ink4Color: string;
  accentColor: string;
  onPress: (index: number, line: TranscriptLine) => void;
  onBookmark: (index: number, line: TranscriptLine, bookmarked: boolean) => void;
  onWordPress: (word: string) => void;
  onLayout: (index: number, e: LayoutChangeEvent) => void;
};

// Split a transcript line into alternating word / whitespace-or-punctuation runs.
// Words are tappable; punctuation is rendered inline as plain text.
function splitWordTokens(text: string): { token: string; isWord: boolean }[] {
  const out: { token: string; isWord: boolean }[] = [];
  const regex = /[\p{L}\p{N}']+|[^\p{L}\p{N}']+/gu;
  for (const match of text.matchAll(regex)) {
    const token = match[0];
    out.push({ token, isWord: /[\p{L}\p{N}]/u.test(token) });
  }
  return out;
}

const TranscriptLineRow = React.memo(function TranscriptLineRow({
  index,
  line,
  isCurrent,
  bookmarked,
  hair2Color,
  inkColor,
  ink4Color,
  accentColor,
  onPress,
  onBookmark,
  onWordPress,
  onLayout,
}: TranscriptLineRowProps) {
  const tokens = splitWordTokens(line.text);
  const textColor = isCurrent ? inkColor : ink4Color;
  return (
    <TouchableOpacity
      onLayout={(e) => onLayout(index, e)}
      style={[
        styles.transcriptLine,
        { borderTopColor: hair2Color },
        index === 0 && { borderTopWidth: 0 },
      ]}
      onPress={() => onPress(index, line)}
      activeOpacity={0.7}
    >
      <View style={styles.transcriptGutter}>
        <Text
          style={[
            Typography.monoSmall,
            { color: isCurrent ? accentColor : ink4Color },
          ]}
        >
          {formatTimestamp(line.start)}
        </Text>
        <TouchableOpacity
          onPress={() => onBookmark(index, line, bookmarked)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.bookmarkBtn}
          activeOpacity={0.6}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={bookmarked ? accentColor : ink4Color}
          />
        </TouchableOpacity>
      </View>
      <Text
        style={[
          Typography.bodyLarge,
          {
            color: textColor,
            flex: 1,
            fontWeight: isCurrent ? '900' : '400',
          },
        ]}
      >
        {tokens.map((t, i) =>
          t.isWord ? (
            <Text
              key={i}
              onPress={() => onWordPress(t.token)}
              suppressHighlighting
              style={{ color: textColor }}
            >
              {t.token}
            </Text>
          ) : (
            <Text key={i} style={{ color: textColor }}>
              {t.token}
            </Text>
          ),
        )}
      </Text>
    </TouchableOpacity>
  );
});

export default function ListenScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { videoId, userVideoId, videoTitle, videoChannel, start } = useLocalSearchParams<{
    videoId?: string;
    userVideoId?: string;
    videoTitle?: string;
    videoChannel?: string;
    start?: string;
  }>();
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptHidden, setTranscriptHidden] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);

  const lineYPositions = useRef<Record<number, number>>({});
  const scrollViewHeight = useRef(0);
  const getPreprocessedTranscript = usePreprocessedTranscriptStore((s) => s.getTranscript);
  const setPreprocessedTranscript = usePreprocessedTranscriptStore((s) => s.setTranscript);

  // Word-tap contextual menu
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [vocabSaving, setVocabSaving] = useState(false);
  const [vocabStatus, setVocabStatus] = useState<string | null>(null);
  const aiSettings = useAiSettingsStore((s) => s.settings);
  const loadAiSettings = useAiSettingsStore((s) => s.load);
  const aiSettingsHydrated = useAiSettingsStore((s) => s.hydrated);

  // Deep-link seek (from Library): only fire once per param value
  const startSeconds = start ? Number(start) : NaN;
  const seekedForStart = useRef<number | null>(null);
  const pendingScrollIdx = useRef<number | null>(null);

  // Bookmarks
  const { hydrated: phrasesHydrated, load: loadPhrases, hasPhrase, add: addPhrase, removeByLine } =
    useSavedPhrasesStore();

  const vid = videoId ?? 'dQw4w9WgcQ';
  const videoHeight = ((width - Spacing.screen * 2) * 9) / 16;

  // ── Fetch transcript on mount ──

  useEffect(() => {
    let cancelled = false;
    setTranscriptLoading(true);
    setTranscriptError(null);

    const prepared = getPreprocessedTranscript(vid);
    if (prepared) {
      setTranscript(prepared);
      setTranscriptLoading(false);
      return () => { cancelled = true; };
    }

    fetchTranscript(vid)
      .then((data) => {
        if (!cancelled) {
          setTranscript(data.lines);
          // Stash so AI Tutor (a sibling route) can read the full transcript
          // for summary-intent questions. The store already holds AI-split
          // lines when preprocessing was used; this fills the fallback path.
          setPreprocessedTranscript(vid, data.lines);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTranscriptError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setTranscriptLoading(false);
      });

    return () => { cancelled = true; };
  }, [vid, getPreprocessedTranscript, setPreprocessedTranscript]);

  useEffect(() => {
    if (!phrasesHydrated) loadPhrases();
  }, [phrasesHydrated, loadPhrases]);

  useEffect(() => {
    if (!aiSettingsHydrated) loadAiSettings();
  }, [aiSettingsHydrated, loadAiSettings]);

  useEffect(() => {
    if (!ready) return;
    if (!Number.isFinite(startSeconds)) return;
    if (seekedForStart.current === startSeconds) return;
    seekedForStart.current = startSeconds;
    (async () => {
      try {
        await playerRef.current?.seekTo(startSeconds);
        setCurrentTime(startSeconds);
      } catch {
        // ignore
      }
    })();
  }, [ready, startSeconds]);

  useEffect(() => {
    if (!Number.isFinite(startSeconds) || transcript.length === 0) return;
    const idx = findCurrentLineIndex(transcript, startSeconds);
    if (idx >= 0) {
      setCurrentLineIdx(idx);
      pendingScrollIdx.current = idx;
      const y = lineYPositions.current[idx];
      if (y != null) {
        const target = Math.max(0, y - scrollViewHeight.current * 0.33);
        scrollRef.current?.scrollTo({ y: target, animated: false });
        pendingScrollIdx.current = null;
      }
    }
  }, [startSeconds, transcript]);

  useEffect(() => {
    if (!ready) return;

    let lastReportedTime = -1;
    let lastLineIdx = -2;

    const tick = async () => {
      try {
        const t = await playerRef.current?.getCurrentTime();
        if (typeof t !== 'number' || !Number.isFinite(t)) return;

        // Avoid re-rendering when the time hasn't moved enough to matter.
        if (Math.abs(t - lastReportedTime) >= 0.2) {
          lastReportedTime = t;
          setCurrentTime(t);
        }

        if (transcript.length > 0) {
          const idx = findCurrentLineIndex(transcript, t);
          if (idx !== lastLineIdx) {
            lastLineIdx = idx;
            setCurrentLineIdx(idx);
          }
        }
      } catch {
        // ignore
      }
    };

    // Faster poll keeps the highlight visually in sync with the audio (~5fps).
    const interval = setInterval(tick, 200);
    void tick();

    return () => clearInterval(interval);
  }, [ready, transcript]);

  useEffect(() => {
    if (currentLineIdx < 0) return;
    const y = lineYPositions.current[currentLineIdx];
    if (y == null || scrollViewHeight.current === 0) return;
    const target = Math.max(0, y - scrollViewHeight.current * 0.33);
    scrollRef.current?.scrollTo({ y: target, animated: true });
  }, [currentLineIdx]);

  const onScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    scrollViewHeight.current = e.nativeEvent.layout.height;
  }, []);

  const onLineLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    lineYPositions.current[index] = e.nativeEvent.layout.y;
    if (pendingScrollIdx.current === index && scrollViewHeight.current > 0) {
      const target = Math.max(0, e.nativeEvent.layout.y - scrollViewHeight.current * 0.33);
      scrollRef.current?.scrollTo({ y: target, animated: false });
      pendingScrollIdx.current = null;
    }
  }, []);

  // ── Player callbacks ──

  const onReady = useCallback(async () => {
    setReady(true);
    try {
      const d = await playerRef.current?.getDuration();
      if (typeof d === 'number') setDuration(d);
    } catch {
      // ignore
    }
  }, []);

  const onStateChange = useCallback((state: string) => {
    if (state === 'playing') setPlaying(true);
    else if (state === 'paused' || state === 'ended') setPlaying(false);
  }, []);

  const onError = useCallback((error: string) => {
    console.warn('YouTube player error:', error);
  }, []);

  const seekTo = useCallback(async (seconds: number) => {
    try {
      await playerRef.current?.seekTo(seconds);
      setCurrentTime(seconds);
    } catch {
      // ignore
    }
  }, []);

  // Stable callbacks for the memoized transcript rows
  const handleLinePress = useCallback(
    (_index: number, line: TranscriptLine) => {
      seekTo(line.start);
    },
    [seekTo],
  );
  const handleWordPress = useCallback((word: string) => {
    setSelectedWord(word);
  }, []);

  const addWordToVocabulary = useCallback(
    async (word: string) => {
      setVocabSaving(true);
      setVocabStatus(null);
      try {
        const transcriptWindow = transcript.length
          ? buildTranscriptWindow(transcript, currentTime)
          : undefined;
        const formatted = await composeVocabulary(word, aiSettings, {
          videoId: vid,
          videoTitle: videoTitle ?? undefined,
          videoChannel: videoChannel ?? undefined,
          transcriptWindow,
          selection: word,
        });
        await addPhrase({
          text: formatted,
          videoId: vid,
          videoTitle: videoTitle ?? undefined,
          videoChannel: videoChannel ?? undefined,
          start: currentTime,
          kind: 'vocabulary',
          source: 'ai',
        });
        setVocabStatus(`Added "${word}" to Vocabulary`);
      } catch (err: any) {
        setVocabStatus(err?.message ?? 'Could not add vocabulary');
      } finally {
        setVocabSaving(false);
        setTimeout(() => setVocabStatus(null), 2400);
      }
    },
    [aiSettings, transcript, currentTime, vid, videoTitle, videoChannel, addPhrase],
  );
  const handleLineBookmark = useCallback(
    (_index: number, line: TranscriptLine, bookmarked: boolean) => {
      if (bookmarked) {
        removeByLine(vid, line.start);
      } else {
        addPhrase({
          text: line.text,
          videoId: vid,
          videoTitle: videoTitle ?? undefined,
          videoChannel: videoChannel ?? undefined,
          start: line.start,
          kind: 'phrase',
        });
      }
    },
    [vid, videoTitle, videoChannel, addPhrase, removeByLine],
  );

  // ── Open AI Tutor with current transcript window + optional selection ──
  const openAiTutor = useCallback(
    (selection?: string) => {
      const transcriptWindow = transcript.length
        ? buildTranscriptWindow(transcript, currentTime)
        : undefined;
      router.push({
        pathname: '/ai-tutor' as any,
        params: {
          videoId: vid,
          userVideoId: userVideoId ?? '',
          videoTitle: videoTitle ?? '',
          videoChannel: videoChannel ?? '',
          transcriptWindow: transcriptWindow ?? '',
          selection: selection ?? '',
          prefill: selection
            ? `Can you explain "${selection}" in the context of this video?`
            : '',
        },
      });
    },
    [transcript, currentTime, vid, userVideoId, videoTitle, videoChannel],
  );

  // ── Render ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={[Typography.headingSmall, { color: colors.ink }]}>Close</Text>
        </TouchableOpacity>
        <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>
          {ready ? 'NOW PLAYING' : 'LOADING…'}
        </Text>
      </View>

      {/* YouTube Video Player — platform-split component */}
      <View style={{ paddingHorizontal: Spacing.screen, paddingTop: Spacing.md }}>
        <View
          style={{
            width: '100%',
            height: videoHeight,
            borderRadius: Radius.xl,
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <YoutubePlayerView
            ref={playerRef}
            videoId={vid}
            width={width - Spacing.screen * 2}
            height={videoHeight}
            play={playing}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={onError}
          />
        </View>
      </View>

      {/* ── Transcript ── */}
      <View style={styles.transcriptHeaderFixed}>
        <Text style={[Typography.marker, { color: colors.ink4 }]}>Transcript</Text>
        <Text style={[Typography.monoSmall, { color: colors.ink4 }]}>
          {transcriptHidden
            ? 'HIDDEN'
            : transcriptLoading
              ? 'FETCHING…'
              : transcriptError
                ? 'ERROR'
                : `${transcript.length} LINES`}
        </Text>
      </View>
      <View style={[styles.transcriptBox, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.transcriptScroll}
        contentContainerStyle={{ padding: Spacing.screen, paddingTop: Spacing.xl }}
        showsVerticalScrollIndicator={false}
        onLayout={onScrollViewLayout}
      >
        {transcriptHidden ? (
          <View style={[styles.transcriptHiddenBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              Listen without reading. Tap CC icon to reveal.
            </Text>
          </View>
        ) : transcriptLoading ? (
          <View style={styles.transcriptLoading}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[Typography.bodySmall, { color: colors.ink4, marginTop: Spacing.md }]}>
              Fetching transcript…
            </Text>
          </View>
        ) : transcriptError ? (
          <View style={[styles.transcriptHiddenBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              {transcriptError}
            </Text>
          </View>
        ) : (
          transcript.map((line, i) => {
            const isCurrent = i === currentLineIdx;
            const bookmarked = phrasesHydrated && hasPhrase(vid, line.start);
            return (
              <TranscriptLineRow
                key={i}
                index={i}
                line={line}
                isCurrent={isCurrent}
                bookmarked={bookmarked}
                hair2Color={colors.hair2}
                inkColor={colors.ink}
                ink4Color={colors.ink4}
                accentColor={colors.accent}
                onPress={handleLinePress}
                onBookmark={handleLineBookmark}
                onWordPress={handleWordPress}
                onLayout={onLineLayout}
              />
            );
          })
        )}
      </ScrollView>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
        <TouchableOpacity
          style={[styles.recallBtn, { backgroundColor: colors.ink }]}
          onPress={() =>
            router.push({
              pathname: '/dictation',
              params: { videoId: vid, userVideoId: userVideoId ?? '' },
            })
          }
          activeOpacity={0.7}
        >
          <Text style={[Typography.button, { color: colors.paper }]}>Recall →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tutorBtn, { borderColor: colors.hair }]}
          onPress={() => openAiTutor()}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.ink} />
          <Text style={[Typography.button, { color: colors.ink, marginLeft: Spacing.sm }]}>Ask AI Tutor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.eyeBtn,
            {
              borderColor: transcriptHidden ? colors.hair : colors.ink,
              backgroundColor: transcriptHidden ? 'transparent' : colors.ink,
            },
          ]}
          onPress={() => setTranscriptHidden(!transcriptHidden)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={transcriptHidden ? 'Show transcript' : 'Hide transcript'}
        >
          <Text
            style={[
              styles.ccLabel,
              { color: transcriptHidden ? colors.ink4 : colors.paper },
            ]}
          >
            CC
          </Text>
        </TouchableOpacity>
      </View>

      {/* Word-tap contextual action strip */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWord(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setSelectedWord(null)}>
          <Pressable style={[styles.menuSheet, { backgroundColor: colors.paper, borderColor: colors.hair }]}>
            {selectedWord !== null && (
              <>
                <Text style={[Typography.marker, { color: colors.ink4 }]}>SELECTED WORD</Text>
                <Text style={[Typography.heading, { color: colors.ink, marginTop: Spacing.sm }]}>
                  "{selectedWord}"
                </Text>
                <View style={[styles.menuDivider, { backgroundColor: colors.hair }]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const w = selectedWord;
                    setSelectedWord(null);
                    if (w) addWordToVocabulary(w);
                  }}
                  disabled={vocabSaving}
                  activeOpacity={0.6}
                >
                  <Ionicons name="bookmark-outline" size={18} color={colors.accent} />
                  <Text style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.lg }]}>
                    Add to Vocabulary List
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const w = selectedWord;
                    setSelectedWord(null);
                    if (w) openAiTutor(w);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
                  <Text style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.lg }]}>
                    Ask AI Tutor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setSelectedWord(null)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-outline" size={18} color={colors.ink3} />
                  <Text style={[Typography.bodyMedium, { color: colors.ink2, marginLeft: Spacing.lg }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {(vocabSaving || vocabStatus) && (
        <View style={[styles.vocabToast, { backgroundColor: colors.ink, borderColor: colors.hair }]}>
          {vocabSaving ? (
            <>
              <ActivityIndicator size="small" color={colors.paper} />
              <Text style={[Typography.bodySmall, { color: colors.paper, marginLeft: Spacing.md }]}>
                Composing vocabulary…
              </Text>
            </>
          ) : (
            <Text style={[Typography.bodySmall, { color: colors.paper }]}>{vocabStatus}</Text>
          )}
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
    paddingTop: Spacing.sm,
  },
  closeBtn: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.xl,
  },

  // ── Transcript ──
  transcriptHeaderFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  transcriptBox: {
    flex: 1,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  transcriptScroll: { flex: 1 },
  transcriptLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.massive,
  },
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
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderRadius: Radius.md,
  },
  transcriptGutter: {
    minWidth: 48,
    alignItems: 'flex-start',
    paddingTop: 6,
    gap: Spacing.sm,
  },
  bookmarkBtn: {
    paddingVertical: 2,
    paddingRight: 4,
  },

  // ── Bottom ──
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
  tutorBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
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
  ccLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  vocabToast: {
    position: 'absolute',
    left: Spacing.screen,
    right: Spacing.screen,
    bottom: 96,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
