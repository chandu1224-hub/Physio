import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Heart, MapPin, Menu, MessageCircle, Search, ShieldCheck, Star, X } from 'lucide-react';
import './styles.css';
import './production.css';
import { useDoctors } from './hooks/useDoctors';
import { submitBooking } from './lib/bookings';
import { submitApplication } from './lib/applications';
import { findNearby } from './lib/nearby';
import { getBrowserLocation } from './lib/places';
import LocationSearch from './components/LocationSearch';

// Admin code is only downloaded when someone opens /admin
const AdminPanel = lazy(() => import('./admin/AdminPanel'));

const WA_NUMBER = '917795855640';

// TODO: fill these in before launch. They appear on the Privacy Policy and Terms pages.
const BUSINESS = {
  legalName: '[Registered business name]',
  email: '[Contact email]',
  address: '[Business address]',
  retention: '[Retention period, e.g. 24 months]',
  cancellation: '[Cancellation and refund policy, e.g. free cancellation up to X hours before the visit]',
  jurisdiction: '[City], India',
};

const conditions = [
  ['Back pain', '↗', 'Relieve stiffness and improve movement'],
  ['Neck & shoulder', '◉', 'Feel easier at your desk and at home'],
  ['Knee pain', '⌁', 'Build strength and everyday confidence'],
  ['Sports injury', '✳', 'Return to activity at your pace'],
  ['Post-surgery', '＋', 'Guided recovery after an operation'],
  ['Senior care', '♡', 'Balance, mobility and independence'],
];

const waLink = (message = 'Hi Physio at Home! I would like to know more about booking a physiotherapy session.') =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

// Local-date YYYY-MM-DD (toISOString() would give the UTC date, which is wrong early morning in India)
const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ maxWidth: 480, margin: '15vh auto', padding: 20, textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>Please refresh the page. If it keeps happening, message us on WhatsApp and we'll help you book.</p>
        <a className="btn btn-primary" href={waLink()} target="_blank" rel="noreferrer">WhatsApp us</a>
      </div>
    );
  }
}

function Brand({ light = false }) {
  return (
    <a className={`brand ${light ? 'brand-light' : ''}`} href="/" aria-label="Physio at Home home">
      <span className="brand-mark"><Activity size={19} /></span>
      <span>physio <i>at home</i></span>
    </a>
  );
}

