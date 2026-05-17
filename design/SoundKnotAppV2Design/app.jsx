// app.jsx — top-level state machine + Tweaks
// Flow: home → listen ↔ dictation → finished
// Listen + Dictation are mounted simultaneously (display toggle) so the YT player keeps state.

const { useState: useAppState, useEffect: useAppEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "amber",
  "transcriptHidden": false
}/*EDITMODE-END*/;

function extractYouTubeId(url) {
  if (!url) return 'dQw4w9WgcQ';
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : 'dQw4w9WgcQ';
}

function SoundKnotApp({ platform = 'ios', tweaks, startScreen = 'home' }) {
  const [screen, setScreen] = useAppState(startScreen);
  const [videoId, setVideoId] = useAppState('dQw4w9WgcQ');
  const [recalls, setRecalls] = useAppState([]);
  const [checked, setChecked] = useAppState(false);
  const [results, setResults] = useAppState([]);
  const [transcriptHidden, setTranscriptHidden] = useAppState(!!tweaks?.transcriptHidden);

  useAppEffect(() => { if (startScreen) setScreen(startScreen); }, [startScreen]);

  const TARGET = (window.GK_DATA?.SEGMENT?.lines || [])
    .map(l => l.text).join(' ');

  const addRecall = (r) => {
    setRecalls(prev => [...prev, { ...r, id: Date.now() + Math.random() }]);
  };

  const checkAll = () => {
    const lines = (window.GK_DATA?.SEGMENT?.lines || []).map(l => l.text);
    const out = recalls.map(r => {
      // Find best-matching line by accuracy
      let best = null;
      for (const line of lines) {
        const candidate = checkRecall(r.text, line);
        if (!best || candidate.accuracy > best.accuracy) {
          best = { ...candidate, target: line };
        }
      }
      return best || checkRecall(r.text, lines[0] || '');
    });
    setResults(out);
    setChecked(true);
  };

  const reset = () => {
    setRecalls([]);
    setResults([]);
    setChecked(false);
  };

  const go = (s) => {
    if (s === 'home') reset();
    setScreen(s);
  };

  // Pre-populate recalls when mounted directly to dictation/finished (canvas screens)
  useAppEffect(() => {
    if (startScreen === 'dictation' && recalls.length === 0) {
      setRecalls([
        { id: 1, type: 'voice', ts: new Date(), text: "For sixty years we wrote software that on CPUs and the architect of that software was shape by the architecture of processor." },
        { id: 2, type: 'text', ts: new Date(), text: "Now we have to relearn how to compute starting from the silicon up." },
      ]);
    }
    if (startScreen === 'finished' && results.length === 0) {
      const fakeRecalls = [
        { id: 1, type: 'voice', text: "For sixty years we wrote software that on CPUs and the architect of that software was shape by the architecture of processor." },
        { id: 2, type: 'text', text: "Now we have to relearn how to compute starting from the silicon up." },
      ];
      setRecalls(fakeRecalls);
      const lines = (window.GK_DATA?.SEGMENT?.lines || []).map(l => l.text);
      setResults(fakeRecalls.map(r => {
        let best = null;
        for (const line of lines) {
          const candidate = checkRecall(r.text, line);
          if (!best || candidate.accuracy > best.accuracy) best = { ...candidate, target: line };
        }
        return best || checkRecall(r.text, lines[0] || '');
      }));
      setChecked(true);
    }
  }, [startScreen]);

  // Both Listen and Dictation are always mounted during a session — visibility toggled
  // so the YouTube iframe doesn't unmount/remount.
  const inSession = screen === 'listen' || screen === 'dictation';

  return (
    <div className={'gk-app ' + (tweaks?.theme === 'dark' ? 'gk-dark' : '')}
      style={{ height: '100%' }}
      data-screen-label={`${platform.toUpperCase()} · ${screen.toUpperCase()}`}>

      {screen === 'home' && (
        <HomeScreen platform={platform}
          onPaste={(u) => { setVideoId(extractYouTubeId(u)); reset(); setScreen('listen'); }}
          onOpenItem={() => { reset(); setScreen('listen'); }}
          onProgress={() => setScreen('listen')}
        />
      )}

      {inSession && (
        <>
          <ListenScreen platform={platform}
            visible={screen === 'listen'}
            videoId={videoId}
            recallCount={recalls.length}
            transcriptHidden={transcriptHidden}
            setTranscriptHidden={setTranscriptHidden}
            onBack={() => go('home')}
            onRecall={() => setScreen('dictation')}
          />
          <DictationScreen platform={platform}
            visible={screen === 'dictation'}
            recalls={recalls}
            addRecall={addRecall}
            checkAll={checkAll}
            checked={checked}
            results={results}
            onBack={() => setScreen('listen')}
            onFinish={() => setScreen('finished')}
          />
        </>
      )}

      {screen === 'finished' && (
        <FinishedScreen platform={platform}
          recalls={recalls}
          results={results}
          onDone={() => go('home')}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Tweaks panel
// ═════════════════════════════════════════════════════════════

function TweaksPanel({ tweaks, setTweaks, screen, setScreen }) {
  const update = (patch) => {
    const merged = { ...tweaks, ...patch };
    setTweaks(merged);
    window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };

  return (
    <div className="gk-tweaks">
      <h4>Tweaks</h4>

      <label>
        Theme
        <div className="seg">
          {['light', 'dark'].map(v => (
            <button key={v} className={tweaks.theme === v ? 'on' : ''} onClick={() => update({ theme: v })}>
              {v}
            </button>
          ))}
        </div>
      </label>

      <label>
        Screen
        <select value={screen} onChange={e => setScreen(e.target.value)}>
          <option value="home">01 · Home</option>
          <option value="listen">02 · Listen</option>
          <option value="dictation">03 · Dictation</option>
          <option value="finished">04 · Session complete</option>
        </select>
      </label>

      <div style={{
        marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 10, color: 'rgba(244,243,238,0.5)', fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.04em',
      }}>
        Sound Knot · iOS + Android · PWA prototype
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Mount — design canvas with iOS + Android side-by-side
// ═════════════════════════════════════════════════════════════

function Root() {
  const [tweaks, setTweaks] = useAppState(TWEAK_DEFAULTS);
  const [editMode, setEditMode] = useAppState(false);
  const [screen, setScreen] = useAppState('listen');

  useAppEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      else if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  useAppEffect(() => {
    document.body.classList.toggle('gk-dark', tweaks.theme === 'dark');
  }, [tweaks.theme]);

  const dark = tweaks.theme === 'dark';

  return (
    <>
      <DesignCanvas
        title="Sound Knot"
        subtitle="PWA · paste YouTube → listen → recall → check"
        defaultZoom={0.55}
      >
        <DCSection id="flow" title="End-to-end flow · iOS + Android">
          <DCArtboard id="ios-current" label="iOS · current screen" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={dark}>
              <SoundKnotApp platform="ios" tweaks={tweaks} startScreen={screen} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="android-current" label="Android · current screen" width={412} height={892}>
            <AndroidDevice width={412} height={892} dark={dark}>
              <SoundKnotApp platform="android" tweaks={tweaks} startScreen={screen} />
            </AndroidDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="screens" title="All screens · iOS">
          <DCArtboard id="s-home" label="01 · Home" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={dark}>
              <SoundKnotApp platform="ios" tweaks={tweaks} startScreen="home" />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="s-listen" label="02 · Listen" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={dark}>
              <SoundKnotApp platform="ios" tweaks={tweaks} startScreen="listen" />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="s-dictation" label="03 · Dictation" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={dark}>
              <SoundKnotApp platform="ios" tweaks={tweaks} startScreen="dictation" />
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="s-finished" label="04 · Session complete" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={dark}>
              <SoundKnotApp platform="ios" tweaks={tweaks} startScreen="finished" />
            </IOSDevice>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {editMode && (
        <TweaksPanel
          tweaks={tweaks} setTweaks={setTweaks}
          screen={screen} setScreen={setScreen}
        />
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
