import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowRight, BadgeCheck, CalendarDays, Check, ChevronDown, Clock3, Heart, MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Star, Stethoscope, X, Zap } from 'lucide-react';
import './styles.css';
import BodyMap from './BodyMap';
import AdminPanel from './admin/AdminPanel';
import { useDoctors, normalizeDoctor } from './hooks/useDoctors';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const WA_NUMBER = '917795855640';
const fallbackDoctors = [
  {id:1,name:'Dr. Ananya Rao',initials:'AR',title:'Senior Physiotherapist',degree:'MPT · Orthopaedics',experience:'8 years',rating:'4.9',reviews:128,price:799,availability:'Available today',specialties:['Back & neck pain','Orthopaedic rehab'],emoji:'👩🏻‍⚕️',color:'peach',distance:'1.2 km away',bio:'Focused on helping people return to comfortable, confident everyday movement.'},
  {id:2,name:'Dr. Karthik Menon',initials:'KM',title:'Sports Physiotherapist',degree:'MPT · Sports Rehab',experience:'6 years',rating:'4.8',reviews:96,price:899,availability:'Available today',specialties:['Sports injuries','Post-surgery rehab'],emoji:'👨🏽‍⚕️',color:'blue',distance:'2.4 km away',bio:'Movement-led rehabilitation for active people, athletes and post-injury recovery.'},
  {id:3,name:'Dr. Meera Iyer',initials:'MI',title:'Neuro Physiotherapist',degree:'MPT · Neurology',experience:'10 years',rating:'5.0',reviews:174,price:999,availability:'Tomorrow, 9 AM',specialties:['Neuro rehab','Senior care'],emoji:'👩🏽‍⚕️',color:'lilac',distance:'3.1 km away',bio:'Patient, goal-oriented care for mobility, balance and neurological rehabilitation.'},
  {id:4,name:'Dr. Rahul Verma',initials:'RV',title:'Musculoskeletal Physio',degree:'BPT · Manual Therapy',experience:'5 years',rating:'4.8',reviews:83,price:699,availability:'Available today',specialties:['Back & neck pain','Shoulder pain'],emoji:'👨🏻‍⚕️',color:'sage',distance:'3.8 km away',bio:'Practical, personalised care for joint stiffness, posture and day-to-day pain.'},
  {id:5,name:'Dr. Nisha Thomas',initials:'NT',title:'Rehabilitation Specialist',degree:'MPT · Rehabilitation',experience:'7 years',rating:'4.9',reviews:112,price:849,availability:'Tomorrow, 11 AM',specialties:['Post-surgery rehab','Senior care'],emoji:'👩🏼‍⚕️',color:'rose',distance:'4.5 km away',bio:'Supporting recovery after surgery with clear goals and an encouraging approach.'}
];
const conditions = [ ['Back pain','↗','Relieve stiffness and improve movement'], ['Neck & shoulder','◉','Feel easier at your desk and at home'], ['Knee pain','⌁','Build strength and everyday confidence'], ['Sports injury','✳','Return to activity at your pace'], ['Post-surgery','＋','Guided recovery after an operation'], ['Senior care','♡','Balance, mobility and independence'] ];
const waLink = (message='Hi Physio at Home! I would like to know more about booking a physiotherapy session.') => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

