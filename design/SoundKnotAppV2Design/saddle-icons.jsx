// saddle-icons.jsx — additional icons for Saddle (audio, mic, brain, etc.)

const SIcon = ({ size = 20, children, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const IconHeadphones  = ({ size = 20 }) => <SIcon size={size}><path d="M3 18v-6a9 9 0 1118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1v-7h3v5zM3 19a2 2 0 002 2h1v-7H3v5z"/></SIcon>;
const IconBookshelf   = ({ size = 20 }) => <SIcon size={size}><path d="M4 3v18M20 3v18M4 7h16M4 14h16M8 7v7M14 7v7"/></SIcon>;
const IconCompass     = ({ size = 20 }) => <SIcon size={size}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></SIcon>;
const IconUser        = ({ size = 20 }) => <SIcon size={size}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/></SIcon>;
const IconAI          = ({ size = 20 }) => <SIcon size={size}><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12"/></SIcon>;
const IconBookmark    = ({ size = 20, filled = false }) => <SIcon size={size} fill={filled ? 'currentColor' : 'none'}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></SIcon>;
const IconWaveform    = ({ size = 20 }) => <SIcon size={size}><path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 12h2"/></SIcon>;
const IconClock       = ({ size = 20 }) => <SIcon size={size}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></SIcon>;
const IconCar         = ({ size = 20 }) => <SIcon size={size}><path d="M5 16l1.5-5.5A2 2 0 018.4 9h7.2a2 2 0 011.9 1.5L19 16M5 16h14M5 16v3M19 16v3"/><circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/></SIcon>;
const IconWalk        = ({ size = 20 }) => <SIcon size={size}><circle cx="13" cy="4" r="2"/><path d="M9 21l2-7-3-3 2-5 4 2 3 4M14 14l3 7"/></SIcon>;
const IconCoffee      = ({ size = 20 }) => <SIcon size={size}><path d="M4 8h13v6a4 4 0 01-4 4H8a4 4 0 01-4-4V8zM17 10h2a2 2 0 012 2 2 2 0 01-2 2h-2M6 2v3M10 2v3M14 2v3"/></SIcon>;
const IconArrowDown   = ({ size = 20 }) => <SIcon size={size}><path d="M12 5v14M19 12l-7 7-7-7"/></SIcon>;
const IconSearch      = ({ size = 20 }) => <SIcon size={size}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></SIcon>;
const IconSparkle     = ({ size = 20 }) => <SIcon size={size} fill="currentColor"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z"/></SIcon>;
const IconDot         = ({ size = 20 }) => <SIcon size={size} fill="currentColor"><circle cx="12" cy="12" r="3"/></SIcon>;
const IconGrid        = ({ size = 20 }) => <SIcon size={size}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></SIcon>;
const IconList        = ({ size = 20 }) => <SIcon size={size}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></SIcon>;
const IconShuffle     = ({ size = 20 }) => <SIcon size={size}><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M4 4l5 5M14 14l7 7"/></SIcon>;
const IconStop        = ({ size = 20 }) => <SIcon size={size} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></SIcon>;
const IconSkipBack    = ({ size = 20 }) => <SIcon size={size} fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 4h2v16H5V4z"/></SIcon>;
const IconSkipFwd     = ({ size = 20 }) => <SIcon size={size} fill="currentColor"><path d="M5 4l10 8-10 8V4zM17 4h2v16h-2V4z"/></SIcon>;

Object.assign(window, {
  IconHeadphones, IconBookshelf, IconCompass, IconUser, IconAI, IconBookmark,
  IconWaveform, IconClock, IconCar, IconWalk, IconCoffee, IconArrowDown,
  IconSearch, IconSparkle, IconDot, IconGrid, IconList, IconShuffle,
  IconStop, IconSkipBack, IconSkipFwd,
});
