import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import { BODY_AREAS, BODY_VIEWS } from './bodyAreas';
import './bodymap.css';

// Lightweight SVG illustration: a dimensional, contour-line anatomical figure.
// Kept inline so it loads reliably without an external image host; pain regions remain interactive.
function Figure({ view }) {
  const back = view === 'back';
  return (
    <g className={`bm-figure ${back ? 'bm-figure-back' : 'bm-figure-front'}`} aria-hidden="true">
      <defs>
        <linearGradient id="bm-skin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#344b3d" />
          <stop offset="27%" stopColor="#8ba995" />
          <stop offset="52%" stopColor="#d0e1d4" />
          <stop offset="76%" stopColor="#789987" />
          <stop offset="100%" stopColor="#2c4436" />
        </linearGradient>
        <linearGradient id="bm-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4e4d8" stopOpacity=".4" />
          <stop offset="100%" stopColor="#14261b" stopOpacity=".2" />
        </linearGradient>
        <clipPath id="bm-body-clip">
          <path d="M88 47 C83 40 82 30 84 20 C86 9 93 4 100 4 C108 4 115 10 117 21 C119 31 117 41 112 47 L113 60 C120 66 130 70 141 75 C151 80 157 92 159 107 L169 145 C171 154 168 163 163 164 C158 165 155 158 153 150 L143 116 L137 103 C140 126 140 147 135 166 C132 180 129 190 132 205 L139 249 C141 262 137 275 134 288 L130 326 C129 344 132 361 136 377 L139 397 C140 403 136 407 129 407 L113 407 C108 405 108 401 110 396 L114 376 C116 358 113 343 109 327 L101 290 L96 253 L91 290 L83 327 C79 343 76 358 78 376 L82 396 C84 401 82 405 77 407 L61 407 C54 407 50 403 51 397 L54 377 C58 361 61 344 60 326 L56 288 C53 275 49 262 51 249 L58 205 C61 190 58 180 55 166 C50 147 50 126 53 103 L47 116 L37 150 C35 158 32 165 27 164 C22 163 19 154 21 145 L31 107 C33 92 39 80 49 75 C60 70 70 66 77 60 L78 47 Z" />
        </clipPath>
      </defs>
      <path className="bm-silhouette" d="M88 47 C83 40 82 30 84 20 C86 9 93 4 100 4 C108 4 115 10 117 21 C119 31 117 41 112 47 L113 60 C120 66 130 70 141 75 C151 80 157 92 159 107 L169 145 C171 154 168 163 163 164 C158 165 155 158 153 150 L143 116 L137 103 C140 126 140 147 135 166 C132 180 129 190 132 205 L139 249 C141 262 137 275 134 288 L130 326 C129 344 132 361 136 377 L139 397 C140 403 136 407 129 407 L113 407 C108 405 108 401 110 396 L114 376 C116 358 113 343 109 327 L101 290 L96 253 L91 290 L83 327 C79 343 76 358 78 376 L82 396 C84 401 82 405 77 407 L61 407 C54 407 50 403 51 397 L54 377 C58 361 61 344 60 326 L56 288 C53 275 49 262 51 249 L58 205 C61 190 58 180 55 166 C50 147 50 126 53 103 L47 116 L37 150 C35 158 32 165 27 164 C22 163 19 154 21 145 L31 107 C33 92 39 80 49 75 C60 70 70 66 77 60 L78 47 Z" fill="url(#bm-skin)" stroke="#b6d0bf" strokeWidth=".8" />
      <path d="M88 47 Q100 54 112 47 M78 60 Q100 75 122 60 M49 75 Q65 81 72 96 M151 75 Q135 81 128 96 M57 104 Q70 119 72 143 M143 104 Q130 119 128 143 M74 78 Q100 91 126 78 M73 98 Q100 111 127 98 M74 119 Q100 132 126 119 M76 141 Q100 151 124 141 M78 163 Q100 173 122 163 M79 184 Q100 191 121 184 M78 205 Q100 214 122 205 M69 226 Q83 236 96 234 M131 226 Q117 236 104 234 M63 252 Q77 264 88 259 M137 252 Q123 264 112 259 M64 278 Q77 286 87 280 M136 278 Q123 286 113 280 M66 303 Q78 311 86 305 M134 303 Q122 311 114 305 M68 329 Q78 336 84 329 M132 329 Q122 336 116 329 M70 352 Q78 359 82 351 M130 352 Q122 359 118 351 M72 374 Q78 380 80 373 M128 374 Q122 380 120 373" fill="none" stroke="#d8e8dc" strokeOpacity=".72" strokeWidth=".8" />
      <g clipPath="url(#bm-body-clip)" className="bm-contours">
        {Array.from({ length: 29 }, (_, i) => {
          const y = 68 + i * 11;
          const inset = Math.sin(i * 0.58) * 5;
          return <path key={i} d={`M${28 + inset} ${y} C58 ${y - 10} 72 ${y + 7} 100 ${y + 1} S142 ${y - 8} ${172 - inset} ${y + 2}`} />;
        })}
        <path d="M100 65 C95 104 105 133 99 167 S104 222 100 258 S104 321 100 389" className="bm-spine" />
        <path d="M81 71 C68 98 83 123 78 150 S84 187 79 210 M119 71 C132 98 117 123 122 150 S116 187 121 210" />
        {back ? (
          <>
            <path d="M63 84 Q100 119 137 84 M67 96 Q100 132 133 96 M70 110 Q100 144 130 110 M73 126 Q100 156 127 126 M76 143 Q100 167 124 143 M79 160 Q100 177 121 160" />
            <path d="M76 177 Q100 192 124 177 M76 190 Q100 205 124 190 M77 205 Q100 220 123 205 M68 214 Q100 242 132 214 M64 231 Q100 259 136 231" />
          </>
        ) : (
          <>
            <path d="M79 80 Q100 98 121 80 M73 91 Q87 108 96 109 M127 91 Q113 108 104 109 M73 105 Q85 121 96 122 M127 105 Q115 121 104 122" />
            <path d="M78 128 Q100 143 122 128 M79 143 Q100 157 121 143 M80 158 Q100 172 120 158 M81 174 Q100 186 119 174 M82 190 Q100 200 118 190" />
          </>
        )}
      </g>
      <path className="bm-centerline" d={back ? "M100 62 L100 222" : "M100 64 L100 201"} />
    </g>
  );
}

