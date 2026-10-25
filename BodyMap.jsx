import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown, X } from 'lucide-react';
import { BODY_AREAS, BODY_VIEWS } from './bodyAreas';
import { OUT, HEAD, HEAD_LINES, MIRROR, shapesFor } from './bodyFigure';
import './bodymap.css';

// Side 'a' is the half drawn on the left of the picture, 'b' the mirrored half.
// In the front view the left of the picture is the person's right side; in the back view it is their left.
const sideName = (view, side) => ((view === 'front') === (side === 'a') ? 'right' : 'left');

function Pair({ d, className }) {
  return (
    <>
      <path d={d} className={className} data-s="a" />
      <path d={d} className={className} data-s="b" transform={MIRROR} />
    </>
  );
}

function Region({ area, side, view, selected, interactive, onPick }) {
  const label = area.central ? area.label : `${area.label}, ${sideName(view, side)} side`;
  const cls = `bm-region${selected ? ' is-selected' : ''}`;
  const paths = area.parts.flatMap((part) => {
    const { m, d } = shapesFor(part, view);
    return [
      ...m.map((p, i) => ({ p, c: 'bm-m', k: `${part}m${i}` })),
      ...d.map((p, i) => ({ p, c: 'bm-d', k: `${part}d${i}` })),
    ];
  });
  const draw = (s) => paths.map(({ p, c, k }) => <path key={k + s} d={p} className={c} transform={s === 'b' ? MIRROR : undefined} />);
  const props = interactive
    ? { role: 'button', tabIndex: 0, 'aria-label': label, 'aria-pressed': selected, onClick: () => onPick(area, side), onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(area, side); } } }
    : { 'aria-hidden': true };
  return (
    <g className={cls} data-area={area.id} data-side={area.central ? 'both' : side} {...props}>
      {area.central ? <>{draw('a')}{draw('b')}</> : draw(side)}
    </g>
  );
}

function Figure({ view, selectedId, side, interactive, onPick }) {
  const areas = BODY_AREAS.filter((a) => a.views.includes(view));
  return (
    <>
      <g aria-hidden="true">
        <Pair d={OUT} className="bm-base" />
        <Pair d={HEAD} className="bm-base" />
        {HEAD_LINES.map((d) => <Pair key={d} d={d} className="bm-d" />)}
      </g>
      {areas.flatMap((area) => (area.central ? ['a'] : ['a', 'b']).map((s) => (
        <Region key={area.id + s} area={area} side={s} view={view} interactive={interactive} onPick={onPick}
          selected={selectedId === area.id && (area.central || side === s)} />
      )))}
    </>
  );
}

// Zooms the picture into the chosen area when the detail card opens.
function ZoomFigure({ view, area, side }) {
  const ref = useRef(null);
  const [box, setBox] = useState('0 0 200 400');
  useEffect(() => {
    const g = ref.current && ref.current.querySelector('.is-selected');
    if (!g) return undefined;
    let target;
    try {
      const b = g.getBBox();
      const pad = 22, w = Math.max(b.width + pad * 2, 80), h = Math.max(b.height + pad * 2, 100);
      target = [b.x + b.width / 2 - w / 2, b.y + b.height / 2 - h / 2, w, h];
    } catch { return undefined; }
    const from = [0, 0, 200, 400];
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setBox(target.join(' ')); return undefined; }
    let raf; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 750), e = 1 - Math.pow(1 - p, 3);
      setBox(from.map((v, i) => v + (target[i] - v) * e).join(' '));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [area.id, side, view]);
  return (
    <svg ref={ref} className="bm-zoom-svg" viewBox={box} aria-hidden="true">
      <Figure view={view} selectedId={area.id} side={side} interactive={false} />
    </svg>
  );
}

export default function BodyMap({ onFind }) {
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const [side, setSide] = useState('a');
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const timer = useRef(null);
  const closeBtn = useRef(null);
  const dialogRef = useRef(null);
  const returnTo = useRef(null);
  const selected = BODY_AREAS.find((a) => a.id === selectedId) || null;

  const openPopup = () => {
    clearTimeout(timer.current);
    if (!mounted) returnTo.current = document.activeElement;
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  };
  // restore = false when focus is about to move elsewhere (for example into the Get started dialog).
  const closePopup = (restore = true) => {
    setShown(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMounted(false);
      const el = returnTo.current;
      returnTo.current = null;
      if (restore && el && el.focus) requestAnimationFrame(() => { if (el.isConnected) el.focus(); });
    }, 350);
  };
  // Keep Tab and Shift+Tab inside the open dialog.
  const trapTab = (e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const nodes = [...dialogRef.current.querySelectorAll('button:not([disabled]), summary')];
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (area, s = 'a') => {
    setSelectedId(area.id);
    setSide(s);
    if (!area.views.includes(view)) setView(area.views[0]);
    openPopup();
  };

  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (shown && closeBtn.current) closeBtn.current.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [mounted, shown]);

  const zoomView = selected && !selected.views.includes(view) ? selected.views[0] : view;
  const find = () => { closePopup(false); if (onFind) onFind(selected); };

  return (
    <section className="section bodymap-section" id="body-guide" aria-labelledby="bodymap-title">
      <div className="wrap" inert={mounted}>
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
            <svg className="bm-svg" viewBox="0 0 200 400" role="group" aria-label={`Body diagram, ${view} view`}>
              <Figure view={view} selectedId={selectedId} side={side} interactive onPick={choose} />
            </svg>
            <p className="bm-hint">Tap the body, or pick an area from the list.</p>
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
              <h3>{selected ? selected.label : 'Choose an area to begin'}</h3>
              <p>{selected
                ? 'Open the details again to read common causes and when to see a doctor.'
                : 'You will see common causes of pain there, and when it is best to see a doctor rather than wait.'}</p>
              {selected && !mounted && (
                <button type="button" className="outline-btn bm-reopen" onClick={openPopup}>View {selected.label.toLowerCase()} details</button>
              )}
            </div>
            <p className="bm-disclaimer">General information only. It cannot tell you what is causing your pain. A physiotherapist or doctor needs to assess you in person.</p>
          </div>
        </div>
      </div>

      {mounted && selected && (
        <div className={`bm-pop${shown ? ' is-open' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) closePopup(); }}>
          <div className="bm-card" role="dialog" aria-modal="true" aria-labelledby="bm-pop-title" ref={dialogRef} onKeyDown={trapTab}>
            <button type="button" className="bm-x" ref={closeBtn} onClick={() => closePopup()} aria-label="Close details"><X size={18} /></button>
            <div className="bm-zoom"><ZoomFigure view={zoomView} area={selected} side={side} /></div>
            <div className="bm-info">
              <h3 id="bm-pop-title" className="bm-panel-title">{selected.label}</h3>
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
              <button type="button" className="btn btn-primary bm-cta" onClick={find}>
                Find a physio for {selected.label.toLowerCase()} pain <ArrowRight size={16} />
              </button>
              <p className="bm-disclaimer">General information only, not a diagnosis.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
