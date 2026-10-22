import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowRight, BadgeCheck, CalendarDays, Check, ChevronDown, Clock3, Heart, MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Star, Stethoscope, X, Zap } from 'lucide-react';
import './styles.css';
import AdminPanel from './admin/AdminPanel';
import { useDoctors } from './hooks/useDoctors';

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

function Brand({light=false}) { return <a className={`brand ${light?'brand-light':''}`} href="#home" aria-label="Physio at Home home"><span className="brand-mark"><Activity size={19}/></span><span>physio <i>at home</i></span></a> }
function JoinTherapist({ onBack }) {
  const FOUNDER_WHATSAPP = WA_NUMBER;

  const [form, setForm] = React.useState({
    name: '', phone: '', email: '', qualification: '',
    experience: '', specialties: '', city: '', regNo: '', about: ''
  });
  const [error, setError] = React.useState('');

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.qualification.trim() || !form.city.trim()) {
      setError('Please fill in name, phone, qualification and city.');
      return;
    }
    setError('');

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

    window.open(`https://wa.me/${FOUNDER_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const field = { width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>← Back</button>
      <h2>Join as a Physiotherapist</h2>
      <p>Fill in your details and we'll get back to you.</p>

      <form onSubmit={submit}>
        <input style={field} name="name" placeholder="Full name *" value={form.name} onChange={update} />
        <input style={field} name="phone" type="tel" placeholder="Phone number *" value={form.phone} onChange={update} />
        <input style={field} name="email" type="email" placeholder="Email" value={form.email} onChange={update} />
        <input style={field} name="qualification" placeholder="Qualification (e.g. BPT, MPT) *" value={form.qualification} onChange={update} />
        <input style={field} name="experience" type="number" min="0" placeholder="Years of experience" value={form.experience} onChange={update} />
        <input style={field} name="specialties" placeholder="Specialties (back pain, sports, senior care...)" value={form.specialties} onChange={update} />
        <input style={field} name="city" placeholder="City / Clinic name *" value={form.city} onChange={update} />
        <input style={field} name="regNo" placeholder="Registration / license number" value={form.regNo} onChange={update} />
        <textarea style={{ ...field, minHeight: 90 }} name="about" placeholder="Tell us about yourself" value={form.about} onChange={update} />

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 8, background: '#25D366', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>
          Submit via WhatsApp
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

  const closeNearby = () => { runId.current++; setNearby(null); };

  const startNearby = () => {
    const id = ++runId.current;
    const alive = () => runId.current === id;
    let finished = false;
    setNearby('locating');
    setCoords(null);

    const finish = (c) => {
      if (finished) return;
      finished = true;
      setTimeout(() => {
        if (!alive()) return;
        setCoords(c);
        setNearby('found');
        setTimeout(() => alive() && setNearby('searching'), 1200);
        setTimeout(() => alive() && setNearby('results'), 4500);
      }, 1800);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => finish({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => finish(null),
        { timeout: 6000 }
      );
      setTimeout(() => finish(null), 9000);
    } else {
      finish(null);
    }
  };

  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('a,button');
      if (el && !el.closest('.nb-overlay') && /find nearby physio/i.test(el.textContent || '')) {
        e.preventDefault();
        e.stopPropagation();
        startNearby();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  useEffect(() => {
    document.body.style.overflow = nearby ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [nearby]);
  const filtered=useMemo(()=>doctors.filter(d=>{const text=(query+' '+condition).toLowerCase();return !text||d.name.toLowerCase().includes(text)||d.title.toLowerCase().includes(text)||d.specialties.join(' ').toLowerCase().includes(text)||['back pain','neck pain','knee pain','physio','physiotherapist','sports','senior care','shoulder'].some(x=>text.includes(x)&& (d.specialties.join(' ').toLowerCase().includes(x)||d.title.toLowerCase().includes(x)))}),[query,condition,doctors]);
 const startSearch=()=>{setResults(false);setSearching(true)};
 const book=(doc)=>{setBooking(doc);setSelected(null)};
 const submitBooking=(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);const msg=`Hi Physio at Home! I'd like to request a ${care.toLowerCase()} appointment.\nPhysiotherapist: ${booking?.name||'Please suggest a nearby physiotherapist'}\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nArea/address: ${f.get('address')}\nCondition: ${f.get('concern')}\nPreferred date: ${f.get('date')}\nPreferred time: ${f.get('time')}`;window.open(waLink(msg),'_blank','noopener,noreferrer');setBooking(null);setToast('Your request is ready in WhatsApp. Send it to confirm with our team.');setTimeout(()=>setToast(''),5000)};
 if (page === 'join') return <JoinTherapist onBack={() => setPage('home')} />;
 return <>
 {doctorsStatus === "error" && <div role="status" className="wrap" style={{padding:"12px 20px",color:"var(--muted)"}}>{doctorsError}</div>}
  {doctorsStatus === "empty" && <div role="status" className="wrap" style={{padding:"12px 20px",color:"var(--muted)"}}>No published physiotherapist profiles are available yet. Please contact our team for assistance.</div>}
  {splash&&<div className="splash"><div className="splash-logo"><span className="brand-mark big"><Activity size={30}/></span><div className="splash-name">physio <i>at home</i></div></div><div className="splash-line"><span/></div><p>Care that comes to you.</p></div>}
 <header className="header"><div className="nav wrap"><Brand/><nav className={menuOpen?'nav-links open':'nav-links'}><a href="#how" onClick={()=>setMenuOpen(false)}>How it works</a><a href="#care" onClick={()=>setMenuOpen(false)}>Conditions</a><a href="#physios" onClick={()=>setMenuOpen(false)}>Our physios</a><a href="#faq" onClick={()=>setMenuOpen(false)}>FAQs</a><a className="nav-cta" href={waLink('Hi! I need help booking a physiotherapist.')} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Talk to us</a></nav><button className="menu-toggle" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?<X/>:<Menu/>}</button></div></header>
 <main>
 <section className="hero" id="home"><div className="hero-glow"/><div className="wrap hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> PHYSIOTHERAPY, REIMAGINED</div><h1>A licensed physio,<br/><em>at your door</em> in 30<br className="desktop-break"/> minutes.</h1><p className="hero-sub">Tap where it hurts, confirm your address, and let a nearby physiotherapist come to you — care that fits your life, from start to finish.</p><div className="hero-actions"><a className="btn btn-primary" href="#find">Find nearby physio <ArrowRight size={18}/></a><button className="outline-btn" onClick={()=>{setPage('join');window.scrollTo(0,0)}}>Join as Physiotherapist</button><a className="text-link" href="#how">See how it works <ArrowDownRight size={17}/></a></div><div className="hero-proof"><div><strong>30 <small>min</small></strong><span>average target arrival*</span></div><div><strong>100%</strong><span>profile-led discovery</span></div><div><strong>4.9<small>★</small></strong><span>sample rating</span></div></div><p className="disclaimer">*Illustrative demo claim. Actual availability and arrival time depend on your location.</p></div>
 <div className="hero-visual"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="hero-card top-card"><span className="mini-icon"><ShieldCheck size={16}/></span><div><b>Care, made personal</b><small>Find the right kind of support</small></div><span className="tiny-check"><Check size={13}/></span></div><div className="hero-person"><div className="person-halo"/><div className="person-emoji">🧑🏻‍⚕️</div><div className="person-spark spark-a">✦</div><div className="person-spark spark-b">✳</div><div className="home-base"><span><Activity size={22}/></span><div><b>Good care starts here</b><small>At your place. At your pace.</small></div></div></div><div className="hero-card floating-card"><div className="avatar-stack"><span>👩🏻‍⚕️</span><span>👨🏽‍⚕️</span><span>👩🏽‍⚕️</span></div><div><b>Care for your needs</b><small>Browse 5 sample profiles</small></div><span className="online-dot"/></div><div className="float-label label-left"><Heart size={15}/> A little care goes far</div><div className="float-label label-right"><MapPin size={15}/> Care comes to you</div></div></div>   </section>  {nearby&&<div className="nb-overlay" role="dialog" aria-modal="true">
  {nearby!=='results'?(
   <div className="nb-stage">
    <button className="nb-close" onClick={closeNearby} aria-label="Cancel"><X size={20}/></button>
    <div className={`nb-radar ${nearby}`}>
     <span className="nb-ring r1"/><span className="nb-ring r2"/><span className="nb-ring r3"/>
     <span className="nb-sweep"/>
     <div className="nb-me"><MapPin size={26}/></div>
     {nearby==='searching'&&[0,1,2,3,4].map(i=><span key={i} className={`nb-dot d${i}`}/>)}
    </div>
    <h2 className="nb-title">{nearby==='locating'?'Checking your location...':nearby==='found'?'Location confirmed':'Finding physios near you...'}</h2>
    <p className="nb-sub">{nearby==='locating'?'Please allow location access if your browser asks.':nearby==='found'?(coords?`Near ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`:'Using a demo area for this preview'):'Matching sample profiles in your area'}</p>
    <div className="nb-steps">{['Detecting your location','Scanning your area','Matching physios'].map((s,i)=>{const a=['locating','found','searching'].indexOf(nearby);return <div key={s} className={`nb-step ${i<a?'done':''} ${i===a?'active':''}`}><span className="nb-step-icon">{i<a?<Check size={13}/>:null}</span>{s}</div>})}</div>
    <button className="nb-cancel" onClick={closeNearby}>Cancel</button>
   </div>
  ):(
   <div className="nb-sheet">
    <div className="nb-sheet-head">
     <div><span className="section-kicker">NEAR YOU</span><h2>{Math.min(5,doctors.length)} physios found nearby</h2><p>Demo profiles for preview. Real availability is confirmed on booking.</p></div>
     <button className="nb-close static" onClick={closeNearby} aria-label="Close"><X size={20}/></button>
    </div>
    <div className="nb-list">{doctors.slice(0,5).map(d=><DoctorCard key={d.id} d={d} onView={()=>{closeNearby();setSelected(d)}} onBook={()=>book(d)}/>)}</div>
   </div>
  )}
 </div>}
 {searching&&<div className="search-overlay"><div className="searching-box"><div className="orbit-search"><div className="search-ring"/><div className="search-center"><MapPin size={30}/><span>YOU</span></div>{['👩🏻‍⚕️','👨🏽‍⚕️','👩🏽‍⚕️','👨🏻‍⚕️','👩🏼‍⚕️'].map((e,i)=><div className={`orbit-doc doc-${i}`} key={i}>{e}</div>)}</div><span className="section-kicker">ONE MOMENT, PLEASE</span><h2>Finding your nearby physio<span className="ellipsis">...</span></h2><p>Looking for a match for your care needs{location?` near ${location}`:''}.</p><div className="search-progress"><span/></div><div className="searching-note"><span className="pulse-dot"/> Matching sample profiles to your preferences</div><button className="cancel-search" onClick={()=>setSearching(false)}>Cancel search</button></div></div>}
 {results&&<section className="results-section" id="results"><div className="wrap"><div className="results-head"><div><span className="section-kicker">YOUR SHORTLIST</span><h2>Meet your care team.</h2><p>These are demo profiles to preview the experience. Contact us to confirm real availability.</p></div><button className="outline-btn" onClick={()=>{setResults(false);document.getElementById('find')?.scrollIntoView({behavior:'smooth'})}}>Edit search <Search size={15}/></button></div><div className="doctor-grid">{filtered.map(d=><DoctorCard key={d.id} d={d} onView={()=>setSelected(d)} onBook={()=>book(d)}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search size={25}/><h3>No exact matches yet</h3><p>Try another condition or message our team for help finding the right care.</p><a className="btn btn-primary" href={waLink()} target="_blank" rel="noreferrer">Ask on WhatsApp <MessageCircle size={16}/></a></div>}</div></section>}
 <section className="trust-strip"><div className="wrap trust-grid"><div><ShieldCheck/><span><b>Profiles to explore</b><small>Know who you're contacting</small></span></div><div><Clock3/><span><b>Flexible scheduling</b><small>Ask for a time that works</small></span></div><div><Heart/><span><b>Care that feels human</b><small>Personal, thoughtful support</small></span></div><div><MessageCircle/><span><b>Real conversations</b><small>WhatsApp booking support</small></span></div></div></section>
 <section className="section care-section" id="care"><div className="wrap"><div className="section-intro"><span className="section-kicker">START WITH WHAT YOU FEEL</span><h2>Whatever's slowing you down,<br/><em>let's work on it.</em></h2><p>Explore common reasons people look for physiotherapy. A physiotherapist can help assess what support may be right for you.</p></div><div className="condition-grid">{conditions.map((c,i)=><button className="condition-card" key={c[0]} onClick={()=>{setCondition(c[0]);setResults(false);document.getElementById('find')?.scrollIntoView({behavior:'smooth'});}}><span className={`condition-symbol symbol-${i}`}>{c[1]}</span><span className="condition-name">{c[0]}</span><span className="condition-desc">{c[2]}</span><span className="condition-arrow"><ArrowRight size={17}/></span></button>)}</div><p className="medical-note">Physiotherapy is not an emergency service. For sudden severe symptoms, seek urgent medical care.</p></div></section>
 <section className="section how-section" id="how"><div className="wrap how-grid"><div className="section-intro how-intro"><span className="section-kicker">SIMPLE FROM THE FIRST TAP</span><h2>Care, without<br/><em>the extra steps.</em></h2><p>Finding support should feel easier. Here's how the Physio at Home experience is designed to work.</p><a className="btn btn-primary" href="#find">Get started <ArrowRight size={17}/></a></div><div className="steps-list"><div className="step-item"><div className="step-num">01</div><div className="step-icon"><Search size={22}/></div><div><h3>Tell us what you need</h3><p>Choose a condition, share your area and explore physiotherapist profiles that fit your preferences.</p></div></div><div className="step-item"><div className="step-num">02</div><div className="step-icon"><CalendarDays size={22}/></div><div><h3>Request your session</h3><p>Pick a preferred date and time. Send your request through WhatsApp to coordinate the next step.</p></div></div><div className="step-item"><div className="step-num">03</div><div className="step-icon"><Heart size={22}/></div><div><h3>Take the next step</h3><p>Confirm the details directly with the care team before your appointment is finalised.</p></div></div></div></div></section>
 <section className="section physios-section" id="physios"><div className="wrap"><div className="results-head"><div><span className="section-kicker">A FRIENDLY PLACE TO START</span><h2>Meet our sample physios.</h2><p>Browse five illustrative profiles. Credentials, ratings, fees and availability must be verified before real-world use.</p></div><button className="text-link" onClick={()=>{setResults(true);document.getElementById('results')?.scrollIntoView({behavior:'smooth'})}}>Explore all profiles <ArrowRight size={17}/></button></div><div className="doctor-grid">{doctors.slice(0,3).map(d=><DoctorCard key={d.id} d={d} onView={()=>setSelected(d)} onBook={()=>book(d)}/>)}</div></div></section>
 <section className="quote-section"><div className="wrap quote-inner"><div className="quote-mark">“</div><div><span className="section-kicker">A MORE COMFORTABLE WAY TO RECOVER</span><h2>Good care meets you<br/><em>where you are.</em></h2><p>At home, on your schedule, with a little more peace of mind.</p></div><div className="quote-art">🌿<span>✦</span></div></div></section>
 <section className="section faq-section" id="faq"><div className="wrap faq-grid"><div className="section-intro"><span className="section-kicker">GOOD TO KNOW</span><h2>Questions?<br/><em>We've got you.</em></h2><p>Need a hand choosing a session? We're happy to help you figure out the next step.</p><a className="text-link" href={waLink('Hi Physio at Home, I have a question about physiotherapy booking.')} target="_blank" rel="noreferrer">Ask us on WhatsApp <ArrowRight size={16}/></a></div><div className="faq-list">{[
 ['How do I book a physiotherapist?','Choose your condition and care type, browse the sample profiles, then submit a booking request. WhatsApp opens with your details so our team can help coordinate.'],
 ['Are the doctor profiles on this site real?','No. The five profiles in this starter project are demo content to help you preview the design. Replace them with real, consented profiles and verify qualifications before launch.'],
 ['Is my appointment confirmed after I click book?','No. This is a frontend prototype. The booking form opens WhatsApp with your request; your team must confirm the appointment directly.'],
 ['Can I request online or clinic-based care?','Yes. The search demo includes home visits, online consultations and clinic visits. Availability depends on the real provider network you set up.'],
 ['How much does a session cost?','The prices shown are illustrative demo prices, not a confirmed tariff. Confirm the actual fee with the physiotherapist before booking.'],
 ['What if I need urgent medical help?','Physiotherapy booking is not an emergency service. If you have sudden weakness, chest pain, a serious injury or another urgent symptom, contact emergency medical services.']
 ].map((f,i)=><div className={`faq-item ${faqOpen===i?'active':''}`} key={f[0]}><button onClick={()=>setFaqOpen(faqOpen===i?-1:i)}><span>{f[0]}</span><span className="faq-plus">{faqOpen===i?'−':'+'}</span></button>{faqOpen===i&&<p>{f[1]}</p>}</div>)}</div></div></section>
 <section className="final-cta"><div className="wrap final-cta-inner"><div><span className="section-kicker">YOUR NEXT STEP CAN BE A SMALL ONE</span><h2>Ready to feel more like <em>you?</em></h2><p>Let's help you explore the right physiotherapy support.</p></div><a className="btn btn-dark" href="#find">Find nearby physio <ArrowRight size={18}/></a></div></section>
 </main>
 <footer className="footer"><div className="wrap"><div className="footer-top"><div className="footer-brand"><Brand light/><p>Thoughtful physiotherapy discovery,<br/>designed around your everyday life.</p><a className="footer-wa" href={waLink()} target="_blank" rel="noreferrer"><MessageCircle size={17}/> +91 77958 55640</a></div><div className="footer-col"><b>Explore</b><a href="#how">How it works</a><a href="#care">Conditions</a><a href="#physios">Physiotherapists</a></div><div className="footer-col"><b>Get in touch</b><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp support ↗</a><a href="#faq">FAQs</a><a href="#find">Request a session</a></div><div className="footer-note"><span className="footer-leaf">✳</span><p>Small steps.<br/><em>Stronger days.</em></p></div></div><div className="footer-bottom"><span>© 2026 Physio at Home. All rights reserved.</span><span>Demo website · Profile details are illustrative</span><a href={waLink()} target="_blank" rel="noreferrer">Made for better movement <Heart size={12}/></a></div></div></footer>
 <a className="whatsapp-float" href={waLink()} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={24}/><span>Chat with us</span></a>
 {toast&&<div className="toast"><Check size={17}/>{toast}<button onClick={()=>setToast('')} aria-label="Dismiss"><X size={15}/></button></div>}
 {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><DoctorAvatar d={selected} large/><span className="section-kicker">SAMPLE PROFILE</span><h2>{selected.name}</h2><p className="modal-title">{selected.title} · {selected.degree}</p><div className="modal-stats"><span><Star size={15} fill="currentColor"/> {selected.rating} <small>({selected.reviews} reviews · demo)</small></span><span><Clock3 size={15}/> {selected.experience}</span></div><p className="modal-bio">{selected.bio}</p><div className="tag-row">{selected.specialties.map(s=><span key={s}>{s}</span>)}</div><div className="modal-price"><div><small>Illustrative session fee</small><b>₹{selected.price}</b></div><button className="btn btn-primary" onClick={()=>book(selected)}>Request booking <ArrowRight size={17}/></button></div><p className="modal-disclaimer">Demo profile only. Credentials and availability are not verified.</p></div></div>}
 {booking&&<div className="modal-backdrop" onClick={()=>setBooking(null)}><div className="booking-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setBooking(null)} aria-label="Close"><X/></button><span className="section-kicker">LET'S GET YOU MOVING</span><h2>Request a session.</h2><p className="booking-intro">{booking?`With ${booking.name} (sample profile)`:'Tell us a little about what you need.'} Fill in your details and continue in WhatsApp.</p><form onSubmit={submitBooking} className="booking-form"><label>Your name<input name="name" required placeholder="Full name"/></label><label>Phone number<input name="phone" required inputMode="tel" pattern="[0-9+ ()-]{8,}" placeholder="Your contact number"/></label><label>Area / address<input name="address" required placeholder="Area, landmark or pincode" defaultValue={location}/></label><label>What do you need help with?<select name="concern" defaultValue={condition||''} required><option value="" disabled>Select a condition</option>{conditions.map(c=><option key={c[0]}>{c[0]}</option>)}</select></label><div className="form-row"><label>Preferred date<input type="date" name="date" required min={new Date().toISOString().split('T')[0]}/></label><label>Preferred time<select name="time" required defaultValue="Morning (9 AM–12 PM)"><option>Morning (9 AM–12 PM)</option><option>Afternoon (12–4 PM)</option><option>Evening (4–8 PM)</option></select></label></div><button className="btn btn-primary form-submit" type="submit">Continue to WhatsApp <MessageCircle size={17}/></button><p className="form-privacy"><ShieldCheck size={14}/> No online payment in this demo. Your request is not confirmed until the team replies.</p></form></div></div>}
 </>;
}
function DoctorAvatar({d,large=false}){return <div className={`doctor-avatar ${d.color} ${large?'avatar-large':''}`}><span>{d.emoji}</span><i><BadgeCheck size={15}/></i></div>}
function DoctorCard({d,onView,onBook}){return <article className="doctor-card"><div className="doctor-card-top"><DoctorAvatar d={d}/><div className="doctor-availability"><span className={d.availability.includes('today')?'availability-dot':'availability-dot later'}/>{d.availability}</div></div><h3>{d.name}</h3><p className="doctor-title">{d.title}</p><p className="doctor-degree">{d.degree}</p><div className="doctor-meta"><span><Star size={14} fill="currentColor"/> {d.rating} <small>({d.reviews})</small></span><span><Clock3 size={14}/>{d.experience}</span></div><div className="tag-row">{d.specialties.map(s=><span key={s}>{s}</span>)}</div><div className="doctor-card-bottom"><div><small>From</small><b>₹{d.price}<small> / session*</small></b><span className="distance"><MapPin size={12}/>{d.distance}</span></div><button className="round-arrow" onClick={onView} aria-label={`View ${d.name} profile`}><ArrowRight size={18}/></button></div><div className="doctor-card-actions"><button className="outline-btn" onClick={onView}>View profile</button><button className="btn btn-primary" onClick={onBook}>Request <ArrowRight size={15}/></button></div></article>}

const isAdminRoute = window.location.pathname.startsWith('/admin');
createRoot(document.getElementById('root')).render(isAdminRoute ? <AdminPanel/> : <App/>);