function LegalPage({ kind }) {
  const isPrivacy = kind === 'privacy';
  useEffect(() => { document.title = `${isPrivacy ? 'Privacy Policy' : 'Terms of Service'} — Physio at Home`; }, [isPrivacy]);

  return (
    <div className="legal-page">
      <Brand />
      {isPrivacy ? (
        <>
          <h1>Privacy Policy</h1>
          <p className="legal-meta">Last updated: [date]. Template only: have it reviewed by a qualified lawyer before launch.</p>
          <h2>Who we are</h2>
          <p>Physio at Home ("we") is operated by {BUSINESS.legalName}, {BUSINESS.address}. Contact: {BUSINESS.email}.</p>
          <h2>What we collect</h2>
          <p>When you request a session: your name, phone number, area or address, the condition you describe, your preferred date and time, and any notes you add. When a physiotherapist applies to join: name, phone, email, qualification, experience, specialties, city or clinic, registration number and a short introduction.</p>
          <h2>Why we collect it</h2>
          <p>To contact you, arrange and confirm your visit, match you with a physiotherapist, and review physiotherapist applications. We do not sell your information.</p>
          <h2>Who sees it</h2>
          <p>Our team, and the physiotherapist assigned to your visit. We use Supabase to store data and WhatsApp if you choose to message us; these providers process data on our behalf under their own terms.</p>
          <h2>Location search</h2>
          <p>If you use "find physio near me", the location you type or share is used only to check which physiotherapists serve your area; we do not store it. Location suggestions come from third-party search services based on OpenStreetMap data (such as Photon and Geoapify), so the text you type in the location box is sent to them.</p>
          <h2>Health information</h2>
          <p>The condition you describe may be health-related. Share only what is needed to arrange your visit. We collect it only with your consent, given when you tick the consent box on our forms.</p>
          <h2>How long we keep it</h2>
          <p>We keep booking requests for {BUSINESS.retention}, then delete or anonymise them, unless the law requires longer.</p>
          <h2>Your choices</h2>
          <p>You can ask us to access, correct or delete your information, or withdraw your consent, by writing to {BUSINESS.email}. Withdrawing consent may mean we can no longer arrange your session.</p>
          <h2>Security</h2>
          <p>Data is stored in access-controlled databases and transmitted over HTTPS. No system is perfectly secure, so please contact us immediately if you suspect misuse.</p>
          <h2>Children</h2>
          <p>Requests for a person under 18 should be made by a parent or guardian.</p>
          <h2>Grievances</h2>
          <p>Questions or complaints: {BUSINESS.email}.</p>
        </>
      ) : (
        <>
          <h1>Terms of Service</h1>
          <p className="legal-meta">Last updated: [date]. Template only: have it reviewed by a qualified lawyer before launch.</p>
          <h2>What we do</h2>
          <p>Physio at Home helps you request and arrange home physiotherapy sessions. Submitting a request is not a confirmed appointment. A session is confirmed only when our team confirms the physiotherapist, time and fee with you.</p>
          <h2>Not for emergencies</h2>
          <p>This is not an emergency service. If you have sudden weakness, chest pain, a serious injury or any urgent symptom, contact emergency medical services immediately.</p>
          <h2>Medical disclaimer</h2>
          <p>Information on this website is general and is not medical advice or a diagnosis. Your physiotherapist will assess you before recommending treatment.</p>
          <h2>Fees and payment</h2>
          <p>Fees vary by physiotherapist and session type, and are confirmed with you before your visit.</p>
          <h2>Cancellations and refunds</h2>
          <p>{BUSINESS.cancellation}</p>
          <h2>Your responsibilities</h2>
          <p>Provide accurate details, a safe environment for the visit, and tell your physiotherapist about relevant medical conditions and medicines.</p>
          <h2>Liability</h2>
          <p>To the extent permitted by law, we are not liable for indirect or consequential loss arising from use of this website or from arranged sessions. Nothing here limits liability that cannot be limited by law.</p>
          <h2>Governing law</h2>
          <p>These terms are governed by the laws of India. Courts at {BUSINESS.jurisdiction} have jurisdiction.</p>
          <h2>Contact</h2>
          <p>{BUSINESS.email}</p>
        </>
      )}
      <p><a href="/">← Back to home</a></p>
    </div>
  );
}

