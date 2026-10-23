import { useEffect, useState, useCallback } from "react";
import { LogOut, Plus, Pencil, Trash2, X, Save, RefreshCw } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./admin.css";

const TABLES = ["physiotherapists", "booking_requests", "therapist_applications"];
const HIDDEN = ["id", "created_at", "updated_at"];
const NUMBER_FIELDS = new Set(["experience_years", "price", "rating", "reviews", "display_order", "service_lat", "service_lng", "service_radius_km"]);
const ARRAY_FIELDS = new Set(["specialties", "conditions", "services", "service_areas", "languages", "gallery_paths"]);
// Known schema lets admins add the first profile without resorting to a raw JSON editor.
const EMPTY_BY_TABLE = {
  booking_requests: {
    id: "", created_at: "", name: "", phone: "", area: "", condition: "",
    care_type: "", preferred_time: "", notes: "", physio_id: "", consent: false, status: "new"
  },
  therapist_applications: {
    id: "", created_at: "", name: "", phone: "", email: "", qualification: "",
    experience_years: null, specialties: "", city: "", reg_no: "", about: "", consent: false, status: "new"
  }
};
const EMPTY_PROFILE = {
  slug: "", name: "", initials: "", title: "Physiotherapist", degree: "",
  experience_years: 0, specialties: [], conditions: [], services: [],
  service_areas: [], languages: [], bio: "", full_bio: "", price: 0,
  availability: "", contact_info: "", rating: 0, reviews: 0, emoji: "🧑‍⚕️",
  color: "sage", photo_path: "", gallery_paths: [], display_order: 0,
  featured: false, status: "draft", published_at: null, service_location: "Bengaluru, Karnataka, India",
  service_lat: null, service_lng: null, service_radius_km: 10
};

function toInput(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fromInput(original, text, field, table) {
  if (typeof original === "boolean" || field === "featured" || field === "consent") return text === true || text === "true";
  if (typeof original === "number" || NUMBER_FIELDS.has(field)) return text === "" ? null : Number(text);
  // Some tables store "specialties" as plain text while provider profiles use arrays.
  const expectsJson = (original !== null && typeof original === "object") || Array.isArray(original) ||
    (ARRAY_FIELDS.has(field) && !(table === "therapist_applications" && field === "specialties"));
  if (expectsJson) {
    if (text === "" && field === "published_at") return null;
    if (text === "") return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(original) && !Array.isArray(parsed)) {
        throw new Error(`Field "${field}" must be a JSON array.`);
      }
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`Field "${field}" must contain valid JSON.`);
      throw error;
    }
  }
  return text === "" ? null : text;
}

function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    if (!isSupabaseConfigured || !supabase) {
      setBusy(false);
      setErr("Admin sign-in is unavailable because Supabase is not configured.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else onDone();
    } catch {
      setErr("Sign-in failed unexpectedly. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-center">
      <form className="ad-login" onSubmit={submit}>
        <h1>Admin sign in</h1>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <p className="ad-err">{err}</p>}
        <button className="ad-btn ad-primary" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
      </form>
    </div>
  );
}

