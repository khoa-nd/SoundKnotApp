// Platform-resolved re-export
// Metro resolves .web.tsx or .native.tsx at build time.
// This file serves as the TypeScript fallback for type checking.
export { YoutubePlayerView } from './YoutubePlayerView.native';
export type { YoutubePlayerHandle, YoutubePlayerViewProps } from './YoutubePlayerView.native';