function JoinTherapist({ onBack }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', qualification: '', experience: '',
    specialties: '', city: '', regNo: '', about: '', consent: false, website: '',
  });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.website) { setDone(true); return; } // honeypot: bots fill hidden fields
    if (!form.name.trim() || !form.phone.trim() || !form.qualification.trim() || !form.city.trim()) {
      setError('Please fill in name, phone, qualification and city.');
      return;
    }
    if (!/^[0-9+() -]{8,20}$/.test(form.phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!form.consent) {
      setError('Please agree to the Privacy Policy to continue.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await submitApplication(form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const field = { width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' };

  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <h2>Thank you!</h2>
        <p>We've received your application and will contact you on the number you shared.</p>
        <button onClick={onBack} style={{ marginTop: 12 }}>← Back to home</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>← Back</button>
      <h2>Join as a Physiotherapist</h2>
      <p>Fill in your details and we'll get back to you.</p>

      <form onSubmit={submit}>
        <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={update} />
        <input style={field} name="name" placeholder="Full name *" value={form.name} onChange={update} maxLength={100} />
        <input style={field} name="phone" type="tel" placeholder="Phone number *" value={form.phone} onChange={update} maxLength={20} />
        <input style={field} name="email" type="email" placeholder="Email" value={form.email} onChange={update} maxLength={200} />
        <input style={field} name="qualification" placeholder="Qualification (e.g. BPT, MPT) *" value={form.qualification} onChange={update} maxLength={200} />
        <input style={field} name="experience" type="number" min="0" max="70" placeholder="Years of experience" value={form.experience} onChange={update} />
        <input style={field} name="specialties" placeholder="Specialties (back pain, sports, senior care...)" value={form.specialties} onChange={update} maxLength={300} />
        <input style={field} name="city" placeholder="City / Clinic name *" value={form.city} onChange={update} maxLength={200} />
        <input style={field} name="regNo" placeholder="Registration / license number" value={form.regNo} onChange={update} maxLength={100} />
        <textarea style={{ ...field, minHeight: 90 }} name="about" placeholder="Tell us about yourself" value={form.about} onChange={update} maxLength={1500} />

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, marginBottom: 12 }}>
          <input type="checkbox" name="consent" checked={form.consent} onChange={update} style={{ marginTop: 3 }} />
          <span>I agree to the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and consent to Physio at Home storing and reviewing these details.</span>
        </label>

        {error && <p style={{ color: 'crimson' }} role="alert">{error}</p>}

        <button type="submit" disabled={sending} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#25D366', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>
          {sending ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

function DoctorAvatar({ d, large = false }) {
  return (
    <div className={`doctor-avatar ${d.color} ${large ? 'avatar-large' : ''}`}>
      <span>{d.photo ? <img src={d.photo} alt={d.name} loading="lazy" /> : d.initials}</span>
      <i><BadgeCheck size={15} /></i>
    </div>
  );
}

function DoctorCard({ d, onView, onBook, distance = null }) {
  const hasRating = d.rating && d.reviews > 0;
  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <DoctorAvatar d={d} />
        {d.availability && (
          <div className="doctor-availability">
            <span className={/today/i.test(d.availability) ? 'availability-dot' : 'availability-dot later'} />{d.availability}
          </div>
        )}
      </div>
      <h3>{d.name}</h3>
      <p className="doctor-title">{d.title}</p>
      {d.degree && <p className="doctor-degree">{d.degree}</p>}
      <div className="doctor-meta">
        {hasRating && <span><Star size={14} fill="currentColor" /> {d.rating} <small>({d.reviews})</small></span>}
        {d.experience && <span><Clock3 size={14} />{d.experience}</span>}
      </div>
      <div className="tag-row">{d.specialties.map((s) => <span key={s}>{s}</span>)}</div>
      <div className="doctor-card-bottom">
        <div>
          <small>{d.price > 0 ? 'From' : 'Session fee'}</small>
          <b>{d.price > 0 ? <>₹{d.price}<small> / session</small></> : <>Confirmed on booking</>}</b>
          {distance != null && <span className="distance"><MapPin size={12} />{distance < 1 ? 'Under 1 km' : `${distance.toFixed(1)} km`} away</span>}
        </div>
        <button className="round-arrow" onClick={onView} aria-label={`View ${d.name} profile`}><ArrowRight size={18} /></button>
      </div>
      <div className="doctor-card-actions">
        <button className="outline-btn" onClick={onView}>View profile</button>
        <button className="btn btn-primary" onClick={onBook}>Request <ArrowRight size={15} /></button>
      </div>
    </article>
  );
}

const fmtKm = (km) => (km < 1 ? 'Under 1 km' : `${km.toFixed(1)} km`);

