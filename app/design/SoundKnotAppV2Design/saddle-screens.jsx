// saddle-screens.jsx — Today, Library, Saved, Hours, Settings + AppShell
const { useState: useSadState, useEffect: useSadEffect, useRef: useSadRef } = React;

// ═════════════════════════════════════════════════════════════
// Status bar spacer
// ═════════════════════════════════════════════════════════════
function SdTopSpacer({ platform }) {
  return <div style={{ height: platform === 'ios' ? 54 : 40, flexShrink: 0 }} />;
}

// ═════════════════════════════════════════════════════════════
// Tab bar — 5 tabs (Today | Library | For You | Hours | Settings)
// ═════════════════════════════════════════════════════════════
function SdTabbar({ active, onChange, platform }) {
  const tabs = [
    { id: 'today',    label: 'Today',    Icon: IconClock },
    { id: 'library',  label: 'Library',  Icon: IconBookshelf },
    { id: 'saved',    label: 'For you',  Icon: IconBookmark },
    { id: 'hours',    label: 'Hours',    Icon: IconCompass },
    { id: 'settings', label: 'Settings', Icon: IconUser },
  ];
  return (
    <div className="sd-tabbar" style={{
      paddingBottom: platform === 'ios' ? 22 : 10,
      gridTemplateColumns: 'repeat(5, 1fr)',
    }}>
      {tabs.map(t => (
        <button key={t.id} className={`sd-tab ${active === t.id ? 'on' : ''}`}
          onClick={() => onChange && onChange(t.id)}>
          <t.Icon size={17} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Mini player — sticky, appears whenever something is loaded
// ═════════════════════════════════════════════════════════════
function SdMiniPlayer({ onOpen, playing, onTogglePlay }) {
  const np = window.SADDLE_DATA.NOW_PLAYING;
  return (
    <div className="sd-mini-player" onClick={onOpen}>
      <div className="sd-handsfree-dot" style={{ flexShrink: 0 }} />
      <div className="meta">
        <div className="title">{np.title}</div>
        <div className="sub">{np.speaker} · {fmtTime(np.position)} / {fmtTime(np.duration)}</div>
      </div>
      <button className="play" onClick={(e) => { e.stopPropagation(); onTogglePlay && onTogglePlay(); }}>
        {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
      </button>
    </div>
  );
}

function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// ═════════════════════════════════════════════════════════════
// Listen card — shared
// ═════════════════════════════════════════════════════════════
function ListenCard({ item, onClick }) {
  return (
    <div className="sd-listen-card" onClick={onClick}>
      <div className="sd-portrait" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title}
        </div>
        <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {item.speaker} · {item.show}
          </span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="sd-tag">{item.mood}</span>
          <span className="gk-mono" style={{ fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.04em' }}>
            {item.mins} min
          </span>
          {item.new && (
            <span className="gk-mono" style={{
              fontSize: 9, color: 'var(--gk-accent-ink)', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'rgba(217,119,87,0.12)', padding: '2px 5px', borderRadius: 2,
            }}>NEW</span>
          )}
          {item.listening && (
            <span className="gk-mono" style={{
              fontSize: 9, color: 'var(--gk-ink)', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--gk-paper-2)', padding: '2px 5px', borderRadius: 2,
              border: '1px solid var(--gk-hair)',
            }}>NOW LISTENING</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 1. TODAY SCREEN
// ═════════════════════════════════════════════════════════════
function TodayScreen({ platform, playing, onOpenPlayer, onTogglePlay, onPickMaster, onNav }) {
  const { USER, INTERESTS, LIBRARY } = window.SADDLE_DATA;
  const todayPct = USER.hoursToday / 2; // 2h goal
  const weekPct = USER.hoursWeek / USER.weeklyTarget;

  return (
    <div className="sd-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <SdTopSpacer platform={platform} />

        {/* Header */}
        <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sd-marker">Wed · May 6</span>
          <span className="sd-marker">{USER.streak}-day streak</span>
        </div>

        {/* Big hours block */}
        <div style={{ padding: '6px 20px 20px' }}>
          <div className="sd-marker" style={{ marginBottom: 8 }}>Time in saddle · today</div>
          <div className="sd-bignum">
            <span className="sd-bignum-val">{USER.hoursToday.toFixed(1)}</span>
            <span className="sd-bignum-unit">hrs</span>
            <span style={{ flex: 1 }} />
            <div className="sd-ring" style={{ '--pct': todayPct }}>
              <div className="sd-ring-inner">
                <span className="sd-num" style={{ fontSize: 13 }}>{Math.round(todayPct * 100)}%</span>
              </div>
            </div>
          </div>
          <div style={{
            marginTop: 12, padding: 12,
            background: 'var(--gk-paper-2)', border: '1px solid var(--gk-hair)',
            borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div className="sd-marker">This week · {USER.hoursWeek.toFixed(1)} of {USER.weeklyTarget} hrs</div>
              <div style={{ marginTop: 8, height: 4, background: 'var(--gk-hair)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, weekPct * 100)}%`, background: 'var(--gk-accent)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pick up where you left off */}
        <div style={{ padding: '0 0 4px' }}>
          <div className="sd-marker" style={{ padding: '0 20px 8px' }}>Pick up where you left off</div>
          <SdMiniPlayer onOpen={onOpenPlayer} playing={playing} onTogglePlay={onTogglePlay} />
        </div>

        {/* Today on your topics */}
        <div style={{ padding: '14px 20px 4px' }}>
          <div className="sd-section-head">
            <span className="sd-section-title">Today on your topics</span>
            <span className="sd-section-why">because you follow</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {INTERESTS.slice(0, 4).map(t => (
              <span key={t} className="sd-tag on">{t}</span>
            ))}
            <span className="sd-tag" onClick={() => onNav && onNav('library')} style={{ cursor: 'pointer' }}>+ more</span>
          </div>
          {LIBRARY[0].items.map(item => (
            <ListenCard key={item.id} item={item} onClick={() => onPickMaster(item)} />
          ))}
        </div>

        {/* Hands-free hint */}
        <div style={{
          margin: '20px 20px 24px',
          padding: 14,
          border: '1px dashed var(--gk-hair)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <IconCar size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Driving or cooking?</div>
            <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginTop: 2 }}>
              Say <span className="gk-mono" style={{ background: 'var(--gk-paper-2)', padding: '1px 5px', borderRadius: 3 }}>"saddle, ask"</span> to bookmark or query without touching.
            </div>
          </div>
        </div>
      </div>

      <SdTabbar active="today" onChange={onNav} platform={platform} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 2. LIBRARY SCREEN — merged with curiosity feed
// ═════════════════════════════════════════════════════════════
function LibraryScreen({ platform, onPickMaster, onTogglePlay, playing, onOpenPlayer, onNav }) {
  const { LIBRARY, INTERESTS } = window.SADDLE_DATA;
  const [selected, setSelected] = useSadState(new Set(INTERESTS));
  const [filter, setFilter] = useSadState('all'); // all | following | masters

  const toggle = (t) => {
    const next = new Set(selected);
    if (next.has(t)) next.delete(t); else next.add(t);
    setSelected(next);
  };

  const visibleShelves = filter === 'masters' ? [LIBRARY[1]]
    : filter === 'following' ? [LIBRARY[0], LIBRARY[2]]
    : LIBRARY;

  return (
    <div className="sd-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <SdTopSpacer platform={platform} />

        <div style={{ padding: '0 20px 12px' }}>
          <div className="sd-marker">Library · curiosity-tuned</div>
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 4,
          }}>
            <span style={{ color: 'var(--gk-ink-3)' }}>Study</span> the masters
            <br/><span style={{ fontStyle: 'italic' }}>on what pulls you.</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: 'var(--gk-paper-2)',
            border: '1px solid var(--gk-hair)',
            borderRadius: 10,
            color: 'var(--gk-ink-3)', fontSize: 13,
          }}>
            <IconSearch size={16} />
            Search speakers, topics…
          </div>
        </div>

        {/* Interest chips — your curiosity feed lives here */}
        <div style={{ padding: '0 20px 14px' }}>
          <div className="sd-section-head">
            <span className="sd-section-title" style={{ fontSize: 14 }}>Your interests</span>
            <span className="sd-section-why">tap to mute</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INTERESTS.map(t => (
              <span key={t}
                className={`sd-tag ${selected.has(t) ? 'on' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(t)}>
                {t}
              </span>
            ))}
            <span className="sd-tag" style={{ cursor: 'pointer', borderStyle: 'dashed' }}>+ add</span>
          </div>
        </div>

        {/* Filter segmented */}
        <div style={{
          margin: '0 20px 4px',
          padding: 3,
          background: 'var(--gk-paper-2)',
          border: '1px solid var(--gk-hair)',
          borderRadius: 8,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
        }}>
          {[['all','All'], ['following','For you'], ['masters','Masters']].map(([id, lbl]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: '7px 8px', border: 'none', cursor: 'pointer',
              background: filter === id ? 'var(--gk-paper)' : 'transparent',
              borderRadius: 6,
              fontFamily: 'var(--gk-mono)', fontSize: 10,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              fontWeight: filter === id ? 600 : 400,
              color: filter === id ? 'var(--gk-ink)' : 'var(--gk-ink-3)',
              boxShadow: filter === id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            }}>{lbl}</button>
          ))}
        </div>

        <SdMiniPlayer onOpen={onOpenPlayer} playing={playing} onTogglePlay={onTogglePlay} />

        {/* Shelves */}
        {visibleShelves.map((shelf, i) => (
          <div key={i} style={{ padding: '10px 20px 10px' }}>
            <div className="sd-section-head">
              <span className="sd-section-title">{shelf.shelf}</span>
              <span className="sd-section-why">{shelf.why}</span>
            </div>
            {shelf.items.map(item => (
              <ListenCard key={item.id} item={item} onClick={() => onPickMaster(item)} />
            ))}
          </div>
        ))}

        {/* No-simplification note */}
        <div style={{
          margin: '6px 20px 16px',
          padding: 12,
          background: 'var(--gk-paper-2)',
          border: '1px solid var(--gk-hair)',
          borderRadius: 8,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <IconSparkle size={14} />
          <div style={{ fontSize: 12, color: 'var(--gk-ink-2)', lineHeight: 1.5 }}>
            All long-form. All native pace. No simplified content. Hard now, fluent later.
          </div>
        </div>
      </div>

      <SdTabbar active="library" onChange={onNav} platform={platform} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 3. FOR YOU — saved phrases + vocabulary
// ═════════════════════════════════════════════════════════════
function SavedScreen({ platform, onNav, onTogglePlay, playing, onOpenPlayer, onDrill }) {
  const { BOOKMARKS, VOCAB } = window.SADDLE_DATA;
  const [tab, setTab] = useSadState('phrases'); // phrases | vocab

  return (
    <div className="sd-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <SdTopSpacer platform={platform} />

        <div style={{ padding: '0 20px 14px' }}>
          <div className="sd-marker">For you · saved</div>
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 4,
          }}>
            <span style={{ fontStyle: 'italic' }}>Phrases</span> &amp; words
            <br/><span style={{ color: 'var(--gk-ink-3)' }}>worth remembering.</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          margin: '0 20px 14px',
          display: 'flex',
          borderBottom: '1px solid var(--gk-hair)',
        }}>
          {[
            ['phrases', 'Phrases', BOOKMARKS.length],
            ['vocab',   'Vocabulary', VOCAB.length],
          ].map(([id, lbl, count]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px 0',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: tab === id ? '2px solid var(--gk-ink)' : '2px solid transparent',
              marginBottom: -1,
              color: tab === id ? 'var(--gk-ink)' : 'var(--gk-ink-4)',
              fontSize: 13, fontWeight: tab === id ? 600 : 500,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
            }}>
              {lbl}
              <span className="gk-mono" style={{
                fontSize: 9, color: 'var(--gk-ink-4)', letterSpacing: '0.04em',
                background: 'var(--gk-paper-2)', padding: '1px 5px', borderRadius: 3,
              }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ padding: '0 20px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="sd-tag on">all</span>
          <span className="sd-tag">drilling (1)</span>
          <span className="sd-tag">today</span>
          <span style={{ flex: 1 }} />
          <span className="sd-tag" style={{ borderStyle: 'dashed' }}>↓ recent</span>
        </div>

        {/* Phrases tab */}
        {tab === 'phrases' && (
          <div style={{ padding: '6px 20px 16px' }}>
            {BOOKMARKS.map((b, i) => (
              <PhraseCard key={i} bm={b} onDrill={onDrill} />
            ))}
            <div style={{
              marginTop: 14,
              padding: 14,
              border: '1px dashed var(--gk-hair)', borderRadius: 10,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <IconWaveform size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Drill the ones you want in your bones</div>
                <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                  Run shadowing reps until each phrase lives in your mouth, not just your memory.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vocab tab */}
        {tab === 'vocab' && (
          <div style={{ padding: '6px 20px 16px' }}>
            {VOCAB.map((v, i) => (
              <VocabRow key={i} v={v} />
            ))}
          </div>
        )}

        <SdMiniPlayer onOpen={onOpenPlayer} playing={playing} onTogglePlay={onTogglePlay} />
        <div style={{ height: 4 }} />
      </div>

      <SdTabbar active="saved" onChange={onNav} platform={platform} />
    </div>
  );
}

function PhraseCard({ bm, onDrill }) {
  return (
    <div style={{
      padding: '14px 0',
      borderTop: '1px solid var(--gk-hair-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span className="gk-mono" style={{
          fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.04em',
        }}>{bm.date} · {bm.ts}</span>
        <span style={{ flex: 1 }} />
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--gk-ink-3)',
        }}>
          <IconBookmark size={14} filled={true} />
        </button>
      </div>
      <div style={{
        fontFamily: 'var(--gk-serif)',
        fontSize: 17, lineHeight: 1.35, letterSpacing: '-0.01em',
      }}>"{bm.phrase}"</div>
      <div style={{
        marginTop: 8,
        color: 'var(--gk-ink-3)', fontSize: 11.5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{bm.source}</span>
      </div>
      {bm.drilling ? (
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          background: 'rgba(217,119,87,0.08)',
          border: '1px solid rgba(217,119,87,0.25)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="gk-mono" style={{
            fontSize: 9, color: 'var(--gk-accent-ink)',
            letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
          }}>DRILLING</span>
          <span className="sd-rep-row">
            {Array.from({ length: bm.target }).map((_, i) => (
              <span key={i} className={`sd-rep ${i < bm.reps ? 'done' : ''}`}
                style={{ width: 9, height: 9 }} />
            ))}
          </span>
          <span style={{ flex: 1 }} />
          <button onClick={onDrill} style={{
            background: 'var(--gk-ink)', color: 'var(--gk-paper)',
            border: 'none', borderRadius: 4,
            padding: '5px 10px', fontSize: 10,
            fontFamily: 'var(--gk-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', fontWeight: 600,
          }}>Continue</button>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={onDrill} style={{
            background: 'transparent', color: 'var(--gk-ink)',
            border: '1px solid var(--gk-hair)', borderRadius: 4,
            padding: '5px 10px', fontSize: 10,
            fontFamily: 'var(--gk-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <IconWaveform size={11} /> Drill
          </button>
          <button style={{
            background: 'transparent', color: 'var(--gk-ink-3)',
            border: '1px solid var(--gk-hair)', borderRadius: 4,
            padding: '5px 10px', fontSize: 10,
            fontFamily: 'var(--gk-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>↗ Open</button>
        </div>
      )}
    </div>
  );
}

function VocabRow({ v }) {
  return (
    <div style={{
      padding: '14px 0',
      borderTop: '1px solid var(--gk-hair-2)',
      display: 'flex', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{v.word}</span>
          <span className="gk-mono" style={{
            fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.02em',
          }}>{v.pron}</span>
          <span className="gk-mono" style={{
            fontSize: 9, color: 'var(--gk-ink-3)', letterSpacing: '0.04em',
            fontStyle: 'italic',
          }}>{v.pos}</span>
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 12.5, color: 'var(--gk-ink-2)', lineHeight: 1.45,
        }}>{v.gloss}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="gk-mono" style={{
            fontSize: 9, color: 'var(--gk-ink-4)', letterSpacing: '0.04em',
          }}>HEARD {v.heard}</span>
          {/* Mastery bar */}
          <div style={{ flex: 1, maxWidth: 80, height: 3, background: 'var(--gk-hair)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${v.mastery * 100}%`, background: v.mastery > 0.7 ? 'var(--gk-accent)' : 'var(--gk-ink-3)' }} />
          </div>
        </div>
      </div>
      <button style={{
        background: 'transparent', border: 'none',
        color: 'var(--gk-ink-3)', cursor: 'pointer',
        alignSelf: 'flex-start',
      }}>
        <IconPlay size={14} />
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 4. HOURS SCREEN — calendar by date
// ═════════════════════════════════════════════════════════════
function HoursScreen({ platform, onTogglePlay, playing, onOpenPlayer, onNav }) {
  const { USER, HEATMAP } = window.SADDLE_DATA;
  // Show last 12 weeks worth of dates as a calendar grid
  // Anchor on today (May 6, 2026)
  const today = new Date(2026, 4, 6);
  const todayKey = `2026-05-06`;

  const cellLevel = (v) => {
    if (v == null || v <= 0) return '';
    if (v < 0.5) return 'sd-cell-l1';
    if (v < 1) return 'sd-cell-l2';
    if (v < 1.5) return 'sd-cell-l3';
    if (v < 2) return 'sd-cell-l4';
    return 'sd-cell-l5';
  };

  // Build a calendar grid: months → weeks → days
  // We'll show 3 months (Mar, Apr, May 2026)
  const months = [
    { y: 2026, m: 2, name: 'Mar' },
    { y: 2026, m: 3, name: 'Apr' },
    { y: 2026, m: 4, name: 'May' },
  ];

  const buildMonth = ({ y, m }) => {
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startDay = (first.getDay() + 6) % 7; // Mon=0
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ d, key, hours: HEATMAP[key] });
    }
    return days;
  };

  return (
    <div className="sd-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <SdTopSpacer platform={platform} />

        <div style={{ padding: '0 20px 12px' }}>
          <div className="sd-marker">Hours · {USER.name}</div>
          <div style={{
            fontFamily: 'var(--gk-serif)',
            fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 4,
          }}>
            <span style={{ fontStyle: 'italic' }}>Time</span> spent
            <br/><span style={{ color: 'var(--gk-ink-3)' }}>in the saddle.</span>
          </div>
        </div>

        {/* Big total */}
        <div style={{ padding: '4px 20px 18px' }}>
          <div className="sd-bignum">
            <span className="sd-bignum-val">{USER.totalHours.toFixed(1)}</span>
            <span className="sd-bignum-unit">total hrs</span>
          </div>
          <div style={{ marginTop: 6, color: 'var(--gk-ink-3)', fontSize: 12 }}>
            Since {USER.joined} · level {USER.level}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCell label="Today" val={USER.hoursToday.toFixed(1)} unit="hrs" />
            <StatCell label="Streak" val={`${USER.streak}`} unit="days" />
            <StatCell label="This week" val={`${USER.hoursWeek}`} unit="hrs" />
            <StatCell label="Per day avg" val="1.2" unit="hrs" />
          </div>
        </div>

        {/* Calendar — 3 months */}
        <div style={{ padding: '0 20px 8px' }}>
          <div className="sd-section-head">
            <span className="sd-section-title">Calendar</span>
            <span className="sd-section-why">tap a day for a breakdown</span>
          </div>

          {/* DOW header (one) */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
            marginBottom: 8,
          }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="gk-mono" style={{
                fontSize: 9, color: 'var(--gk-ink-4)', letterSpacing: '0.04em',
                textAlign: 'center',
              }}>{d}</div>
            ))}
          </div>

          {months.map((mo, i) => {
            const days = buildMonth(mo);
            return (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'var(--gk-serif)', fontSize: 16,
                    fontStyle: 'italic',
                  }}>{mo.name} {mo.y}</span>
                  <span className="gk-mono" style={{ fontSize: 10, color: 'var(--gk-ink-4)', letterSpacing: '0.04em' }}>
                    {days.filter(d => d && d.hours > 0).length} days · {days.reduce((a, d) => a + (d?.hours || 0), 0).toFixed(1)}h
                  </span>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
                }}>
                  {days.map((day, di) => {
                    if (!day) return <div key={di} />;
                    const isToday = day.key === todayKey;
                    const hours = day.hours;
                    const lvl = cellLevel(hours);
                    return (
                      <div key={di} style={{
                        position: 'relative',
                        aspectRatio: 1,
                        borderRadius: 4,
                        border: isToday ? '1.5px solid var(--gk-ink)' : '1px solid transparent',
                        background: hours > 0
                          ? `var(--gk-accent)`
                          : 'var(--gk-paper-2)',
                        opacity: hours > 0 ? Math.max(0.18, Math.min(1, 0.18 + hours * 0.4)) : 1,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                        padding: '2px 4px',
                        cursor: 'pointer',
                      }} title={hours ? `${hours}h` : 'rest'}>
                        <span className="gk-mono" style={{
                          fontSize: 9,
                          color: hours > 0.5 ? 'var(--gk-paper)' : 'var(--gk-ink-4)',
                          opacity: 0.85,
                          letterSpacing: '-0.02em',
                        }}>{day.d}</span>
                        {isToday && (
                          <span style={{
                            position: 'absolute', bottom: 3, left: 4,
                            width: 4, height: 4, borderRadius: 2,
                            background: 'var(--gk-ink)',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6,
            marginTop: -4, marginBottom: 14,
          }}>
            <span className="gk-mono" style={{ fontSize: 9, color: 'var(--gk-ink-4)' }}>0h</span>
            {[0.18, 0.4, 0.6, 0.8, 1].map((o, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: 3,
                background: 'var(--gk-accent)', opacity: o,
              }} />
            ))}
            <span className="gk-mono" style={{ fontSize: 9, color: 'var(--gk-ink-4)' }}>2h+</span>
          </div>
        </div>

        <SdMiniPlayer onOpen={onOpenPlayer} playing={playing} onTogglePlay={onTogglePlay} />
        <div style={{ height: 4 }} />
      </div>

      <SdTabbar active="hours" onChange={onNav} platform={platform} />
    </div>
  );
}

function StatCell({ label, val, unit }) {
  return (
    <div style={{
      padding: 12,
      background: 'var(--gk-paper-2)',
      border: '1px solid var(--gk-hair)',
      borderRadius: 8,
    }}>
      <div className="sd-marker" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="sd-num" style={{ fontSize: 22 }}>{val}</span>
        <span className="gk-mono" style={{ fontSize: 9, color: 'var(--gk-ink-4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{unit}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 5. SETTINGS SCREEN — account / preferences / misc
// ═════════════════════════════════════════════════════════════
function SettingsScreen({ platform, onNav }) {
  const { USER } = window.SADDLE_DATA;

  return (
    <div className="sd-app">
      <div className="gk-scroll" style={{ flex: 1 }}>
        <SdTopSpacer platform={platform} />

        <div style={{ padding: '0 20px 16px' }}>
          <div className="sd-marker">Account</div>
        </div>

        {/* Profile card */}
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{
            padding: 16,
            background: 'var(--gk-paper-2)',
            border: '1px solid var(--gk-hair)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div className="sd-portrait" style={{ width: 56, height: 56 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{USER.name}</div>
              <div style={{ color: 'var(--gk-ink-3)', fontSize: 12, marginTop: 2 }}>
                Level {USER.level} · joined {USER.joined}
              </div>
              <div className="gk-mono" style={{
                marginTop: 6, fontSize: 9, color: 'var(--gk-ink-4)',
                letterSpacing: '0.04em',
              }}>
                {USER.totalHours.toFixed(1)} TOTAL HRS · {USER.streak}-DAY STREAK
              </div>
            </div>
            <button style={{
              background: 'transparent', border: '1px solid var(--gk-hair)',
              borderRadius: 6, padding: '6px 10px',
              fontFamily: 'var(--gk-mono)', fontSize: 10,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', color: 'var(--gk-ink)',
            }}>Edit</button>
          </div>
        </div>

        {/* Goals */}
        <SettingsGroup title="Practice goals">
          <SettingsRow label="Daily target" value="2.0 hrs" />
          <SettingsRow label="Weekly target" value="10 hrs" />
          <SettingsRow label="Drill reps default" value="5" />
          <SettingsRow label="Streak protection" value="2 / month" />
        </SettingsGroup>

        {/* Listening */}
        <SettingsGroup title="Listening">
          <SettingsRow label="Default playback speed" value="1.0×" />
          <SettingsRow label="Skip silence" toggle on />
          <SettingsRow label="Hands-free wake word" value="“saddle”" />
          <SettingsRow label="Auto-pause when speaking" toggle on />
          <SettingsRow label="Sleep timer" value="Off" />
        </SettingsGroup>

        {/* AI Companion */}
        <SettingsGroup title="AI Companion">
          <SettingsRow label="Voice" value="Iris · neutral" />
          <SettingsRow label="Explanation depth" value="Concise" />
          <SettingsRow label="Translate to" value="Off" />
          <SettingsRow label="Save AI threads" toggle on />
        </SettingsGroup>

        {/* Curiosity */}
        <SettingsGroup title="Curiosity">
          <SettingsRow label="Manage interests" value="6 active" chevron onClick={() => onNav('library')} />
          <SettingsRow label="Source filters" value="Long-form only" />
          <SettingsRow label="Languages" value="English only" />
        </SettingsGroup>

        {/* Notifications */}
        <SettingsGroup title="Notifications">
          <SettingsRow label="Daily reminder" value="07:30" />
          <SettingsRow label="Streak alerts" toggle on />
          <SettingsRow label="New episodes from masters" toggle on />
          <SettingsRow label="Weekly summary" toggle />
        </SettingsGroup>

        {/* Data */}
        <SettingsGroup title="Data &amp; privacy">
          <SettingsRow label="Export listening history" chevron />
          <SettingsRow label="Clear AI thread history" chevron />
          <SettingsRow label="Privacy policy" chevron />
          <SettingsRow label="Terms" chevron />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title="About">
          <SettingsRow label="Version" value="0.4.2 · prototype" />
          <SettingsRow label="Send feedback" chevron />
          <SettingsRow label="Sign out" danger />
        </SettingsGroup>

        <div style={{ padding: '8px 20px 24px', textAlign: 'center' }}>
          <div className="gk-mono" style={{ fontSize: 9, color: 'var(--gk-ink-4)', letterSpacing: '0.06em' }}>
            SADDLE · WORK HARD NOW, LISTEN SMART LATER
          </div>
        </div>
      </div>

      <SdTabbar active="settings" onChange={onNav} platform={platform} />
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ padding: '0 20px 18px' }}>
      <div className="sd-marker" style={{ marginBottom: 8 }}>{title}</div>
      <div style={{
        background: 'var(--gk-paper-2)',
        border: '1px solid var(--gk-hair)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, value, toggle, on, chevron, danger, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderTop: '1px solid var(--gk-hair-2)',
      cursor: onClick || chevron ? 'pointer' : 'default',
    }}>
      <span style={{
        fontSize: 13.5, color: danger ? 'var(--gk-negative)' : 'var(--gk-ink)',
        flex: 1,
      }}>{label}</span>
      {value && (
        <span style={{
          fontSize: 12, color: 'var(--gk-ink-3)',
          fontFamily: typeof value === 'string' && /\d|×|"/.test(value) ? 'var(--gk-mono)' : 'inherit',
        }}>{value}</span>
      )}
      {toggle && (
        <div style={{
          width: 36, height: 22, borderRadius: 11,
          background: on ? 'var(--gk-ink)' : 'var(--gk-hair)',
          position: 'relative',
          transition: 'background 0.2s ease',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: on ? 16 : 2,
            width: 18, height: 18, borderRadius: 9,
            background: 'var(--gk-paper)',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }} />
        </div>
      )}
      {chevron && <span style={{ color: 'var(--gk-ink-4)', fontSize: 14 }}>›</span>}
    </div>
  );
}

Object.assign(window, {
  TodayScreen, LibraryScreen, SavedScreen, HoursScreen, SettingsScreen,
  SdTabbar, SdMiniPlayer, SdTopSpacer, ListenCard, fmtTime,
});
