import { useEffect, useState, useCallback } from "react";
import { LogOut, Plus, Pencil, Trash2, X, Save, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import LocationSearch from "../components/LocationSearch";
import "./admin.css";
import "./admin-geo.css";

const TABLES = ["physiotherapists", "booking_requests", "therapist_applications"]; // add more table names here to manage them too
const HIDDEN = ["id", "created_at", "updated_at"];
const GEO = ["service_location", "service_lat", "service_lng", "service_radius_km"];

function toInput(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fromInput(original, text) {
  if (typeof original === "boolean") return text === true || text === "true";
  if (typeof original === "number") return text === "" ? null : Number(text);
  if (original !== null && typeof original === "object") {
    try { return JSON.parse(text); } catch { return original; }
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
    else onDone();
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
    columns.forEach((c) => { v[c] = row ? row[c] : ""; });
    if (!row && columns.includes("service_radius_km")) v.service_radius_km = 10; // default service radius
    return v;
  });
  const [raw, setRaw] = useState("{\n  \n}");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Physiotherapists get a Google-Maps powered "Service location" block
  const hasGeo = table === "physiotherapists" && GEO.every((c) => columns.includes(c));
  const formColumns = hasGeo ? columns.filter((c) => !GEO.includes(c)) : columns;
  const hasPoint = values.service_lat !== "" && values.service_lat != null && values.service_lng !== "" && values.service_lng != null;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    let payload;
    if (columns.length === 0) {
      try { payload = JSON.parse(raw); } catch { setBusy(false); return setErr("Enter valid JSON."); }
    } else {
      payload = {};
      columns.forEach((c) => {
        payload[c] = row ? fromInput(row[c], values[c]) : (values[c] === "" ? null : values[c]);
      });
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
          <h2>{isNew ? "Add record" : "Edit record"}</h2>
          <button type="button" className="ad-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ad-modal-body">
          {columns.length === 0 ? (
            <label>Record as JSON
              <textarea rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} />
            </label>
          ) : (<>
            {hasGeo && (
              <div className="ad-geo">
                <strong>Service location</strong>
                <p className="ad-muted">Search the area this physiotherapist serves. Clients within the radius below will find them under “find physio near me”.</p>
                <LocationSearch
                  label="Search location"
                  initial={values.service_location || ""}
                  placeholder="e.g. Adyar, Chennai"
                  onSelect={(p) => setValues((v) => ({
                    ...v,
                    service_location: p.label,
                    service_lat: p.lat,
                    service_lng: p.lng,
                    service_radius_km: v.service_radius_km === "" || v.service_radius_km == null ? 10 : v.service_radius_km,
                  }))}
                />
                {hasPoint ? (
                  <p className="ad-geo-ok">📍 {values.service_location}<br />
                    <small>{Number(values.service_lat).toFixed(5)}, {Number(values.service_lng).toFixed(5)}</small>
                  </p>
                ) : (
                  <p className="ad-geo-warn">No location set. This physiotherapist will not appear in “near me” searches.</p>
                )}
                <details className="ad-geo-manual">
                  <summary>Can’t find it? Enter the place and coordinates manually</summary>
                  <p className="ad-muted">Right-click the spot on any map (OpenStreetMap, Google Maps) and copy the latitude and longitude.</p>
                  <label>Place name
                    <input type="text" value={values.service_location ?? ""} onChange={(e) => setValues({ ...values, service_location: e.target.value })} />
                  </label>
                  <label>Latitude
                    <input type="number" step="any" min="-90" max="90" value={values.service_lat ?? ""}
                      onChange={(e) => setValues({ ...values, service_lat: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </label>
                  <label>Longitude
                    <input type="number" step="any" min="-180" max="180" value={values.service_lng ?? ""}
                      onChange={(e) => setValues({ ...values, service_lng: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </label>
                </details>
                <label>Service radius (km)
                  <input type="number" min="1" max="50" step="1"
                    value={values.service_radius_km ?? ""}
                    onChange={(e) => setValues({ ...values, service_radius_km: e.target.value === "" ? "" : Number(e.target.value) })} />
                </label>
                {hasPoint && (
                  <button type="button" className="ad-btn" onClick={() => setValues({ ...values, service_location: "", service_lat: "", service_lng: "" })}>
                    Clear location
                  </button>
                )}
              </div>
            )}
            {formColumns.map((c) => {
            const orig = row ? row[c] : undefined;
            if (typeof orig === "boolean") {
              return (
                <label key={c} className="ad-check">
                  <input type="checkbox" checked={!!values[c]} onChange={(e) => setValues({ ...values, [c]: e.target.checked })} />
                  {c}
                </label>
              );
            }
            const long = typeof orig === "string" && orig.length > 80;
            return (
              <label key={c}>{c}
                {long ? (
                  <textarea rows={4} value={toInput(values[c])} onChange={(e) => setValues({ ...values, [c]: e.target.value })} />
                ) : (
                  <input
                    type={typeof orig === "number" ? "number" : "text"}
                    step="any"
                    value={toInput(values[c])}
                    onChange={(e) => setValues({ ...values, [c]: e.target.value })}
                  />
                )}
              </label>
            );
            })}
          </>)}
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
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
    if (error) {
      // retry without ordering in case created_at does not exist
      const retry = await supabase.from(table).select("*");
      if (retry.error) setErr(retry.error.message);
      else setRows(retry.data || []);
    } else setRows(data || []);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const columns = rows.length ? Object.keys(rows[0]).filter((k) => !HIDDEN.includes(k)) : [];

  async function remove(row) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) setErr(error.message);
    else load();
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
          <Plus size={16} /> Add record
        </button>
      </div>

      {err && <p className="ad-err">{err}</p>}
      {loading ? <p className="ad-muted">Loading records</p> : rows.length === 0 ? (
        <p className="ad-muted">No records in {table}. Add the first one.</p>
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
