// saddle-data.js — sample content for Saddle (smart English listening)

const SADDLE_USER = {
  name: 'Minh',
  totalHours: 142.6,
  streak: 23,
  hoursToday: 1.4,
  hoursWeek: 8.7,
  weeklyTarget: 10,
  level: 'B2 → C1',
  joined: 'Jan 2025',
};

// Time-in-saddle: keyed by ISO date string ("2026-04-15"), value = hours that day
// We seed 90 days back from today (May 6, 2026)
const SADDLE_HEATMAP = (() => {
  const map = {};
  const today = new Date(2026, 4, 6); // May = month 4 (0-indexed)
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) * 9301 + 49297;
    const r = ((seed % 233280) / 233280);
    const v = i > 60 ? r * 0.6 : 0.3 + r * 1.7;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    map[key] = Math.round(v * 10) / 10;
  }
  // Knock out a few rest days for realism
  const restKeys = Object.keys(map).filter((_, i) => i % 11 === 3);
  restKeys.forEach(k => map[k] = 0);
  return map;
})();

const SADDLE_INTERESTS = ['chess', 'compilers', 'physics', 'jazz', 'rust', 'urban planning'];

const SADDLE_NOW_PLAYING = {
  id: 'lex-carmack',
  title: 'On compilers, simulation, and the art of programming',
  speaker: 'John Carmack',
  show: 'Lex Fridman Podcast · #309',
  duration: 5 * 3600 + 12 * 60,  // 5:12:00
  position: 1 * 3600 + 47 * 60 + 12, // 1:47:12
  tags: ['compilers', 'engineering', 'curiosity'],
  artistColor: '#1a1d22',
};

const SADDLE_TRANSCRIPT = [
  { t: '1:46:58', speaker: 'JC',  text: "If you really want to understand a system, you have to be willing to read the source. Not the documentation — the actual source." },
  { t: '1:47:08', speaker: 'LF',  text: "And you've done this with engines, with operating system kernels…" },
  { t: '1:47:12', speaker: 'JC',  text: "Right. There's a kind of ground truth in code that summaries always strip out.", current: true },
  { t: '1:47:21', speaker: 'JC',  text: "When you skip the journey, you skip the parts that actually rewire your intuition." },
  { t: '1:47:32', speaker: 'LF',  text: "Is that why you keep going back to the assembly level on hobby projects?" },
  { t: '1:47:38', speaker: 'JC',  text: "Yeah. There's no substitute for putting time in the saddle." },
];

const SADDLE_LIBRARY = [
  {
    shelf: 'Today on your topics',
    why: 'because you follow compilers, chess',
    items: [
      { id: 'a', title: 'Why your CPU is mostly idle', speaker: 'Casey Muratori', show: 'Hand­made Hero', mins: 87, mood: 'engineering', new: true },
      { id: 'b', title: 'Endgame intuition vs calculation', speaker: 'Magnus Carlsen', show: 'Take Take Take', mins: 64, mood: 'chess' },
      { id: 'c', title: 'The future is silicon, again', speaker: 'Jim Keller', show: 'Lex Fridman #438', mins: 213, mood: 'engineering', new: true },
    ],
  },
  {
    shelf: 'Masters · long-form',
    why: 'unsanitized, native pace, full conversations',
    items: [
      { id: 'd', title: 'On thinking from first principles', speaker: 'Elon Musk', show: 'Lex Fridman #400', mins: 128, mood: 'physics' },
      { id: 'e', title: 'Forty years of writing engines', speaker: 'John Carmack', show: 'Lex Fridman #309', mins: 312, mood: 'engineering', listening: true },
      { id: 'f', title: 'Why music is the math of feeling', speaker: 'Rick Rubin', show: 'Tetragrammaton', mins: 96, mood: 'music' },
    ],
  },
  {
    shelf: 'Curiosity · added by you',
    why: 'rust, urban planning',
    items: [
      { id: 'g', title: 'Memory, lifetimes, and the borrow checker', speaker: 'Niko Matsakis', show: 'Rustacean Station', mins: 52, mood: 'engineering' },
      { id: 'h', title: 'How streets shape behaviour', speaker: 'Janette Sadik-Khan', show: 'The War on Cars', mins: 71, mood: 'cities' },
    ],
  },
];

