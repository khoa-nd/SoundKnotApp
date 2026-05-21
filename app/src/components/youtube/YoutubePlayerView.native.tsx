// Native YouTube player — uses react-native-youtube-iframe (WebView-based)
import React, { forwardRef } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

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
    const innerRef = React.useRef<any>(null);

    React.useImperativeHandle(ref, () => ({
      getCurrentTime: async () => {
        return (await innerRef.current?.getCurrentTime()) ?? 0;
      },
      getDuration: async () => {
        return (await innerRef.current?.getDuration()) ?? 0;
      },
      seekTo: async (seconds: number) => {
        await innerRef.current?.seekTo(seconds, true);
      },
    }));

    return (
      <YoutubePlayer
        ref={innerRef}
        height={height}
        width={width}
        videoId={videoId}
        play={play}
        onReady={onReady}
        onChangeState={onStateChange}
        onError={onError}
        initialPlayerParams={{
          modestbranding: true,
          rel: false,
          controls: true,
          iv_load_policy: 3,
        }}
        webViewProps={{
          allowsFullscreenVideo: true,
          javaScriptEnabled: true,
          domStorageEnabled: true,
        }}
      />
    );
  }
);
