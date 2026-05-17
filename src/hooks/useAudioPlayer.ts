import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../stores/playerStore';

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const {
    isPlaying,
    isBuffering,
    isLoaded,
    currentTime,
    duration,
    playbackRate,
    volume,
    currentContentId,
    loadContent,
    play,
    pause,
    togglePlay,
    seek,
    setPlaybackRate,
    setVolume,
    updateProgress,
    setBuffering,
    reset,
  } = usePlayerStore();

  const loadAudio = useCallback(
    async (audioUrl: string, contentId: string) => {
      try {
        setBuffering(true);
        loadContent(contentId);

        // Unload previous sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          {
            shouldPlay: false,
            rate: playbackRate,
            volume,
            progressUpdateIntervalMillis: 500,
          }
        );

        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;

          updateProgress(status.positionMillis / 1000, status.durationMillis! / 1000);

          if (status.didJustFinish) {
            pause();
          }
        });

        setBuffering(false);
      } catch (error) {
        console.error('Failed to load audio:', error);
        setBuffering(false);
      }
    },
    [loadContent, playbackRate, volume, updateProgress, setBuffering, pause]
  );

  const handlePlay = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      play();
    }
  }, [play]);

  const handlePause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      pause();
    }
  }, [pause]);

  const handleTogglePlay = useCallback(async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      pause();
    } else {
      await soundRef.current.playAsync();
      play();
    }
  }, [play, pause]);

  const handleSeek = useCallback(
    async (timeSeconds: number) => {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(timeSeconds * 1000);
        seek(timeSeconds);
      }
    },
    [seek]
  );

  const handleSetRate = useCallback(
    async (rate: number) => {
      if (soundRef.current) {
        await soundRef.current.setRateAsync(rate, true);
        setPlaybackRate(rate);
      }
    },
    [setPlaybackRate]
  );

  const handleSetVolume = useCallback(
    async (vol: number) => {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(vol);
        setVolume(vol);
      }
    },
    [setVolume]
  );

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    isPlaying,
    isBuffering,
    isLoaded,
    currentTime,
    duration,
    playbackRate,
    volume,
    currentContentId,
    loadAudio,
    play: handlePlay,
    pause: handlePause,
    togglePlay: handleTogglePlay,
    seek: handleSeek,
    setPlaybackRate: handleSetRate,
    setVolume: handleSetVolume,
    reset,
  };
}