export default function BodyMap({ onFind }) {
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const selected = BODY_AREAS.find((area) => area.id === selectedId) || null;

  const choose = (area) => {
    setSelectedId(area.id);
    if (!area.views.includes(view)) setView(area.views[0]);
  };

  const onRegionKey = (event, area) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(area); }
  };

  return (
    <section className="section bodymap-section" id="body-guide" aria-labelledby="bodymap-title">
      <div className="wrap">
        <div className="section-intro">
          <span className="section-kicker">UNDERSTAND YOUR PAIN</span>
          <h2 id="bodymap-title">Start with the spot<br /><em>that bothers you.</em></h2>
          <p>Choose a body area to read about common reasons it can hurt, in plain language. This is general information to help you describe your problem, not a diagnosis.</p>
        </div>

        <div className="bm-layout">
          <div className="bm-figure-card">
            <div className="bm-toggle" role="group" aria-label="Body view">
              {BODY_VIEWS.map((v) => (
                <button type="button" key={v} className={view === v ? 'is-active' : ''} aria-pressed={view === v} onClick={() => setView(v)}>
                  {v === 'front' ? 'Front' : 'Back'}
                </button>
              ))}
            </div>
            <svg className="bm-svg" viewBox="0 0 200 420" role="group" aria-label={`Body diagram, ${view} view`}>
              <Figure view={view} />
              {BODY_AREAS.filter((area) => area.views.includes(view)).map((area) => (
                <g
                  key={area.id}
                  className={selectedId === area.id ? 'bm-region is-selected' : 'bm-region'}
                  role="button"
                  tabIndex={0}
                  aria-label={area.label}
                  aria-pressed={selectedId === area.id}
                  onClick={() => choose(area)}
                  onKeyDown={(e) => onRegionKey(e, area)}
                >
                  {area.shapes.map((shape, i) => {
                    const { t, ...attrs } = shape;
                    return React.createElement(t, { key: i, ...attrs });
                  })}
                </g>
              ))}
            </svg>
            <p className="bm-hint">Tap a highlighted area, or pick one from the list.</p>
          </div>

          <div className="bm-detail">
            <div className="bm-chips" role="group" aria-label="Body areas">
              {BODY_AREAS.map((area) => (
                <button type="button" key={area.id} className={selectedId === area.id ? 'bm-chip is-selected' : 'bm-chip'} aria-pressed={selectedId === area.id} onClick={() => choose(area)}>
                  {area.label}
                </button>
              ))}
            </div>

            <div className="bm-panel" aria-live="polite">
              {!selected && (
                <div className="bm-empty">
                  <h3>Choose an area to begin</h3>
                  <p>You will see common causes of pain there, and when it is best to see a doctor rather than wait.</p>
                </div>
              )}
              {selected && (
                <>
                  <h3 className="bm-panel-title">{selected.label}</h3>
                  <p className="bm-panel-sub">Common reasons for pain here</p>
                  <div className="bm-conditions">
                    {selected.conditions.map((c) => (
                      <details key={c.name} className="bm-condition">
                        <summary><span>{c.name}</span><ChevronDown size={16} aria-hidden="true" /></summary>
                        <p>{c.meaning}</p>
                      </details>
                    ))}
                  </div>
                  <div className="bm-alert" role="note">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <p><strong>See a doctor promptly if you have:</strong> {selected.seekCare}</p>
                  </div>
                  <button type="button" className="btn btn-primary bm-cta" onClick={onFind}>
                    Find a physio near you <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
            <p className="bm-disclaimer">General information only. It cannot tell you what is causing your pain. A physiotherapist or doctor needs to assess you in person.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
