import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const API = 'http://localhost:8000/api';
const ff = { fontFamily: "'Inter',-apple-system,sans-serif" };

export default function SwapProposal() {
  const { itemId } = useParams();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [requestedItem, setRequestedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/items/${itemId}/`);
        setRequestedItem(res.data);
      } catch { setError('Failed to load product details.'); }
      finally { setLoading(false); }
    };
    if (tokens?.access) fetchData(); else navigate('/login');
  }, [itemId, tokens, navigate]);

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await axios.post(`${API}/interests/`, { requested_item: requestedItem.id }, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      if (res.data.chat_room_id) setChatRoomId(res.data.chat_room_id);
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to send interest.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ff }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, ...ff }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Interest Submitted!</h2>
        <p style={{ fontSize: 14, color: '#6e6e73', margin: '0 0 28px', lineHeight: 1.6 }}>The owner has been notified about your interest. They'll connect with you soon.</p>
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          {chatRoomId && (
            <Link to={`/chat/${chatRoomId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: 10, background: '#0071e3', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Chat with Owner
            </Link>
          )}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: 10, border: '1.5px solid #d2d2d7', background: '#fff', color: '#1d1d1f', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...ff }}>
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 72px' }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 500, color: '#0071e3', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 16 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Product Details</h1>
          <p style={{ fontSize: 13.5, color: '#86868b', margin: 0 }}>Review the item and let the owner know if you're interested</p>
        </div>

        {error && <div style={{ backgroundColor: '#fff2f2', border: '1.5px solid #ffd2d2', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, color: '#cc0000', fontWeight: 500, marginBottom: 20 }}>{error}</div>}

        {requestedItem && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {/* Image */}
            <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f7' }}>
              <img src={requestedItem.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'} alt={requestedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ padding: '28px 32px' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#e8f4fd', color: '#0071e3', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.04em', marginBottom: 12 }}>
                {requestedItem.category_name || 'Uncategorized'}
              </span>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: '0 0 16px', letterSpacing: '-0.02em' }}>{requestedItem.title}</h2>
              {requestedItem.description && (
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.65, margin: '0 0 24px' }}>{requestedItem.description}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                  { l: 'Condition', v: requestedItem.condition?.replace('_', ' ') },
                  { l: 'Location', v: requestedItem.location },
                  { l: 'Owner', v: requestedItem.owner_username },
                  { l: 'Seeking', v: requestedItem.wanting || 'Open Discussion' },
                ].map(s => (
                  <div key={s.l} style={{ backgroundColor: '#f5f5f7', borderRadius: 12, padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>{s.l}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1d1d1f', textTransform: s.l === 'Condition' ? 'capitalize' : 'none' }}>{s.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #e8e8ed', paddingTop: 24 }}>
                <button onClick={() => navigate(-1)} style={{ flex: 1, height: 48, borderRadius: 10, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, height: 48, borderRadius: 10, background: submitting ? '#86868b' : '#0071e3', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.18s' }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#0064d0'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#0071e3'; }}>
                  {submitting ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Notifying Owner...</> : "I'm Interested →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
