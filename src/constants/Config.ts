export const Config = {
  appName: 'SoundKnot',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.soundknot.app',
  aiEndpoint: process.env.EXPO_PUBLIC_AI_ENDPOINT || 'https://api.soundknot.app/ai',

  audio: {
    minPlaybackRate: 0.5,
    maxPlaybackRate: 2.0,
    defaultPlaybackRate: 1.0,
    rewindSeconds: 10,
    forwardSeconds: 30,
  },

  tracker: {
    milestoneMinutes: [600, 3000, 6000, 30000, 60000], // 10h, 50h, 100h, 500h, 1000h
    sessionHeartbeatMs: 5000, // update timer every 5s
  },

  achievements: {
    milestones: [
      { thresholdMinutes: 600, title: 'First 10 Hours', description: '10 hours of deliberate listening' },
      { thresholdMinutes: 3000, title: '50 Hour Club', description: '50 hours of immersive practice' },
      { thresholdMinutes: 6000, title: 'Century Mark', description: '100 hours — comprehension is becoming instinct' },
      { thresholdMinutes: 30000, title: '500 Hour Deep Dive', description: '500 hours of deep listening' },
      { thresholdMinutes: 60000, title: 'The 1000 Hour Knot', description: '1000 hours. The skill is in your bones.' },
    ],
    streaks: [
      { thresholdStreak: 7, title: 'Week Warrior', description: '7 day listening streak' },
      { thresholdStreak: 30, title: 'Monthly Grind', description: '30 day listening streak' },
      { thresholdStreak: 100, title: 'Century Streak', description: '100 consecutive days of practice' },
    ],
  },

  voiceCommands: [
    { phrase: 'hey sound knot play', action: 'play' },
    { phrase: 'hey sound knot pause', action: 'pause' },
    { phrase: 'rewind', action: 'rewind_10s' },
    { phrase: 'skip forward', action: 'forward_30s' },
    { phrase: 'bookmark this', action: 'bookmark' },
    { phrase: 'explain this', action: 'ask_ai' },
    { phrase: 'slow down', action: 'slow_down' },
    { phrase: 'speed up', action: 'speed_up' },
    { phrase: 'normal speed', action: 'normal_speed' },
    { phrase: 'repeat that', action: 'repeat_phrase' },
  ],
} as const;
