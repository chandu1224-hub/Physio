import { useCallback, useEffect, useRef, useState } from "react";
import { X, MapPin, MessageCircle, Star, Clock3, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { normalizeDoctor } from "../hooks/useDoctors";
import PlaceSearch from "./PlaceSearch";
import "./nearby.css";

const WA_NUMBER = "917795855640";
const OPEN_EVENT = "open-nearby-finder";

const waLink = (doc, area) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi Physio at Home! I'd like to request a session with ${doc.name}.\nMy area: ${area}`
  )}`;

// Search box shown next to the "Find nearby physio" button.
export function HeroLocationBox() {
  return (
    <div className="nf-hero">
      <PlaceSearch
        placeholder="Find physio at your location"
        clearOnSelect
        onSelect={(place) => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { place } }))}
      />
    </div>
  );
}

export default function NearbyFinder() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("locating"); // locating | searching | results | none | ask | error
  const [place, setPlace] = useState(null);
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const run = useRef(0);

  const search = useCallback(async (p) => {
    const id = ++run.current;
    setPlace(p);
    setStage("searching");
    setErr("");
    const { data, error } = await supabase.rpc("physios_near", { user_lat: p.lat, user_lng: p.lng });
    if (id !== run.current) return;
    if (error) { setErr(error.message); setStage("error"); return; }
    const rows = Array.isArray(data) ? data : [];
    const docs = rows.map((r, i) => ({
      ...normalizeDoctor(r, i),
      distance: `${Number(r.distance_km).toFixed(1)} km away`,
    }));
    setList(docs);
    setStage(docs.length ? "results" : "none");
  }, []);

  const locate = useCallback(() => {
    const id = ++run.current;
    setStage("locating");
    setPlace(null);
    if (!navigator.geolocation) { setStage("ask"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== run.current) return;
        search({ label: "your current location", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { if (id === run.current) setStage("ask"); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [search]);

  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true);
      const p = e.detail && e.detail.place;
      if (p) search(p); else locate();
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [search, locate]);

  const close = useCallback(() => { run.current++; setOpen(false); }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, close]);

  if (!open) return null;

  const area = place ? place.label : "your area";
  const busy = stage === "locating" || stage === "searching";

  return (
    <div className="nf-overlay" role="dialog" aria-modal="true" onClick={close}>
      <div className="nf-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="nf-head">
          <div>
            <h2>
              {stage === "results" ? `${list.length} physio${list.length === 1 ? "" : "s"} available near you`
                : stage === "none" ? "Sorry, no service available"
                : busy ? "Finding physios near you"
                : "Find physio at your location"}
            </h2>
            {stage === "results" && <p className="nf-sub">Showing physios who serve {area}.</p>}
            {stage === "none" && <p className="nf-sub">We don't have a physiotherapist covering {area} yet. Try another location below.</p>}
            {stage === "ask" && <p className="nf-sub">We couldn't read your location. Type your area, street or landmark below.</p>}
            {stage === "error" && <p className="nf-sub nf-bad">Something went wrong: {err}</p>}
          </div>
          <button className="nf-x" onClick={close} aria-label="Close"><X size={20} /></button>
        </div>

        {busy && (
          <div className="nf-busy">
            <Loader2 className="nf-spin" size={28} />
            <p>{stage === "locating" ? "Checking your location. Allow access if your browser asks." : `Searching near ${area}`}</p>
          </div>
        )}

        {stage === "results" && (
          <div className="nf-list">
            {list.map((d) => (
              <article className="nf-card" key={d.id}>
                <div className="nf-card-top">
                  <div className="nf-avatar">{d.initials}</div>
                  <div className="nf-card-main">
                    <h3>{d.name}</h3>
                    <p>{[d.title, d.degree].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="nf-dist"><MapPin size={13} /> {d.distance}</span>
                </div>
                <div className="nf-meta">
                  {d.rating && <span><Star size={14} fill="currentColor" /> {d.rating}</span>}
                  {d.experience && <span><Clock3 size={14} /> {d.experience}</span>}
                  {d.price > 0 && <span>From ₹{d.price} / session</span>}
                </div>
                {d.specialties.length > 0 && (
                  <div className="nf-tags">{d.specialties.map((s) => <span key={s}>{s}</span>)}</div>
                )}
                <a className="nf-btn" href={waLink(d, area)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> Request on WhatsApp
                </a>
              </article>
            ))}
          </div>
        )}

        {!busy && (
          <div className="nf-search">
            <label>{stage === "results" ? "Search another location" : "Search your location"}</label>
            <PlaceSearch placeholder="Type area, street or landmark" autoFocus={stage !== "results"} onSelect={search} />
            <button className="nf-link" onClick={locate}>Use my current location</button>
          </div>
        )}
      </div>
    </div>
  );
}
