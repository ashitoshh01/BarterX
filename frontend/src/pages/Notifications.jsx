import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const API = 'http://localhost:8000/api';

export default function Notifications() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications/`, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      setNotifications(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [tokens]);

  useEffect(() => {
    if (tokens?.access) fetchNotifications();
    else navigate('/login');
  }, [tokens, navigate, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await axios.post(`${API}/notifications/${id}/read/`, {}, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/mark_all_read/`, {}, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const getNotifAction = (notif) => {
    if (['interest_received', 'interest_accepted', 'deal_requested'].includes(notif.notification_type) && notif.barter_interest_id)
      return { label: 'Open Chat', isChatAction: true };
    return null;
  };

  const handleActionClick = async (notif, action) => {
    if (action.isChatAction) {
      setActionLoadingId(notif.id);
      await markAsRead(notif.id);
      try {
        const res = await axios.post(`${API}/interests/${notif.barter_interest_id}/accept/`, {}, { headers: { Authorization: `Bearer ${tokens?.access}` } });
        navigate(res.data.chat_room_id ? `/chat/${res.data.chat_room_id}` : '/my-chats');
      } catch {
        try {
          const ir = await axios.get(`${API}/interests/${notif.barter_interest_id}/`, { headers: { Authorization: `Bearer ${tokens?.access}` } });
          navigate(ir.data.chat_room_id ? `/chat/${ir.data.chat_room_id}` : '/my-chats');
        } catch { navigate('/my-chats'); }
      } finally { setActionLoadingId(null); }
    } else if (action.path) { await markAsRead(notif.id); navigate(action.path); }
  };

  const ICON_MAP = { interest_received: '📥', interest_accepted: '✅', interest_rejected: '❌', deal_requested: '🤝', deal_completed: '🎉' };
  const timeAgo = (d) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

  const ff = { fontFamily: "'Inter',-apple-system,sans-serif" };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ff }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...ff }}>
      <NavBar />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 72px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Notifications</h1>
            <p style={{ fontSize: 13, color: '#86868b', margin: 0 }}>{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ height: 34, padding: '0 16px', borderRadius: 8, border: '1.5px solid #d2d2d7', backgroundColor: '#fff', color: '#6e6e73', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0071e3'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d2d2d7'}>
              Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 32px', backgroundColor: '#fff', borderRadius: 20, border: '2px dashed #d2d2d7' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>No notifications yet</h3>
            <p style={{ fontSize: 13.5, color: '#86868b', margin: 0 }}>When someone interacts with your listings, you'll see it here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(notif => {
              const action = getNotifAction(notif);
              return (
                <div key={notif.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: notif.is_read ? 'none' : '0 2px 12px rgba(0,0,0,0.07)', border: notif.is_read ? '1.5px solid #e8e8ed' : '1.5px solid rgba(0,113,227,0.2)', opacity: notif.is_read ? 0.72 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{ICON_MAP[notif.notification_type] || '🔔'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{notif.title}</h4>
                        <span style={{ fontSize: 11, color: '#86868b', fontWeight: 500, flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#6e6e73', margin: '0 0 12px', lineHeight: 1.5 }}>{notif.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {action && (
                          <button onClick={() => handleActionClick(notif, action)} disabled={actionLoadingId === notif.id}
                            style={{ height: 32, padding: '0 16px', borderRadius: 8, background: '#0071e3', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: actionLoadingId === notif.id ? 0.6 : 1 }}>
                            {actionLoadingId === notif.id && <div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                            {action.label}
                          </button>
                        )}
                        {!notif.is_read && (
                          <button onClick={() => markAsRead(notif.id)} style={{ fontSize: 12, fontWeight: 500, color: '#86868b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
                        )}
                      </div>
                    </div>
                    {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0071e3', flexShrink: 0, marginTop: 6 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
