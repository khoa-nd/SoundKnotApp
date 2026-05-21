// saddle-player.jsx — Now Playing, AI Companion, Drill screens

const { useState: useSadState2, useEffect: useSadEffect2, useRef: useSadRef2 } = React;

// ═════════════════════════════════════════════════════════════
// 4. NOW PLAYING — full-screen, dark surface
// ═════════════════════════════════════════════════════════════
function NowPlayingScreen({ platform, onClose, onAskAI, onDrill, playing, onTogglePlay }) {
  const np = window.SADDLE_DATA.NOW_PLAYING;
  const transcript = window.SADDLE_DATA.TRANSCRIPT;
  const [position, setPosition] = useSadState2(np.position);
  const [handsfree, setHandsfree] = useSadState2(true);
  const [bookmarked, setBookmarked] = useSadState2(false);

  // Build a fake waveform — 80 bars
  const wave = useSadRef2(null);
  if (!wave.current) {
    wave.current = Array.from({ length: 80 }, (_, i) => {
      const seed = i * 7919 + 1234;
      const r = ((seed % 233280) / 233280);
      return 0.3 + r * 0.7;
    });
  }
  const playedFrac = position / np.duration;

  return (
    <div className="sd-app sd-now">
      <SdTopSpacer platform={platform} />

      {/* Top bar */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="sd-iconbtn dark" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18 }}>
          <IconArrowDown size={16} />
        </button>
        <div className="sd-marker">{np.show}</div>
        <button className="sd-iconbtn dark" style={{ width: 36, height: 36, borderRadius: 18 }} onClick={() => setBookmarked(!bookmarked)}>
          <IconBookmark size={16} filled={bookmarked} />
        </button>
      </div>

      <div style={{ padding: '0 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        {/* Cover */}
        <div className="sd-cover" />

        {/* Title */}
        <div>
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.01em',
          }}>{np.title}</div>
          <div className="sd-marker" style={{ marginTop: 8 }}>{np.speaker}</div>
        </div>

        {/* Hands-free indicator + tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="sd-handsfree" onClick={() => setHandsfree(!handsfree)} style={{ cursor: 'pointer', opacity: handsfree ? 1 : 0.4 }}>
            <span className="sd-handsfree-dot" />
            HANDS-FREE
          </span>
          {np.tags.map(t => (
            <span key={t} className="sd-tag" style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(244,243,238,0.65)' }}>{t}</span>
          ))}
        </div>

        {/* Waveform + scrubber */}
        <div>
          <div className="sd-wave" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const f = (e.clientX - rect.left) / rect.width;
            setPosition(Math.max(0, Math.min(np.duration, f * np.duration)));
          }}>
            {wave.current.map((h, i) => {
              const frac = i / wave.current.length;
              const played = frac < playedFrac;
              return (
                <div key={i}
                  className="sd-wave-bar"
                  style={{
                    height: `${h * 100}%`,
                    background: played ? 'var(--gk-paper)' : 'rgba(244,243,238,0.18)',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="sd-num" style={{ fontSize: 11, color: 'rgba(244,243,238,0.7)' }}>{fmtTime(position)}</span>
            <span className="sd-num" style={{ fontSize: 11, color: 'rgba(244,243,238,0.45)' }}>-{fmtTime(np.duration - position)}</span>
          </div>
        </div>
      </div>

      {/* Transport */}
      <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="sd-iconbtn dark"><IconShuffle size={16} /></button>
        <button className="sd-iconbtn dark"><IconSkipBack size={16} /></button>
        <button className="sd-bigplay" onClick={onTogglePlay}>
          {playing ? <IconPause size={28} /> : <IconPlay size={28} />}
        </button>
        <button className="sd-iconbtn dark"><IconSkipFwd size={16} /></button>
        <button className="sd-iconbtn dark" onClick={onDrill}><IconWaveform size={16} /></button>
      </div>

      {/* Bottom action row — Ask AI + Drill + Bookmark current phrase */}
      <div style={{
        padding: '10px 16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onAskAI} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 12px',
          background: 'var(--gk-accent)', color: '#1a1d22',
          border: 'none', borderRadius: 10,
          fontFamily: 'var(--gk-mono)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
          <IconAI size={16} /> Ask AI
        </button>
        <button onClick={onDrill} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 12px',
          background: 'rgba(255,255,255,0.08)', color: 'var(--gk-paper)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          fontFamily: 'var(--gk-mono)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
          <IconWaveform size={16} /> Drill phrase
        </button>
      </div>

      <div style={{ height: platform === 'ios' ? 28 : 12 }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 5. AI COMPANION — voice-to-voice chat overlay
// ═════════════════════════════════════════════════════════════
function AICompanionScreen({ platform, onClose }) {
  const thread = window.SADDLE_DATA.AI_THREAD;
  const np = window.SADDLE_DATA.NOW_PLAYING;
  const [listening, setListening] = useSadState2(false);

  return (
    <div className="sd-app sd-now">
      <SdTopSpacer platform={platform} />

      {/* Top bar */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="sd-iconbtn dark" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18 }}>
          <IconArrowDown size={16} />
        </button>
        <div className="sd-marker">AI Companion</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Context strip — what you were listening to */}
      <div style={{
        margin: '0 16px 8px',
        padding: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div className="sd-handsfree-dot" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sd-marker">PAUSED · 1:47:12</div>
          <div style={{ fontSize: 12, color: 'rgba(244,243,238,0.85)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {np.title}
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="gk-scroll" style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {thread.map((m, i) => (
          <div key={i} className={`sd-bubble ${m.from}`}
            style={m.from === 'ai' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--gk-paper)' } : { background: 'var(--gk-accent)', color: '#1a1d22', alignSelf: 'flex-end' }}>
            {m.text}
          </div>
        ))}

        {/* Live indicator when listening */}
        {listening && (
          <div className="sd-bubble" style={{
            alignSelf: 'flex-end',
            background: 'transparent',
            border: '1px dashed rgba(217,119,87,0.5)',
            color: 'var(--gk-accent)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ display: 'flex', gap: 3 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 4, height: 16, borderRadius: 2, background: 'var(--gk-accent)',
                  animation: `gk-pulse 1s ${i * 0.15}s ease-in-out infinite`,
                }} />
              ))}
            </span>
            <span className="gk-mono" style={{ fontSize: 11, letterSpacing: '0.06em' }}>LISTENING…</span>
          </div>
        )}
      </div>

      {/* Mic button */}
      <div style={{
        padding: '14px 16px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => setListening(!listening)} style={{
          width: 76, height: 76, borderRadius: 38,
          background: listening ? 'var(--gk-accent)' : 'rgba(255,255,255,0.06)',
          color: listening ? '#1a1d22' : 'var(--gk-paper)',
          border: listening ? 'none' : '1px solid rgba(255,255,255,0.14)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <IconMic size={28} />
        </button>
        <div className="gk-mono" style={{ fontSize: 10, color: 'rgba(244,243,238,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {listening ? 'Tap to send' : 'Tap & hold to ask · or say "saddle"'}
        </div>
      </div>

      <div style={{ height: platform === 'ios' ? 24 : 12 }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 6. DRILL — shadowing/repetition exercise
// ═════════════════════════════════════════════════════════════
function DrillScreen({ platform, onClose }) {
  const drill = window.SADDLE_DATA.DRILL;
  const [reps, setReps] = useSadState2(drill.reps);
  const [rec, setRec] = useSadState2(false);
  const [stage, setStage] = useSadState2('idle'); // idle | listening | speaking | scoring

  const doRep = () => {
    setStage('listening');
    setTimeout(() => setStage('speaking'), 1200);
    setTimeout(() => {
      setStage('scoring');
      setReps(r => Math.min(r + 1, drill.targetReps));
      setTimeout(() => setStage('idle'), 1500);
    }, 3500);
  };

  return (
    <div className="sd-app">
      <SdTopSpacer platform={platform} />

      {/* Top bar */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="sd-iconbtn" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18 }}>
          <IconArrowDown size={16} />
        </button>
        <div className="sd-marker">Drill · shadowing</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Source */}
        <div className="sd-marker">From {drill.source}</div>

        {/* Phrase */}
        <div className="sd-phrase">
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 22, lineHeight: 1.3, letterSpacing: '-0.01em',
          }}>"{drill.phrase}"</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <div className="sd-portrait" style={{ width: 32, height: 32 }} />
            <div className="sd-marker">{drill.speaker}</div>
          </div>

          {/* Mini wave to mimic original */}
          <div className="sd-wave" style={{ marginTop: 14, height: 22 }}>
            {Array.from({ length: 36 }).map((_, i) => {
              const seed = i * 4129 + 21;
              const r = ((seed % 233280) / 233280);
              return <div key={i} className="sd-wave-bar" style={{ height: `${30 + r * 70}%` }} />;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'var(--gk-paper)',
              border: '1px solid var(--gk-hair)', borderRadius: 16,
              cursor: 'pointer', fontSize: 11, color: 'var(--gk-ink)',
              fontFamily: 'var(--gk-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <IconPlay size={11} /> 0.7×
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'var(--gk-paper)',
              border: '1px solid var(--gk-hair)', borderRadius: 16,
              cursor: 'pointer', fontSize: 11, color: 'var(--gk-ink)',
              fontFamily: 'var(--gk-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <IconPlay size={11} /> 1.0×
            </button>
          </div>
        </div>

        {/* Reps */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span className="sd-section-title" style={{ fontSize: 14 }}>Reps · until it lives in your mouth</span>
            <span className="sd-num" style={{ fontSize: 13 }}>{reps}/{drill.targetReps}</span>
          </div>
          <div className="sd-rep-row">
            {Array.from({ length: drill.targetReps }).map((_, i) => (
              <div key={i} className={`sd-rep ${i < reps ? 'done' : ''}`} />
            ))}
          </div>
        </div>

        {/* Coaching feedback */}
        <div style={{
          padding: 14, background: 'var(--gk-paper-2)',
          border: '1px solid var(--gk-hair)', borderRadius: 8,
          minHeight: 80,
        }}>
          <div className="sd-marker" style={{ marginBottom: 8 }}>
            {stage === 'idle' && 'Last attempt'}
            {stage === 'listening' && 'Listen first'}
            {stage === 'speaking' && 'Repeat after the speaker'}
            {stage === 'scoring' && 'Scoring…'}
          </div>
          {stage === 'idle' && (
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--gk-ink-2)' }}>
              <span style={{ color: 'var(--gk-ink-4)' }}>Stress on </span>
              <strong style={{ color: 'var(--gk-accent-ink)' }}>"sub-sti-tute"</strong>
              <span style={{ color: 'var(--gk-ink-4)' }}> — second syllable. Try a touch slower next rep.</span>
            </div>
          )}
          {(stage === 'listening' || stage === 'speaking') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4].map(i => (
                  <span key={i} style={{
                    width: 3, height: 18, borderRadius: 2,
                    background: stage === 'speaking' ? 'var(--gk-accent)' : 'var(--gk-ink)',
                    animation: `gk-pulse 1s ${i * 0.1}s ease-in-out infinite`,
                  }} />
                ))}
              </span>
              <span className="gk-mono" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                {stage === 'listening' ? 'Original audio…' : 'Your turn…'}
              </span>
            </div>
          )}
          {stage === 'scoring' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="sd-num" style={{ fontSize: 22, color: 'var(--gk-accent-ink)' }}>87</span>
              <div style={{ flex: 1 }}>
                <div className="sd-marker">RHYTHM 92 · STRESS 80 · SOUNDS 89</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Big record button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
          <button onClick={doRep} style={{
            width: 80, height: 80, borderRadius: 40,
            background: stage !== 'idle' ? 'var(--gk-accent)' : 'var(--gk-ink)',
            color: 'var(--gk-paper)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <IconMic size={28} />
          </button>
          <span className="gk-mono" style={{ fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Tap to start a rep
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NowPlayingScreen, AICompanionScreen, DrillScreen });
