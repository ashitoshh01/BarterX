import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-pink-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-purple-500', 'bg-orange-500', 'bg-teal-500',
];

function colorFor(str) {
  if (!str) return AVATAR_COLORS[0];
  const idx = str.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}messages/`);
      setMessages(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartner]);

  const userId = user?.id;

  // Group messages by conversation partner
  const conversations = {};
  messages.forEach(msg => {
    const partnerId   = msg.sender === userId || msg.sender?.id === userId
      ? (msg.receiver?.id ?? msg.receiver)
      : (msg.sender?.id ?? msg.sender);
    const partnerName = msg.sender === userId || msg.sender?.id === userId
      ? (msg.receiver_username || `User ${msg.receiver}`)
      : (msg.sender_username   || `User ${msg.sender}`);

    if (!conversations[partnerId]) {
      conversations[partnerId] = { partnerId, partnerName, messages: [] };
    }
    conversations[partnerId].messages.push(msg);
  });

  const convList = Object.values(conversations).sort((a, b) => {
    const lastA = new Date(a.messages[a.messages.length - 1]?.created_at || 0);
    const lastB = new Date(b.messages[b.messages.length - 1]?.created_at || 0);
    return lastB - lastA;
  });

  const activeConv = selectedPartner ? conversations[selectedPartner] : null;
  const threadMessages = activeConv
    ? [...activeConv.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}messages/`, {
        receiver: selectedPartner,
        message: newMessage.trim(),
      });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const markRead = async (msgId) => {
    try {
      await axios.patch(`${API_URL}messages/${msgId}/`, { is_read: true });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
    } catch {}
  };

  const unreadCount = messages.filter(m =>
    (m.receiver === userId || m.receiver?.id === userId) && !m.is_read
  ).length;

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left: Conversation List */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800">Messages</h1>
              <p className="text-xs text-gray-400 mt-0.5">{convList.length} conversations</p>
            </div>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-wine-900 text-white text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
            </div>
          ) : convList.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              </div>
              <p className="text-sm text-gray-400">No messages yet</p>
            </div>
          ) : (
            convList.map(conv => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isActive = selectedPartner === conv.partnerId;
              const hasUnread = conv.messages.some(m =>
                (m.receiver === userId || m.receiver?.id === userId) && !m.is_read
              );
              return (
                <button
                  key={conv.partnerId}
                  onClick={() => {
                    setSelectedPartner(conv.partnerId);
                    conv.messages.filter(m =>
                      (m.receiver === userId || m.receiver?.id === userId) && !m.is_read
                    ).forEach(m => markRead(m.id));
                  }}
                  className={`w-full px-5 py-4 flex items-start gap-3 transition-colors text-left border-b border-gray-50 ${
                    isActive ? 'bg-wine-900/5 border-l-2 border-l-wine-900' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${colorFor(conv.partnerName)} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
                    {getInitials(conv.partnerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isActive ? 'text-wine-900' : 'text-gray-800'}`}>
                        {conv.partnerName}
                      </span>
                      {hasUnread && <span className="w-2 h-2 rounded-full bg-wine-900 shrink-0"/>}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg?.message || ''}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Message Thread */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedPartner ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-500">Select a conversation</h2>
              <p className="text-sm text-gray-400 mt-1">Choose a conversation from the left to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shrink-0">
              <div className={`w-10 h-10 rounded-full ${colorFor(activeConv?.partnerName)} text-white text-sm font-bold flex items-center justify-center`}>
                {getInitials(activeConv?.partnerName)}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">{activeConv?.partnerName}</div>
                <div className="text-xs text-gray-400">{activeConv?.messages.length} messages</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {threadMessages.map(msg => {
                const isMe = msg.sender === userId || msg.sender?.id === userId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full ${colorFor(activeConv?.partnerName)} text-white text-xs font-bold flex items-center justify-center mr-2 shrink-0 self-end`}>
                        {getInitials(activeConv?.partnerName)}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-wine-900 text-white rounded-br-sm'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 px-1">
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span className={`ml-1 ${msg.is_read ? 'text-blue-400' : 'text-gray-300'}`}>
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3 shrink-0">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 rounded-2xl bg-wine-900 hover:bg-wine-800 text-white flex items-center justify-center transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
