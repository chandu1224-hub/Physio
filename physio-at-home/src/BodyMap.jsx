import React, { useEffect, useMemo, useRef, useState } from 'react';
import './bodymap.css';

const MIR = 'translate(200 0) scale(-1 1)';
const OUT = 'M92 54L90 58Q78 62 66 66Q54 68 52 84Q51 112 51 140Q50 170 51 198Q42 212 39 232Q40 246 48 247Q58 246 59 232L59 210L59 198Q62 176 66 158L69 142Q72 124 71 106Q73 124 78 140L77 150Q74 165 74 180Q70 230 73 262Q72 280 74 292Q71 320 77 350L78 366Q73 380 73 390Q80 398 92 395L94 378L93 360Q97 320 97 296Q98 275 97 262Q99 225 100 190L100 54Z';
const HEAD = 'M100 9C90 9 84 17 84.5 28C85 36 88 43 92 47L92 54L100 54Z';
const HEADD = ['M85 24Q92 14 100 13', 'M91 47Q96 50 100 50', 'M83.5 26Q81 30 84 36'];

const S = {
 neck:{m:['M93 52L99 60L100 74L96 70Q92 62 90 58Z','M90 58Q80 62 68 67L74 74Q86 70 96 70Z'],d:['M90 58Q94 64 96 70']},
 shoulder:{m:['M66 66Q54 68 52 84Q51 94 54 101L68 97Q72 82 74 72Z'],d:['M62 70Q58 84 58 98','M68 72Q64 86 63 98']},
 chest:{m:['M74 73Q86 70 100 75L100 104Q88 110 77 101Q70 90 74 73Z'],d:['M100 82Q88 80 75 84','M100 90Q88 90 74 92','M100 98Q89 100 78 99','M100 76Q90 78 82 86']},
 abdomen:{m:['M76 106Q86 112 91 110L91 151L85 152Q78 130 76 106Z','M92.5 108h7.5v12h-7.5z','M92.5 122h7.5v12h-7.5z','M92.5 136h7.5v12h-7.5z','M92.5 150h7.5v10h-7.5z'],d:['M78 112Q84 116 89 116','M78 122Q84 126 89 126','M78 132Q83 136 88 136']},
 upperarm:{m:['M60 101Q66 98 70 102Q71 120 68 139L61 139Q59 120 60 101Z','M52 103Q56 100 60 102Q58 120 61 139L52 139Q49 120 52 103Z'],d:['M65 106Q66 120 65 134']},
 elbow:{m:['M51 140L69 140L67 154L50 154Z'],d:['M56 144Q60 148 64 144']},
 forearm:{m:['M50 154L59 154Q59 176 56 198L52 198Q49 176 50 154Z','M60 154L67 154Q65 176 58 199L57 198Q61 176 60 154Z'],d:['M55 160Q56 178 54 194','M63 160Q62 176 59 192']},
 wrist:{m:['M52 199L59 200L59 208L52 208Z'],d:['M52 203L59 204']},
 hand:{m:['M51 209L59 210Q61 222 59 236Q57 246 48 246Q39 244 39 232Q41 218 51 209Z'],d:['M56 214Q54 226 55 238','M49 214Q46 228 46 240']},
 hip:{m:['M78 156Q90 158 100 160L100 188Q88 180 78 174Q74 164 78 156Z'],d:['M78 158Q86 162 94 170']},
 thigh:{m:['M76 176Q82 178 87 182Q89 220 88 252L74 252Q72 215 76 176Z','M89 184Q94 188 96 192Q96 222 95 252L89 252Q90 220 89 184Z','M97 192L100 190L100 252L96 252Q98 222 97 192Z'],d:['M80 190Q84 220 82 248','M92 200Q93 224 92 248']},
 knee:{m:['M74 253L97 253L96 279L74 279Z'],d:['M80 264Q86 256 92 264Q86 274 80 264Z']},
 calf:{m:['M74 280L86 280Q86 320 84 346L77 346Q73 320 74 280Z','M87 280L96 280Q95 320 90 346L85 346Q88 320 87 280Z'],d:['M80 290Q80 320 80 340']},
 ankle:{m:['M77 347L90 347L91 362L78 362Z'],d:[]},
 foot:{m:['M76 363L93 363L94 380Q92 394 82 394Q73 394 74 382Z'],d:['M82 380L82 392','M88 380L88 391']}
};
const SB = {
 neck:{m:['M93 54L100 52L100 72Q94 70 87 64Z'],d:['M100 56Q94 62 90 68']},
 upperarm:{m:['M52 103Q58 100 66 102Q71 122 68 139L55 139Q49 120 52 103Z'],d:['M62 106Q60 122 62 136']},
 upperback:{m:['M74 90Q84 100 94 114L90 140Q80 132 74 112Q71 100 74 90Z','M86 62L100 58L100 120Q92 114 84 102Q79 84 86 62Z'],d:['M78 78Q90 76 92 84L88 102Q80 100 78 78Z','M100 70Q92 74 86 80']},
 lowerback:{m:['M91 122Q96 120 100 122L100 158Q93 158 90 154Z','M80 128Q86 130 90 134L89 154L82 154Q79 142 80 128Z'],d:['M95 128L95 154']},
 hip:{m:['M78 156Q90 154 100 158L100 194Q90 200 80 192Q72 174 78 156Z'],d:['M78 162Q88 160 94 168','M100 170Q92 182 86 194']},
 thigh:{m:['M75 196Q82 198 90 198Q90 226 88 252L74 252Q71 222 75 196Z','M91 198L100 196Q99 226 97 252L90 252Q92 226 91 198Z'],d:['M82 206Q83 230 81 248','M95 206L94 246']},
 knee:{m:['M74 253L97 253L96 279L74 279Z'],d:['M80 262Q86 270 92 262']},
 calf:{m:['M74 280Q82 278 86 280Q88 310 84 346L77 346Q70 312 74 280Z','M87 280Q94 278 96 280Q97 312 90 346L86 346Q89 312 87 280Z'],d:['M86 322L85 346']}
};