// Date input minimum must use the visitor's local calendar date, not UTC (which can be tomorrow in India).
const todayLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function Brand({light=false}) { return <a className={`brand ${light?'brand-light':''}`} href="#home" aria-label="Physio at Home home"><span className="brand-mark"><Activity size={19}/></span><span>physio <i>at home</i></span></a> }
function JoinTherapist({ onBack }) {
  const FOUNDER_WHATSAPP = WA_NUMBER;

  const [form, setForm] = React.useState({
    name: '', phone: '', email: '', qualification: '',
    experience: '', specialties: '', city: '', regNo: '', about: ''
  });
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.qualification.trim() || !form.city.trim()) {
      setError('Please fill in name, phone, qualification and city.');
      return;
    }
    if (form.name.trim().length > 100 || form.phone.trim().length > 20 || form.email.trim().length > 254 || form.qualification.trim().length > 120 || form.city.trim().length > 120 || form.specialties.trim().length > 300 || form.regNo.trim().length > 100 || form.about.trim().length > 2000) {
      setError('Please shorten one or more fields to fit the allowed limits.');
      return;
    }
    if (!/^[0-9+() -]{8,20}$/.test(form.phone.trim())) {
      setError('Enter a valid phone number using 8–20 digits or phone symbols.');
      return;
    }
    const experience = form.experience === '' ? null : Number(form.experience);
    if (experience !== null && (!Number.isFinite(experience) || experience < 0 || experience > 80)) {
      setError('Experience must be a number between 0 and 80 years.');
      return;
    }
    if (submitting) return;
    if (!e.currentTarget.elements.namedItem('applicationConsent')?.checked) {
      setError('Please consent to storing your details so we can review your application.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError('Applications are temporarily unavailable. Please contact our team directly.');
      return;
    }
    setError('');
    setSubmitting(true);
    const message =
`*New Physiotherapist Application*

*Name:* ${form.name}
*Phone:* ${form.phone}
*Email:* ${form.email || '-'}
*Qualification:* ${form.qualification}
*Experience:* ${form.experience || '-'} years
*Specialties:* ${form.specialties || '-'}
*City / Clinic:* ${form.city}
*Registration No:* ${form.regNo || '-'}
*About:* ${form.about || '-'}`;
    const waWindow = window.open('about:blank', '_blank');
    try {
      const { error: insertError } = await supabase.from('therapist_applications').insert({
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || null,
        qualification: form.qualification.trim(),
        experience_years: experience,
        specialties: form.specialties.trim() || null, city: form.city.trim(),
        reg_no: form.regNo.trim() || null, about: form.about.trim() || null,
        consent: true, status: 'new'
      });
      if (insertError) throw insertError;
      if (waWindow) waWindow.location.href = `https://wa.me/${FOUNDER_WHATSAPP}?text=${encodeURIComponent(message)}`;
      setError('Application saved. Send the WhatsApp message if you would also like to contact the team immediately.');
    } catch (error) {
      if (waWindow) waWindow.close();
      setError('We could not save your application. Please try again later.');
      console.error('Therapist application submission failed:', error?.message);
    } finally {
      setSubmitting(false);
    }
  };
  const field = { width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>← Back</button>
      <h2>Join as a Physiotherapist</h2>
      <p>Fill in your details and we'll get back to you.</p>

      <form onSubmit={submit}>
        <input style={field} name="name" placeholder="Full name *" value={form.name} onChange={update} required minLength={2} maxLength={100} autoComplete="name" />
        <input style={field} name="phone" type="tel" placeholder="Phone number *" value={form.phone} onChange={update} required minLength={8} maxLength={20} pattern="[0-9+() -]{8,20}" autoComplete="tel" />
        <input style={field} name="email" type="email" placeholder="Email" value={form.email} onChange={update} maxLength={254} autoComplete="email" />
        <input style={field} name="qualification" placeholder="Qualification (e.g. BPT, MPT) *" value={form.qualification} onChange={update} required maxLength={120} />
        <input style={field} name="experience" type="number" min="0" max="80" step="1" placeholder="Years of experience" value={form.experience} onChange={update} />
        <input style={field} name="specialties" placeholder="Specialties (back pain, sports, senior care...)" value={form.specialties} onChange={update} maxLength={300} />
        <input style={field} name="city" placeholder="City / Clinic name *" value={form.city} onChange={update} required maxLength={120} />
        <input style={field} name="regNo" placeholder="Registration / license number" value={form.regNo} onChange={update} maxLength={100} />
        <textarea style={{ ...field, minHeight: 90 }} name="about" placeholder="Tell us about yourself" value={form.about} onChange={update} maxLength={2000} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '8px 0 14px', fontSize: 14 }}><input type="checkbox" name="applicationConsent" required style={{ marginTop: 4 }} /> I agree that Physio at Home may store and review my application details to contact me about opportunities.</label>
        {error && <p style={{ color: error.startsWith('Application saved') ? 'green' : 'crimson' }} role="status">{error}</p>}

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#25D366', color: '#fff', border: 'none', fontSize: 16, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Saving application…' : 'Save application & continue to WhatsApp'}
        </button>
      </form>
    </div>
  );
}
function App(){
 const { doctors, status: doctorsStatus, error: doctorsError } = useDoctors(fallbackDoctors);
 const [splash,setSplash]=useState(true); const [menuOpen,setMenuOpen]=useState(false); const [query,setQuery]=useState(''); const [condition,setCondition]=useState(''); const [care,setCare]=useState('Home visit'); const [location,setLocation]=useState(''); const [searching,setSearching]=useState(false); const [results,setResults]=useState(false); const [selected,setSelected]=useState(null); const [booking,setBooking]=useState(null); const [faqOpen,setFaqOpen]=useState(0); const [toast,setToast]=useState(''); const [page,setPage]=useState('home');
 useEffect(()=>{const t=setTimeout(()=>setSplash(false),1500);return()=>clearTimeout(t)},[]);
 useEffect(()=>{if(searching){const t=setTimeout(()=>{setSearching(false);setResults(true);document.getElementById('results')?.scrollIntoView({behavior:'smooth',block:'start'})},2600); return()=>clearTimeout(t)}},[searching]);
 const runId = useRef(0);
  const [nearby, setNearby] = useState(null);
  const [coords, setCoords] = useState(null);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [nearbyLocation, setNearbyLocation] = useState('');
  const [nearbyMessage, setNearbyMessage] = useState('');
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startModalPain, setStartModalPain] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [areaSuggestionsOpen, setAreaSuggestionsOpen] = useState(false);
  const [locationMatches, setLocationMatches] = useState([]);
  const [locationResultsOpen, setLocationResultsOpen] = useState(false);

  const serviceAreas = useMemo(() => {
    // Present concise locality names in the dropdown, not full city/state/country strings.
    const values = doctors.flatMap((doctor) => [
      String(doctor.serviceLocation || '').split(',')[0],
      ...(Array.isArray(doctor.serviceAreas) ? doctor.serviceAreas : [])
    ]).map((value) => String(value || '').trim()).filter(Boolean);
    const unique = new Map();
    // Keep the first spelling seen so a lower-case duplicate cannot replace a properly capitalised area name.
    values.forEach((value) => { const key = value.toLocaleLowerCase(); if (!unique.has(key)) unique.set(key, value); });
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  const openStartModal = (detail = null) => { setStartModalPain(detail?.label ? `Looking for help with: ${detail.label.toLowerCase()} pain` : ''); setStartModalOpen(true); setLocationSearch(''); setAreaSuggestionsOpen(false); };
  const closeStartModal = () => { setStartModalOpen(false); setAreaSuggestionsOpen(false); };
  const selectServiceArea = (area) => {
    const normalizedArea = String(area || '').trim().toLocaleLowerCase();
    if (!normalizedArea) return;
    setLocationSearch(area); setStartModalOpen(false); setAreaSuggestionsOpen(false);
    const matches = doctors.filter((doctor) => [doctor.serviceLocation || '', ...(Array.isArray(doctor.serviceAreas) ? doctor.serviceAreas : [])]
      .map((value) => String(value || '').trim().toLocaleLowerCase()).filter(Boolean)
      .some((value) => value === normalizedArea || value.includes(normalizedArea) || normalizedArea.includes(value)));
    if (!matches.length) { setToast('No physiotherapist is currently listed for this area. Please try another area.'); setTimeout(() => setToast(''), 5000); return; }
    if (matches.length === 1) { setSelected(matches[0]); return; }
    setLocationMatches(matches); setLocationResultsOpen(true);
  };

  const closeNearby = () => { runId.current++; setNearby(null); setNearbyMessage(''); };

  const searchNearbyCoords = async (lat, lng, label = '') => {
    const id = ++runId.current;
    setCoords({ lat, lng });
    setNearbyLocation(label);
    setNearbyDoctors([]);
    setNearby('searching');
    setNearbyMessage('');
    if (!isSupabaseConfigured || !supabase) {
      setNearby('error');
      setNearbyMessage('Nearby search is not configured yet. Please contact our team or try again later.');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('physios_near', { p_lat: lat, p_lng: lng });
      if (id !== runId.current) return;
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) {
        setNearbyDoctors([]);
        setNearby('empty');
        setNearbyMessage('Sorry, no service is available within the providers’ configured service radius of this location. Try another location.');
        return;
      }
      // Fetch the public profile fields directly so the result does not depend on
      // whether the homepage profile hook has finished loading yet.
      const ids = rows.map((row) => String(row.physio_id)).filter(Boolean);
      const { data: profiles, error: profileError } = await supabase
        .from('physiotherapists')
        .select('id,name,initials,title,degree,experience_years,specialties,conditions,services,service_areas,languages,bio,price,availability,rating,reviews,emoji,color,photo_path,gallery_paths,display_order,featured,status,service_location,service_radius_km')
        .in('id', ids)
        .eq('status', 'published');
      if (id !== runId.current) return;
      if (profileError) throw profileError;
      const profilesById = new Map((profiles || []).map((profile, index) => [String(profile.id), normalizeDoctor(profile, index)]));
      const normalized = rows.map((row) => {
        const profile = profilesById.get(String(row.physio_id));
        if (!profile) return null;
        const distanceKm = Number(row.distance_km);
        return { ...profile, distance: Number.isFinite(distanceKm) ? distanceKm.toFixed(1) + ' km away' : '' };
      }).filter(Boolean);
      setNearbyDoctors(normalized);
      setNearby(normalized.length ? 'results' : 'empty');
      if (!normalized.length) setNearbyMessage('Sorry, no service is available within the providers’ configured service radius of this location. Try another location.');
    } catch {
      if (id !== runId.current) return;
      setNearby('error');
      setNearbyMessage('Nearby search is temporarily unavailable. The secure location-search service may need to be enabled. You can try another location or contact our team.');
    }
  };

  const startNearby = () => {
    const id = ++runId.current;
    setNearby('locating');
    setCoords(null);
    setNearbyDoctors([]);
    setNearbyLocation('');
    setNearbyMessage('');
    if (!navigator.geolocation) {
      setNearby('manual');
      setNearbyMessage('Your browser does not support automatic location. Enter an area below.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => { if (id === runId.current) void searchNearbyCoords(p.coords.latitude, p.coords.longitude); },
      () => {
        if (id !== runId.current) return;
        setNearby('manual');
        setNearbyMessage('We could not access your location. Enter an area or allow location access and try again.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const searchNearbyByText = async (e) => {
    e?.preventDefault();
    const q = nearbyLocation.trim();
    if (!q) { setNearbyMessage('Enter a city, area or full address to search.'); return; }
    const id = ++runId.current;
    setNearby('searching');
    setNearbyMessage('');
    try {
      const response = await fetch('https://photon.komoot.io/api/?q=' + encodeURIComponent(q + ', Bengaluru, Karnataka, India') + '&limit=5');
      if (!response.ok) throw new Error('Geocoding failed');
      const json = await response.json();
      const features = Array.isArray(json?.features) ? json.features : [];
      // This service currently operates in Bengaluru only. Never geocode a result
      // from another city and accidentally use it for a local provider search.
      const feature = features.find((item) => {
        const p = item?.properties || {};
        const city = String(p.city || p.name || '').toLowerCase();
        const district = String(p.district || '').toLowerCase();
        const state = String(p.state || '').toLowerCase();
        const country = String(p.country || '').toLowerCase();
        return country === 'india' && state.includes('karnataka') &&
          (city.includes('bengaluru') || city.includes('bangalore') || district.includes('bengaluru') || district.includes('bangalore'));
      });
      const point = feature && feature.geometry && feature.geometry.coordinates;
      if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1]))) {
        if (id === runId.current) { setNearby('manual'); setNearbyMessage('We could not find that Bengaluru location. This service currently covers Bengaluru, Karnataka only. Try a more specific Bengaluru area or address.'); }
        return;
      }
      if (id !== runId.current) return;
      const p = feature.properties || {};
      const label = [p.name, p.district, p.city, p.state, p.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
      await searchNearbyCoords(Number(point[1]), Number(point[0]), label || q);
    } catch {
      if (id === runId.current) { setNearby('manual'); setNearbyMessage('We could not look up that location right now. Check your connection and try again.'); }
    }
  };

  useEffect(() => {
    document.body.style.overflow = nearby ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [nearby]);
  const filtered=useMemo(()=>doctors.filter(d=>{const text=(query+' '+condition).toLowerCase();return !text||d.name.toLowerCase().includes(text)||d.title.toLowerCase().includes(text)||d.specialties.join(' ').toLowerCase().includes(text)||['back pain','neck pain','knee pain','physio','physiotherapist','sports','senior care','shoulder'].some(x=>text.includes(x)&& (d.specialties.join(' ').toLowerCase().includes(x)||d.title.toLowerCase().includes(x)))}),[query,condition,doctors]);
 const startSearch=()=>{setResults(false);setSearching(true)};
 const book=(doc)=>{setBooking(doc);setSelected(null)};
 const submitBooking=async(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);if(f.get('consent')!=='on'){setToast('Please consent to storing your details so we can process your request.');return}const msg=`Hi Physio at Home! I'd like to request a ${care.toLowerCase()} appointment.\nPhysiotherapist: ${booking?.name||'Please suggest a nearby physiotherapist'}\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nArea/address: ${f.get('address')}\nCondition: ${f.get('concern')}\nPreferred date: ${f.get('date')}\nPreferred time: ${f.get('time')}`;const waWindow=window.open('about:blank','_blank');if(!isSupabaseConfigured||!supabase){if(waWindow)waWindow.close();setToast('Booking is temporarily unavailable. Please contact our team directly.');return}try{const {error}=await supabase.from('booking_requests').insert({name:String(f.get('name')).trim(),phone:String(f.get('phone')).trim(),area:String(f.get('address')).trim(),condition:String(f.get('concern')||''),care_type:care,preferred_time:String(f.get('date')+' · '+f.get('time')),notes:'Submitted via website. Appointment is not confirmed until the team replies.',physio_id:booking?.id?String(booking.id):null,consent:true,status:'new'});if(error)throw error;if(waWindow)waWindow.location.href=waLink(msg);setBooking(null);setToast('Your request has been saved. Send the WhatsApp message to coordinate with our team.')}catch(error){if(waWindow)waWindow.close();setToast('We could not save your request. Please try again or contact our team.');console.error('Booking submission failed:',error?.message)}setTimeout(()=>setToast(''),6000)};
 if (page === 'join') return <JoinTherapist onBack={() => setPage('home')} />;
 return <>
 {doctorsStatus === "error" && <div role="status" className="wrap" style={{padding:"12px 20px",color:"var(--muted)"}}>{doctorsError}</div>}
  {doctorsStatus === "empty" && <div role="status" className="wrap" style={{padding:"12px 20px",color:"var(--muted)"}}>No published physiotherapist profiles are available yet. Please contact our team for assistance.</div>}
  {splash&&<div className="splash"><div className="splash-logo"><span className="brand-mark big"><Activity size={30}/></span><div className="splash-name">physio <i>at home</i></div></div><div className="splash-line"><span/></div><p>Care that comes to you.</p></div>}
 <header className="header"><div className="nav wrap"><Brand/><nav className={menuOpen?'nav-links open':'nav-links'}><a href="#how" onClick={()=>setMenuOpen(false)}>How it works</a><a href="#care" onClick={()=>setMenuOpen(false)}>Conditions</a><a href="#physios" onClick={()=>setMenuOpen(false)}>Our physios</a><a href="#faq" onClick={()=>setMenuOpen(false)}>FAQs</a><a className="nav-cta" href={waLink('Hi! I need help booking a physiotherapist.')} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Talk to us</a></nav><button className="menu-toggle" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?<X/>:<Menu/>}</button></div></header>
 <main>
 <section className="hero" id="home"><div className="hero-glow"/><div className="wrap hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> PHYSIOTHERAPY, REIMAGINED</div><h1>Find physiotherapy<br/><em>that fits your life.</em></h1><p className="hero-sub">Explore physiotherapist profiles and request home, clinic or online care in Bengaluru. The team will confirm provider availability and appointment details with you.</p><div className="hero-actions"><button className="btn btn-primary" onClick={openStartModal}>Find nearby physio <ArrowRight size={18}/></button><button className="outline-btn" onClick={()=>{setPage('join');window.scrollTo(0,0)}}>Join as Physiotherapist</button><a className="text-link" href="#how">See how it works <ArrowDownRight size={17}/></a></div><div className="hero-proof"><div><strong>3 <small>ways</small></strong><span>home, clinic or online</span></div><div><strong>1:1</strong><span>request coordination</span></div><div><strong>BLR</strong><span>Bengaluru service area</span></div></div><p className="disclaimer">Profiles help you compare care options. Confirm availability and final appointment details with our team.</p></div>
 <div className="hero-visual"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="hero-card top-card"><span className="mini-icon"><ShieldCheck size={16}/></span><div><b>Care, made personal</b><small>Find the right kind of support</small></div><span className="tiny-check"><Check size={13}/></span></div><div className="hero-person"><div className="person-halo"/><div className="person-emoji">🧑🏻‍⚕️</div><div className="person-spark spark-a">✦</div><div className="person-spark spark-b">✳</div><div className="home-base"><span><Activity size={22}/></span><div><b>Good care starts here</b><small>At your place. At your pace.</small></div></div></div><div className="hero-card floating-card"><div className="avatar-stack"><span>👩🏻‍⚕️</span><span>👨🏽‍⚕️</span><span>👩🏽‍⚕️</span></div><div><b>Care for your needs</b><small>Browse physiotherapist profiles</small></div><span className="online-dot"/></div><div className="float-label label-left"><Heart size={15}/> A little care goes far</div><div className="float-label label-right"><MapPin size={15}/> Care comes to you</div></div></div>   </section><BodyMap onFind={openStartModal}/> {startModalOpen&&<div className="start-overlay" role="dialog" aria-modal="true" aria-labelledby="start-modal-title" onClick={closeStartModal}>
   <section className="start-modal" onClick={e=>e.stopPropagation()}>
     <button className="start-close" onClick={closeStartModal} aria-label="Close Get started dialog"><X size={20}/></button>
     <span className="section-kicker">YOUR CARE, YOUR WAY</span>
     <h2 id="start-modal-title">How would you like to find a physio?</h2>
     {startModalPain && <p className="start-modal-intro" role="status">{startModalPain}</p>}<p className="start-modal-intro">Choose the quickest way to find physiotherapy support in your area.</p>
     <div className="start-options">
       <button className="start-option start-option-nearby" onClick={()=>{closeStartModal();startNearby();}}>
         <span className="start-option-icon"><MapPin size={25}/></span>
         <span className="start-option-copy"><strong>Find nearby physio</strong><small>Use your current location to check nearby providers.</small></span>
         <ArrowRight className="start-option-arrow" size={20}/>
       </button>
       <div className="start-location-option">
         <span className="start-option-icon"><Search size={25}/></span>
         <div className="start-location-content">
           <label htmlFor="start-location-search">Search physio by location</label>
           <p>Type an area listed on a physiotherapist's profile.</p>
            <button
              type="button"
              className="start-search-wrap start-area-select"
              id="start-location-search"
              aria-haspopup="listbox"
              aria-expanded={areaSuggestionsOpen}
              aria-controls="start-area-suggestions"
              onClick={() => setAreaSuggestionsOpen(open => !open)}
              onKeyDown={e => { if (e.key === 'Escape') setAreaSuggestionsOpen(false); }}
            >
              <Search size={18}/>
              <span className={locationSearch ? 'start-area-value' : 'start-area-placeholder'}>{locationSearch || 'Choose a service area...'}</span>
              <ChevronDown size={17} className={areaSuggestionsOpen ? 'start-area-chevron is-open' : 'start-area-chevron'}/>
            </button>
            {areaSuggestionsOpen&&<div className="start-suggestions" id="start-area-suggestions" role="listbox" aria-label="Available physiotherapist service areas">
              {serviceAreas.map(area=><button type="button" role="option" aria-selected={locationSearch === area} key={area} onClick={()=>selectServiceArea(area)}><MapPin size={15}/><span>{area}</span><ArrowRight size={15}/></button>)}
              {!serviceAreas.length&&<p className="start-no-areas">No service areas are available yet. Please try finding a nearby physio.</p>}
            </div>}
         </div>
       </div>
     </div>
     <p className="start-modal-footnote">Only areas saved to published physiotherapist profiles are suggested.</p>
   </section>
 </div>}
 {locationResultsOpen&&<div className="start-overlay" role="dialog" aria-modal="true" aria-labelledby="location-results-title" onClick={()=>setLocationResultsOpen(false)}>
   <section className="start-modal start-results-modal" onClick={e=>e.stopPropagation()}>
     <button className="start-close" onClick={()=>setLocationResultsOpen(false)} aria-label="Close location results"><X size={20}/></button>
     <span className="section-kicker">MATCHED TO YOUR AREA</span>
     <h2 id="location-results-title">Physiotherapists in {locationSearch}</h2>
     <p className="start-modal-intro">Choose a profile to view details and request a session.</p>
     <div className="start-results-list">{locationMatches.map(doctor=><DoctorCard key={doctor.id} d={doctor} onView={()=>{setLocationResultsOpen(false);setSelected(doctor);}} onBook={()=>{setLocationResultsOpen(false);book(doctor);}}/>)}</div>
   </section>
 </div>}
 {nearby&&<div className="nb-overlay" role="dialog" aria-modal="true" aria-labelledby="nearby-title">
  <div className={nearby==='results'?'nb-sheet':'nb-stage'}>
    <button className="nb-close" onClick={closeNearby} aria-label="Close nearby search"><X size={20}/></button>
    {nearby==='locating'||nearby==='searching'?<>
      <div className={'nb-radar '+nearby}><span className="nb-ring r1"/><span className="nb-ring r2"/><span className="nb-ring r3"/><span className="nb-sweep"/><div className="nb-me"><MapPin size={26}/></div></div>
      <h2 id="nearby-title" className="nb-title">{nearby==='locating'?'Checking your location...':'Searching for available physiotherapists...'}</h2>
      <p className="nb-sub">{nearby==='locating'?'Please allow location access if your browser asks.':'Checking published physiotherapists whose service radius covers this location.'}</p>
      <button className="nb-cancel" onClick={closeNearby}>Cancel</button>
    </>:<>
      <div className="nb-sheet-head"><div><span className="section-kicker">NEARBY CARE</span>
        <h2 id="nearby-title">{nearby==='results'?nearbyDoctors.length+' physio'+(nearbyDoctors.length===1?'':'s')+' found nearby':nearby==='empty'?'Sorry, no service available':nearby==='error'?'Nearby search unavailable':'Find care in your area'}</h2>
        <p>{coords?('Searching near '+(nearbyLocation || (coords.lat.toFixed(3)+', '+coords.lng.toFixed(3)))+'. Results are limited to each provider’s saved service radius (10 km by default).'):'Use your current location or enter an area to check coverage.'}</p>
      </div></div>
      {nearbyMessage&&<p role="status" className="nb-sub">{nearbyMessage}</p>}
      {(nearby==='manual'||nearby==='empty'||nearby==='error')&&<form className="nb-location-form" onSubmit={searchNearbyByText}>
        <label htmlFor="nearby-location">Search by area or address</label>
        <input id="nearby-location" value={nearbyLocation} onChange={e=>setNearbyLocation(e.target.value)} placeholder="e.g. Kengeri, Bengaluru" autoComplete="street-address"/>
        <button className="btn btn-primary" type="submit">Search location <Search size={15}/></button>
        <button className="outline-btn" type="button" onClick={startNearby}>Use my current location <MapPin size={15}/></button>
      </form>}
      {nearby==='results'&&<>
        <div className="nb-list">{nearbyDoctors.map(d=><DoctorCard key={d.id} d={d} onView={()=>{closeNearby();setSelected(d)}} onBook={()=>book(d)}/>)}</div>
        <form className="nb-location-form" onSubmit={searchNearbyByText}>
          <label htmlFor="nearby-location">Search another location</label>
          <input id="nearby-location" value={nearbyLocation} onChange={e=>setNearbyLocation(e.target.value)} placeholder="Enter another area or address" autoComplete="street-address"/>
          <button className="outline-btn" type="submit">Search another area <Search size={15}/></button>
        </form>
      </>}
      <button className="nb-cancel" onClick={closeNearby}>Close</button>
    </>}
  </div>
</div>}{searching&&<div className="search-overlay"><div className="searching-box"><div className="orbit-search"><div className="search-ring"/><div className="search-center"><MapPin size={30}/><span>YOU</span></div>{['👩🏻‍⚕️','👨🏽‍⚕️','👩🏽‍⚕️','👨🏻‍⚕️','👩🏼‍⚕️'].map((e,i)=><div className={`orbit-doc doc-${i}`} key={i}>{e}</div>)}</div><span className="section-kicker">ONE MOMENT, PLEASE</span><h2>Finding your nearby physio<span className="ellipsis">...</span></h2><p>Looking for a match for your care needs{location?` near ${location}`:''}.</p><div className="search-progress"><span/></div><div className="searching-note"><span className="pulse-dot"/> Matching physiotherapists to your preferences</div><button className="cancel-search" onClick={()=>setSearching(false)}>Cancel search</button></div></div>}
 {results&&<section className="results-section" id="results"><div className="wrap"><div className="results-head"><div><span className="section-kicker">YOUR SHORTLIST</span><h2>Meet your care team.</h2><p>Explore physiotherapist profiles and contact our team to confirm availability.</p></div><button className="outline-btn" onClick={()=>{setResults(false);document.getElementById('find')?.scrollIntoView({behavior:'smooth'})}}>Edit search <Search size={15}/></button></div><div className="doctor-grid">{filtered.map(d=><DoctorCard key={d.id} d={d} onView={()=>setSelected(d)} onBook={()=>book(d)}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search size={25}/><h3>No exact matches yet</h3><p>Try another condition or message our team for help finding the right care.</p><a className="btn btn-primary" href={waLink()} target="_blank" rel="noreferrer">Ask on WhatsApp <MessageCircle size={16}/></a></div>}</div></section>}
 <section className="trust-strip"><div className="wrap trust-grid"><div><ShieldCheck/><span><b>Profiles to explore</b><small>Know who you're contacting</small></span></div><div><Clock3/><span><b>Flexible scheduling</b><small>Ask for a time that works</small></span></div><div><Heart/><span><b>Care that feels human</b><small>Personal, thoughtful support</small></span></div><div><MessageCircle/><span><b>Real conversations</b><small>WhatsApp booking support</small></span></div></div></section>
 <section className="section care-section" id="care"><div className="wrap"><div className="section-intro"><span className="section-kicker">START WITH WHAT YOU FEEL</span><h2>Whatever's slowing you down,<br/><em>let's work on it.</em></h2><p>Explore common reasons people look for physiotherapy. A physiotherapist can help assess what support may be right for you.</p></div><div className="condition-grid">{conditions.map((c,i)=><button className="condition-card" key={c[0]} onClick={()=>{setCondition(c[0]);setResults(false);document.getElementById('find')?.scrollIntoView({behavior:'smooth'});}}><span className={`condition-symbol symbol-${i}`}>{c[1]}</span><span className="condition-name">{c[0]}</span><span className="condition-desc">{c[2]}</span><span className="condition-arrow"><ArrowRight size={17}/></span></button>)}</div><p className="medical-note">Physiotherapy is not an emergency service. For sudden severe symptoms, seek urgent medical care.</p></div></section>
 <section className="section how-section" id="how"><div className="wrap how-grid"><div className="section-intro how-intro"><span className="section-kicker">SIMPLE FROM THE FIRST TAP</span><h2>Care, without<br/><em>the extra steps.</em></h2><p>Finding support should feel easier. Here's how the Physio at Home experience is designed to work.</p><button className="btn btn-primary" onClick={openStartModal}>Get started <ArrowRight size={17}/></button></div><div className="steps-list"><div className="step-item"><div className="step-num">01</div><div className="step-icon"><Search size={22}/></div><div><h3>Tell us what you need</h3><p>Choose a condition, share your area and explore physiotherapist profiles that fit your preferences.</p></div></div><div className="step-item"><div className="step-num">02</div><div className="step-icon"><CalendarDays size={22}/></div><div><h3>Request your session</h3><p>Pick a preferred date and time. Send your request through WhatsApp to coordinate the next step.</p></div></div><div className="step-item"><div className="step-num">03</div><div className="step-icon"><Heart size={22}/></div><div><h3>Take the next step</h3><p>Confirm the details directly with the care team before your appointment is finalised.</p></div></div></div></div></section>
 <section className="section physios-section" id="physios"><div className="wrap"><div className="results-head"><div><span className="section-kicker">A FRIENDLY PLACE TO START</span><h2>Meet our physiotherapists.</h2><p>Compare physiotherapists by care type, experience and listed fees. Confirm availability and appointment details with our team.</p></div><button className="text-link" onClick={()=>{setResults(true);document.getElementById('results')?.scrollIntoView({behavior:'smooth'})}}>Explore all profiles <ArrowRight size={17}/></button></div><div className="doctor-grid">{doctors.slice(0,3).map(d=><DoctorCard key={d.id} d={d} onView={()=>setSelected(d)} onBook={()=>book(d)}/>)}</div></div></section>
 <section className="quote-section"><div className="wrap quote-inner"><div className="quote-mark">“</div><div><span className="section-kicker">A MORE COMFORTABLE WAY TO RECOVER</span><h2>Good care meets you<br/><em>where you are.</em></h2><p>At home, on your schedule, with a little more peace of mind.</p></div><div className="quote-art">🌿<span>✦</span></div></div></section>
 <section className="section faq-section" id="faq"><div className="wrap faq-grid"><div className="section-intro"><span className="section-kicker">GOOD TO KNOW</span><h2>Questions?<br/><em>We've got you.</em></h2><p>Need a hand choosing a session? We're happy to help you figure out the next step.</p><a className="text-link" href={waLink('Hi Physio at Home, I have a question about physiotherapy booking.')} target="_blank" rel="noreferrer">Ask us on WhatsApp <ArrowRight size={16}/></a></div><div className="faq-list">{[
 ['How do I book a physiotherapist?','Choose your condition and care type, compare physiotherapist profiles, then submit a booking request. WhatsApp opens with your details so our team can help coordinate.'],
 ['Are the doctor profiles on this site real?','We list physiotherapists to help you compare care options. You can contact our team to confirm provider details and availability before booking.'],
 ['Is my appointment confirmed after I click book?','No. Submitting sends a booking request and opens WhatsApp. Your team must confirm the appointment directly.'],
 ['Can I request online or clinic-based care?','Yes. You can request home visits, online consultations and clinic visits. Available services depend on the service options listed on each profile.'],
 ['How much does a session cost?','Listed fees are intended as a guide. Please confirm the final fee with the physiotherapist before your appointment.'],
 ['What if I need urgent medical help?','Physiotherapy booking is not an emergency service. If you have sudden weakness, chest pain, a serious injury or another urgent symptom, contact emergency medical services.']
 ].map((f,i)=><div className={`faq-item ${faqOpen===i?'active':''}`} key={f[0]}><button onClick={()=>setFaqOpen(faqOpen===i?-1:i)}><span>{f[0]}</span><span className="faq-plus">{faqOpen===i?'−':'+'}</span></button>{faqOpen===i&&<p>{f[1]}</p>}</div>)}</div></div></section>
 <section className="final-cta"><div className="wrap final-cta-inner"><div><span className="section-kicker">YOUR NEXT STEP CAN BE A SMALL ONE</span><h2>Ready to feel more like <em>you?</em></h2><p>Let's help you explore the right physiotherapy support.</p></div><button className="btn btn-dark" onClick={openStartModal}>Find nearby physio <ArrowRight size={18}/></button></div></section>
 </main>
 <footer className="footer"><div className="wrap"><div className="footer-top"><div className="footer-brand"><Brand light/><p>Thoughtful physiotherapy discovery,<br/>designed around your everyday life.</p><a className="footer-wa" href={waLink()} target="_blank" rel="noreferrer"><MessageCircle size={17}/> +91 77958 55640</a></div><div className="footer-col"><b>Explore</b><a href="#how">How it works</a><a href="#care">Conditions</a><a href="#physios">Physiotherapists</a></div><div className="footer-col"><b>Get in touch</b><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp support ↗</a><a href="#faq">FAQs</a><button className="footer-action-link" onClick={openStartModal}>Request a session</button></div><div className="footer-note"><span className="footer-leaf">✳</span><p>Small steps.<br/><em>Stronger days.</em></p></div></div><div className="footer-bottom"><span>© 2026 Physio at Home. All rights reserved.</span><span>Physiotherapy at home, clinic or online</span><a href={waLink()} target="_blank" rel="noreferrer">Made for better movement <Heart size={12}/></a></div></div></footer>
 <a className="whatsapp-float" href={waLink()} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={24}/><span>Chat with us</span></a>
 {toast&&<div className="toast"><Check size={17}/>{toast}<button onClick={()=>setToast('')} aria-label="Dismiss"><X size={15}/></button></div>}
 {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><DoctorAvatar d={selected} large/><span className="section-kicker">PHYSIOTHERAPIST PROFILE</span><h2>{selected.name}</h2><p className="modal-title">{selected.title} · {selected.degree}</p><div className="modal-stats"><span><Star size={15} fill="currentColor"/> {selected.rating} <small>({selected.reviews} reviews)</small></span><span><Clock3 size={15}/> {selected.experience}</span></div><p className="modal-bio">{selected.bio}</p><div className="tag-row">{selected.specialties.map(s=><span key={s}>{s}</span>)}</div><div className="modal-price"><div><small>Session fee</small><b>₹{selected.price}</b></div><button className="btn btn-primary" onClick={()=>book(selected)}>Request booking <ArrowRight size={17}/></button></div><p className="modal-disclaimer">Please confirm availability and appointment details with our team before booking.</p></div></div>}
 {booking&&<div className="modal-backdrop" onClick={()=>setBooking(null)}><div className="booking-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setBooking(null)} aria-label="Close"><X/></button><span className="section-kicker">LET'S GET YOU MOVING</span><h2>Request a session.</h2><p className="booking-intro">{booking?`With ${booking.name}`:'Tell us a little about what you need.'} Save your request securely, then continue in WhatsApp.</p><form onSubmit={submitBooking} className="booking-form"><label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name"/></label><label>Phone number<input name="phone" required inputMode="tel" autoComplete="tel" maxLength={20} pattern="[0-9+() -]{8,20}" title="Enter 8–20 characters using digits, spaces, +, parentheses or hyphens." placeholder="Your contact number"/></label><label>Area / address<input name="address" required maxLength={250} autoComplete="street-address" placeholder="Area, landmark or pincode" defaultValue={location}/></label><label>What do you need help with?<select name="concern" defaultValue={condition||''} required><option value="" disabled>Select a condition</option>{conditions.map(c=><option key={c[0]}>{c[0]}</option>)}</select></label><div className="form-row"><label>Preferred date<input type="date" name="date" required min={todayLocal()}/></label><label>Preferred time<select name="time" required defaultValue="Morning (9 AM–12 PM)"><option>Morning (9 AM–12 PM)</option><option>Afternoon (12–4 PM)</option><option>Evening (4–8 PM)</option></select></label></div><label className="form-privacy"><input type="checkbox" name="consent" required/> I agree that Physio at Home may store and use these details to respond to my request.</label><button className="btn btn-primary form-submit" type="submit">Save request & continue <MessageCircle size={17}/></button><p className="form-privacy"><ShieldCheck size={14}/> No online payment. Your request is not confirmed until the team replies.</p></form></div></div>}
 </>;
}
function DoctorAvatar({d,large=false}){return <div className={`doctor-avatar ${d.color} ${large?'avatar-large':''}`}><span>{d.emoji}</span><i><BadgeCheck size={15}/></i></div>}
function DoctorCard({d,onView,onBook}){return <article className="doctor-card"><div className="doctor-card-top"><DoctorAvatar d={d}/><div className="doctor-availability"><span className={d.availability.includes('today')?'availability-dot':'availability-dot later'}/>{d.availability}</div></div><h3>{d.name}</h3><p className="doctor-title">{d.title}</p><p className="doctor-degree">{d.degree}</p><div className="doctor-meta"><span><Star size={14} fill="currentColor"/> {d.rating} <small>({d.reviews})</small></span><span><Clock3 size={14}/>{d.experience}</span></div><div className="tag-row">{d.specialties.map(s=><span key={s}>{s}</span>)}</div><div className="doctor-card-bottom"><div><small>From</small><b>₹{d.price}<small> / session*</small></b><span className="distance"><MapPin size={12}/>{d.distance}</span></div><button className="round-arrow" onClick={onView} aria-label={`View ${d.name} profile`}><ArrowRight size={18}/></button></div><div className="doctor-card-actions"><button className="outline-btn" onClick={onView}>View profile</button><button className="btn btn-primary" onClick={onBook}>Request <ArrowRight size={15}/></button></div></article>}

const isAdminRoute = window.location.pathname.startsWith('/admin');
createRoot(document.getElementById('root')).render(isAdminRoute ? <AdminPanel/> : <App/>);