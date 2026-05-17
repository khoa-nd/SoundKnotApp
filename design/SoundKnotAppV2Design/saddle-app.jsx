// saddle-app.jsx — root component
const { useState: useSdAppState } = React;

function SaddleFrame({ screen, platform = 'ios', label }) {
  const width  = platform === 'ios' ? 402 : 412;
  const height = platform === 'ios' ? 874 : 892;
  const [playing, setPlaying] = useSdAppState(screen === 'now' || screen === 'ai');
  const [view, setView] = useSdAppState(screen);

  const FrameCmp = platform === 'ios' ? IOSDevice : AndroidDevice;
  const togglePlay = () => setPlaying(p => !p);
  const onNav = (id) => setView(id);

  const common = {
    platform, playing, onTogglePlay: togglePlay,
    onOpenPlayer: () => setView('now'),
    onPickMaster: () => setView('now'),
    onDrill: () => setView('drill'),
    onNav,
  };

  let page;
  switch (view) {
    case 'today':    page = <TodayScreen {...common} />; break;
    case 'library':  page = <LibraryScreen {...common} />; break;
    case 'saved':    page = <SavedScreen {...common} />; break;
    case 'hours':    page = <HoursScreen {...common} />; break;
    case 'settings': page = <SettingsScreen {...common} />; break;
    case 'now':      page = <NowPlayingScreen platform={platform} playing={playing} onTogglePlay={togglePlay}
                              onClose={() => setView('today')}
                              onAskAI={() => setView('ai')}
                              onDrill={() => setView('drill')} />; break;
    case 'ai':       page = <AICompanionScreen platform={platform} onClose={() => setView('now')} />; break;
    case 'drill':    page = <DrillScreen platform={platform} onClose={() => setView('now')} />; break;
    default:         page = <TodayScreen {...common} />;
  }

  return (
    <div style={{ width, height, position: 'relative' }} data-screen-label={label}>
      <FrameCmp width={width} height={height}>
        {page}
      </FrameCmp>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Root canvas
// ──────────────────────────────────────────────────────────────
function SaddleApp() {
  return (
    <DesignCanvas title="Saddle" subtitle="Smart English listening · five tabs · iOS reference">
      <DCSection id="discover" title="Discover" subtitle="Land, browse, return">
        <DCArtboard id="today" label="01 Today" width={402} height={874}>
          <SaddleFrame screen="today" label="01 Today" />
        </DCArtboard>
        <DCArtboard id="library" label="02 Library — masters + curiosity" width={402} height={874}>
          <SaddleFrame screen="library" label="02 Library" />
        </DCArtboard>
        <DCArtboard id="saved" label="03 For You — phrases + vocabulary" width={402} height={874}>
          <SaddleFrame screen="saved" label="03 For You" />
        </DCArtboard>
      </DCSection>

      <DCSection id="listen" title="Active listening" subtitle="The hands-free centerpiece">
        <DCArtboard id="now" label="04 Now playing" width={402} height={874}>
          <SaddleFrame screen="now" label="04 Now playing" />
        </DCArtboard>
        <DCArtboard id="ai" label="05 AI Companion" width={402} height={874}>
          <SaddleFrame screen="ai" label="05 AI Companion" />
        </DCArtboard>
        <DCArtboard id="drill" label="06 Drill / shadowing" width={402} height={874}>
          <SaddleFrame screen="drill" label="06 Drill / shadowing" />
        </DCArtboard>
      </DCSection>

      <DCSection id="account" title="Time + account" subtitle="Hours, settings, the long view">
        <DCArtboard id="hours" label="07 Hours — calendar" width={402} height={874}>
          <SaddleFrame screen="hours" label="07 Hours" />
        </DCArtboard>
        <DCArtboard id="settings" label="08 Settings — account &amp; misc" width={402} height={874}>
          <SaddleFrame screen="settings" label="08 Settings" />
        </DCArtboard>
        <DCArtboard id="hours-android" label="09 Hours · Android" width={412} height={892}>
          <SaddleFrame screen="hours" label="09 Hours · Android" platform="android" />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SaddleApp />);
