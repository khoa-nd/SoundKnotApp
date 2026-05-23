// ── Sound Knot V2 — AI Tutor Screen
// Conversational UI with text + voice input. Voice is sent as an audio
// attachment to Gemini (multimodal), which transcribes and replies in one hop.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { useAiSettingsStore } from '../src/stores/aiSettingsStore';
import { useSavedPhrasesStore, type SavedPhraseKind } from '../src/stores/savedPhrasesStore';
import { chat, type AiMessage, type AiContext, type AiAudioAttachment } from '../src/services/aiTutor';

interface UiMessage extends AiMessage {
  id: string;
  timestamp: number;
  displayContent?: string;
  audioMs?: number; // if this message originated from a voice recording
  pending?: boolean;
  listKind?: SavedPhraseKind;
}

interface PromptSuggestion {
  label: string;
  prompt: string;
  align?: 'left' | 'right' | 'center';
  wide?: boolean;
}

export default function AiTutorScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    videoId?: string;
    userVideoId?: string;
    videoTitle?: string;
    videoChannel?: string;
    transcriptWindow?: string;
    selection?: string;
    prefill?: string;
  }>();

  const { settings, hydrated, load } = useAiSettingsStore();
  const { hydrated: savedHydrated, load: loadSaved, add: addSaved } = useSavedPhrasesStore();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState(params.prefill ?? '');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedSec, setRecordedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedGenerated, setSavedGenerated] = useState<Record<string, boolean>>({});
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const baseContext: AiContext = {
    videoId: params.videoId,
    videoTitle: params.videoTitle,
    videoChannel: params.videoChannel,
    transcriptWindow: params.transcriptWindow,
    selection: params.selection,
  };
  const starterSuggestions = buildPromptSuggestions();
  const followUpSuggestions = buildFollowUpSuggestions(baseContext, messages);

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

  useEffect(() => {
    if (!savedHydrated) loadSaved();
  }, [savedHydrated, loadSaved]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      // Best-effort cleanup if user leaves mid-recording
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, sending]);

  // ── Send a text message ───────────────────────────────────────────────────
  const sendText = async (text: string, displayText?: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const userMsg: UiMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: trimmed,
      displayContent: displayText?.trim() || trimmed,
      timestamp: Date.now(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft('');
    await callAi(next, baseContext);
  };

  // ── Send a voice message ──────────────────────────────────────────────────
  const sendAudio = async (audio: AiAudioAttachment, ms: number) => {
    if (sending) return;
    setError(null);
    const userMsg: UiMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: '🎙️ Voice question — please transcribe and answer.',
      audio,
      audioMs: ms,
      timestamp: Date.now(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    await callAi(next, baseContext);
  };

  const callAi = async (history: UiMessage[], context: AiContext) => {
    setSending(true);
    try {
      const apiMessages: AiMessage[] = history.map(({ role, content, audio }) => ({
        role,
        content,
        ...(audio ? { audio } : {}),
      }));
      const res = await chat({ messages: apiMessages, context, settings });
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-r`,
          role: 'assistant',
          content: res.reply,
          timestamp: Date.now(),
          listKind: inferSavedKind(history),
        },
      ]);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSending(false);
    }
  };

  // ── Recording (native only) ───────────────────────────────────────────────
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setError('Voice input is not yet supported on the web build. Type your question instead.');
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Microphone permission denied. Enable it in system settings.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecording(true);
      setRecordedSec(0);
      recordTimerRef.current = setInterval(() => setRecordedSec((s) => s + 1), 1000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start recording');
      setRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const ms = recordedSec * 1000;
    setRecording(false);
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error('Recording produced no file.');
      const base64 = await readUriAsBase64(uri);
      const mimeType = guessAudioMimeType(uri);
      await sendAudio({ base64, mimeType }, ms);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to process recording');
    }
  };

  const cancelRecording = async () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setRecording(false);
    const rec = recordingRef.current;
    recordingRef.current = null;
    try { await rec?.stopAndUnloadAsync(); } catch { /* ignore */ }
  };

  const saveGeneratedItem = async (text: string, kind: SavedPhraseKind) => {
    const key = savedItemKey(text, kind);
    if (savedGenerated[key]) return;
    const saved = await addSaved({
      text,
      kind,
      source: 'ai',
      videoId: params.videoId ?? 'ai-tutor',
      videoTitle: params.videoTitle,
      videoChannel: params.videoChannel,
      start: Date.now() / 1000,
    });
    setSavedGenerated((prev) => ({ ...prev, [key]: true, [savedItemKey(saved.text, saved.kind)]: true }));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      >
        <View style={[styles.shell, { borderColor: colors.hair }]}>
          <View style={[styles.header, { paddingTop: Math.max(34, insets.top + 12) }]}>
            <Text style={[styles.title, { color: colors.ink }]}>Ask about this video</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={[styles.closeBtn, { top: Math.max(28, insets.top + 6) }]}
              accessibilityRole="button"
              accessibilityLabel="Close AI tutor"
            >
              <Ionicons name="close" size={34} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {params.selection && (
            <View style={[styles.selectionBanner, { backgroundColor: colors.accentSoft, borderColor: colors.hair }]}>
              <Text style={[Typography.marker, { color: colors.accentInk }]}>Selected</Text>
              <Text style={[Typography.bodySmall, { color: colors.ink, marginTop: Spacing.xs }]} numberOfLines={3}>
                “{params.selection}”
              </Text>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.starter}>
              <Text style={[styles.sparkle, { color: colors.ink }]}>✦</Text>
              <Text style={[styles.greeting, { color: colors.ink }]}>
                Hello! Curious about what you&apos;re watching? I&apos;m here to help.
              </Text>
              <Text style={[styles.promptIntro, { color: colors.ink }]}>
                Not sure what to ask? Choose something:
              </Text>
              <View style={styles.suggestionList}>
                {starterSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.72}
                    onPress={() => sendText(item.prompt, item.label)}
                    disabled={sending}
                    style={[
                      styles.suggestionChip,
                      item.wide && styles.suggestionChipWide,
                      item.align === 'right' && styles.suggestionRight,
                      item.align === 'center' && styles.suggestionCenter,
                      { borderColor: colors.hair, backgroundColor: colors.paper },
                    ]}
                  >
                    <Text style={[styles.suggestionText, { color: colors.ink }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                colors={colors}
                savedGenerated={savedGenerated}
                onSaveGeneratedItem={saveGeneratedItem}
              />
            ))}
            {sending && (
              <View style={[styles.bubble, styles.bubbleAi, { backgroundColor: colors.paper2 }]}>
                <ActivityIndicator size="small" color={colors.ink3} />
              </View>
            )}
            {messages.length > 0 && !sending && (
              <View style={styles.followUpBlock}>
                <Text style={[styles.followUpLabel, { color: colors.ink4 }]}>Keep going</Text>
                <View style={styles.followUpList}>
                  {followUpSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      activeOpacity={0.72}
                      onPress={() => sendText(item.prompt, item.label)}
                      style={[styles.followUpChip, { borderColor: colors.hair, backgroundColor: colors.paper }]}
                    >
                      <Text style={[styles.followUpText, { color: colors.ink }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {error && (
              <View style={[styles.errorBox, { borderColor: colors.negative, backgroundColor: 'rgba(229,57,53,0.06)' }]}>
                <Text style={[Typography.bodySmall, { color: colors.negative }]}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputDock, { borderTopColor: colors.hair, backgroundColor: colors.paper, paddingBottom: Math.max(insets.bottom, Spacing.xxxl) }]}>
            {recording ? (
              <View style={[styles.recordingBar, { backgroundColor: colors.paper2, borderColor: colors.hair }]}>
                <View style={[styles.recDot, { backgroundColor: colors.negative }]} />
                <Text style={[Typography.bodyMedium, { flex: 1, color: colors.ink2 }]}>
                  Recording… {String(Math.floor(recordedSec / 60)).padStart(2, '0')}:
                  {String(recordedSec % 60).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={cancelRecording} style={[styles.iconBtn, { borderColor: colors.hair }]}>
                  <Ionicons name="close" size={18} color={colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={stopRecordingAndSend}
                  style={[styles.iconBtn, { backgroundColor: colors.ink, borderWidth: 0 }]}
                >
                  <Ionicons name="checkmark" size={18} color={colors.paper} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.paper2, borderColor: colors.hair, color: colors.ink }]}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask the tutor…"
                  placeholderTextColor={colors.ink4}
                  onSubmitEditing={() => sendText(draft)}
                  multiline
                  editable={!sending}
                />
                <TouchableOpacity
                  style={[styles.iconBtn, { borderColor: colors.hair }]}
                  onPress={startRecording}
                  disabled={sending}
                >
                  <Ionicons name="mic-outline" size={20} color={colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconBtn,
                    { backgroundColor: draft.trim() && !sending ? colors.ink : colors.ink4, borderWidth: 0 },
                  ]}
                  onPress={() => sendText(draft)}
                  disabled={!draft.trim() || sending}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.paper} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { borderColor: colors.hair }]}
                  onPress={() => router.push('/ai-settings' as any)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open AI settings"
                >
                  <Ionicons name="settings-outline" size={20} color={colors.ink} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  message,
  colors,
  savedGenerated,
  onSaveGeneratedItem,
}: {
  message: UiMessage;
  colors: any;
  savedGenerated: Record<string, boolean>;
  onSaveGeneratedItem: (text: string, kind: SavedPhraseKind) => Promise<void>;
}) {
  const isUser = message.role === 'user';
  const listItems = !isUser && message.listKind ? parseMarkdownListItems(message.content) : [];

  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi, {
      backgroundColor: isUser ? colors.ink : colors.paper2,
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: listItems.length ? '100%' : '85%',
    }, listItems.length > 0 && styles.bubbleList]}>
      {message.audio ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Ionicons name="mic" size={16} color={isUser ? colors.paper : colors.ink2} />
          <Text style={[Typography.bodyMedium, { color: isUser ? colors.paper : colors.ink2 }]}>
            Voice question{message.audioMs ? ` · ${Math.round(message.audioMs / 1000)}s` : ''}
          </Text>
        </View>
      ) : listItems.length > 0 && message.listKind ? (
        <ScrollView
          horizontal
          style={styles.generatedSlider}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.generatedList}
        >
          {listItems.map((item, index) => {
            const key = savedItemKey(item, message.listKind!);
            const saved = !!savedGenerated[key];
            const parsed = parseGeneratedItem(item);
            return (
              <View key={`${index}-${item.slice(0, 16)}`} style={[styles.generatedListItem, { borderColor: colors.hair, backgroundColor: colors.paper }]}>
                <Text style={[styles.generatedIndex, { color: colors.ink4 }]}>#{index + 1}</Text>
                <View style={styles.generatedItemText}>
                  <Text style={[styles.generatedTitle, { color: colors.ink }]}>{parsed.title}</Text>
                  {!!parsed.explanation && (
                    <Text style={[styles.generatedExplanation, { color: colors.ink2 }]}>{parsed.explanation}</Text>
                  )}
                  {!!parsed.example && (
                    <Text style={[styles.generatedExample, { color: colors.ink3 }]}>{parsed.example}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => onSaveGeneratedItem(stripMarkdown(item), message.listKind!)}
                  disabled={saved}
                  style={[
                    styles.addItemBtn,
                    { borderColor: colors.hair, backgroundColor: saved ? colors.ink : colors.paper },
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={saved ? 'Saved' : 'Save item'}
                >
                  <Ionicons name={saved ? 'checkmark' : 'add'} size={16} color={saved ? colors.paper : colors.ink} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <FormattedMessageText content={message.displayContent ?? message.content} isUser={isUser} colors={colors} />
      )}
    </View>
  );
}

function FormattedMessageText({
  content,
  isUser,
  colors,
}: {
  content: string;
  isUser: boolean;
  colors: any;
}) {
  const segments = parseBoldSegments(content);
  const color = isUser ? colors.paper : colors.ink;

  return (
    <Text style={[Typography.bodyMedium, { color }]}>
      {segments.map((segment, index) => (
        <Text
          key={`${index}-${segment.text}`}
          style={segment.bold ? { fontWeight: '700', color } : { color }}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function readUriAsBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function guessAudioMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mp4';
}

function parseBoldSegments(text: string): { text: string; bold: boolean }[] {
  const segments: { text: string; bold: boolean }[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length ? segments : [{ text, bold: false }];
}

function parseMarkdownListItems(text: string): string[] {
  const lines = text.split('\n');
  const items: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (match) {
      if (current.length) items.push(current.join(' ').trim());
      current = [match[1].trim()];
    } else if (current.length && line.trim()) {
      current.push(line.trim());
    } else if (current.length) {
      items.push(current.join(' ').trim());
      current = [];
    }
  }

  if (current.length) items.push(current.join(' ').trim());
  return items.filter(Boolean);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGeneratedItem(text: string): { title: string; explanation: string; example: string } {
  const clean = stripMarkdown(text);
  const exampleMatch = clean.match(/\b(?:Transcript|Example)\s*:\s*["“]?(.+?)["”]?$/i);
  const beforeExample = exampleMatch ? clean.slice(0, exampleMatch.index).trim() : clean;
  const example = exampleMatch?.[1]?.trim() ?? '';
  const separator = beforeExample.indexOf(' - ');

  if (separator < 0) {
    return { title: beforeExample, explanation: '', example };
  }

  return {
    title: beforeExample.slice(0, separator).trim(),
    explanation: beforeExample.slice(separator + 3).trim(),
    example,
  };
}

function savedItemKey(text: string, kind: SavedPhraseKind): string {
  return `${kind}:${stripMarkdown(text).toLowerCase()}`;
}

function inferSavedKind(history: UiMessage[]): SavedPhraseKind | undefined {
  const last = lastUserMessage(history);
  if (last.includes('keyword') || last.includes('vocabular')) return 'vocabulary';
  if (last.includes('grammar') || last.includes('phrase')) return 'phrase';
  return undefined;
}

function buildPromptSuggestions(): PromptSuggestion[] {
  return [
    {
      label: 'Summarize the video',
      prompt: 'Summarize the main ideas in this video. Keep it concise and easy to remember.',
      align: 'right',
    },
    {
      label: 'List of keywords',
      prompt:
        [
          'Curate 8 high-value vocabulary items from the nearby transcript for an English listening learner.',
          'Choose words or short lexical chunks that are actually useful for understanding this video, not obvious filler words and not random rare words.',
          'Prefer items that carry meaning, argument, emotion, or speaker intent. Avoid duplicates and avoid proper nouns unless essential.',
          'Return only a numbered list. No intro, no outro.',
          'Each item must use exactly this format:',
          '**word or chunk** - learner-friendly meaning in 1 short sentence. Transcript: "exact short transcript quote that uses it".',
          'Keep each explanation practical: explain how the word/chunk works in this context, not a dictionary definition.',
        ].join(' '),
      wide: true,
      align: 'right',
    },
    {
      label: 'List of grammars or phrases',
      prompt:
        [
          'Curate 6 useful spoken-English phrases, grammar patterns, discourse markers, or sentence frames from the nearby transcript.',
          'Choose expressions a learner could reuse in real conversation, especially phrases that show opinion, uncertainty, emphasis, connection, or explanation.',
          'Do not list single vocabulary words here unless they are part of a reusable phrase. Avoid generic fillers unless the phrase teaches natural spoken structure.',
          'Return only a numbered list. No intro, no outro.',
          'Each item must use exactly this format:',
          '**phrase or pattern** - what it means and when to use it in 1 short sentence. Transcript: "exact short transcript quote that uses it".',
          'Keep the phrase exactly as spoken when possible, but clean obvious caption artifacts like repeated arrows or speaker markers.',
        ].join(' '),
      wide: true,
      align: 'right',
    },
  ];
}

function lastUserMessage(messages: UiMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content.toLowerCase();
  }
  return '';
}

function buildFollowUpSuggestions(context: AiContext, messages: UiMessage[]): PromptSuggestion[] {
  const last = lastUserMessage(messages);

  if (last.includes('quiz')) {
    return [
      { label: 'Give me a hint', prompt: 'Give me a small hint, but do not reveal the full answer yet.' },
      { label: 'Show the answer', prompt: 'Show the answer and explain why it is correct.' },
      { label: 'Ask another one', prompt: 'Ask me another question from this video.' },
    ];
  }

  if (last.includes('summarize') || last.includes('main ideas')) {
    return [
      { label: '3 takeaways', prompt: 'Turn that summary into 3 memorable takeaways.' },
      { label: 'Make flashcards', prompt: 'Make a few flashcards from the key ideas.' },
      { label: 'Quiz me on it', prompt: 'Quiz me on the summary, one question at a time.' },
    ];
  }

  if (last.includes('explain') || last.includes('mean')) {
    return [
      { label: 'Give examples', prompt: 'Give me 3 natural example sentences for that idea or phrase.' },
      { label: 'Simpler version', prompt: 'Explain it again in simpler English.' },
      { label: 'Pronunciation tips', prompt: 'Give pronunciation or listening tips for this phrase.' },
    ];
  }

  const prompts: PromptSuggestion[] = [
    { label: 'Go deeper', prompt: 'Go one level deeper and explain the most useful detail.' },
    { label: 'Make it practical', prompt: 'How can I use this idea or phrase in real conversation?' },
    { label: 'Quiz me', prompt: 'Quiz me on what we just discussed.' },
  ];

  if (context.transcriptWindow) {
    prompts.push({
      label: 'Back to transcript',
      prompt: 'Use the nearby transcript and point out what I should listen for next.',
    });
  }

  return prompts.slice(0, 3);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.xxxl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: Spacing.xxxl,
    position: 'relative',
  },
  title: {
    fontFamily: Typography.headingLarge.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    flex: 1,
    paddingRight: 56,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBanner: {
    marginHorizontal: 28,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: Spacing.xxxl,
    gap: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  starter: {
    gap: 18,
  },
  sparkle: {
    fontSize: 30,
    lineHeight: 34,
  },
  greeting: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
  },
  promptIntro: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500',
    marginTop: 4,
  },
  suggestionList: {
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  suggestionChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  suggestionChipWide: {
    borderRadius: Radius.xxxl,
    maxWidth: '96%',
  },
  suggestionRight: {
    alignSelf: 'flex-end',
  },
  suggestionCenter: {
    alignSelf: 'center',
  },
  suggestionText: {
    fontFamily: Typography.headingSmall.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  followUpBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  followUpLabel: {
    ...Typography.marker,
  },
  followUpList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  followUpChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    maxWidth: '100%',
  },
  followUpText: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  generatedList: {
    gap: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  generatedSlider: {
    height: 250,
    maxHeight: 250,
    alignSelf: 'stretch',
  },
  generatedListItem: {
    width: 270,
    height: 230,
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xxxl,
    padding: Spacing.xl,
  },
  generatedIndex: {
    ...Typography.monoSmall,
    alignSelf: 'flex-start',
  },
  generatedItemText: {
    flex: 1,
    gap: Spacing.sm,
  },
  generatedTitle: {
    fontFamily: Typography.headingSmall.fontFamily,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  generatedExplanation: {
    fontFamily: Typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  generatedExample: {
    fontFamily: Typography.bodySmall.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  addItemBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xxxl,
  },
  bubbleList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  bubbleUser: { borderBottomRightRadius: Radius.sm },
  bubbleAi: { borderBottomLeftRadius: Radius.sm },
  errorBox: {
    padding: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginTop: Spacing.md,
  },
  inputDock: { borderTopWidth: 1, padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
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
    maxHeight: 140,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  recDot: { width: 10, height: 10, borderRadius: 5 },
});
