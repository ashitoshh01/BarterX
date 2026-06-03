import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const f = { fontFamily: "'Inter',-apple-system,sans-serif" };
const label = { fontSize: 10, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 3 };
const value = { fontSize: 14, fontWeight: 600, color: '#1d1d1f' };

export default function Profile() {
  const { logout, tokens } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true); setError(null);
        const [pRes, lRes, rRes] = await Promise.all([
          axios.get('http://localhost:8000/api/profile/', { headers: { Authorization: `Bearer ${tokens?.access}` } }),
          axios.get('http://localhost:8000/api/items/my_items/', { headers: { Authorization: `Bearer ${tokens?.access}` } }),
          axios.get('http://localhost:8000/api/reviews/', { headers: { Authorization: `Bearer ${tokens?.access}` } }),
        ]);
        setProfile(pRes.data);
        setListings(lRes.data);
        setReviews(rRes.data.filter(r => r.reviewed_user_username === pRes.data.username));
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load profile.');
        if (err.response?.status === 401) { logout(); navigate('/login'); }
      } finally { setLoading(false); }
    };
    if (tokens?.access) fetchProfileData();
    else { setLoading(false); navigate('/login'); }
  }, [tokens, navigate, logout]);

  const Loader = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...f }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (loading) return <Loader />;

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, ...f }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 40, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" fill="none" stroke="#cc0000" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px' }}>Failed to load profile</h3>
        <p style={{ fontSize: 13.5, color: '#6e6e73', margin: '0 0 24px' }}>{error || 'Unauthorized access.'}</p>
        <Link to="/" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 9, background: '#0071e3', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Back to Home</Link>
      </div>
    </div>
  );

  const trustScore = profile.trust_score ?? 50;
  const trustColor = trustScore >= 80 ? '#16a34a' : trustScore >= 50 ? '#d97706' : '#dc2626';
  const trustBg = trustScore >= 80 ? '#f0fdf4' : trustScore >= 50 ? '#fffbeb' : '#fff2f2';
  const trustLabel = trustScore >= 80 ? 'High Trust' : trustScore >= 50 ? 'Medium Trust' : 'Low Trust';
  const TABS = ['overview', 'listings', 'reviews', 'settings'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...f }}>
      <NavBar activeLink="profile" />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 72px' }}>

        {/* Profile card */}
        <section style={{ backgroundColor: '#fff', borderRadius: 20, padding: '32px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#0071e3,#2997ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {profile.profile_picture_url
              ? <img src={profile.profile_picture_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: 0, letterSpacing: '-0.02em' }}>{profile.display_name || profile.username}</h1>
              {profile.is_verified && (
                <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✓ Verified</span>
              )}
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{profile.account_type === 'business' ? 'Business Account' : 'Individual Account'}</p>
            <p style={{ fontSize: 13.5, color: '#6e6e73', margin: 0 }}>{profile.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#1d1d1f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
            Logout
          </button>
        </section>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, backgroundColor: '#fff', borderRadius: 12, padding: 6, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.18s', backgroundColor: activeTab === tab ? '#0071e3' : 'transparent', color: activeTab === tab ? '#fff' : '#6e6e73', minWidth: 80 }}>
              {tab === 'listings' ? 'My Listings' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: '0 0 20px', paddingBottom: 16, borderBottom: '1px solid #e8e8ed' }}>About</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { l: 'Display Name', v: profile.display_name || '—' },
                  { l: 'Account Type', v: profile.account_type === 'business' ? (profile.business_category || 'Business') : 'Individual' },
                  { l: 'Location', v: profile.location || '—' },
                  { l: 'Phone', v: profile.phone_number || '—' },
                  { l: 'Member Since', v: profile.member_since || 'June 2026' },
                  { l: 'Verification', v: profile.is_verified ? 'Verified' : 'Basic Member' },
                ].map(item => (
                  <div key={item.l}>
                    <span style={label}>{item.l}</span>
                    <span style={value}>{item.v}</span>
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={label}>Bio</span>
                  <p style={{ fontSize: 14, color: '#6e6e73', margin: 0, lineHeight: 1.6 }}>{profile.bio || 'No bio added yet.'}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Trust Score */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ ...label, marginBottom: 14 }}>Trust Score</p>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, backgroundColor: trustBg, color: trustColor, borderRadius: 20, padding: '6px 16px', marginBottom: 12 }}>
                    <span style={{ fontSize: 28, fontWeight: 700 }}>{trustScore}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>/100</span>
                  </span>
                  <div style={{ height: 6, backgroundColor: '#e8e8ed', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${trustScore}%`, backgroundColor: trustColor, borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: trustColor }}>{trustLabel}</span>
                </div>
              </div>

              {/* Reward points */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <p style={{ ...label, marginBottom: 10 }}>Reward Points</p>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#0071e3' }}>{profile.reward_points ?? 0}</span>
                <p style={{ fontSize: 11, color: '#86868b', margin: '4px 0 0' }}>Points earned</p>
              </div>

              {/* Stats */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ ...label, marginBottom: 12 }}>Account Stats</p>
                {[
                  { l: 'Total Listings', v: listings.length },
                  { l: 'Completed Trades', v: listings.filter(i => ['traded','completed'].includes(i.status)).length },
                  { l: 'Avg. Rating', v: profile.average_rating > 0 ? `${profile.average_rating.toFixed(1)} / 5.0` : '0.0 / 5.0' },
                ].map((s, i, arr) => (
                  <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f7' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#6e6e73' }}>{s.l}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 20px', letterSpacing: '-0.02em' }}>My Listings</h2>
            {listings.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
                {listings.map(item => (
                  <article key={item.id} style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden', backgroundColor: '#f5f5f7', position: 'relative' }}>
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: 8, left: 8, backgroundColor: item.status === 'active' ? '#16a34a' : item.status === 'traded' ? '#0071e3' : '#d97706', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.status}</span>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{item.category_name || 'Uncategorized'}</p>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{item.title}</h3>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 32px', backgroundColor: '#fff', borderRadius: 16, border: '2px dashed #d2d2d7' }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>No listings yet</p>
                <p style={{ fontSize: 13.5, color: '#86868b', margin: '0 0 20px' }}>Start by adding a listing from the home page.</p>
                <Link to="/" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 9, background: '#0071e3', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>+ Add Listing</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>Reviews</h2>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{profile.average_rating > 0 ? `${profile.average_rating.toFixed(1)} / 5.0` : '0.0 / 5.0'} avg.</span>
            </div>
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.map(rev => (
                  <div key={rev.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', margin: '0 0 2px' }}>{rev.reviewer_username}</p>
                        <p style={{ fontSize: 11.5, color: '#86868b', margin: 0 }}>{new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <span style={{ backgroundColor: '#e8f4fd', color: '#0071e3', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>⭐ {rev.rating}</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: '#424245', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 32px', backgroundColor: '#fff', borderRadius: 16, border: '2px dashed #d2d2d7' }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>No reviews yet</p>
                <p style={{ fontSize: 13.5, color: '#86868b', margin: 0 }}>Feedback from completed swaps will appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 20px' }}>Settings</h2>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button type="button" onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', height: 46, borderRadius: 10, border: '1.5px solid #d2d2d7', background: '#fff', color: '#cc0000', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff2f2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                Logout from Account
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
