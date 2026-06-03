import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const API = 'http://localhost:8000/api';
const ff = { fontFamily: "'Inter',-apple-system,sans-serif" };

const ItemCard = ({ item, label, accentColor, accentBg }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${accentBg}` }}>
    <div style={{ aspectRatio: '16/10', overflow: 'hidden', backgroundColor: '#f5f5f7' }}>
      <img src={item?.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'} alt={item?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ padding: '20px 22px' }}>
      <span style={{ display: 'inline-block', backgroundColor: accentBg, color: accentColor, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</span>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{item?.title}</h3>
      <p style={{ fontSize: 12.5, color: '#6e6e73', margin: '0 0 14px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item?.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { l: 'Category', v: item?.category_name },
          { l: 'Condition', v: item?.condition?.replace('_', ' ') },
          { l: 'Owner', v: item?.owner_display_name },
          { l: 'Trust', v: `${item?.owner_trust_score}/100` },
        ].map(s => (
          <div key={s.l} style={{ backgroundColor: '#f5f5f7', borderRadius: 9, padding: '10px 12px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 2 }}>{s.l}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1d1d1f', textTransform: s.l === 'Condition' ? 'capitalize' : 'none' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function OfferReview() {
  const { interestId } = useParams();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchInterest = async () => {
      try {
        const res = await axios.get(`${API}/interests/${interestId}/`, { headers: { Authorization: `Bearer ${tokens?.access}` } });
        setInterest(res.data);
      } catch { setError('Failed to load offer details.'); }
      finally { setLoading(false); }
    };
    if (tokens?.access) fetchInterest(); else navigate('/login');
  }, [interestId, tokens, navigate]);

  const handleAction = async (action) => {
    setActing(true); setError(null);
    try {
      const res = await axios.post(`${API}/interests/${interestId}/${action}/`, {}, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      setResult(action === 'accept' ? 'accepted' : 'rejected');
      if (action === 'accept' && res.data.chat_room_id) setTimeout(() => navigate(`/chat/${res.data.chat_room_id}`), 1500);
    } catch (err) { setError(err.response?.data?.detail || `Failed to ${action} interest.`); }
    finally { setActing(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ff }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (result) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, ...ff }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '44px 36px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 68, height: 68, borderRadius: 18, backgroundColor: result === 'accepted' ? '#f0fdf4' : '#fff2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {result === 'accepted'
            ? <svg width="28" height="28" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            : <svg width="28" height="28" fill="none" stroke="#dc2626" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          }
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px' }}>{result === 'accepted' ? 'Interest Accepted!' : 'Interest Declined'}</h2>
        <p style={{ fontSize: 14, color: '#6e6e73', margin: '0 0 28px' }}>{result === 'accepted' ? 'Redirecting to chat room...' : 'The requester has been notified.'}</p>
        {result === 'rejected' && <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 24px', borderRadius: 10, background: '#0071e3', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Back to Home</Link>}
      </div>
    </div>
  );

  const requested = interest?.requested_item_detail;
  const offered = interest?.offered_item_detail;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...ff }}>
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Review Swap Offer</h1>
          <p style={{ fontSize: 14, color: '#6e6e73', margin: 0 }}>
            <strong>{interest?.requester_display_name}</strong> wants to swap with you
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fff2f2', border: '1.5px solid #ffd2d2', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, color: '#cc0000', fontWeight: 500, marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <ItemCard item={requested} label="Your Item (Requested)" accentColor="#0071e3" accentBg="#e8f4fd" />
          <ItemCard item={offered} label="Their Offer" accentColor="#16a34a" accentBg="#f0fdf4" />
        </div>

        {/* Swap indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 30, padding: '10px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #e8e8ed' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6e6e73' }}>{offered?.title}</span>
            <svg width="18" height="18" fill="none" stroke="#0071e3" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6e6e73' }}>{requested?.title}</span>
          </div>
        </div>

        {interest?.status === 'pending' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => handleAction('reject')} disabled={acting}
              style={{ height: 48, padding: '0 28px', borderRadius: 10, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', opacity: acting ? 0.6 : 1 }}
              onMouseEnter={e => { if (!acting) e.currentTarget.style.backgroundColor = '#fff2f2'; }}
              onMouseLeave={e => { if (!acting) e.currentTarget.style.backgroundColor = '#fff'; }}>
              Reject
            </button>
            <button onClick={() => handleAction('accept')} disabled={acting}
              style={{ height: 48, padding: '0 32px', borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: acting ? 0.7 : 1, transition: 'background 0.18s' }}
              onMouseEnter={e => { if (!acting) e.currentTarget.style.background = '#15803d'; }}
              onMouseLeave={e => { if (!acting) e.currentTarget.style.background = '#16a34a'; }}>
              {acting && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              Accept & Start Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