function FindPhysioDialog({ doctors, loading, auto, onClose, onView, onBook }) {
  const [status, setStatus] = useState('idle'); // idle | locating | searching | done | error
  const [place, setPlace] = useState(null);
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState('');
  const run = useRef(0); // ignore answers from older searches

  const search = async (p) => {
    const id = ++run.current;
    setPlace(p);
    setMatches([]);
    setMessage('');
    setStatus('searching');
    try {
      const found = await findNearby(p.lat, p.lng);
      if (id !== run.current) return;
      setMatches(found);
      setStatus('done');
    } catch (err) {
      console.error(err);
      if (id !== run.current) return;
      setMessage("We couldn't check availability right now. Please try again, or message us on WhatsApp.");
      setStatus('error');
    }
  };

  const locateMe = async () => {
    const id = ++run.current;
    setStatus('locating');
    setMessage('');
    setPlace(null);
    setMatches([]);
    try {
      const pos = await getBrowserLocation();
      if (id !== run.current) return;
      search({ label: 'your current location', lat: pos.lat, lng: pos.lng });
    } catch (err) {
      if (id !== run.current) return;
      setMessage(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (auto) locateMe();
    return () => { run.current++; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = status === 'done'
    ? matches.map((m) => ({ d: doctors.find((x) => String(x.id) === m.id), km: m.distanceKm })).filter((m) => m.d)
    : [];
  const noService = status === 'done' && !loading && shown.length === 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-modal find-modal" role="dialog" aria-modal="true" aria-label="Find physio at your location" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <span className="section-kicker">NEAR YOU</span>
        <h2>Find physio at your location.</h2>
        <p className="booking-intro">Search your area, street or landmark, or use your current location. We'll show the physiotherapists who serve it.</p>

        <LocationSearch autoFocus={!auto} placeholder="Type your area, street or landmark" onSelect={search} />
        <button className="outline-btn find-locate" onClick={locateMe} disabled={status === 'locating' || status === 'searching'}>
          <MapPin size={16} /> Use my current location
        </button>
        <p className="form-privacy"><ShieldCheck size={14} /> We use your location only to find physios near you. We don't save it.</p>

        <div className="find-results" aria-live="polite">
          {status === 'locating' && <p className="find-status" role="status">Checking your location...</p>}
          {status === 'searching' && <p className="find-status" role="status">Looking for physios near {place?.label}...</p>}
          {status === 'error' && <p className="form-error" role="alert">{message}</p>}
          {status === 'done' && loading && <p className="find-status" role="status">Loading physiotherapists...</p>}

          {noService && (
            <div className="find-none" role="status">
              <h3>Sorry, no service available at this location.</h3>
              <p>We don't have a physiotherapist serving {place?.label} yet. Try another location above, or message us and we'll tell you when we reach your area.</p>
              <a className="btn btn-primary" target="_blank" rel="noreferrer"
                href={waLink(`Hi Physio at Home, I'd like home physiotherapy at ${place?.label} but it isn't available yet. Please let me know when you can serve this area.`)}>
                Message us on WhatsApp <MessageCircle size={16} />
              </a>
            </div>
          )}

          {shown.length > 0 && (
            <>
              <h3 className="find-count">{shown.length} {shown.length === 1 ? 'physiotherapist serves' : 'physiotherapists serve'} {place?.label}</h3>
              <div className="doctor-grid">
                {shown.map(({ d, km }) => (
                  <DoctorCard key={d.id} d={d} distance={km} onView={() => onView(d)} onBook={() => onBook(d, place)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const FAQS = [
  ['How do I book a physiotherapist?', 'Tap "Request a session", tell us your area, what you need help with and when suits you. Our team will contact you to confirm a physiotherapist and the visit.'],
  ['Is my appointment confirmed after I submit?', 'Not instantly. We receive your request and contact you to confirm the physiotherapist, time and fee. Your session is confirmed only once we have spoken.'],
  ['How much does a session cost?', 'Fees vary by physiotherapist and session type. You will be told the fee before you confirm your visit.'],
  ['How is my information used?', 'Only to arrange your session and contact you. See our Privacy Policy for details, including how to ask us to delete your data.'],
  ['What if I need urgent medical help?', 'Physiotherapy booking is not an emergency service. If you have sudden weakness, chest pain, a serious injury or another urgent symptom, contact emergency medical services.'],
];

function App() {
  const { doctors, loading } = useDoctors();
  const [splash, setSplash] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return !sessionStorage.getItem('splashSeen');
    } catch { return true; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [booking, setBooking] = useState(null); // { doc, condition }
  const [bookedWith, setBookedWith] = useState(null);
  const [bookError, setBookError] = useState('');
  const [sending, setSending] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState('home');
  const [showAll, setShowAll] = useState(false);
  const [find, setFind] = useState(null); // null | { auto: boolean }

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => {
      setSplash(false);
      try { sessionStorage.setItem('splashSeen', '1'); } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
  }, [splash]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setSelected(null); setBooking(null); setBookedWith(null); setMenuOpen(false); setFind(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openBooking = (doc = null, cond = '', area = '') => {
    setSelected(null);
    setFind(null);
    setMenuOpen(false);
    setBookError('');
    setBookedWith(null);
    setBooking({ doc, condition: cond, area });
  };
  const openFind = (auto = false) => { setMenuOpen(false); setFind({ auto }); };
  const closeBooking = () => { setBooking(null); setBookedWith(null); setBookError(''); };

  const onSubmitBooking = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const summary = {
      name: String(f.get('name') || '').trim(),
      phone: String(f.get('phone') || '').trim(),
      concern: f.get('concern'),
      date: f.get('date'),
      time: f.get('time'),
      doc: booking?.doc || null,
    };
    if (f.get('website')) { setBookedWith(summary); return; } // honeypot: bots fill hidden fields
    setSending(true);
    setBookError('');
    try {
      await submitBooking({
        name: summary.name,
        phone: summary.phone,
        area: String(f.get('address') || ''),
        condition: summary.concern,
        careType: 'Home visit',
        preferredTime: `${summary.date} · ${summary.time}`,
        notes: String(f.get('notes') || ''),
        physioId: summary.doc?.id,
        consent: f.get('consent') === 'on',
      });
      setBookedWith(summary);
    } catch (err) {
      setBookError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (page === 'join') return <JoinTherapist onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />;

  const visibleDoctors = showAll ? doctors : doctors.slice(0, 3);

  return (
    <>
      {splash && (
        <div className="splash">
          <div className="splash-logo">
            <span className="brand-mark big"><Activity size={30} /></span>
            <div className="splash-name">physio <i>at home</i></div>
          </div>
          <div className="splash-line"><span /></div>
          <p>Care that comes to you.</p>
        </div>
      )}

      <header className="header">
        <div className="nav wrap">
          <Brand />
          <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#care" onClick={() => setMenuOpen(false)}>Conditions</a>
            <a href="#physios" onClick={() => setMenuOpen(false)}>Our physios</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a>
            <a className="nav-cta" href={waLink('Hi! I need help booking a physiotherapist.')} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Talk to us</a>
          </nav>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-glow" />
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> PHYSIOTHERAPY, AT YOUR PLACE</div>
              <h1>A qualified physio,<br /><em>at your door.</em></h1>
              <p className="hero-sub">Tell us what's bothering you and where you are. Our team will arrange a physiotherapist to visit you at home, so care fits your life from start to finish.</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => openFind(true)}>Find nearby physio <ArrowRight size={18} /></button>
                <button className="outline-btn" onClick={() => openFind(false)}><MapPin size={16} /> Find physio at your location</button>
                <button className="outline-btn" onClick={() => { setPage('join'); window.scrollTo(0, 0); }}>Join as Physiotherapist</button>
                <a className="text-link" href="#how">See how it works <ArrowDownRight size={17} /></a>
              </div>
              <div className="hero-proof">
                <div><strong>Home <small>visits</small></strong><span>at your place, your pace</span></div>
                <div><strong>Chat</strong><span>WhatsApp booking support</span></div>
                <div><strong>Profiles</strong><span>credentials shown up front</span></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
              <div className="hero-card top-card"><span className="mini-icon"><ShieldCheck size={16} /></span><div><b>Care, made personal</b><small>Find the right kind of support</small></div><span className="tiny-check"><Check size={13} /></span></div>
              <div className="hero-person"><div className="person-halo" /><div className="person-emoji">🧑🏻‍⚕️</div><div className="person-spark spark-a">✦</div><div className="person-spark spark-b">✳</div><div className="home-base"><span><Activity size={22} /></span><div><b>Good care starts here</b><small>At your place. At your pace.</small></div></div></div>
              <div className="hero-card floating-card"><div className="avatar-stack"><span>👩🏻‍⚕️</span><span>👨🏽‍⚕️</span><span>👩🏽‍⚕️</span></div><div><b>Care for your needs</b><small>Browse physiotherapist profiles</small></div><span className="online-dot" /></div>
              <div className="float-label label-left"><Heart size={15} /> A little care goes far</div>
              <div className="float-label label-right"><MapPin size={15} /> Care comes to you</div>
            </div>
          </div>
        </section>

        <section className="trust-strip"><div className="wrap trust-grid"><div><ShieldCheck /><span><b>Profiles to explore</b><small>Know who you're contacting</small></span></div><div><Clock3 /><span><b>Flexible scheduling</b><small>Ask for a time that works</small></span></div><div><Heart /><span><b>Care that feels human</b><small>Personal, thoughtful support</small></span></div><div><MessageCircle /><span><b>Real conversations</b><small>WhatsApp booking support</small></span></div></div></section>

        <section className="section care-section" id="care">
          <div className="wrap">
            <div className="section-intro"><span className="section-kicker">START WITH WHAT YOU FEEL</span><h2>Whatever's slowing you down,<br /><em>let's work on it.</em></h2><p>Explore common reasons people look for physiotherapy. A physiotherapist can help assess what support may be right for you.</p></div>
            <div className="condition-grid">
              {conditions.map((c, i) => (
                <button className="condition-card" key={c[0]} onClick={() => openBooking(null, c[0])}>
                  <span className={`condition-symbol symbol-${i}`}>{c[1]}</span>
                  <span className="condition-name">{c[0]}</span>
                  <span className="condition-desc">{c[2]}</span>
                  <span className="condition-arrow"><ArrowRight size={17} /></span>
                </button>
              ))}
            </div>
            <p className="medical-note">Physiotherapy is not an emergency service. For sudden severe symptoms, seek urgent medical care.</p>
          </div>
        </section>

        <section className="section how-section" id="how">
          <div className="wrap how-grid">
            <div className="section-intro how-intro"><span className="section-kicker">SIMPLE FROM THE FIRST TAP</span><h2>Care, without<br /><em>the extra steps.</em></h2><p>Finding support should feel easier. Here's how Physio at Home works.</p><button className="btn btn-primary" onClick={() => openFind(false)}>Find physio near me <ArrowRight size={17} /></button></div>
            <div className="steps-list">
              <div className="step-item"><div className="step-num">01</div><div className="step-icon"><Search size={22} /></div><div><h3>Tell us what you need</h3><p>Choose a condition, share your area and pick a time that suits you.</p></div></div>
              <div className="step-item"><div className="step-num">02</div><div className="step-icon"><CalendarDays size={22} /></div><div><h3>We arrange your visit</h3><p>Our team contacts you to match you with a physiotherapist and agree the time and fee.</p></div></div>
              <div className="step-item"><div className="step-num">03</div><div className="step-icon"><Heart size={22} /></div><div><h3>Care at your place</h3><p>Your physiotherapist visits, assesses you and starts your recovery plan.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section physios-section" id="physios">
          <div className="wrap">
            <div className="results-head">
              <div><span className="section-kicker">OUR PHYSIOTHERAPISTS</span><h2>Meet our physios.</h2><p>Browse profiles, then request a session. Fees and timings are confirmed with you before your visit.</p></div>
              {doctors.length > 3 && <button className="text-link" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `See all ${doctors.length}`} <ArrowRight size={17} /></button>}
            </div>
            {loading ? (
              <p role="status">Loading physiotherapists...</p>
            ) : doctors.length === 0 ? (
              <div className="empty-state">
                <Search size={25} />
                <h3>Physiotherapist profiles are coming soon</h3>
                <p>Tell us what you need and our team will match you with a physiotherapist.</p>
                <button className="btn btn-primary" onClick={() => openBooking()}>Request a session <ArrowRight size={16} /></button>
              </div>
            ) : (
              <div className="doctor-grid">{visibleDoctors.map((d) => <DoctorCard key={d.id} d={d} onView={() => setSelected(d)} onBook={() => openBooking(d)} />)}</div>
            )}
          </div>
        </section>

        <section className="quote-section"><div className="wrap quote-inner"><div className="quote-mark">“</div><div><span className="section-kicker">A MORE COMFORTABLE WAY TO RECOVER</span><h2>Good care meets you<br /><em>where you are.</em></h2><p>At home, on your schedule, with a little more peace of mind.</p></div><div className="quote-art">🌿<span>✦</span></div></div></section>

        <section className="section faq-section" id="faq">
          <div className="wrap faq-grid">
            <div className="section-intro"><span className="section-kicker">GOOD TO KNOW</span><h2>Questions?<br /><em>We've got you.</em></h2><p>Need a hand choosing a session? We're happy to help you figure out the next step.</p><a className="text-link" href={waLink('Hi Physio at Home, I have a question about physiotherapy booking.')} target="_blank" rel="noreferrer">Ask us on WhatsApp <ArrowRight size={16} /></a></div>
            <div className="faq-list">
              {FAQS.map((f, i) => (
                <div className={`faq-item ${faqOpen === i ? 'active' : ''}`} key={f[0]}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i}><span>{f[0]}</span><span className="faq-plus">{faqOpen === i ? '−' : '+'}</span></button>
                  {faqOpen === i && <p>{f[1]}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta"><div className="wrap final-cta-inner"><div><span className="section-kicker">YOUR NEXT STEP CAN BE A SMALL ONE</span><h2>Ready to feel more like <em>you?</em></h2><p>Let's help you explore the right physiotherapy support.</p></div><button className="btn btn-dark" onClick={() => openFind(false)}>Find nearby physio <ArrowRight size={18} /></button></div></section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand"><Brand light /><p>Thoughtful physiotherapy at home,<br />designed around your everyday life.</p><a className="footer-wa" href={waLink()} target="_blank" rel="noreferrer"><MessageCircle size={17} /> +91 77958 55640</a></div>
            <div className="footer-col"><b>Explore</b><a href="#how">How it works</a><a href="#care">Conditions</a><a href="#physios">Physiotherapists</a></div>
            <div className="footer-col"><b>Get in touch</b><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp support ↗</a><a href="#faq">FAQs</a><a href="#book" onClick={(e) => { e.preventDefault(); openBooking(); }}>Request a session</a></div>
            <div className="footer-note"><span className="footer-leaf">✳</span><p>Small steps.<br /><em>Stronger days.</em></p></div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Physio at Home. All rights reserved.</span>
            <span><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a></span>
            <span>Not an emergency service</span>
          </div>
        </div>
      </footer>

      <a className="whatsapp-float" href={waLink()} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={24} /><span>Chat with us</span></a>
      {toast && <div className="toast" role="status" aria-live="polite"><Check size={17} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={15} /></button></div>}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} profile`} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X /></button>
            <DoctorAvatar d={selected} large />
            <span className="section-kicker">PHYSIOTHERAPIST</span>
            <h2>{selected.name}</h2>
            <p className="modal-title">{selected.title}{selected.degree ? ` · ${selected.degree}` : ''}</p>
            <div className="modal-stats">
              {selected.rating && selected.reviews > 0 && <span><Star size={15} fill="currentColor" /> {selected.rating} <small>({selected.reviews} reviews)</small></span>}
              {selected.experience && <span><Clock3 size={15} /> {selected.experience}</span>}
            </div>
            {selected.bio && <p className="modal-bio">{selected.bio}</p>}
            {selected.serviceLocation && <p className="modal-bio"><MapPin size={14} /> Serves {selected.serviceLocation}{selected.serviceRadius ? ` and up to ${selected.serviceRadius} km around` : ''}</p>}
            <div className="tag-row">{selected.specialties.map((s) => <span key={s}>{s}</span>)}</div>
            <div className="modal-price">
              <div><small>Session fee</small><b>{selected.price > 0 ? `₹${selected.price}` : 'Confirmed on booking'}</b></div>
              <button className="btn btn-primary" onClick={() => openBooking(selected)}>Request booking <ArrowRight size={17} /></button>
            </div>
            <p className="modal-disclaimer">Final fee and timing are confirmed with you before your visit.</p>
          </div>
        </div>
      )}

      {find && (
        <FindPhysioDialog
          doctors={doctors}
          loading={loading}
          auto={find.auto}
          onClose={() => setFind(null)}
          onView={(d) => { setFind(null); setSelected(d); }}
          onBook={(d, place) => openBooking(d, '', place && place.label !== 'your current location' ? place.label : '')}
        />
      )}

      {booking && (
        <div className="modal-backdrop" onClick={closeBooking}>
          <div className="booking-modal" role="dialog" aria-modal="true" aria-label="Request a session" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeBooking} aria-label="Close"><X /></button>
            {bookedWith ? (
              <div className="booking-success">
                <span className="mini-icon"><Check size={18} /></span>
                <h2>Request received.</h2>
                <p>Thank you, {bookedWith.name}. Our team will contact you on {bookedWith.phone} to confirm your physiotherapist, time and fee. Your session is not confirmed until we speak.</p>
                <a className="btn btn-primary" target="_blank" rel="noreferrer"
                  href={waLink(`Hi Physio at Home! I just submitted a session request.\nName: ${bookedWith.name}\nPhone: ${bookedWith.phone}\nCondition: ${bookedWith.concern}\nPreferred: ${bookedWith.date}, ${bookedWith.time}${bookedWith.doc ? `\nPhysiotherapist: ${bookedWith.doc.name}` : ''}`)}>
                  Message us on WhatsApp <MessageCircle size={17} />
                </a>
                <button className="outline-btn" onClick={closeBooking}>Close</button>
              </div>
            ) : (
              <>
                <span className="section-kicker">LET'S GET YOU MOVING</span>
                <h2>Request a session.</h2>
                <p className="booking-intro">{booking.doc ? `With ${booking.doc.name}. ` : 'Tell us a little about what you need. '}Fill in your details and our team will contact you to confirm.</p>
                <form onSubmit={onSubmitBooking} className="booking-form">
                  <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <label>Your name<input name="name" required minLength={2} maxLength={100} placeholder="Full name" /></label>
                  <label>Phone number<input name="phone" required inputMode="tel" pattern="[0-9+ ()\-]{8,20}" maxLength={20} placeholder="Your contact number" /></label>
                  <label>Area / address<input name="address" required minLength={2} maxLength={200} placeholder="Area, landmark or pincode" defaultValue={booking.area || ''} /></label>
                  <label>What do you need help with?
                    <select name="concern" defaultValue={booking.condition || ''} required>
                      <option value="" disabled>Select a condition</option>
                      {conditions.map((c) => <option key={c[0]}>{c[0]}</option>)}
                      <option>Other</option>
                    </select>
                  </label>
                  <div className="form-row">
                    <label>Preferred date<input type="date" name="date" required min={todayLocal()} /></label>
                    <label>Preferred time
                      <select name="time" required defaultValue="Morning (9 AM–12 PM)">
                        <option>Morning (9 AM–12 PM)</option>
                        <option>Afternoon (12–4 PM)</option>
                        <option>Evening (4–8 PM)</option>
                      </select>
                    </label>
                  </div>
                  <label>Anything else we should know? (optional)<textarea name="notes" rows={3} maxLength={500} placeholder="Doctor's advice, mobility issues, access to your home..." /></label>
                  <label className="consent">
                    <input type="checkbox" name="consent" required />
                    <span>I agree to the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="/terms" target="_blank" rel="noreferrer">Terms</a>, and consent to Physio at Home contacting me about this request.</span>
                  </label>
                  {bookError && <p className="form-error" role="alert">{bookError}</p>}
                  <button className="btn btn-primary form-submit" type="submit" disabled={sending}>{sending ? 'Sending...' : <>Send request <ArrowRight size={17} /></>}</button>
                  <p className="form-privacy"><ShieldCheck size={14} /> Used only to arrange your session. Not an emergency service. Your request is not confirmed until our team replies.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const path = window.location.pathname.replace(/\/+$/, '') || '/';
let root;
if (path.startsWith('/admin')) {
  const m = document.createElement('meta');
  m.name = 'robots';
  m.content = 'noindex,nofollow';
  document.head.appendChild(m);
  root = <Suspense fallback={null}><AdminPanel /></Suspense>;
} else if (path === '/privacy') {
  root = <LegalPage kind="privacy" />;
} else if (path === '/terms') {
  root = <LegalPage kind="terms" />;
} else {
  root = <App />;
}

createRoot(document.getElementById('root')).render(<ErrorBoundary>{root}</ErrorBoundary>);
