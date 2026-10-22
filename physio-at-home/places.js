// Free, no-billing location search built on OpenStreetMap data.
//   1. Photon (photon.komoot.io): open source, no key, made for search-as-you-type. Default.
//   2. Geoapify (optional): free plan, no credit card. If VITE_GEOAPIFY_KEY is set it is tried first,
//      and Photon is the automatic fallback (and the other way round if Geoapify is down).
// NOTE: the public Nominatim server forbids autocomplete, so it is deliberately not used here.
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
const INDIA_BBOX = '68.0,6.0,97.5,36.0'; // minLon,minLat,maxLon,maxLat. Remove if you serve other countries.

export const attribution = GEOAPIFY_KEY
  ? 'Powered by Geoapify · © OpenStreetMap contributors'
  : 'Search by Photon · © OpenStreetMap contributors';

const uniq = (arr) => arr.filter((v, i) => v && arr.indexOf(v) === i);
const cache = new Map(); // repeat searches cost nothing and keep us well inside fair-use limits

async function photon(q, signal) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=${INDIA_BBOX}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon failed (${res.status})`);
  const data = await res.json();
  return (data.features || []).map((f) => {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [];
    const main = p.name || p.street || p.district || p.locality || p.city || '';
    const rest = uniq([p.district || p.locality, p.city || p.county, p.state]).filter((v) => v !== main);
    return { id: `p-${p.osm_type || ''}${p.osm_id || ''}-${lat}-${lng}`, main, secondary: rest.join(', '), label: uniq([main, ...rest]).join(', '), lat, lng };
  });
}

async function geoapify(q, signal) {
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&filter=countrycode:in&limit=6&lang=en&apiKey=${GEOAPIFY_KEY}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geoapify failed (${res.status})`);
  const data = await res.json();
  return (data.features || []).map((f) => {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [];
    return {
      id: `g-${p.place_id || `${p.lat}-${p.lon}`}`,
      main: p.address_line1 || p.name || '',
      secondary: p.address_line2 || '',
      label: p.formatted || [p.address_line1, p.address_line2].filter(Boolean).join(', '),
      lat: p.lat ?? lat,
      lng: p.lon ?? lng,
    };
  });
}

// Returns [{ id, main, secondary, label, lat, lng }]. Coordinates come with the suggestion, no second call needed.
export async function searchPlaces(q, signal) {
  const key = q.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const providers = GEOAPIFY_KEY ? [geoapify, photon] : [photon];
  let lastErr;
  for (const provider of providers) {
    try {
      const seen = new Set();
      const results = (await provider(q, signal)).filter((r) => {
        if (!r.label || !Number.isFinite(r.lat) || !Number.isFinite(r.lng) || seen.has(r.label)) return false;
        seen.add(r.label);
        return true;
      });
      cache.set(key, results);
      return results;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}

// Browser GPS position as a promise with friendly errors.
export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Your browser can’t share its location. Please type your area instead.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(new Error(
        err.code === 1
          ? 'Location access was blocked. Please type your area instead.'
          : 'We couldn’t detect your location. Please type your area instead.'
      )),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}
