import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HowItWorks from './pages/HowItWorks';
import SwapProposal from './pages/SwapProposal';
import OfferReview from './pages/OfferReview';
import Notifications from './pages/Notifications';
import MyChats from './pages/MyChats';
import ChatRoomPage from './pages/ChatRoom';
import Profile from './pages/Profile';

// ─── Sample fallback items ─────────────────────────────────────────────────
const INITIAL_ITEMS = [
  { id: 6, title: "Sony A7 III Camera", description: "Mint condition body. Shutter count around 12k. Includes 2 batteries.", offering: "Sony A7 III Body", wanting: "DJI Mavic 3 Pro or similar drone", category: "Electronics & Gadgets", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80", owner: "Alex M.", location: "Mumbai, MH", date: "2m ago" },
  { id: 5, title: "iPad Pro 12.9\" (M1)", description: "128GB, Space Gray, Wi-Fi. Always used with screen protector.", offering: "iPad Pro + Apple Pencil 2", wanting: "MacBook Pro M1 (16GB RAM)", category: "Electronics & Gadgets", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80", owner: "Sarah K.", location: "Bengaluru, KA", date: "1h ago" },
  { id: 4, title: "Vintage Leather Jacket", description: "Genuine brown leather, size L. Excellent patina, minor wear on cuffs.", offering: "Leather Jacket (Size L)", wanting: "Doc Martens Boots (Size 10)", category: "Fashion & Apparel", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80", owner: "Marcus T.", location: "New Delhi, DL", date: "3h ago" },
  { id: 3, title: "Fender Stratocaster", description: "Player Series in 3-Color Sunburst. Maple fingerboard. Perfect setup.", offering: "Fender Stratocaster", wanting: "Analog Synthesizer / Drum Machine", category: "Media & Entertainment", image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80", owner: "Elena R.", location: "Pune, MH", date: "5h ago" },
  { id: 2, title: "Ergonomic Office Chair", description: "High-back mesh with 3D armrests and lumbar support.", offering: "Ergonomic Chair", wanting: "Mechanical Keyboard (Custom/Hot-swap)", category: "Lifestyle & Home", image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80", owner: "David L.", location: "Hyderabad, TS", date: "1d ago" },
  { id: 1, title: "UI/UX Design Mentorship", description: "5 hours of 1-on-1 design mentoring, portfolio reviews, resume prep.", offering: "5h Design Mentorship", wanting: "React Native developer mentoring", category: "Technology & IT Services", image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80", owner: "Chloe W.", location: "Remote", date: "2d ago" },
];

const CATEGORIES = [
  "All","Fashion & Apparel","Lifestyle & Home","Media & Entertainment","Jewellery & Accessories",
  "Automotive & Accessories","Electronics & Gadgets","Hospitality & Equipment","Travel & Luggage",
  "Beauty & Personal Care","Healthcare & Wellness","Entertainment & Gaming","Events & Celebrations",
  "Marketing & Advertising","Finance & Accounting","Operations & Supply Chain",
  "Human Resources & Recruitment","Legal & Compliance","Sales & Business Development",
  "Technology & IT Services","Agriculture & Farming","Construction & Real Estate",
  "Transport & Logistics","Household & Craftsman Services",
];

// ─── Notification Bell ─────────────────────────────────────────────────────
function NotificationBell() {
  const { tokens } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!tokens?.access) return;
    const fetch = async () => {
      try { const r = await axios.get('http://localhost:8000/api/notifications/unread_count/', { headers: { Authorization: `Bearer ${tokens.access}` } }); setUnread(r.data.unread_count || 0); } catch { /* ignore */ }
    };
    fetch();
    const iv = setInterval(fetch, 10000);
    return () => clearInterval(iv);
  }, [tokens]);

  const iconBtn = { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7', border: '1.5px solid #d2d2d7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#424245', textDecoration: 'none', transition: 'all 0.18s', position: 'relative', flexShrink: 0 };

  return (
    <Link to="/notifications" title="Notifications" style={iconBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, padding: '0 4px' }}>{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}

// ─── Protected Route ───────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Marketplace / Home ────────────────────────────────────────────────────
function Marketplace() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [loadingItems, setLoadingItems] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(""); const [newDescription, setNewDescription] = useState(""); const [newOffering, setNewOffering] = useState(""); const [newWanting, setNewWanting] = useState(""); const [newCategory, setNewCategory] = useState("Electronics & Gadgets"); const [newLocation, setNewLocation] = useState("");

  const { user, logout, tokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchItems = async () => {
      try { const r = await axios.get('http://localhost:8000/api/items/'); setItems(r.data?.length > 0 ? r.data : INITIAL_ITEMS); }
      catch { setItems(INITIAL_ITEMS); }
      finally { setLoadingItems(false); }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('create') === 'true') { setIsModalOpen(true); navigate('/', { replace: true }); }
  }, [location, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle || !newOffering || !newWanting) return;
    if (tokens?.access) {
      try {
        const r = await axios.post('http://localhost:8000/api/items/', { title: newTitle, description: newDescription, offering: newOffering, wanting: newWanting, location: newLocation || 'Local', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80' }, { headers: { Authorization: `Bearer ${tokens.access}` } });
        setItems([r.data, ...items]);
      } catch {
        setItems([{ id: Date.now(), title: newTitle, description: newDescription, offering: newOffering, wanting: newWanting, category_name: newCategory, image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80', owner_username: user?.username || 'You', location: newLocation || 'Local', created_at: new Date().toISOString() }, ...items]);
      }
    }
    setIsModalOpen(false);
    setNewTitle(""); setNewDescription(""); setNewOffering(""); setNewWanting(""); setNewCategory("Electronics & Gadgets"); setNewLocation("");
  };

  const gCat = i => i.category_name || i.category || '';
  const gImg = i => i.image_url || i.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
  const gOwner = i => i.owner_username || i.owner || 'Unknown';
  const gDate = i => {
    if (i.date) return i.date;
    if (i.created_at) { const m = Math.floor((Date.now() - new Date(i.created_at).getTime()) / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }
    return '';
  };

  const filtered = items.filter(i => { const mc = selectedCategory === "All" || gCat(i) === selectedCategory; const q = searchQuery.toLowerCase(); const ms = !q || [i.title, i.offering, i.wanting, i.description].some(f => (f || '').toLowerCase().includes(q)); return mc && ms; });
  const sorted = [...filtered].sort((a, b) => sortBy === "alphabetical" ? a.title.localeCompare(b.title) : sortBy === "oldest" ? a.id - b.id : b.id - a.id);

  const focusIn  = e => { e.target.style.borderColor = '#0071e3'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.14)'; };
  const focusOut = e => { e.target.style.borderColor = '#d2d2d7'; e.target.style.backgroundColor = '#f5f5f7'; e.target.style.boxShadow = 'none'; };
  const fieldStyle = { width: '100%', height: 42, padding: '0 14px', borderRadius: 9, border: '1.5px solid #d2d2d7', backgroundColor: '#f5f5f7', fontSize: 14, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' };
  const iconBtn = { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7', border: '1.5px solid #d2d2d7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#424245', textDecoration: 'none', transition: 'all 0.18s' };

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", backgroundColor: '#f5f5f7', minHeight: '100vh', color: '#1d1d1f' }}>

      {/* Announcement */}
      <div style={{ backgroundColor: '#1d1d1f', color: '#f5f5f7', textAlign: 'center', padding: '9px 16px', fontSize: 12, fontWeight: 500 }}>
        🎉&nbsp;Zero fees, zero middlemen — trade anything on BarterX.&nbsp;
        <a href="#browse" style={{ color: '#2997ff', textDecoration: 'none', fontWeight: 600 }}>Explore now →</a>
      </div>

      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 35, height: 35, borderRadius: 10, background: 'linear-gradient(135deg,#0071e3 0%,#0055b3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,113,227,0.32)' }}>
              <svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em' }}>BarterX</span>
          </Link>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 580, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products, services, skills..."
              style={{ width: '100%', height: 40, paddingLeft: 40, paddingRight: 14, borderRadius: 10, border: '1.5px solid #d2d2d7', backgroundColor: '#f5f5f7', fontSize: 13.5, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.14)'; }}
              onBlur={e => { e.target.style.borderColor = '#d2d2d7'; e.target.style.backgroundColor = '#f5f5f7'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Right nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, marginLeft: 'auto' }}>
            <Link to="/how-it-works" style={{ fontSize: 13.5, fontWeight: 500, color: '#424245', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#0071e3'} onMouseLeave={e => e.target.style.color = '#424245'}>
              How it Works
            </Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setIsModalOpen(true)} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0071e3', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0064d0'} onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>List Item
                </button>
                <NotificationBell />
                <Link to="/my-chats" title="Chats" style={iconBtn} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </Link>
                <Link to="/profile" title="Profile" style={{ ...iconBtn, backgroundColor: '#1d1d1f', borderColor: '#1d1d1f', color: '#fff' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
                <button onClick={logout} style={{ fontSize: 13, fontWeight: 500, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to="/login" style={{ fontSize: 13.5, fontWeight: 500, color: '#0071e3', textDecoration: 'none' }}>Sign In</Link>
                <Link to="/signup" style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0071e3', color: 'white', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0064d0'} onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Category tab bar */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#fff' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', padding: '7px 0' }}>
              {CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ flexShrink: 0, height: 30, padding: '0 13px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 600 : 500, backgroundColor: active ? '#0071e3' : 'transparent', color: active ? '#fff' : '#424245', transition: 'all 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#f5f5f7'; e.currentTarget.style.color = '#1d1d1f'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#424245'; } }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px 72px' }}>

        {/* Hero */}
        <section style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 36, position: 'relative', background: 'linear-gradient(140deg,#0047ab 0%,#0071e3 50%,#2997ff 100%)', padding: '52px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ position: 'absolute', right: -80, top: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 80, bottom: -100, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, padding: '4px 13px', marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>Live · 30+ active listings</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
              Trade what you <em style={{ fontStyle: 'italic', fontWeight: 300 }}>have,</em><br />
              for what you <em style={{ fontStyle: 'italic', fontWeight: 300 }}>need.</em>
            </h1>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.76)', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 430 }}>
              India's premier peer-to-peer barter platform. Exchange products &amp; services — zero fees, zero hassle.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="#browse" style={{ height: 44, padding: '0 24px', borderRadius: 22, backgroundColor: '#fff', color: '#0071e3', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>Browse Listings</a>
              <button onClick={() => setIsModalOpen(true)} style={{ height: 44, padding: '0 24px', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'}>+ List an Item</button>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, flexShrink: 0 }}>
            {[{ num: '23+', label: 'Categories' }, { num: '0%', label: 'Fees' }, { num: '100%', label: 'Peer-to-peer' }].map(s => (
              <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px 22px', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.2)', minWidth: 86 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Listings */}
        <section id="browse" style={{ scrollMarginTop: 140 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 21, fontWeight: 700, color: '#1d1d1f', margin: 0, letterSpacing: '-0.02em' }}>{selectedCategory === 'All' ? 'All Listings' : selectedCategory}</h2>
              <p style={{ fontSize: 12.5, color: '#86868b', margin: '4px 0 0' }}>{loadingItems ? 'Loading...' : `${sorted.length} listing${sorted.length !== 1 ? 's' : ''} available`}</p>
            </div>
            <div style={{ position: 'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ height: 36, padding: '0 34px 0 13px', borderRadius: 8, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', fontSize: 13, fontWeight: 500, color: '#1d1d1f', cursor: 'pointer', appearance: 'none', outline: 'none', fontFamily: 'inherit' }}>
                <option value="latest">Sort: Latest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="alphabetical">Sort: A–Z</option>
              </select>
              <svg style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6e6e73' }} width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {loadingItems ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                  <div style={{ height: 192, background: 'linear-gradient(90deg,#f0f0f5 25%,#e8e8ed 50%,#f0f0f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ height: 14, borderRadius: 7, marginBottom: 10, background: 'linear-gradient(90deg,#f0f0f5 25%,#e8e8ed 50%,#f0f0f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    <div style={{ height: 10, borderRadius: 5, width: '65%', background: 'linear-gradient(90deg,#f0f0f5 25%,#e8e8ed 50%,#f0f0f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(288px,1fr))', gap: 20 }}>
              {sorted.map(item => (
                <article key={item.id} style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07),0 0 1px rgba(0,0,0,0.04)', transition: 'box-shadow 0.22s,transform 0.22s', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12),0 0 1px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07),0 0 1px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', backgroundColor: '#f5f5f7', flexShrink: 0 }}>
                    <img src={gImg(item)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    <div style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '3px 10px', fontSize: 9.5, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{gCat(item)}</div>
                    <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: '#424245' }}>{gDate(item)}</div>
                  </div>
                  <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#0071e3,#2997ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{gOwner(item).charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#6e6e73' }}>{gOwner(item)}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{item.title}</h3>
                    {item.description && <p style={{ fontSize: 13, color: '#6e6e73', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                    <div style={{ borderRadius: 10, border: '1.5px solid #e8e8ed', backgroundColor: '#fbfbfd', padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Offering', val: item.offering, iconColor: '#0071e3', iconBg: '#e8f4fd', d: 'M5 10l7-7m0 0l7 7m-7-7v18' },
                        { label: 'Seeking', val: item.wanting, iconColor: '#f97316', iconBg: '#fff3e8', d: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
                      ].map((row, i) => (
                        <div key={row.label}>
                          {i > 0 && <div style={{ height: 1, backgroundColor: '#e8e8ed', margin: '0 0 8px' }} />}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              <svg width="9" height="9" fill="none" stroke={row.iconColor} viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d={row.d} /></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: 9.5, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{row.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1d1d1f' }}>{row.val}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Link to={user ? `/swap/${item.id}` : '/login'} style={{ flex: 1, height: 38, borderRadius: 9, backgroundColor: '#0071e3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.18s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0064d0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0071e3'}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>Propose Swap
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <svg width="11" height="11" fill="none" stroke="#86868b" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#86868b' }}>{item.location}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 32px', backgroundColor: '#fff', borderRadius: 20, border: '2px dashed #d2d2d7' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>No listings found</h3>
              <p style={{ fontSize: 13.5, color: '#86868b', margin: '0 0 24px' }}>Try a different category or clear your search.</p>
              <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} style={{ height: 40, padding: '0 20px', borderRadius: 9, backgroundColor: '#0071e3', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Clear Filters</button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1d1d1f', color: '#f5f5f7' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '36px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#0071e3,#2997ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>BarterX</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.4)', margin: 0 }}>© {new Date().getFullYear()} BarterX. Trade smarter, live better.</p>
          <div style={{ display: 'flex', gap: 22 }}>
            {['Privacy','Terms','Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(245,245,247,0.55)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#f5f5f7'} onMouseLeave={e => e.target.style.color = 'rgba(245,245,247,0.55)'}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Create Listing Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>List a New Item</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', backgroundColor: '#f5f5f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6e73' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
              {[
                { label: 'Item / Service Title *', placeholder: 'e.g. Vintage Leather Jacket', value: newTitle, setter: setNewTitle, req: true },
                { label: 'What are you offering? *', placeholder: 'e.g. Leather Jacket (Size L)', value: newOffering, setter: setNewOffering, req: true },
                { label: 'What are you seeking? *', placeholder: 'e.g. Doc Martens Boots', value: newWanting, setter: setNewWanting, req: true },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{f.label}</label>
                  <input type="text" required={f.req} placeholder={f.placeholder} value={f.value} onChange={e => f.setter(e.target.value)} style={fieldStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer' }}>{CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Location</label>
                  <input type="text" placeholder="e.g. Mumbai, MH" value={newLocation} onChange={e => setNewLocation(e.target.value)} style={fieldStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Description</label>
                <textarea rows="3" placeholder="Tell potential traders more about this item..." value={newDescription} onChange={e => setNewDescription(e.target.value)} style={{ ...fieldStyle, height: 'auto', padding: '11px 14px', resize: 'none', lineHeight: 1.5 }} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 44, borderRadius: 9, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f7'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>Cancel</button>
                <button type="submit" style={{ flex: 1, height: 44, borderRadius: 9, border: 'none', backgroundColor: '#0071e3', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0064d0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0071e3'}>Publish Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}@keyframes spin{to{transform:rotate(360deg)}}header div::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Marketplace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/swap/:itemId" element={<ProtectedRoute><SwapProposal /></ProtectedRoute>} />
      <Route path="/offer/:interestId" element={<ProtectedRoute><OfferReview /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/my-chats" element={<ProtectedRoute><MyChats /></ProtectedRoute>} />
      <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
    </Routes>
  );
}
