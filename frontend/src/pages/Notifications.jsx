import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

export default function Notifications() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` }
      });
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
      await axios.post(`${API}/notifications/${id}/read/`, {}, {
        headers: { Authorization: `Bearer ${tokens?.access}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/mark_all_read/`, {}, {
        headers: { Authorization: `Bearer ${tokens?.access}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const getNotifAction = (notif) => {
    if (notif.notification_type === 'interest_received' && notif.barter_interest_id) {
      return { label: 'Chat', isChatAction: true };
    }
    if (notif.notification_type === 'interest_accepted' && notif.barter_interest_id) {
      return { label: 'Open Chat', isChatAction: true };
    }
    if (notif.notification_type === 'deal_requested' && notif.barter_interest_id) {
      return { label: 'View Chat', isChatAction: true };
    }
    return null;
  };

  const handleActionClick = async (notif, action) => {
    if (action.isChatAction) {
      setActionLoadingId(notif.id);
      await markAsRead(notif.id);
      try {
        // Auto-accept/retrieve chat room id
        const res = await axios.post(`${API}/interests/${notif.barter_interest_id}/accept/`, {}, {
          headers: { Authorization: `Bearer ${tokens?.access}` }
        });
        if (res.data.chat_room_id) {
          navigate(`/chat/${res.data.chat_room_id}`);
        } else {
          navigate('/my-chats');
        }
      } catch (err) {
        // Fallback: check if chat room is already created and can be fetched
        try {
          const interestRes = await axios.get(`${API}/interests/${notif.barter_interest_id}/`, {
            headers: { Authorization: `Bearer ${tokens?.access}` }
          });
          if (interestRes.data.chat_room_id) {
            navigate(`/chat/${interestRes.data.chat_room_id}`);
          } else {
            navigate('/my-chats');
          }
        } catch {
          navigate('/my-chats');
        }
      } finally {
        setActionLoadingId(null);
      }
    } else if (action.path) {
      await markAsRead(notif.id);
      navigate(action.path);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'interest_received': return '📥';
      case 'interest_accepted': return '✅';
      case 'interest_rejected': return '❌';
      case 'deal_requested': return '🤝';
      case 'deal_completed': return '🎉';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-wine-900 border-r-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-400 text-wine-900 flex flex-col">
      <header className="bg-sand-400/85 backdrop-blur-md border-b border-sand-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-wine-900 border-2 border-sand-200 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-sand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-wide font-serif-aesthetic">BarterX</span>
          </Link>
          <Link to="/" className="text-xs font-bold uppercase tracking-wider text-wine-900/70 hover:text-wine-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif-aesthetic font-normal text-wine-900">Notifications</h1>
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold uppercase tracking-wider text-wine-900/60 hover:text-wine-900 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-sand-500/40 rounded-[28px] bg-sand-100/50">
            <span className="text-4xl block mb-3">🔔</span>
            <h3 className="text-xl font-serif-aesthetic font-normal text-wine-900">No Notifications Yet</h3>
            <p className="text-xs text-wine-900/50 mt-1 font-medium">When someone interacts with your listings, you'll see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => {
              const action = getNotifAction(notif);
              return (
                <div
                  key={notif.id}
                  className={`bg-sand-100 border rounded-[20px] p-5 transition-all ${
                    notif.is_read ? 'border-sand-500/15 opacity-70' : 'border-wine-900/15 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0 mt-0.5">{getIcon(notif.notification_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-wine-900">{notif.title}</h4>
                        <span className="text-[10px] text-wine-900/50 font-semibold shrink-0">{timeAgo(notif.created_at)}</span>
                      </div>
                      <p className="text-xs text-wine-900/70 font-medium mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-3">
                        {action && (
                          <button
                            onClick={() => handleActionClick(notif, action)}
                            disabled={actionLoadingId === notif.id}
                            className="px-4 py-2 rounded-full bg-wine-900 text-sand-100 text-[10px] font-bold uppercase tracking-wider hover:bg-wine-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoadingId === notif.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-sand-100"></div>
                            ) : null}
                            {action.label}
                          </button>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-[10px] font-bold text-wine-900/50 uppercase tracking-wider hover:text-wine-900 transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-wine-900 shrink-0 mt-1.5"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
