// ── User ──
export interface User {
  id: string;
  displayName: string;
  interests: string[];
  totalListeningMinutes: number;
  streak: number;
  longestStreak: number;
  level: UserLevel;
  onboardingComplete: boolean;
  handsFreeEnabled: boolean;
  createdAt: string;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

// ── Content ──
export interface ContentItem {
  id: string;
  title: string;
  speaker: string;
  speakerBio?: string;
  description: string;
  topics: string[];
  difficulty: ContentDifficulty;
  durationSeconds: number;
  audioUrl: string;
  transcript?: TranscriptSegment[];
  sourceUrl?: string;
  thumbnailUrl?: string;
  publishedAt: string;
  isDownloaded: boolean;
}

export type ContentDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  keyPhrases?: KeyPhrase[];
}

export interface KeyPhrase {
  id: string;
  original: string;
  translation?: string;
  startTime: number;
  endTime: number;
  masteryLevel: number; // 0-100
}

// ── Listening Session ──
export interface ListeningSession {
  id: string;
  contentId: string;
  startTime: string;
  endTime?: string;
  listenedSeconds: number;
  completed: boolean;
  bookmarks: Bookmark[];
  aiQueries: AIQuery[];
}

export interface Bookmark {
  id: string;
  timestampSeconds: number;
  label?: string;
  note?: string;
  createdAt: string;
}

export interface AIQuery {
  id: string;
  query: string;
  response: string;
  timestampSeconds: number;
  createdAt: string;
}

// ── Drill ──
export interface DrillSession {
  id: string;
  contentId: string;
  phraseId: string;
  repetitions: number;
  score?: number;
  startedAt: string;
  completedAt?: string;
}

// ── Recommendations ──
export interface Recommendation {
  contentId: string;
  reason: string;
  score: number; // 0-100 relevance
}

// ── Achievement ──
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  thresholdMinutes?: number;
  thresholdStreak?: number;
}

// ── Auth ──
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  interests: string[];
  level: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  current_streak: number;
  longest_streak: number;
  total_minutes: number;
  total_sessions: number;
  last_session_date: string | null;
  updated_at: string;
}

// ── User Videos ──
export interface UserVideo {
  id: string;
  user_id: string;
  youtube_video_id: string;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
  added_at: string;
}

// ── Practice Sessions ──
export interface PracticeSession {
  id: string;
  user_id: string;
  video_id: string;
  segment: string | null;
  pass: number;
  mastery: number;
  accuracy: number;
  listened_seconds: number;
  created_at: string;
  user_videos?: {
    title: string | null;
    youtube_video_id: string;
    thumbnail_url: string | null;
  };
}

// ── Home Screen Response ──
export interface HomeData {
  progress: UserProgress | null;
  todaySessions: PracticeSession[];
  recentKnots: PracticeSession[];
  videos: UserVideo[];
}

// ── Navigation ──
export type RootStackParamList = {
  index: undefined;
  login: undefined;
  onboarding: undefined;
  '(tabs)': undefined;
  listen: { videoId: string; userVideoId?: string };
  dictation: { videoId: string; userVideoId?: string };
  finished: { userVideoId?: string; recallsCount?: string; averageAccuracy?: string; listenedSeconds?: string };
  'player/[id]': { id: string };
  'drill/[id]': { id: string };
  'content/[id]': { id: string };
};

// ── Audio State ──
export interface AudioState {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number; // 0.5 - 2.0
  volume: number;
  currentContentId: string | null;
  loopMode: LoopMode;
}

export type LoopMode = 'off' | 'phrase' | 'segment' | 'full';

// ── Voice Command ──
export interface VoiceCommand {
  id: string;
  phrase: string;
  action: VoiceAction;
  enabled: boolean;
}

export type VoiceAction =
  | 'play'
  | 'pause'
  | 'rewind_10s'
  | 'forward_30s'
  | 'bookmark'
  | 'ask_ai'
  | 'slow_down'
  | 'speed_up'
  | 'normal_speed'
  | 'repeat_phrase';
