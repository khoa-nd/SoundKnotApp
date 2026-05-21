// data.js — sample content for the mock: tech interview transcript

const SAMPLE_VIDEO = {
  id: 'a16z-huang',
  url: 'https://youtu.be/dQw4w9WgXcQ', // placeholder
  title: 'Jensen Huang on the coming decade of compute',
  channel: 'a16z Podcast',
  uploaded: '3 weeks ago',
  duration: '1:42:08',
  thumbTint: ['#1a1d22', '#2a2e36'],
  transcriptSource: 'auto-generated',
};

// A short practice segment — 3 lines for the demo, each with timestamps.
// Each sentence is tokenized into words for the transcript / dictation UIs.
const SEGMENT = {
  start: '24:18',
  end: '27:02',
  durationSec: 164,
  lines: [
    {
      t: '24:18',
      seconds: 0,
      text: "What people still don't appreciate is that the whole computing stack is being reinvented from the silicon up.",
    },
    {
      t: '24:24',
      seconds: 14,
      text: "For sixty years we wrote software that ran on CPUs, and the architecture of that software was shaped by the architecture of the processor.",
    },
    {
      t: '24:36',
      seconds: 32,
      text: "When you move to a completely parallel machine, the programs themselves have to be rewritten. It's not a port; it's a rethinking.",
    },
    {
      t: '24:48',
      seconds: 52,
      text: "We spent almost two decades convincing the world this was worth doing. And I'll tell you, until recently, most of them were quite polite about it.",
    },
  ],
};

// Recent practice items — varying mastery levels
const RECENT_ITEMS = [
  {
    id: 'r1',
    title: 'Jensen Huang on the coming decade of compute',
    channel: 'a16z Podcast',
    segment: '24:18 — 27:02',
    lastPracticed: 'today',
    mastery: 0.35,
    pass: 2,
    streak: 3,
  },
  {
    id: 'r2',
    title: 'The long interview: Demis Hassabis',
    channel: 'Dwarkesh Patel',
    segment: '08:40 — 11:30',
    lastPracticed: 'yesterday',
    mastery: 0.68,
    pass: 4,
    streak: 7,
  },
  {
    id: 'r3',
    title: 'Why we built Stripe — Patrick Collison',
    channel: 'Invest Like the Best',
    segment: '51:10 — 54:05',
    lastPracticed: '2 days ago',
    mastery: 0.82,
    pass: 6,
    streak: 12,
  },
  {
    id: 'r4',
    title: 'How language models actually work',
    channel: 'Lex Fridman',
    segment: '1:12:00 — 1:15:00',
    lastPracticed: '4 days ago',
    mastery: 0.15,
    pass: 1,
    streak: 0,
  },
];

// 12 weeks of practice data — last day is "today"
// 0 = nothing, 1 = partial, 2 = complete
const PRACTICE_GRID = (() => {
  const days = 84;
  const arr = [];
  // Seeded so the layout stays consistent
  const seed = [
    2,2,0,2,2,1,2,
    0,2,2,2,0,2,1,
    2,1,2,2,2,0,2,
    2,2,0,2,2,2,1,
    2,0,2,2,1,2,2,
    2,2,2,2,2,0,2,
    0,2,2,2,2,2,2,
    2,2,1,2,2,2,0,
    2,2,2,2,2,2,2,
    1,2,2,2,0,2,2,
    2,2,2,2,2,2,2,
    2,1,2,2,2,2,2,
  ];
  for (let i = 0; i < days; i++) arr.push(seed[i] ?? 0);
  return arr;
})();

window.GK_DATA = { SAMPLE_VIDEO, SEGMENT, RECENT_ITEMS, PRACTICE_GRID };
