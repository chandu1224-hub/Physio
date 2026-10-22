// Free, open-source geocoding. No API key, no billing.
// Primary: Photon (OpenStreetMap data, built for search-as-you-type). Fallback: Nominatim.
const PHOTON = "https://photon.komoot.io/api/";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const INDIA_BBOX = "68.1,6.7,97.5,35.7"; // minLon,minLat,maxLon,maxLat

function photonLabel(p) {
  const parts = [p.name, p.locality || p.district, p.city, p.state].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const r = await fetch(`${PHOTON}?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=${INDIA_BBOX}`, { signal });
    if (r.ok) {
      const json = await r.json();
      const seen = new Set();
      const out = [];
      for (const f of json.features || []) {
        const label = photonLabel(f.properties || {});
        const [lng, lat] = f.geometry.coordinates;
        if (!label || seen.has(label)) continue;
        seen.add(label);
        out.push({ label, lat, lng });
      }
      if (out.length) return out;
    }
  } catch (e) {
    if (e.name === "AbortError") throw e;
  }

  const r2 = await fetch(`${NOMINATIM}?format=jsonv2&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`, { signal });
  if (!r2.ok) return [];
  const rows = await r2.json();
  return rows.map((x) => ({ label: x.display_name, lat: Number(x.lat), lng: Number(x.lon) }));
}
