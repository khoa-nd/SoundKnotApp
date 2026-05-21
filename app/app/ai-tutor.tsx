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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { useAiSettingsStore } from '../src/stores/aiSettingsStore';
import { chat, type AiMessage, type AiContext, type AiAudioAttachment } from '../src/services/aiTutor';

interface UiMessage extends AiMessage {
  id: string;
  timestamp: number;
  audioMs?: number; // if this message originated from a voice recording
  pending?: boolean;
}

export default function AiTutorScreen() {
  const colors = useTheme();
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
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState(params.prefill ?? '');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedSec, setRecordedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!hydrated) load();
  }, [hydrated, load]);

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
  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const userMsg: UiMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: trimmed,
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
        { id: `m-${Date.now()}-r`, role: 'assistant', content: res.reply, timestamp: Date.now() },
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.paper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
            <Text style={[Typography.headingSmall, { color: colors.ink }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[Typography.monoSmall, { color: colors.ink3 }]}>AI TUTOR</Text>
          <TouchableOpacity onPress={() => router.push('/ai-settings' as any)} activeOpacity={0.7} style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={20} color={colors.ink2} />
          </TouchableOpacity>
        </View>

        {params.selection && (
          <View style={[styles.selectionBanner, { backgroundColor: colors.accentSoft, borderColor: colors.hair }]}>
            <Text style={[Typography.marker, { color: colors.accentInk }]}>SELECTED</Text>
            <Text style={[Typography.bodySmall, { color: colors.ink, marginTop: Spacing.xs }]} numberOfLines={3}>
              "{params.selection}"
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
          {messages.length === 0 && (
            <View style={[styles.emptyBox, { borderColor: colors.hair }]}>
              <Ionicons name="sparkles-outline" size={28} color={colors.accent} />
              <Text style={[Typography.heading, { marginTop: Spacing.md, textAlign: 'center' }]}>Ask anything</Text>
              <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center', marginTop: Spacing.sm }]}>
                Word meanings, slang, idioms, grammar, pronunciation. Type a question or hold the mic.
              </Text>
            </View>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} message={m} colors={colors} />
          ))}
          {sending && (
            <View style={[styles.bubble, styles.bubbleAi, { backgroundColor: colors.paper2 }]}>
              <ActivityIndicator size="small" color={colors.ink3} />
            </View>
          )}
          {error && (
            <View style={[styles.errorBox, { borderColor: colors.negative, backgroundColor: 'rgba(229,57,53,0.06)' }]}>
              <Text style={[Typography.bodySmall, { color: colors.negative }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputDock, { borderTopColor: colors.hair, backgroundColor: colors.paper }]}>
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
            </View>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, colors }: { message: UiMessage; colors: any }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi, {
      backgroundColor: isUser ? colors.ink : colors.paper2,
      alignSelf: isUser ? 'flex-end' : 'flex-start',
    }]}>
      {message.audio ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Ionicons name="mic" size={16} color={isUser ? colors.paper : colors.ink2} />
          <Text style={[Typography.bodyMedium, { color: isUser ? colors.paper : colors.ink2 }]}>
            Voice question{message.audioMs ? ` · ${Math.round(message.audioMs / 1000)}s` : ''}
          </Text>
        </View>
      ) : (
        <Text style={[Typography.bodyMedium, { color: isUser ? colors.paper : colors.ink }]}>
          {message.content}
        </Text>
      )}
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.sm,
  },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  selectionBanner: {
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.screen, gap: Spacing.lg, paddingBottom: Spacing.massive },
  emptyBox: {
    padding: Spacing.massive,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginTop: Spacing.huge,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xxxl,
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
