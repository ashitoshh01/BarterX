import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shared Apple-style sticky header used by all inner pages
export default function NavBar({ activeLink = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const S = {
    nav: {
      position: 'sticky', top: 0, zIndex: 50,
      backgroundColor: 'rgba(255,255,255,0.92)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    },
    inner: {
      maxWidth: 1320, margin: '0 auto', padding: '0 24px',
      height: 62, display: 'flex', alignItems: 'center', gap: 20,
    },
    logo: { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 },
    logoIcon: {
      width: 35, height: 35, borderRadius: 10,
      background: 'linear-gradient(135deg,#0071e3 0%,#0055b3 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,113,227,0.32)',
    },
    logoText: { fontSize: 19, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em' },
    navLink: (active) => ({
      fontSize: 13.5, fontWeight: 500, color: active ? '#0071e3' : '#424245',
      textDecoration: active ? 'underline' : 'none', cursor: 'pointer',
    }),
    iconBtn: {
      width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7',
      border: '1.5px solid #d2d2d7', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#424245', textDecoration: 'none', transition: 'all 0.18s',
    },
    primaryBtn: {
      height: 36, padding: '0 18px', borderRadius: 8,
      background: '#0071e3', color: 'white', border: 'none',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.18s',
    },
  };

  return (
    <header style={S.nav}>
      <div style={S.inner}>
        {/* Logo */}
        <Link to="/" style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <span style={S.logoText}>BarterX</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 'auto' }}>
          <Link to="/" style={S.navLink(activeLink === 'home')}
            onMouseEnter={e => e.currentTarget.style.color = '#0071e3'}
            onMouseLeave={e => { if (activeLink !== 'home') e.currentTarget.style.color = '#424245'; }}
          >Marketplace</Link>
          <Link to="/how-it-works" style={S.navLink(activeLink === 'how')}
            onMouseEnter={e => e.currentTarget.style.color = '#0071e3'}
            onMouseLeave={e => { if (activeLink !== 'how') e.currentTarget.style.color = '#424245'; }}
          >How it Works</Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/my-chats" title="Chats" style={S.iconBtn}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
              <Link to="/notifications" title="Notifications" style={S.iconBtn}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
              <Link to="/profile" title="Profile" style={{ ...S.iconBtn, backgroundColor: '#1d1d1f', borderColor: '#1d1d1f', color: '#fff' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <button onClick={() => { logout(); navigate('/login'); }}
                style={{ fontSize: 13, fontWeight: 500, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/login" style={{ fontSize: 13.5, fontWeight: 500, color: '#0071e3', textDecoration: 'none' }}>Sign In</Link>
              <Link to="/signup" style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0071e3', color: 'white', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0064d0'}
                onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
