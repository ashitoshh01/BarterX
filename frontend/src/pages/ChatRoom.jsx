import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';
const POLL_INTERVAL = 3000;
const ff = { fontFamily: "'Inter',-apple-system,sans-serif" };

export default function ChatRoom() {
  const { roomId } = useParams();
  const { user, tokens } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dealStatus, setDealStatus] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [dealAction, setDealAction] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const headers = { Authorization: `Bearer ${tokens?.access}` };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchRoom = useCallback(async () => {
    try { const res = await axios.get(`${API}/chatrooms/${roomId}/`, { headers }); setRoom(res.data); } catch { /* ignore */ }
  }, [roomId, tokens]);

  const fetchMessages = useCallback(async () => {
    try { const res = await axios.get(`${API}/chatrooms/${roomId}/messages/`, { headers }); setMessages(res.data); } catch { /* ignore */ }
  }, [roomId, tokens]);

  const fetchDealStatus = useCallback(async () => {
    try { const res = await axios.get(`${API}/chatrooms/${roomId}/confirmation_status/`, { headers }); setDealStatus(res.data); }
    catch { setDealStatus(null); }
  }, [roomId, tokens]);

  useEffect(() => {
    if (!tokens?.access) { navigate('/login'); return; }
    const init = async () => { setLoading(true); await Promise.all([fetchRoom(), fetchMessages(), fetchDealStatus()]); setLoading(false); setTimeout(scrollToBottom, 100); };
    init();
  }, [roomId, tokens, navigate]);

  useEffect(() => {
    if (!tokens?.access) return;
    const interval = setInterval(() => { fetchMessages(); fetchDealStatus(); }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchDealStatus, tokens]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() && !mediaFile) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (newMsg.trim()) formData.append('message', newMsg.trim());
      if (mediaFile) formData.append('media', mediaFile);
      await axios.post(`${API}/chatrooms/${roomId}/send_message/`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      setNewMsg(''); setMediaFile(null); setMediaPreview(null);
      await fetchMessages();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); }
  };

  const handleRequestConfirmation = async () => {
    try { await axios.post(`${API}/chatrooms/${roomId}/request_confirmation/`, {}, { headers }); await fetchDealStatus(); }
    catch (err) { if (err.response?.status === 429) setCooldown(err.response.data.cooldown_remaining || 60); }
  };

  const handleRespondConfirmation = async (action) => {
    setDealAction(action);
    try { await axios.post(`${API}/chatrooms/${roomId}/respond_confirmation/`, { action }, { headers }); await fetchDealStatus(); await fetchRoom(); setConfirmPopup(false); }
    catch { /* ignore */ }
    finally { setDealAction(null); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ff }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const interest = room?.barter_interest_detail;
  const otherName = room?.user1_username === user?.username ? room?.user2_display_name : room?.user1_display_name;
  const isCompleted = interest?.status === 'completed';

  // Auto-show popup
  if (dealStatus && !isCompleted) {
    const isUser1 = user?.username === interest?.requester_username;
    const otherConfirmed = isUser1 ? dealStatus.user2_confirmed : dealStatus.user1_confirmed;
    const myConfirmed = isUser1 ? dealStatus.user1_confirmed : dealStatus.user2_confirmed;
    const otherCount = isUser1 ? dealStatus.user2_request_count : dealStatus.user1_request_count;
    if (otherCount > 0 && otherConfirmed && !myConfirmed && !confirmPopup) setTimeout(() => setConfirmPopup(true), 500);
  }

  return (
    <div style={{ height: '100vh', backgroundColor: '#f5f5f7', display: 'flex', flexDirection: 'column', ...ff }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Chat Header ── */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e8ed', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Link to="/my-chats" style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f5f5f7', border: '1.5px solid #e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#424245', textDecoration: 'none', flexShrink: 0, transition: 'background 0.18s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8ed'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f7'}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>

        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#0071e3,#2997ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{(otherName || '?').charAt(0).toUpperCase()}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherName}</h3>
          <span style={{ fontSize: 11, fontWeight: 600, color: isCompleted ? '#16a34a' : '#86868b', textTransform: 'capitalize' }}>{interest?.status || 'Active'}</span>
        </div>

        {!isCompleted && interest?.status === 'accepted' && (
          cooldown > 0
            ? <span style={{ fontSize: 11, fontWeight: 600, color: '#86868b', flexShrink: 0 }}>Cooldown: {cooldown}s</span>
            : <button onClick={handleRequestConfirmation} style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
                onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
                ✓ Request Deal
              </button>
        )}
        {isCompleted && (
          <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #bbf7d0', flexShrink: 0 }}>✓ Completed</span>
        )}
      </header>

      {/* ── Context bar ── */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0 }}>
        {interest?.offered_item_detail && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{interest.offered_item_detail.title}</span>
        )}
        {interest?.offered_item_detail && <svg width="14" height="14" fill="none" stroke="#0071e3" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>}
        {!interest?.offered_item_detail && <span style={{ fontSize: 11, fontWeight: 600, color: '#86868b' }}>Interested in:</span>}
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{interest?.requested_item_detail?.title}</span>
      </div>

      {/* ── Messages Area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <p style={{ fontSize: 13.5, color: '#86868b', margin: 0 }}>Start the conversation! Discuss swap details here.</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_username === user?.username;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '72%', backgroundColor: isMine ? '#0071e3' : '#fff', color: isMine ? '#fff' : '#1d1d1f', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '10px 14px', boxShadow: isMine ? '0 2px 8px rgba(0,113,227,0.25)' : '0 2px 6px rgba(0,0,0,0.07)', border: isMine ? 'none' : '1px solid #e8e8ed' }}>
                {!isMine && <span style={{ fontSize: 10, fontWeight: 600, color: '#0071e3', display: 'block', marginBottom: 3 }}>{msg.sender_display_name}</span>}
                {msg.media_url && <img src={msg.media_url} alt="Shared" style={{ borderRadius: 10, marginBottom: 6, maxHeight: 200, width: '100%', objectFit: 'cover', display: 'block' }} />}
                {msg.message && <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{msg.message}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.55)' : '#86868b' }}>{formatTime(msg.created_at)}</span>
                  {isMine && <span style={{ fontSize: 10, color: msg.is_read ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Media Preview ── */}
      {mediaPreview && (
        <div style={{ padding: '8px 20px 0', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={mediaPreview} alt="Preview" style={{ height: 72, borderRadius: 10, border: '1.5px solid #e8e8ed', objectFit: 'cover' }} />
            <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#1d1d1f', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'inherit' }}>×</button>
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      {!isCompleted && (
        <form onSubmit={handleSend} style={{ backgroundColor: '#fff', borderTop: '1px solid #e8e8ed', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7', border: '1.5px solid #e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6e73', cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0071e3'; e.currentTarget.style.borderColor = '#0071e3'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6e6e73'; e.currentTarget.style.borderColor = '#e8e8ed'; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleMediaSelect} accept="image/*" style={{ display: 'none' }} />
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
            style={{ flex: 1, height: 42, padding: '0 16px', borderRadius: 21, border: '1.5px solid #e8e8ed', backgroundColor: '#f5f5f7', fontSize: 14, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.backgroundColor = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#e8e8ed'; e.target.style.backgroundColor = '#f5f5f7'; }} />
          <button type="submit" disabled={sending || (!newMsg.trim() && !mediaFile)}
            style={{ width: 42, height: 42, borderRadius: '50%', background: (sending || (!newMsg.trim() && !mediaFile)) ? '#d2d2d7' : '#0071e3', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (sending || (!newMsg.trim() && !mediaFile)) ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'background 0.18s' }}
            onMouseEnter={e => { if (!sending && (newMsg.trim() || mediaFile)) e.currentTarget.style.background = '#0064d0'; }}
            onMouseLeave={e => { if (!sending && (newMsg.trim() || mediaFile)) e.currentTarget.style.background = '#0071e3'; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        </form>
      )}

      {/* ── Deal Confirmation Modal ── */}
      {confirmPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, maxWidth: 400, width: '100%', padding: '36px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🤝</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px' }}>Deal Confirmation</h3>
            <p style={{ fontSize: 13.5, color: '#6e6e73', margin: '0 0 24px', lineHeight: 1.6 }}>The other party has requested to finalize the barter. Do you confirm the deal is complete?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmPopup(false)} style={{ flex: 1, height: 42, borderRadius: 9, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#6e6e73', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Later</button>
              <button onClick={() => handleRespondConfirmation('decline')} disabled={dealAction === 'decline'} style={{ flex: 1, height: 42, borderRadius: 9, border: '1.5px solid #ffd2d2', backgroundColor: '#fff2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Decline</button>
              <button onClick={() => handleRespondConfirmation('accept')} disabled={dealAction === 'accept'} style={{ flex: 1, height: 42, borderRadius: 9, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Accept ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
