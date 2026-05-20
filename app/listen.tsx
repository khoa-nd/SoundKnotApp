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

// ── Component ──

export default function ListenScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { videoId, userVideoId, videoTitle, videoChannel } = useLocalSearchParams<{
    videoId?: string;
    userVideoId?: string;
    videoTitle?: string;
    videoChannel?: string;
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

  // Auto-scroll state — track measured Y positions and user interaction
  const lineYPositions = useRef<Record<number, number>>({});
  const scrollViewHeight = useRef(0);
  const userIsScrolling = useRef(false);
  const userScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoScrollIdx = useRef(-1);

  // Long-press contextual menu
  const [menuLineIdx, setMenuLineIdx] = useState<number | null>(null);

  const vid = videoId ?? 'dQw4w9WgcQ';
  const videoHeight = ((width - Spacing.screen * 2) * 9) / 16;

  // ── Fetch transcript on mount ──

  useEffect(() => {
    let cancelled = false;
    setTranscriptLoading(true);
    setTranscriptError(null);

    fetchTranscript(vid)
      .then((data) => {
        if (!cancelled) {
          setTranscript(data.lines);
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
  }, [vid]);

  // ── Poll current time for transcript highlighting ──

  useEffect(() => {
    if (!ready || !playing) return;

    const interval = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime();
        if (typeof t === 'number') {
          setCurrentTime(t);
          if (transcript.length > 0) {
            setCurrentLineIdx(findCurrentLineIndex(transcript, t));
          }
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ready, playing, transcript]);

  // ── Auto-scroll when currentLineIdx changes ──

  useEffect(() => {
    if (
      currentLineIdx < 0 ||
      userIsScrolling.current ||
      currentLineIdx === lastAutoScrollIdx.current
    ) return;

    const y = lineYPositions.current[currentLineIdx];
    if (y == null) return;

    lastAutoScrollIdx.current = currentLineIdx;
    // Scroll so the active line is ~1/3 from the top of the visible area
    const target = Math.max(0, y - scrollViewHeight.current * 0.33);
    scrollRef.current?.scrollTo({ y: target, animated: true });
  }, [currentLineIdx]);

  // ── User scroll detection ──

  const onScrollBeginDrag = useCallback(() => {
    userIsScrolling.current = true;
    if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
  }, []);

  const onScrollEndDrag = useCallback(() => {
    // Resume auto-scroll after 4 seconds of no user interaction
    if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
    userScrollTimer.current = setTimeout(() => {
      userIsScrolling.current = false;
    }, 4000);
  }, []);

  const onScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    scrollViewHeight.current = e.nativeEvent.layout.height;
  }, []);

  const onLineLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    lineYPositions.current[index] = e.nativeEvent.layout.y;
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
      <ScrollView
        ref={scrollRef}
        style={styles.transcriptScroll}
        contentContainerStyle={{ padding: Spacing.screen, paddingTop: Spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        onLayout={onScrollViewLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onScrollEndDrag}
        scrollEventThrottle={16}
      >
        <View style={styles.transcriptHeader}>
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

        {transcriptHidden ? (
          <View style={[styles.transcriptHiddenBox, { borderColor: colors.hair }]}>
            <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>
              Listen without reading. Tap the eye icon to reveal.
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
            return (
              <TouchableOpacity
                key={i}
                onLayout={(e) => onLineLayout(i, e)}
                style={[
                  styles.transcriptLine,
                  { borderTopColor: colors.hair2 },
                  i === 0 && { borderTopWidth: 0 },
                ]}
                onPress={() => seekTo(line.start)}
                onLongPress={() => setMenuLineIdx(i)}
                delayLongPress={350}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    Typography.monoSmall,
                    styles.transcriptTime,
                    { color: isCurrent ? colors.accent : colors.ink4 },
                  ]}
                >
                  {formatTimestamp(line.start)}
                </Text>
                <Text
                  style={[
                    Typography.bodyLarge,
                    {
                      color: isCurrent ? colors.ink : colors.ink2,
                      flex: 1,
                      fontWeight: isCurrent ? '700' : '400',
                    },
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

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
          style={[styles.eyeBtn, { borderColor: colors.hair }]}
          onPress={() => setTranscriptHidden(!transcriptHidden)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={transcriptHidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.ink}
          />
        </TouchableOpacity>
      </View>

      {/* Long-press contextual menu */}
      <Modal
        visible={menuLineIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuLineIdx(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuLineIdx(null)}>
          <Pressable style={[styles.menuSheet, { backgroundColor: colors.paper, borderColor: colors.hair }]}>
            {menuLineIdx !== null && transcript[menuLineIdx] && (
              <>
                <Text style={[Typography.marker, { color: colors.ink4 }]}>SELECTED</Text>
                <Text style={[Typography.bodyMedium, { color: colors.ink, marginTop: Spacing.sm }]} numberOfLines={3}>
                  "{transcript[menuLineIdx].text}"
                </Text>
                <View style={[styles.menuDivider, { backgroundColor: colors.hair }]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const sel = transcript[menuLineIdx].text;
                    setMenuLineIdx(null);
                    openAiTutor(sel);
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
                  onPress={() => {
                    seekTo(transcript[menuLineIdx].start);
                    setMenuLineIdx(null);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="play-circle-outline" size={18} color={colors.ink2} />
                  <Text style={[Typography.bodyMedium, { color: colors.ink, marginLeft: Spacing.lg }]}>
                    Play from here
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setMenuLineIdx(null)}
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
  transcriptTime: { paddingTop: 6, minWidth: 42 },

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
