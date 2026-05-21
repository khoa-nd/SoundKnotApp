import React from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface CompanionChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onVoiceInput: () => void;
  isVoiceActive: boolean;
}

export function CompanionChat({
  messages,
  isLoading,
  onSend,
  onVoiceInput,
  isVoiceActive,
}: CompanionChatProps) {
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.roleLabel}>
              {item.role === 'user' ? 'You' : 'SoundKnot AI'}
            </Text>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
        inverted={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyTitle}>Ask anything about what you're listening to</Text>
            <Text style={styles.emptyDesc}>
              Tap the mic or type a question — "What does that word mean?" or "Explain this concept"
            </Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.thinking}>
          <Text style={styles.thinkingText}>SoundKnot AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={onVoiceInput}
          style={[styles.voiceBtn, isVoiceActive && styles.voiceBtnActive]}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question..."
          placeholderTextColor={Colors.textMuted}
          style={styles.textInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!input.trim()}>
          <Text style={[styles.sendIcon, !input.trim() && styles.sendDisabled]}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  roleLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  bubbleText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  thinking: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thinkingText: {
    color: Colors.accent,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  voiceBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: Colors.error,
  },
  voiceIcon: { fontSize: 18 },
  textInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