function Editor({ table, columns, row, onClose, onSaved }) {
  const isNew = !row;
  const [values, setValues] = useState(() => {
    const v = {};
    const tableTemplate = EMPTY_BY_TABLE[table] || EMPTY_PROFILE;
    columns.forEach((c) => {
      const template = Object.prototype.hasOwnProperty.call(tableTemplate, c) ? tableTemplate[c] : "";
      v[c] = row ? row[c] : template;
    });
    return v;
  });
  const [raw, setRaw] = useState("{\n  \n}");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  async function lookupLocation() {
    const query = String(values.service_location || "").trim();
    if (!query) { setLocationMessage("Enter an area, city and state in India first."); return; }
    setLocationBusy(true);
    setLocationMessage("");
    try {
      const response = await fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(query + ", Bengaluru, Karnataka, India") + "&limit=8");
      if (!response.ok) throw new Error("Location lookup failed");
      const json = await response.json();
      const features = Array.isArray(json.features) ? json.features : [];
      const feature = features.find((item) => {
        const p = item.properties || {};
        return String(p.country || "").toLowerCase() === "india"
          && String(p.state || "").toLowerCase().includes("karnataka")
          && /bengaluru|bangalore/i.test([p.name, p.city, p.district, p.county].filter(Boolean).join(" "))
          && Array.isArray(item.geometry?.coordinates)
          && item.geometry.coordinates.length >= 2;
      });
      const point = feature?.geometry?.coordinates;
      if (!Array.isArray(point) || point.length < 2) {
        setLocationMessage("Could not verify a Bengaluru, Karnataka location. Enter a Bengaluru neighbourhood or area and try again.");
        return;
      }
      const p = feature.properties || {};
      const label = [p.name, p.district, p.city, p.state, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
      setValues((current) => ({ ...current, service_location: label || query, service_lng: Number(point[0]), service_lat: Number(point[1]) }));
      setLocationMessage("Bengaluru location found. Review the area and coordinates, then save the profile.");
    } catch {
      setLocationMessage("Location lookup is unavailable. You can enter latitude and longitude manually.");
    } finally {
      setLocationBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    let payload;
    if (columns.length === 0) {
      try { payload = JSON.parse(raw); } catch { setBusy(false); return setErr("Enter valid JSON."); }
    } else {
      payload = {};
      const tableTemplate = EMPTY_BY_TABLE[table] || EMPTY_PROFILE;
      try {
        columns.forEach((c) => {
          const original = row ? row[c] : tableTemplate[c];
          payload[c] = fromInput(original, values[c], c, table);
        });
      } catch (error) {
        setBusy(false);
        return setErr(error.message || "One or more fields have an invalid value.");
      }
      if (table === "physiotherapists" && isNew) {
        if (!String(payload.name || "").trim()) {
          setBusy(false);
          return setErr("Physiotherapist name is required.");
        }
        payload.name = String(payload.name).trim();
        payload.slug = String(payload.slug || payload.name.toLowerCase().trim()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).trim();
        if (!payload.slug) {
          setBusy(false);
          return setErr("Add a valid profile slug.");
        }
        if (!payload.status) payload.status = "draft";
      }
    }
    for (const field of NUMBER_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;
      const value = payload[field];
      if (value != null && !Number.isFinite(value)) {
        setBusy(false);
        return setErr(`Field "${field}" must be a valid number.`);
      }
    }
    if (payload.experience_years != null && payload.experience_years < 0) {
      setBusy(false);
      return setErr("Experience years cannot be negative.");
    }
    if (payload.price != null && payload.price < 0) {
      setBusy(false);
      return setErr("Price cannot be negative.");
    }
    if (payload.rating != null && (payload.rating < 0 || payload.rating > 5)) {
      setBusy(false);
      return setErr("Rating must be between 0 and 5.");
    }
    if (payload.reviews != null && payload.reviews < 0) {
      setBusy(false);
      return setErr("Review count cannot be negative.");
    }
    if (payload.display_order != null && payload.display_order < 0) {
      setBusy(false);
      return setErr("Display order cannot be negative.");
    }
    if (table === "physiotherapists") {
      const lat = payload.service_lat;
      const lng = payload.service_lng;
      const radius = payload.service_radius_km;
      if ((lat == null) !== (lng == null)) {
        setBusy(false);
        return setErr("Enter both latitude and longitude, or leave both blank.");
      }
      if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
        setBusy(false);
        return setErr("Latitude must be between -90 and 90.");
      }
      if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
        setBusy(false);
        return setErr("Longitude must be between -180 and 180.");
      }
      if (radius != null && (!Number.isFinite(radius) || radius <= 0 || radius > 50)) {
        setBusy(false);
        return setErr("Service radius must be greater than 0 and no more than 50 km.");
      }
    }
    const q = isNew
      ? supabase.from(table).insert(payload)
      : supabase.from(table).update(payload).eq("id", row.id);
    try {
      const { error } = await q;
      if (error) setErr(error.message);
      else onSaved();
    } catch {
      setErr("Could not save this profile. Check your connection and permissions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-overlay" onClick={onClose}>
      <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="ad-modal-head">
          <h2>{isNew ? "Add record" : "Edit record"}</h2>
          <button type="button" className="ad-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ad-modal-body">
          {columns.length === 0 ? (
            <label>Record as JSON
              <textarea rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} />
            </label>
          ) : (
            <>
              {table === "physiotherapists" && <section className="ad-location-panel">
                <h3>Service location</h3>
                <p>Set the physiotherapist’s service base. For this test rollout, use Bengaluru, Karnataka. Nearby search uses the saved coordinates and service radius.</p>
                <label>Address or area
                  <input type="text" value={toInput(values.service_location)} onChange={(e) => setValues({ ...values, service_location: e.target.value })} placeholder="e.g. Indiranagar, Bengaluru, Karnataka" />
                </label>
                <button type="button" className="ad-btn" onClick={lookupLocation} disabled={locationBusy}>{locationBusy ? "Finding location…" : "Find coordinates from address"}</button>
                {locationMessage && <p className="ad-muted" role="status">{locationMessage}</p>}
                <div className="ad-location-grid">
                  <label>Latitude
                    <input type="number" step="any" value={toInput(values.service_lat)} onChange={(e) => setValues({ ...values, service_lat: e.target.value })} placeholder="12.9716" />
                  </label>
                  <label>Longitude
                    <input type="number" step="any" value={toInput(values.service_lng)} onChange={(e) => setValues({ ...values, service_lng: e.target.value })} placeholder="77.5946" />
                  </label>
                  <label>Service radius (km)
                    <input type="number" min="1" max="50" step="1" value={toInput(values.service_radius_km)} onChange={(e) => setValues({ ...values, service_radius_km: e.target.value })} />
                  </label>
                </div>
                <p className="ad-muted">Only save verified provider locations for real profiles. Demo coordinates must remain test-only and must not be treated as a real clinic address.</p>
              </section>}
              {columns.filter((c) => !["service_location", "service_lat", "service_lng", "service_radius_km"].includes(c)).map((c) => {
            const tableTemplate = EMPTY_BY_TABLE[table] || EMPTY_PROFILE;
                const orig = row ? row[c] : tableTemplate[c];
            if (typeof orig === "boolean") {
              return (
                <label key={c} className="ad-check">
                  <input type="checkbox" checked={!!values[c]} onChange={(e) => setValues({ ...values, [c]: e.target.checked })} />
                  {c}
                </label>
              );
            }
            const long = (typeof orig === "string" && orig.length > 80) || ARRAY_FIELDS.has(c);
            return (
              <label key={c}>{c}
                {long ? (
                  <textarea rows={4} value={toInput(values[c])} onChange={(e) => setValues({ ...values, [c]: e.target.value })} />
                ) : (
                  <input
                    type={typeof orig === "number" || NUMBER_FIELDS.has(c) ? "number" : "text"}
                    step="any"
                    value={toInput(values[c])}
                    onChange={(e) => setValues({ ...values, [c]: e.target.value })}
                  />
                )}
              </label>
            );
              })}
            </>
          )}
          {err && <p className="ad-err">{err}</p>}
        </div>
        <div className="ad-modal-foot">
          <button type="button" className="ad-btn" onClick={onClose}>Cancel</button>
          <button className="ad-btn ad-primary" disabled={busy}><Save size={16} /> {busy ? "Saving" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function Manager({ session }) {
  const [table, setTable] = useState(TABLES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // null | {row}

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    if (!isSupabaseConfigured || !supabase) {
      setErr("Admin data is unavailable because Supabase is not configured.");
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
      if (error) {
        // Retry without ordering in case created_at does not exist.
        const retry = await supabase.from(table).select("*");
        if (retry.error) {
          setErr(retry.error.message);
          setRows([]);
        } else {
          setRows(retry.data || []);
        }
      } else {
        setRows(data || []);
      }
    } catch {
      setErr("Could not load admin records. Check your connection and permissions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const columns = rows.length
    ? Object.keys(rows[0]).filter((k) => !HIDDEN.includes(k))
    : Object.keys(EMPTY_BY_TABLE[table] || EMPTY_PROFILE).filter((k) => !HIDDEN.includes(k));

  async function remove(row) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    if (!supabase) { setErr("Supabase is not configured."); return; }
    try {
      const { error } = await supabase.from(table).delete().eq("id", row.id);
      if (error) setErr(error.message);
      else await load();
    } catch {
      setErr("Could not delete this record. Please try again.");
    }
  }

  return (
    <div className="ad-wrap">
      <header className="ad-top">
        <div>
          <h1>Admin panel</h1>
          <span className="ad-sub">{session.user.email}</span>
        </div>
        <div className="ad-actions">
          <button className="ad-btn" onClick={load}><RefreshCw size={16} /> Refresh</button>
          <button className="ad-btn" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sign out</button>
        </div>
      </header>

      <div className="ad-bar">
        <div className="ad-tabs">
          {TABLES.map((t) => (
            <button key={t} className={t === table ? "on" : ""} onClick={() => setTable(t)}>{t}</button>
          ))}
        </div>
        {table === "physiotherapists" && <button className="ad-btn ad-primary" onClick={() => setEditing({ row: null })}>
          <Plus size={16} /> Add physiotherapist
        </button>}
      </div>

      {err && <p className="ad-err">{err}</p>}
      {loading ? <p className="ad-muted">Loading records</p> : rows.length === 0 ? (
        <p className="ad-muted">No records in {table} yet.</p>
      ) : (
        <div className="ad-scroll">
          <table className="ad-table">
            <thead>
              <tr>{columns.map((c) => <th key={c}>{c}</th>)}<th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c} title={toInput(r[c])}>{toInput(r[c])}</td>)}
                  <td className="ad-row-actions">
                    <button className="ad-icon" aria-label="Edit" onClick={() => setEditing({ row: r })}><Pencil size={16} /></button>
                    <button className="ad-icon ad-danger" aria-label="Delete" onClick={() => remove(r)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Editor
          table={table}
          columns={columns}
          row={editing.row}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setReady(true);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error("Could not restore admin session:", error.message);
        setSession(data?.session ?? null);
        setReady(true);
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setReady(true);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    if (!supabase) { setIsAdmin(false); return; }
    let active = true;
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (active) setIsAdmin(!error && !!data);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => { active = false; };
  }, [session]);

  if (!ready) return <div className="ad-center"><p className="ad-muted">Loading</p></div>;
  if (!isSupabaseConfigured || !supabase) return <div className="ad-center"><div className="ad-login"><h1>Admin unavailable</h1><p className="ad-muted">Supabase is not configured for this deployment. Add the required environment variables and rebuild the site.</p></div></div>;
  if (!session) return <Login onDone={() => {}} />;
  if (isAdmin === null) return <div className="ad-center"><p className="ad-muted">Checking access</p></div>;
  if (!isAdmin) {
    return (
      <div className="ad-center">
        <div className="ad-login">
          <h1>No admin access</h1>
          <p className="ad-muted">{session.user.email} is not in the admins table.</p>
          <button className="ad-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }
  return <Manager session={session} />;
}
