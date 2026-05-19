// Web YouTube player — uses a standard iframe with the YT postMessage API
import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';

export interface YoutubePlayerViewProps {
  videoId: string;
  width: number;
  height: number;
  play: boolean;
  onReady: () => void;
  onStateChange: (state: string) => void;
  onError: (error: string) => void;
}

export interface YoutubePlayerHandle {
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  seekTo: (seconds: number) => Promise<void>;
}

export const YoutubePlayerView = forwardRef<YoutubePlayerHandle, YoutubePlayerViewProps>(
  ({ videoId, width, height, play, onReady, onStateChange, onError }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const readyRef = useRef(false);
    const lastTime = useRef(0);
    const lastDuration = useRef(0);

    // Listen for YT postMessage events
    useEffect(() => {
      const handler = (event: MessageEvent) => {
        if (typeof event.data !== 'string') return;
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'onReady') {
            readyRef.current = true;
            onReady();
          }
          if (data.event === 'onStateChange') {
            const stateMap: Record<number, string> = { 1: 'playing', 2: 'paused', 0: 'ended' };
            const state = stateMap[data.info];
            if (state) onStateChange(state);
          }
          if (data.event === 'onError') {
            onError(String(data.info));
          }
          if (data.event === 'infoDelivery' && data.info) {
            if (typeof data.info.currentTime === 'number') {
              lastTime.current = data.info.currentTime;
            }
            if (typeof data.info.duration === 'number') {
              lastDuration.current = data.info.duration;
            }
          }
        } catch {
          // not a YT message
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [onReady, onStateChange, onError]);

    // Sync play/pause
    useEffect(() => {
      if (!readyRef.current || !iframeRef.current?.contentWindow) return;
      const cmd = play ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: cmd, args: [] }),
        '*'
      );
    }, [play]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getCurrentTime: async () => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening', id: 1 }),
          '*'
        );
        await new Promise((r) => setTimeout(r, 100));
        return lastTime.current;
      },
      getDuration: async () => lastDuration.current,
      seekTo: async (seconds: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
          '*'
        );
      },
    }));

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(origin)}&modestbranding=1&rel=0&controls=1&iv_load_policy=3&autoplay=0`;

    return (
      <iframe
        ref={iframeRef}
        src={src}
        width={width}
        height={height}
        style={{ border: 'none', borderRadius: 16 }}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
      />
    );
  }
);
