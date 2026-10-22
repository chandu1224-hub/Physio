import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { searchPlaces, attribution } from '../lib/places';
import './location-search.css';

// Type-ahead location box (OpenStreetMap data via Photon / Geoapify, no billing).
// Calls onSelect({ label, lat, lng }) with the exact geocode when the user picks a suggestion.
export default function LocationSearch({ label, placeholder = 'Search area, street or landmark', initial = '', autoFocus = false, onSelect }) {
  const id = useId();
  const [text, setText] = useState(initial || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emptyFor, setEmptyFor] = useState('');
  const skip = useRef(false); // don't search when we set the text ourselves

  // keep the box in sync if the parent changes/clears the value
  useEffect(() => {
    const next = initial || '';
    if (next !== text) { skip.current = true; setText(next); }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const q = text.trim();
    setEmptyFor('');
    if (q.length < 3) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const r = await searchPlaces(q, ctrl.signal);
        setItems(r);
        setActive(-1);
        setOpen(true);
        setEmptyFor(r.length === 0 ? q : '');
      } catch (e) {
        if (e.name !== 'AbortError') { console.error(e); setError('Location search is unavailable right now. Please try again in a moment.'); setItems([]); }
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, 350); // gentle on the free services
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text]);

  const choose = (item) => {
    setOpen(false);
    if (item.label !== text) skip.current = true;
    setText(item.label);
    setItems([]);
    onSelect({ label: item.label, lat: item.lat, lng: item.lng });
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && items.length) choose(items[active >= 0 ? active : 0]);
    } else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
  };

  return (
    <div className="ls">
      {label && <label className="ls-label" htmlFor={id}>{label}</label>}
      <div className="ls-box">
        <MapPin size={18} className="ls-icon" aria-hidden="true" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {busy && <span className="ls-spin" aria-hidden="true" />}
      </div>
      {open && items.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="ls-list">
          {items.map((it, i) => (
            <li key={it.id} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
              onMouseDown={(e) => { e.preventDefault(); choose(it); }}>
              <b>{it.main}</b>{it.secondary && <span>{it.secondary}</span>}
            </li>
          ))}
          <li className="ls-attrib" aria-hidden="true">{attribution}</li>
        </ul>
      )}
      {!busy && emptyFor && emptyFor === text.trim() && <p className="ls-note" role="status">No places found. Try a nearby area, a bigger neighbourhood or a landmark.</p>}
      {error && <p className="ls-note ls-err" role="alert">{error}</p>}
    </div>
  );
}
