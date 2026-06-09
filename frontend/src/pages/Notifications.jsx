import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/';

function buildNotifications(offers, messages, userId) {
  const notifs = [];

  // Incoming pending offers
  offers
    .filter(o => (o.receiver === userId || o.receiver?.id === userId) && o.status === 'pending')
    .forEach(o => {
      notifs.push({
        id: `offer-pending-${o.id}`,
        type: 'offer_received',
        title: 'New Swap Offer Received',
        body: `Someone wants to swap "${o.requested_item?.title || 'an item'}" for your "${o.offered_item?.title || 'item'}"`,
        time: o.created_at,
        icon: 'swap',
        color: 'bg-blue-100 text-blue-600',
        link: '/offers',
        read: false,
      });
    });

  // Accepted offers
  offers
    .filter(o => (o.sender === userId || o.sender?.id === userId) && o.status === 'accepted')
    .forEach(o => {
      notifs.push({
        id: `offer-accepted-${o.id}`,
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        body: `Your offer for "${o.requested_item?.title || 'an item'}" was accepted. Trade completed!`,
        time: o.updated_at || o.created_at,
        icon: 'check',
        color: 'bg-emerald-100 text-emerald-600',
        link: '/swap-history',
        read: false,
      });
    });

  // Rejected offers
  offers
    .filter(o => (o.sender === userId || o.sender?.id === userId) && o.status === 'rejected')
    .forEach(o => {
      notifs.push({
        id: `offer-rejected-${o.id}`,
        type: 'offer_rejected',
        title: 'Offer Rejected',
        body: `Your offer for "${o.requested_item?.title || 'an item'}" was declined.`,
        time: o.updated_at || o.created_at,
        icon: 'x',
        color: 'bg-red-100 text-red-500',
        link: '/offers',
        read: false,
      });
    });

  // Unread messages
  const unreadMsgs = messages.filter(m =>
    (m.receiver === userId || m.receiver?.id === userId) && !m.is_read
  );
  if (unreadMsgs.length > 0) {
    notifs.push({
      id: 'unread-messages',
      type: 'message',
      title: `${unreadMsgs.length} Unread Message${unreadMsgs.length > 1 ? 's' : ''}`,
      body: `You have ${unreadMsgs.length} unread message${unreadMsgs.length > 1 ? 's' : ''} waiting for you.`,
      time: unreadMsgs[0]?.created_at,
      icon: 'chat',
      color: 'bg-purple-100 text-purple-600',
      link: '/messages',
      read: false,
    });
  }

  // Sort by time
  return notifs.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
}

const ICONS = {
  swap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  ),
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersRes, msgsRes] = await Promise.all([
          axios.get(`${API_URL}offers/`),
          axios.get(`${API_URL}messages/`),
        ]);
        setOffers(offersRes.data?.results || offersRes.data || []);
        setMessages(msgsRes.data?.results || msgsRes.data || []);
      } catch (err) {
        console.error('Notifications fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userId = user?.id;
  const notifications = buildNotifications(offers, messages, userId);
  const unread = notifications.filter(n => !readIds.has(n.id));
  const readCount = readIds.size;

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
  };

  const markRead = (id) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  const TYPE_LABELS = {
    offer_received: 'Offer',
    offer_accepted: 'Trade',
    offer_rejected: 'Offer',
    message: 'Message',
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {unread.filter(n => !readIds.has(n.id)).length} unread notifications
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-semibold text-wine-900 hover:underline transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-28 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-gray-500">All caught up!</h3>
            <p className="text-sm text-gray-400 mt-1">No new notifications. Start trading to get activity here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map(notif => {
            const isRead = readIds.has(notif.id);
            return (
              <div
                key={notif.id}
                onClick={() => { markRead(notif.id); navigate(notif.link); }}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isRead ? 'border-gray-100 opacity-60' : 'border-wine-900/10'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.color}`}>
                  {ICONS[notif.icon]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-800">{notif.title}</span>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-wine-900 shrink-0"/>}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notif.body}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${notif.color}`}>
                      {TYPE_LABELS[notif.type]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-gray-400">
                      {notif.time
                        ? new Date(notif.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Recently'}
                    </span>
                    <span className="text-[10px] font-semibold text-wine-900 hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
