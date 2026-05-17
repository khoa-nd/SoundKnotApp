// screens.jsx — Home, Import, Segment, Progress screens
// Practice + Recall + Dictation live in practice.jsx

const { useState, useEffect, useRef, useMemo } = React;

// ═════════════════════════════════════════════════════════════
// Shell pieces
// ═════════════════════════════════════════════════════════════

function StatusBar({ dark, time = '9:41', platform = 'ios' }) {
  return <div style={{ height: platform === 'ios' ? 54 : 40, flexShrink: 0 }} />;
}

function TopSpacer({ platform }) {
  return <div style={{ height: platform === 'ios' ? 54 : 40, flexShrink: 0 }} />;
}

function AppHeader({ title, subtitle, right, marker, onBack, compact, platform = 'ios' }) {
  const topPad = platform === 'ios' ? 54 : 40;
  return (
    <div style={{
      padding: `${topPad}px 20px ${compact ? 12 : 20}px`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
        {onBack ? (
          <button onClick={onBack} style={{
            background: 'transparent', border: 'none', padding: 0, color: 'var(--gk-ink)',
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            fontFamily: 'var(--gk-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <IconBack size={14} /> Back
          </button>
        ) : (
          <span className="gk-marker">{marker || ''}</span>
        )}
        {right}
      </div>
      {title && (
        <div style={{
          fontSize: compact ? 22 : 28,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginTop: 4,
        }}>{title}</div>
      )}
      {subtitle && (
        <div style={{ color: 'var(--gk-ink-3)', fontSize: 13, marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
  );
}

function BottomNav({ active, onChange, platform }) {
  // Hide tab bar when on practice flow screens — those get a full-bleed surface
  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid var(--gk-hair)',
      background: 'var(--gk-paper)',
      paddingBottom: platform === 'ios' ? 22 : 10,
    }}>
      {[
        { id: 'home', label: 'Practice', Icon: IconHome },
        { id: 'library', label: 'Library', Icon: IconLibrary },
        { id: 'progress', label: 'Progress', Icon: IconChart },
      ].map(t => (
        <button key={t.id} className={`gk-tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}>
          <t.Icon size={18} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 1. HOME SCREEN
// ═════════════════════════════════════════════════════════════

function HomeScreen({ onPaste, onOpenItem, onProgress, platform }) {
  const { RECENT_ITEMS } = window.GK_DATA;
  const [urlValue, setUrlValue] = useState('');
  const active = RECENT_ITEMS[0];
  const rest = RECENT_ITEMS.slice(1);

  const submitUrl = () => {
    if (urlValue.trim()) onPaste(urlValue.trim());
    else onPaste('https://youtube.com/watch?v=sample');
  };

  return (
    <div className="gk-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <TopSpacer platform={platform} />
        <div style={{ padding: '0 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="gk-marker">Sound Knot · Wed Apr 23</span>
          <span className="gk-chip">
            <IconFlame size={10} />
            12 day streak
          </span>
        </div>

        {/* Paste URL — the doorway */}
        <div style={{ padding: '12px 20px 24px' }}>
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
            marginBottom: 16,
          }}>
            <span style={{ color: 'var(--gk-ink-3)' }}>Bring in a video.</span><br/>
            <span style={{ fontStyle: 'italic' }}>Work the knot.</span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              className="gk-input"
              placeholder="Paste a YouTube URL…"
              value={urlValue}
              onChange={e => setUrlValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitUrl()}
              style={{ paddingRight: 52 }}
            />
            <button onClick={submitUrl} style={{
              position: 'absolute', right: 6, top: 6, bottom: 6, width: 40,
              borderRadius: 7,
              background: urlValue ? 'var(--gk-ink)' : 'var(--gk-ink-4)',
              color: 'var(--gk-paper)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}>
              <IconArrowRight size={16} />
            </button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span className="gk-chip"><IconYT size={10} /> Paste link</span>
            <span className="gk-chip">or use clipboard</span>
          </div>
        </div>

        {/* Today — pick up where you left off */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="gk-marker">Today</span>
            <span className="gk-marker">1 / 4 complete</span>
          </div>

          <div
            onClick={() => onOpenItem(active)}
            style={{
              padding: 16,
              background: 'var(--gk-paper-2)',
              border: '1px solid var(--gk-hair)',
              borderRadius: 12,
              display: 'flex', gap: 14,
              cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
            }}>
            <div style={{ flexShrink: 0, color: 'var(--gk-ink)' }}>
              <Knot size={64} progress={0.45} mastery={active.mastery} pass={active.pass} animated={false} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="gk-marker" style={{ marginBottom: 4 }}>Pass {active.pass} · {active.segment}</div>
              <div style={{
                fontSize: 14, fontWeight: 500, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{active.title}</div>
              <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginTop: 6 }}>
                {active.channel}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: 3, flex: 1, borderRadius: 2,
                    background: i < Math.round(active.mastery * 5) ? 'var(--gk-ink)' : 'var(--gk-hair)',
                  }}/>
                ))}
              </div>
            </div>
          </div>

          <button className="gk-btn gk-btn-primary" style={{ marginTop: 12 }}
            onClick={() => onOpenItem(active)}>
            <IconPlay size={14} /> Continue · 3 min
          </button>
        </div>

        {/* Recent segments */}
        <div style={{ padding: '18px 20px 20px' }}>
          <div className="gk-marker" style={{ marginBottom: 10 }}>Recent knots</div>
          {rest.map(item => (
            <div key={item.id}
              onClick={() => onOpenItem(item)}
              style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderTop: '1px solid var(--gk-hair)',
                cursor: 'pointer',
              }}>
              <div style={{ color: 'var(--gk-ink)', flexShrink: 0 }}>
                <Knot size={40} progress={item.mastery} mastery={item.mastery} pass={item.pass} animated={false} subdued={0.3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                  whiteSpace: 'nowrap',
                }}>{item.title}</div>
                <div className="gk-mono" style={{ color: 'var(--gk-ink-4)', fontSize: 10.5, marginTop: 4, letterSpacing: '0.03em' }}>
                  {item.segment} · pass {item.pass} · {item.lastPracticed}
                </div>
              </div>
              <div className="gk-mono" style={{ color: 'var(--gk-ink-3)', fontSize: 11, alignSelf: 'center' }}>
                {Math.round(item.mastery * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 2. IMPORT REVIEW
// ═════════════════════════════════════════════════════════════

// Extract YouTube video ID from a URL (supports youtu.be / watch?v= / embed)
function extractYouTubeId(url) {
  if (!url) return 'dQw4w9WgcQ';
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : 'dQw4w9WgcQ';
}

function ImportScreen({ url, onBack, onConfirm, platform }) {
  const { SAMPLE_VIDEO, SEGMENT } = window.GK_DATA;
  const [phase, setPhase] = useState('fetching'); // fetching → ready
  const [transcriptFound, setTranscriptFound] = useState(true);
  const vid = extractYouTubeId(url);

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="gk-app">
      <AppHeader platform={platform} onBack={onBack} marker="Import · review" compact />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        <div className="gk-mono" style={{
          color: 'var(--gk-ink-4)', fontSize: 10.5, letterSpacing: '0.05em',
          marginBottom: 8, wordBreak: 'break-all',
        }}>
          youtu.be/{vid}
        </div>

        {/* Video card with real YouTube embed */}
        <div style={{
          background: 'var(--gk-paper-2)',
          border: '1px solid var(--gk-hair)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{ aspectRatio: '16 / 9', position: 'relative', background: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title="YouTube preview"
            />
            {phase === 'fetching' && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'var(--gk-mono)', fontSize: 11, letterSpacing: '0.06em',
                zIndex: 2,
              }}>
                FETCHING METADATA…
              </div>
            )}
          </div>

          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
              {SAMPLE_VIDEO.title}
            </div>
            <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginBottom: 12 }}>
              {SAMPLE_VIDEO.channel} · {SAMPLE_VIDEO.duration}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <DetectRow label="Video metadata" value={phase === 'ready' ? 'found' : 'checking…'} done={phase === 'ready'} />
              <DetectRow
                label="Transcript (auto-captions)"
                value={phase === 'ready' ? (transcriptFound ? `found · en · ${SEGMENT.lines.length} lines` : 'not available') : 'checking…'}
                done={phase === 'ready' && transcriptFound}
                fail={phase === 'ready' && !transcriptFound}
              />
            </div>

            {phase === 'ready' && !transcriptFound && (
              <button className="gk-btn gk-btn-ghost" style={{ marginTop: 12, width: '100%' }}
                onClick={() => setTranscriptFound(true)}>
                Paste transcript manually
              </button>
            )}
          </div>
        </div>

        {/* Transcript review */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 8,
          }}>
            <div className="gk-marker">Transcript review</div>
            <div className="gk-mono" style={{ fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.04em' }}>
              {phase === 'ready' ? `${SEGMENT.lines.length} LINES` : '—'}
            </div>
          </div>
          <div style={{
            border: '1px solid var(--gk-hair)',
            borderRadius: 10,
            padding: 14,
            background: 'var(--gk-paper)',
            opacity: phase === 'ready' ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
          }}>
            {SEGMENT.lines.map((line, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '7px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--gk-hair-2)',
              }}>
                <div className="gk-mono" style={{
                  color: 'var(--gk-ink-4)', fontSize: 10, letterSpacing: '0.03em',
                  paddingTop: 3, minWidth: 38, flexShrink: 0,
                }}>
                  {line.t}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--gk-ink-2)' }}>
                  {line.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: 'var(--gk-ink-3)', fontSize: 11, marginTop: 8 }}>
            The whole video is your practice target. No need to cut a segment.
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 20px 18px', borderTop: '1px solid var(--gk-hair)' }}>
        <button
          className="gk-btn gk-btn-primary"
          disabled={phase !== 'ready'}
          style={{ opacity: phase === 'ready' ? 1 : 0.4 }}
          onClick={onConfirm}>
          {phase === 'ready' ? (<>Start practice <IconArrowRight size={14} /></>) : 'Processing…'}
        </button>
      </div>
    </div>
  );
}

function DetectRow({ label, value, done, fail }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12, paddingTop: 6,
      borderTop: '1px solid var(--gk-hair-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gk-ink-2)' }}>
        <div style={{
          width: 12, height: 12, borderRadius: 12,
          background: done ? 'var(--gk-ink)' : fail ? 'var(--gk-negative)' : 'var(--gk-hair)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gk-paper)',
        }}>
          {done && <IconCheck size={8} />}
        </div>
        {label}
      </div>
      <div className="gk-mono" style={{
        color: fail ? 'var(--gk-negative)' : 'var(--gk-ink-3)',
        fontSize: 10.5, textTransform: 'lowercase', letterSpacing: '0.02em',
      }}>{value}</div>
    </div>
  );
}

// (SegmentScreen removed — whole video is the practice target)
function SegmentScreen() { return null; }

// ═════════════════════════════════════════════════════════════
// 6. PROGRESS SCREEN
// ═════════════════════════════════════════════════════════════

function ProgressScreen({ onBack, platform = 'ios' }) {
  const { PRACTICE_GRID, RECENT_ITEMS } = window.GK_DATA;

  return (
    <div className="gk-app">
      <AppHeader platform={platform} marker="Your practice" title="Progress" compact />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 80px' }}>
        {/* Streak stat block */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 18,
        }}>
          <StatCard label="Current streak" value="12" unit="days" accent />
          <StatCard label="Longest" value="23" unit="days" />
          <StatCard label="Segments" value="14" unit="active" />
          <StatCard label="Minutes" value="284" unit="total" />
        </div>

        {/* Heatmap 12 weeks */}
        <div className="gk-marker" style={{ marginBottom: 10 }}>Last 12 weeks</div>
        <div style={{
          padding: 12,
          background: 'var(--gk-paper-2)',
          border: '1px solid var(--gk-hair)',
          borderRadius: 10,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'repeat(7, auto)',
            gap: 3,
            gridAutoFlow: 'column',
          }}>
            {PRACTICE_GRID.map((v, i) => {
              const isToday = i === PRACTICE_GRID.length - 1;
              const cls = isToday ? 'today' : v === 2 ? 'done' : v === 1 ? 'partial' : '';
              return <div key={i} className={`gk-streak-cell ${cls}`} />;
            })}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 12, fontSize: 10, fontFamily: 'var(--gk-mono)',
            color: 'var(--gk-ink-3)', letterSpacing: '0.04em',
          }}>
            <span>JAN 29</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>less</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gk-hair)' }}/>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gk-ink-4)' }}/>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gk-ink)' }}/>
              </div>
              <span>more</span>
            </div>
            <span>APR 23</span>
          </div>
        </div>

        {/* Listening indicators */}
        <div style={{ marginTop: 22 }}>
          <div className="gk-marker" style={{ marginBottom: 10 }}>Listening indicators · last 30 days</div>
          <IndicatorRow label="First-listen accuracy" from={38} to={62} unit="%" />
          <IndicatorRow label="Transcript dependence" from={82} to={41} unit="%" inverted />
          <IndicatorRow label="Avg replays per line" from={5.2} to={2.8} unit="×" inverted decimals />
          <IndicatorRow label="Dictation word accuracy" from={58} to={79} unit="%" />
        </div>

        {/* Per-segment mastery */}
        <div style={{ marginTop: 24 }}>
          <div className="gk-marker" style={{ marginBottom: 10 }}>Active knots · mastery</div>
          {RECENT_ITEMS.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderTop: '1px solid var(--gk-hair)',
            }}>
              <div style={{ color: 'var(--gk-ink)' }}>
                <Knot size={32} progress={item.mastery} mastery={item.mastery} pass={item.pass} animated={false} subdued={0.3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div className="gk-progress" style={{ marginTop: 6 }}>
                  <div className="gk-progress-fill" style={{ width: `${item.mastery * 100}%` }} />
                </div>
              </div>
              <div className="gk-mono" style={{ fontSize: 11, color: 'var(--gk-ink-3)', minWidth: 36, textAlign: 'right' }}>
                {Math.round(item.mastery * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{
      padding: 14,
      background: accent ? 'var(--gk-ink)' : 'var(--gk-paper-2)',
      color: accent ? 'var(--gk-paper)' : 'var(--gk-ink)',
      border: '1px solid ' + (accent ? 'var(--gk-ink)' : 'var(--gk-hair)'),
      borderRadius: 10,
    }}>
      <div className="gk-mono" style={{
        fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: accent ? 'rgba(244,243,238,0.6)' : 'var(--gk-ink-4)',
        marginBottom: 6,
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
        <span className="gk-mono" style={{ fontSize: 10, color: accent ? 'rgba(244,243,238,0.6)' : 'var(--gk-ink-3)' }}>{unit}</span>
      </div>
      {accent && (
        <div style={{ marginTop: 10, display: 'flex', gap: 2 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 1,
              background: 'var(--gk-accent)',
              opacity: 0.9,
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

function IndicatorRow({ label, from, to, unit, inverted, decimals }) {
  const delta = to - from;
  const improved = inverted ? delta < 0 : delta > 0;
  const fmt = v => decimals ? v.toFixed(1) : Math.round(v);
  return (
    <div style={{
      padding: '12px 0',
      borderTop: '1px solid var(--gk-hair)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, color: 'var(--gk-ink-2)' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="gk-mono" style={{ fontSize: 11, color: 'var(--gk-ink-4)' }}>{fmt(from)}{unit}</span>
          <IconArrowRight size={10} />
          <span className="gk-mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--gk-ink)' }}>{fmt(to)}{unit}</span>
          <span className="gk-mono" style={{
            fontSize: 10, padding: '2px 5px', borderRadius: 3,
            background: improved ? 'var(--gk-paper-2)' : 'var(--gk-paper-2)',
            color: improved ? 'var(--gk-positive)' : 'var(--gk-negative)',
            border: '1px solid var(--gk-hair)',
          }}>
            {delta > 0 ? '+' : ''}{fmt(delta)}{unit}
          </span>
        </div>
      </div>
      {/* Sparkline */}
      <div style={{
        marginTop: 8, height: 24, display: 'flex', alignItems: 'flex-end', gap: 2,
      }}>
        {Array.from({ length: 30 }, (_, i) => {
          const p = i / 29;
          const val = from + delta * p + (Math.sin(i * 0.9) * Math.abs(delta) * 0.12);
          const normMax = Math.max(from, to) * 1.15;
          const h = (val / normMax) * 100;
          return <div key={i} style={{
            flex: 1,
            height: `${Math.max(10, h)}%`,
            background: i > 25 ? 'var(--gk-ink)' : 'var(--gk-ink-4)',
            opacity: i > 25 ? 1 : 0.35,
            borderRadius: 1,
          }}/>;
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, ImportScreen, SegmentScreen, ProgressScreen,
  BottomNav, AppHeader,
});