const A = [
 ['neck','Neck','Neck flexors, trapezius','Stiffness or aching, often worse after long hours at a screen.',[['Neck strain','Overworked neck muscles; usually eases with movement and posture changes.'],['Pinched nerve','Pain or tingling that travels into the shoulder or arm.']],
 ['shoulder','Shoulder','Deltoid, rotator cuff','Pain when lifting the arm, reaching or sleeping on that side.',[['Rotator cuff strain','Pain lifting the arm overhead or reaching behind.'],['Frozen shoulder','Gradual stiffness that limits movement in every direction.']]],
 ['chest','Chest','Pectorals, rib muscles','Tightness or soreness in the front of the chest wall.',[['Muscle strain','Sore when breathing deeply or moving the arm.'],['Rib joint irritation','Sharp, localised pain when pressing on the rib joints.']],'front'],
 ['abdomen','Abdomen','Rectus abdominis, obliques','Core and abdominal wall soreness.',[['Core strain','Pain when twisting, sitting up or coughing.'],['Postnatal core weakness','Weak core muscles after pregnancy or surgery.']],'front'],
 ['upperarm','Upper arm','Biceps, triceps','Aching or weakness between the shoulder and elbow.',[['Biceps strain','Pain at the front of the arm when lifting.'],['Triceps tendon pain','Pain at the back of the arm when pushing.']]],
 ['elbow','Elbow','Elbow tendons','Pain on the outer or inner side of the elbow.',[['Tennis elbow','Outer elbow pain when gripping or lifting.'],['Golfer’s elbow','Inner elbow pain when gripping or twisting.']]],
 ['forearm','Forearm','Wrist flexors and extensors','Aching along the forearm, often after repetitive work.',[['Overuse strain','Aching after typing, tools or repeated gripping.'],['Tendon irritation','Pain that builds with repeated wrist movement.']]],
 ['wrist','Wrist','Wrist joint, carpal tunnel','Pain, clicking or tingling at the wrist.',[['Carpal tunnel','Tingling in the thumb, index and middle fingers.'],['Wrist sprain','Pain after a fall or sudden twist.']]],
 ['hand','Hand','Small hand muscles, tendons','Stiffness or pain in the palm and fingers.',[['Trigger finger','A finger that catches or locks when bending.'],['Hand arthritis','Morning stiffness and aching in the joints.']]],
 ['upperback','Upper back','Trapezius, rhomboids','Tightness between the shoulder blades.',[['Postural strain','Aching from long periods sitting or hunching.'],['Muscle knot','A tender, tight spot that limits movement.']],'back'],
 ['lowerback','Lower back','Lumbar muscles, spine','Aching or sharp pain in the lower back.',[['Lumbar strain','Pain after lifting or long sitting; eases with movement.'],['Disc irritation','Back pain that may spread down the leg.']],'back'],
 ['hip','Hip','Hip flexors, glutes','Pain in the hip, groin or buttock.',[['Hip bursitis','Pain on the outer hip, worse lying on that side.'],['Glute strain','Deep buttock pain when climbing or running.']]],
 ['thigh','Thigh','Quadriceps, hamstrings','Pain or tightness in the front or back of the thigh.',[['Hamstring strain','Sudden pain at the back of the thigh when sprinting.'],['Quadriceps strain','Pain at the front of the thigh when kicking or climbing.']]],
 ['knee','Knee','Knee joint, ligaments','Pain, swelling or giving way at the knee.',[['Runner’s knee','Pain around the kneecap, worse on stairs.'],['Ligament sprain','Pain and instability after a twist or impact.']]],
 ['calf','Calf','Gastrocnemius, soleus','Cramping or tightness in the lower leg.',[['Calf strain','Sudden tight pain when pushing off.'],['Shin splints','Aching along the shin when running.']]],
 ['ankle','Ankle','Ankle ligaments, Achilles','Pain or swelling around the ankle.',[['Ankle sprain','Swelling and pain after rolling the ankle.'],['Achilles tendinopathy','Pain at the back of the heel when walking.']]],
 ['foot','Foot','Plantar fascia, toes','Pain in the heel, arch or toes.',[['Plantar fasciitis','Heel pain, worst with the first steps in the morning.'],['Flat foot strain','Arch aching after long standing.']]]
];
const NS = 'http://www.w3.org/2000/svg';
const svgNode = (tag, attrs = {}, children = []) => React.createElement(tag, attrs, ...children);

function BodySvg({ view, selectedId, zoom = false, svgRef, onChoose, viewBox }) {
  const areas = A.filter((a) => !a[5] || a[5] === view);
  return <svg ref={svgRef} className={zoom ? 'svg-body-guide zoom-svg' : 'svg-body-guide'} viewBox={zoom ? viewBox : '0 0 200 400'} role="group" aria-label={zoom ? 'Zoomed body area' : 'Body map'}>
    {[OUT, HEAD].flatMap((d, i) => [<path key={i+'r'} d={d} className="bg-base" />, <path key={i+'l'} d={d} className="bg-base" transform={MIR} />])}
    {HEADD.flatMap((d, i) => [<path key={i+'r'} d={d} className="bg-fibre" />, <path key={i+'l'} d={d} className="bg-fibre" transform={MIR} />])}
    {areas.map((a) => {
      const shape = (view === 'back' && SB[a[0]]) || S[a[0]];
      return <g key={a[0]} className={'bg-area'+(selectedId === a[0] ? ' on' : '')} data-area={a[0]} data-clinical-name={a[2]} aria-label={a[1]} role={zoom ? undefined : 'button'} tabIndex={zoom ? -1 : 0} onClick={zoom ? undefined : (event) => onChoose?.(a[0], event.currentTarget)} onKeyDown={zoom ? undefined : (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChoose?.(a[0], event.currentTarget); } }}>{['m','d'].flatMap((part) => shape[part].flatMap((d, i) => [<path key={part+i+'r'} d={d} className={part === 'm' ? 'bg-muscle' : 'bg-fibre'} />, <path key={part+i+'l'} d={d} className={part === 'm' ? 'bg-muscle' : 'bg-fibre'} transform={MIR} />]))}</g>;
    })}
  </svg>;
}

