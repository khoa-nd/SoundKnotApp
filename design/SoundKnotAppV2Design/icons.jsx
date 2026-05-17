// icons.jsx — minimal stroke icons
// All icons inherit currentColor. 1.5px stroke. No filled shapes except where semantically meaningful.

const Icon = ({ children, size = 20, stroke = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}>
    {children}
  </svg>
);

const IconPlay = ({ size = 20 }) => (
  <Icon size={size}><path d="M6 4v16l14-8z" fill="currentColor" stroke="none"/></Icon>
);
const IconPause = ({ size = 20 }) => (
  <Icon size={size}><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" stroke="none"/></Icon>
);
const IconBack = ({ size = 20 }) => (
  <Icon size={size}><path d="M19 12H5M12 5l-7 7 7 7"/></Icon>
);
const IconClose = ({ size = 20 }) => (
  <Icon size={size}><path d="M18 6 6 18M6 6l12 12"/></Icon>
);
const IconClip = ({ size = 20 }) => (
  <Icon size={size}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.48-8.49L12.96 2.55a4 4 0 015.66 5.66L9.41 17.42a2 2 0 01-2.83-2.83l8.48-8.48"/></Icon>
);
const IconRepeat = ({ size = 20 }) => (
  <Icon size={size}><path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></Icon>
);
const IconEye = ({ size = 20 }) => (
  <Icon size={size}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>
);
const IconEyeOff = ({ size = 20 }) => (
  <Icon size={size}><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.3 19.3 0 014.22-5.17M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a19.4 19.4 0 01-2.37 3.51M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22"/></Icon>
);
const IconMic = ({ size = 20 }) => (
  <Icon size={size}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0014 0v-1M12 18v4M8 22h8"/></Icon>
);
const IconHome = ({ size = 20 }) => (
  <Icon size={size}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></Icon>
);
const IconChart = ({ size = 20 }) => (
  <Icon size={size}><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></Icon>
);
const IconLibrary = ({ size = 20 }) => (
  <Icon size={size}><path d="M4 4v16M9 4v16M14 6l5 14M19 4h1"/></Icon>
);
const IconPlus = ({ size = 20 }) => (
  <Icon size={size}><path d="M12 5v14M5 12h14"/></Icon>
);
const IconArrowRight = ({ size = 20 }) => (
  <Icon size={size}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>
);
const IconCheck = ({ size = 20 }) => (
  <Icon size={size}><path d="M20 6L9 17l-5-5"/></Icon>
);
const IconFlame = ({ size = 20 }) => (
  <Icon size={size}><path d="M12 2s4 5 4 9a4 4 0 11-8 0c0-1 .5-2 1-3-2 1-4 4-4 7a7 7 0 0014 0c0-6-7-13-7-13z"/></Icon>
);
const IconRewind = ({ size = 20 }) => (
  <Icon size={size}><path d="M11 19L2 12l9-7zM22 19l-9-7 9-7z"/></Icon>
);
const IconForward = ({ size = 20 }) => (
  <Icon size={size}><path d="M13 19l9-7-9-7zM2 19l9-7-9-7z"/></Icon>
);
const IconLink = ({ size = 20 }) => (
  <Icon size={size}><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></Icon>
);
const IconYT = ({ size = 20 }) => (
  <Icon size={size} stroke={0}><path d="M23 7s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.7 3.4 12 3.4 12 3.4s-4.7 0-7.9.3c-.4.1-1.4.1-2.2 1C1.2 5.4 1 7 1 7S.8 8.9.8 10.8v1.4C.8 14.1 1 16 1 16s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.3 7.7.3s4.7 0 7.9-.3c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4C23.2 8.9 23 7 23 7zM9.8 14.3V8l6.2 3.2-6.2 3.1z" fill="currentColor"/></Icon>
);

Object.assign(window, {
  IconPlay, IconPause, IconBack, IconClose, IconClip, IconRepeat,
  IconEye, IconEyeOff, IconMic, IconHome, IconChart, IconLibrary,
  IconPlus, IconArrowRight, IconCheck, IconFlame, IconRewind, IconForward,
  IconLink, IconYT,
});
