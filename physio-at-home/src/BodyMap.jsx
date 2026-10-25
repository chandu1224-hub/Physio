import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import { BODY_AREAS, BODY_VIEWS } from './bodyAreas';
import './bodymap.css';

export default function BodyMap({ onFind }) {
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const selected = BODY_AREAS.find((area) => area.id === selectedId) || null;

  const choose = (area) => {
    setSelectedId(area.id);
    if (!area.views.includes(view)) setView(area.views[0]);
  };

  const onRegionKey = (event, area) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(area);
    }
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

            <div className="bm-image-stage">
              <img
                className="bm-anatomy-image"
                src={view === 'front' ? '/images/anatomy-front.jpg' : '/images/anatomy-back.jpg'}
                alt={view === 'front' ? 'Grey anatomical mannequin, front view' : 'Grey anatomical mannequin, back view'}
                draggable="false"
              />
              <svg className="bm-svg" viewBox="0 0 200 300" role="group" aria-label={`Interactive body map, ${view} view`} preserveAspectRatio="none">
                <g transform="scale(1 0.7142857)">
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
                </g>
              </svg>
            </div>
            <p className="bm-hint">Tap a body area to highlight it in red, or choose one from the list.</p>
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
