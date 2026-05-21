import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useUserStore } from '../stores/userStore';
import { Config } from '../constants/Config';

export function useTimer() {
  const {
    activeSession,
    isTracking,
    totalSecondsToday,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    tick,
  } = useSessionStore();

  const { addListeningMinutes } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isTracking) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        tick(elapsed);
      }, Config.tracker.sessionHeartbeatMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, tick]);

  useEffect(() => {
    if (activeSession && !isTracking && activeSession.endTime) {
      const minutes = Math.floor(activeSession.listenedSeconds / 60);
      if (minutes > 0) {
        addListeningMinutes(minutes);
      }
    }
  }, [activeSession?.endTime]);

  const start = useCallback(
    (contentId: string) => {
      startSession(contentId);
    },
    [startSession]
  );

  const pause = useCallback(() => {
    pauseSession();
  }, [pauseSession]);

  const resume = useCallback(() => {
    resumeSession();
  }, [resumeSession]);

  const end = useCallback(() => {
    endSession();
  }, [endSession]);

  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    activeSession,
    isTracking,
    totalSecondsToday,
    elapsed: activeSession?.listenedSeconds ?? 0,
    formattedElapsed: formatTime(activeSession?.listenedSeconds ?? 0),
    formattedToday: formatTime(totalSecondsToday),
    start,
    pause,
    resume,
    end,
  };
}