const SADDLE_AI_THREAD = [
  { from: 'me',  text: "What does 'put time in the saddle' mean here?" },
  { from: 'ai',  text: "It's an idiom — \"in the saddle\" originally means actively riding a horse. Carmack is using it to mean spending sustained, hands-on hours practicing a craft. Not reading about it, not watching tutorials — actually doing it. The same way a rider only gets good by logging hours on the horse." },
  { from: 'me',  text: "Is that the same as 'putting in the reps'?" },
  { from: 'ai',  text: "Very close — both come from physical training. \"Reps\" is from weightlifting. \"Time in the saddle\" leans into the long, unglamorous duration of practice rather than the count of repetitions." },
];

const SADDLE_DRILL = {
  phrase: "There's no substitute for putting time in the saddle.",
  speaker: 'John Carmack',
  source: 'Lex Fridman #309 · 1:47:38',
  reps: 3,
  targetReps: 5,
};

const SADDLE_BOOKMARKS = [
  { ts: '1:47:38', phrase: "There's no substitute for putting time in the saddle.", source: 'John Carmack · Lex Fridman #309', date: 'Today', drilling: true, reps: 3, target: 5 },
  { ts: '1:12:48', phrase: "Most insight comes from staring at the problem longer than is reasonable.", source: 'John Carmack · Lex Fridman #309', date: 'Today' },
  { ts: '0:34:12', phrase: "You don't get intuition by reading abstracts.", source: 'John Carmack · Lex Fridman #309', date: 'Today' },
  { ts: '0:48:02', phrase: "It's a question of taste, not technique.", source: 'Rick Rubin · Tetragrammaton', date: 'Yesterday' },
  { ts: '2:11:30', phrase: "The map is never the territory — read the source.", source: 'Jim Keller · Lex Fridman #438', date: 'May 3' },
];

const SADDLE_VOCAB = [
  { word: 'substitute',     pron: '/ˈsʌb.stɪ.tjuːt/',  pos: 'n.',   gloss: 'a person or thing that replaces another', heard: '× 4', mastery: 0.8 },
  { word: 'instinctive',    pron: '/ɪnˈstɪŋk.tɪv/',     pos: 'adj.', gloss: 'done without thinking, from instinct', heard: '× 7', mastery: 0.9 },
  { word: 'derivation',     pron: '/ˌder.ɪˈveɪ.ʃən/',   pos: 'n.',  gloss: 'the act of obtaining from a source', heard: '× 2', mastery: 0.4 },
  { word: 'first principles', pron: '/fɜːst ˈprɪn.sə.pəlz/', pos: 'phr.', gloss: 'reasoning from foundational truths', heard: '× 11', mastery: 1.0 },
  { word: 'idiomatic',      pron: '/ˌɪd.iˈæm.ət.ɪk/',    pos: 'adj.', gloss: 'natural to a native speaker', heard: '× 3', mastery: 0.5 },
  { word: 'in the saddle',  pron: '/ɪn ðə ˈsæd.əl/',     pos: 'idiom', gloss: 'actively practicing a skill over time', heard: '× 6', mastery: 0.7 },
  { word: 'unsanitized',    pron: '/ʌnˈsæn.ɪ.taɪzd/',    pos: 'adj.', gloss: 'not cleaned up or simplified', heard: '× 1', mastery: 0.2 },
  { word: 'cadence',        pron: '/ˈkeɪ.dəns/',         pos: 'n.',   gloss: 'a rhythm of speech or sound', heard: '× 3', mastery: 0.6 },
];

window.SADDLE_DATA = {
  USER: SADDLE_USER,
  HEATMAP: SADDLE_HEATMAP,
  INTERESTS: SADDLE_INTERESTS,
  NOW_PLAYING: SADDLE_NOW_PLAYING,
  TRANSCRIPT: SADDLE_TRANSCRIPT,
  LIBRARY: SADDLE_LIBRARY,
  AI_THREAD: SADDLE_AI_THREAD,
  DRILL: SADDLE_DRILL,
  BOOKMARKS: SADDLE_BOOKMARKS,
  VOCAB: SADDLE_VOCAB,
};
