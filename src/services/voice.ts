import { Config } from '../constants/Config';
import type { VoiceAction } from '../types';

type CommandCallback = (action: VoiceAction) => void;

let isListening = false;
let callback: CommandCallback | null = null;

const commandMap: Record<string, VoiceAction> = {
  'play': 'play',
  'pause': 'pause',
  'resume': 'play',
  'rewind': 'rewind_10s',
  'go back': 'rewind_10s',
  'skip': 'forward_30s',
  'skip forward': 'forward_30s',
  'forward': 'forward_30s',
  'bookmark': 'bookmark',
  'bookmark this': 'bookmark',
  'save this': 'bookmark',
  'explain': 'ask_ai',
  'explain this': 'ask_ai',
  'what does that mean': 'ask_ai',
  'slow down': 'slow_down',
  'slower': 'slow_down',
  'speed up': 'speed_up',
  'faster': 'speed_up',
  'normal speed': 'normal_speed',
  'repeat': 'repeat_phrase',
  'repeat that': 'repeat_phrase',
  'say that again': 'repeat_phrase',
};

export const voiceService = {
  startListening(onCommand: CommandCallback) {
    if (isListening) return;
    isListening = true;
    callback = onCommand;
    console.log('[Voice] Started listening for commands');
  },

  stopListening() {
    isListening = false;
    callback = null;
    console.log('[Voice] Stopped listening');
  },

  processTranscript(transcript: string): VoiceAction | null {
    const lower = transcript.toLowerCase().trim();

    for (const [phrase, action] of Object.entries(commandMap)) {
      if (lower.includes(phrase)) {
        return action;
      }
    }

    return null;
  },

  isActive(): boolean {
    return isListening;
  },
};
