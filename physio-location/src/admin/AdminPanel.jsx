import { Component, useEffect, useMemo, useState, useCallback } from "react";
import { LogOut, Plus, Pencil, Trash2, X, Save, RefreshCw, MapPin } from "lucide-react";
import { supabase, supabaseReady } from "../lib/supabase";
import PlaceSearch from "../components/PlaceSearch";
import "./admin.css";

const TABLES = ["physiotherapists"];
const HIDDEN = ["id", "created_at", "updated_at"];
const LOC_FIELDS = ["location_name", "latitude", "longitude", "service_radius_km"];
const TABLE_HIDDEN = [...HIDDEN, "latitude", "longitude", "service_radius_km"];

function toInput(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fromInput(sample, text) {
  if (typeof sample === "boolean") return text === true || text === "true";
  if (typeof sample === "number") return text === "" ? null : Number(text);
  if (Array.isArray(sample)) return String(text).split(",").map((s) => s.trim()).filter(Boolean);
  if (sample !== null && typeof sample === "object") {
    try { return JSON.parse(text); } catch { return sample; }
  }
  return text === "" ? null : text;
}

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="ad-center">
        <div className="ad-login">
          <h1>Admin panel error</h1>
          <p className="ad-err">{String(this.state.error?.message || this.state.error)}</p>
          <button className="ad-btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
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

function Editor({ table, columns, row, template, locCols, onClose, onSaved }) {
  const isNew = !row;
  const sampleOf = (c) => (row && row[c] !== null && row[c] !== undefined ? row[c] : template[c]);

  const [values, setValues] = useState(() => {
    const v = {};
    columns.forEach((c) => { v[c] = row ? row[c] : ""; });
    return v;
  });
  const [loc, setLoc] = useState({
    label: row?.location_name || "",
    lat: row?.latitude ?? null,
    lng: row?.longitude ?? null,
    radius: row?.service_radius_km ?? 10,
  });
  const [raw, setRaw] = useState("{\n  \n}");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    let payload;
    if (columns.length === 0) {
      try { payload = JSON.parse(raw); } catch { setBusy(false); return setErr("Enter valid JSON."); }
    } else {
      payload = {};
      columns.forEach((c) => { payload[c] = fromInput(sampleOf(c), values[c]); });
    }
    if (locCols) {
      payload.location_name = loc.label || null;
      payload.latitude = loc.lat ?? null;
      payload.longitude = loc.lng ?? null;
      payload.service_radius_km = loc.radius === "" ? 10 : Number(loc.radius);
    }
    const q = isNew
      ? supabase.from(table).insert(payload)
      : supabase.from(table).update(payload).eq("id", row.id);
    const { error } = await q;
    setBusy(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <div className="ad-overlay" onClick={onClose}>
      <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="ad-modal-head">
          <h2>{isNew ? "Add physiotherapist" : "Edit physiotherapist"}</h2>
          <button type="button" className="ad-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ad-modal-body">
          {columns.length === 0 ? (
            <label>Record as JSON
              <textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)} />
            </label>
          ) : columns.map((c) => {
            const s = sampleOf(c);
            if (typeof s === "boolean") {
              return (
                <label key={c} className="ad-check">
                  <input type="checkbox" checked={!!values[c]} onChange={(e) => setValues({ ...values, [c]: e.target.checked })} />
                  {c}
                </label>
              );
            }
            const long = typeof s === "string" && s.length > 80;
            return (
              <label key={c}>{c}{Array.isArray(s) ? " (comma separated)" : ""}
                {long ? (
                  <textarea rows={4} value={toInput(values[c])} onChange={(e) => setValues({ ...values, [c]: e.target.value })} />
                ) : (
                  <input
                    type={typeof s === "number" ? "number" : "text"}
                    step="any"
                    value={toInput(values[c])}
                    onChange={(e) => setValues({ ...values, [c]: e.target.value })}
                  />
                )}
              </label>
            );
          })}

          <div className="ad-loc">
            <div className="ad-loc-title"><MapPin size={16} /> Service location</div>
            {!locCols && <p className="ad-loc-warn">Location columns not found. Run sql/setup.sql in Supabase, then refresh.</p>}
            {locCols && (
              <>
                <PlaceSearch
                  value={loc.label}
                  placeholder="Search area, clinic or address"
                  onSelect={(p) => setLoc((l) => ({ ...l, label: p.label, lat: p.lat, lng: p.lng }))}
                />
                {loc.lat != null ? (
                  <p className="ad-loc-meta">
                    Latitude {Number(loc.lat).toFixed(5)}, Longitude {Number(loc.lng).toFixed(5)} ·{" "}
                    <a href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=15/${loc.lat}/${loc.lng}`} target="_blank" rel="noreferrer">Verify on map</a>
                  </p>
                ) : (
                  <p className="ad-muted">Pick a suggestion from the list to capture exact coordinates.</p>
                )}
                <label>Service radius (km)
                  <input type="number" min="1" step="1" value={loc.radius} onChange={(e) => setLoc((l) => ({ ...l, radius: e.target.value }))} />
                </label>
              </>
            )}
          </div>

          {err && <p className="ad-err">{err}</p>}
        </div>
        <div className="ad-modal-foot">
          <button type="button" className="ad-btn" onClick={onClose}>Cancel</button>
          <button className="ad-btn ad-primary" disabled={busy}><Save size={16} /> {busy ? "Saving" : "Save"}</button>
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
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    let res = await supabase.from(table).select("*").order("created_at", { ascending: true });
    if (res.error) res = await supabase.from(table).select("*");
    if (res.error) setErr(res.error.message); else setRows(res.data || []);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const template = useMemo(() => {
    const t = {};
    rows.forEach((r) => Object.keys(r).forEach((k) => { if (t[k] === undefined && r[k] !== null) t[k] = r[k]; }));
    return t;
  }, [rows]);

  const allKeys = rows.length ? Object.keys(rows[0]) : [];
  const formColumns = allKeys.filter((k) => ![...HIDDEN, ...LOC_FIELDS].includes(k));
  const tableColumns = allKeys.filter((k) => !TABLE_HIDDEN.includes(k));
  const locCols = rows.length ? allKeys.includes("latitude") : true;

  async function remove(row) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) setErr(error.message); else load();
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
        <button className="ad-btn ad-primary" onClick={() => setEditing({ row: null })}>
          <Plus size={16} /> Add physiotherapist
        </button>
      </div>

      {err && <p className="ad-err">{err}</p>}
      {loading ? <p className="ad-muted">Loading records</p> : rows.length === 0 ? (
        <p className="ad-muted">No records yet. Add the first one.</p>
      ) : (
        <div className="ad-scroll">
          <table className="ad-table">
            <thead>
              <tr>{tableColumns.map((c) => <th key={c}>{c}</th>)}<th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {tableColumns.map((c) => (
                    <td key={c} title={toInput(r[c])}>
                      {c === "location_name" && !r.latitude ? "Not set" : toInput(r[c])}
                    </td>
                  ))}
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
          key={editing.row ? editing.row.id : "new"}
          table={table}
          columns={formColumns}
          row={editing.row}
          template={template}
          locCols={locCols}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function Gate() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return <div className="ad-center"><p className="ad-muted">Loading</p></div>;
  if (!session) return <Login />;
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

export default function AdminPanel() {
  if (!supabaseReady) {
    return (
      <div className="ad-center">
        <div className="ad-login">
          <h1>Supabase keys not loaded</h1>
          <p className="ad-err">Check that .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then stop the dev server (Ctrl+C) and run npm run dev again. On Netlify, rebuild after adding the variables.</p>
        </div>
      </div>
    );
  }
  return <Boundary><Gate /></Boundary>;
}
