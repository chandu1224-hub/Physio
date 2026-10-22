import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { searchPlaces } from "../lib/geocode";
import "./nearby.css";

// Type-ahead location box. Calls onSelect({label, lat, lng}) when a suggestion is chosen.
export default function PlaceSearch({ value = "", placeholder = "Search your area", onSelect, clearOnSelect = false, autoFocus = false }) {
  const [text, setText] = useState(value);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const boxRef = useRef(null);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    if (text.trim().length < 3) { setItems([]); setEmpty(false); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await searchPlaces(text, ctrl.signal);
        setItems(res);
        setEmpty(res.length === 0);
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") { setItems([]); setEmpty(true); }
      }
      setBusy(false);
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text]);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(p) {
    skip.current = true;
    setText(clearOnSelect ? "" : p.label);
    setItems([]);
    setOpen(false);
    onSelect && onSelect(p);
  }

  return (
    <div className="ps-box" ref={boxRef}>
      <MapPin size={16} className="ps-icon" />
      <input
        className="ps-input"
        type="text"
        value={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); if (items[0]) choose(items[0]); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (busy || items.length > 0 || empty) && (
        <ul className="ps-list" role="listbox">
          {busy && items.length === 0 && <li className="ps-note">Searching</li>}
          {items.map((p) => (
            <li key={p.label + p.lat}>
              <button type="button" className="ps-item" onMouseDown={(e) => { e.preventDefault(); choose(p); }}>{p.label}</button>
            </li>
          ))}
          {!busy && empty && <li className="ps-note">No places found. Try a nearby landmark or area name.</li>}
        </ul>
      )}
    </div>
  );
}
