import { useState, useCallback, useRef } from 'react';
import { voiceService } from '../services/voice';
import { usePlayerStore } from '../stores/playerStore';
import { useSessionStore } from '../stores/sessionStore';
import type { VoiceAction } from '../types';

export function useVoiceCommands() {
  const [isActive, setIsActive] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const { seek, currentTime } = usePlayerStore();
  const { addBookmark } = useSessionStore();

  const handleCommand = useCallback(
    (action: VoiceAction) => {
      setLastCommand(action);

      switch (action) {
        case 'play':
          usePlayerStore.getState().play();
          break;
        case 'pause':
          usePlayerStore.getState().pause();
          break;
        case 'rewind_10s':
          seek(Math.max(0, currentTime - 10));
          break;
        case 'forward_30s':
          seek(currentTime + 30);
          break;
        case 'bookmark':
          addBookmark({
            id: `bm-${Date.now()}`,
            timestampSeconds: currentTime,
            label: 'Voice bookmark',
            createdAt: new Date().toISOString(),
          });
          break;
        case 'slow_down': {
          const rate = usePlayerStore.getState().playbackRate;
          usePlayerStore.getState().setPlaybackRate(Math.max(0.5, rate - 0.25));
          break;
        }
        case 'speed_up': {
          const rate = usePlayerStore.getState().playbackRate;
          usePlayerStore.getState().setPlaybackRate(Math.min(2.0, rate + 0.25));
          break;
        }
        case 'normal_speed':
          usePlayerStore.getState().setPlaybackRate(1.0);
          break;
        case 'ask_ai':
        case 'repeat_phrase':
          break;
      }
    },
    [seek, currentTime, addBookmark]
  );

  const startListening = useCallback(() => {
    setIsActive(true);
    voiceService.startListening(handleCommand);
  }, [handleCommand]);

  const stopListening = useCallback(() => {
    setIsActive(false);
    voiceService.stopListening();
  }, []);

  const toggleListening = useCallback(() => {
    if (isActive) {
      stopListening();
    } else {
      startListening();
    }
  }, [isActive, startListening, stopListening]);

  return {
    isActive,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
  };
}