export default function BodyMap({ onFind }) {
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const [condition, setCondition] = useState(null);
  const [open, setOpen] = useState(false);
  const [zoomBox, setZoomBox] = useState('0 0 200 400');
  const [returnFocus, setReturnFocus] = useState(null);
  const svgRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const selected = A.find((a) => a[0] === selectedId);
  const visibleAreas = useMemo(() => A.filter((a) => !a[5] || a[5] === view), [view]);

  const chooseView = (next) => {
    setView(next);
    if (selectedId) {
      const area = A.find((a) => a[0] === selectedId);
      if (area?.[5] && area[5] !== next) { setSelectedId(null); setCondition(null); }
    }
  };

  const chooseArea = (id, trigger) => {
    const area = A.find((a) => a[0] === id);
    if (!area) return;
    setReturnFocus(trigger || document.activeElement);
    setSelectedId(id);
    setCondition(null);
    setOpen(true);
    const shape = (view === 'back' && SB[id]) || S[id];
    const points = shape.m.map((d) => d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || []).flat();
    if (points.length) {
      const xs = points.filter((_, i) => i % 2 === 0), ys = points.filter((_, i) => i % 2 === 1);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const w = Math.max(maxX - minX + 44, 70), h = Math.max(maxY - minY + 44, 90);
      setZoomBox(`${minX + (maxX-minX)/2 - w/2} ${minY + (maxY-minY)/2 - h/2} ${w} ${h}`);
    }
  };

  const close = () => { setOpen(false); setCondition(null); };

  useEffect(() => {
    if (!open) { returnFocus?.focus?.(); return; }
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab' && dialogRef.current) {
        const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const startSearch = () => {
    if (!selected) return;
    onFind?.({ area: selected[0], label: selected[1], condition: condition?.[0] || null });
    close();
  };

  return <section className="section approved-body-guide" id="body-guide" aria-labelledby="body-guide-title">
    <div className="wrap">
      <h2 id="body-guide-title">Where does it hurt?</h2>
      <p className="bg-subtitle">Tap the body or pick an area, then choose a condition to find physios who treat it.</p>
      <div className="bg-toggle" role="group" aria-label="Body view">
        <button type="button" aria-pressed={view === 'front'} onClick={() => chooseView('front')}>Front</button>
        <button type="button" aria-pressed={view === 'back'} onClick={() => chooseView('back')}>Back</button>
      </div>
      <div className="bg-stage">
        <div className="bg-figure-card">
          <BodySvg view={view} selectedId={selectedId} svgRef={svgRef} onChoose={chooseArea} />
        </div>
        <div className="bg-area-list" role="group" aria-label="Body areas">
          {visibleAreas.map((a) => <button key={a[0]} type="button" aria-current={selectedId === a[0] ? 'true' : undefined} onClick={(e) => chooseArea(a[0], e.currentTarget)}><span className="bg-dot" />{a[1]}</button>)}
        </div>
      </div>
    </div>
    <div className={'bg-popup'+(open ? ' open' : '')} aria-hidden={!open} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-card-wrap">
        <button type="button" className="bg-close" ref={closeRef} onClick={close} aria-label="Close body area details">×</button>
        <div className="bg-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bg-popup-title" tabIndex={-1}>
          <div className="bg-zoom"><BodySvg view={view} selectedId={selectedId} zoom viewBox={zoomBox} /></div>
          <div className="bg-info">
            <h3 id="bg-popup-title">{selected?.[1]}</h3>
            <p className="bg-note">Muscles and structures: {selected?.[2]}</p>
            <p>{selected?.[3]}</p>
            <div className="bg-condition-chips" role="group" aria-label="Conditions">
              {selected?.[4].map((c) => <button type="button" key={c[0]} aria-pressed={condition?.[0] === c[0]} onClick={() => setCondition(c)}>{c[0]}</button>)}
            </div>
            <p className="bg-detail" aria-live="polite">{condition?.[1] || 'Choose the condition that sounds closest.'}</p>
            <button type="button" className="bg-cta" onClick={startSearch}>Find a physio for {selected?.[1]?.toLowerCase()} pain</button>
            <p className="bg-note">General information only, not a diagnosis. See a physiotherapist or doctor if pain is severe, sudden or lasting.</p>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
