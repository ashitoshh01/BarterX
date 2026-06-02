import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';
const POLL_INTERVAL = 3000;

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoom = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chatrooms/${roomId}/`, { headers });
      setRoom(res.data);
    } catch { /* ignore */ }
  }, [roomId, tokens]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chatrooms/${roomId}/messages/`, { headers });
      setMessages(res.data);
    } catch { /* ignore */ }
  }, [roomId, tokens]);

  const fetchDealStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chatrooms/${roomId}/confirmation_status/`, { headers });
      setDealStatus(res.data);
    } catch { setDealStatus(null); }
  }, [roomId, tokens]);

  // Initial load
  useEffect(() => {
    if (!tokens?.access) { navigate('/login'); return; }
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRoom(), fetchMessages(), fetchDealStatus()]);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };
    init();
  }, [roomId, tokens, navigate]);

  // Polling for new messages
  useEffect(() => {
    if (!tokens?.access) return;
    const interval = setInterval(() => {
      fetchMessages();
      fetchDealStatus();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchDealStatus, tokens]);

  // Scroll when messages update
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Cooldown timer
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

      await axios.post(`${API}/chatrooms/${roomId}/send_message/`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setNewMsg('');
      setMediaFile(null);
      setMediaPreview(null);
      await fetchMessages();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRequestConfirmation = async () => {
    try {
      await axios.post(`${API}/chatrooms/${roomId}/request_confirmation/`, {}, { headers });
      await fetchDealStatus();
    } catch (err) {
      if (err.response?.status === 429) {
        setCooldown(err.response.data.cooldown_remaining || 60);
      }
    }
  };

  const handleRespondConfirmation = async (action) => {
    setDealAction(action);
    try {
      await axios.post(`${API}/chatrooms/${roomId}/respond_confirmation/`, { action }, { headers });
      await fetchDealStatus();
      await fetchRoom();
      setConfirmPopup(false);
    } catch { /* ignore */ }
    finally { setDealAction(null); }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-wine-900 border-r-2"></div>
      </div>
    );
  }

  const interest = room?.barter_interest_detail;
  const otherName = room?.user1_username === user?.username ? room?.user2_display_name : room?.user1_display_name;
  const isCompleted = interest?.status === 'completed';

  return (
    <div className="h-screen bg-sand-400 text-wine-900 flex flex-col">
      {/* Chat Header */}
      <header className="bg-sand-100 border-b border-sand-500/20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/my-chats" className="text-wine-900/60 hover:text-wine-900 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="h-10 w-10 rounded-full bg-wine-900/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-wine-900/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{otherName}</h3>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${
              isCompleted ? 'text-green-800' : 'text-wine-900/50'
            }`}>
              {interest?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Deal Confirmation Button */}
        {!isCompleted && interest?.status === 'accepted' && (
          <div className="flex items-center gap-2 shrink-0">
            {cooldown > 0 ? (
              <span className="text-[10px] font-bold text-wine-900/50 uppercase tracking-widest">
                Cooldown: {cooldown}s
              </span>
            ) : (
              <button
                onClick={handleRequestConfirmation}
                className="px-4 py-2 rounded-full bg-green-800 text-sand-100 text-[10px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm"
              >
                Request Deal ✓
              </button>
            )}
          </div>
        )}

        {isCompleted && (
          <span className="px-3 py-1.5 rounded-full bg-green-900/10 text-green-900 text-[9px] font-bold uppercase tracking-widest border border-green-900/20 shrink-0">
            ✓ Completed
          </span>
        )}
      </header>

      {/* Barter Context Bar */}
      <div className="bg-sand-200/50 border-b border-sand-500/15 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 text-[10px] shrink-0">
        {interest?.offered_item_detail ? (
          <>
            <span className="font-bold text-wine-900/60 uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
              {interest.offered_item_detail.title}
            </span>
            <svg className="w-4 h-4 text-wine-900/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </>
        ) : (
          <span className="font-bold text-wine-900/50 uppercase tracking-widest mr-1">
            Interested in:
          </span>
        )}
        <span className="font-bold text-wine-900/60 uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
          {interest?.requested_item_detail?.title}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <span className="text-3xl block mb-2">👋</span>
            <p className="text-xs text-wine-900/50 font-medium">Start the conversation! Discuss swap details here.</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_username === user?.username;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] sm:max-w-[60%] rounded-[18px] px-4 py-2.5 ${
                isMine
                  ? 'bg-wine-900 text-sand-100 rounded-br-md'
                  : 'bg-sand-100 text-wine-900 border border-sand-500/20 rounded-bl-md'
              }`}>
                {!isMine && (
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block mb-0.5">
                    {msg.sender_display_name}
                  </span>
                )}
                {msg.media_url && (
                  <img src={msg.media_url} alt="Shared" className="rounded-xl mb-2 max-h-48 object-cover w-full" />
                )}
                {msg.message && <p className="text-sm font-medium leading-relaxed">{msg.message}</p>}
                <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : ''}`}>
                  <span className={`text-[9px] ${isMine ? 'text-sand-100/50' : 'text-wine-900/40'}`}>
                    {formatTime(msg.created_at)}
                  </span>
                  {isMine && (
                    <span className={`text-[9px] ${msg.is_read ? 'text-blue-300' : 'text-sand-100/40'}`}>
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="relative inline-block">
            <img src={mediaPreview} alt="Preview" className="h-20 rounded-xl border border-sand-500/20" />
            <button
              onClick={() => { setMediaFile(null); setMediaPreview(null); }}
              className="absolute -top-2 -right-2 bg-wine-900 text-sand-100 rounded-full h-5 w-5 flex items-center justify-center text-xs"
            >×</button>
          </div>
        </div>
      )}

      {/* Message Input */}
      {!isCompleted && (
        <form onSubmit={handleSend} className="bg-sand-100 border-t border-sand-500/20 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-wine-900/50 hover:text-wine-900 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleMediaSelect} accept="image/*" className="hidden" />
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full bg-sand-200/50 border border-sand-500/20 text-sm text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-800"
          />
          <button
            type="submit"
            disabled={sending || (!newMsg.trim() && !mediaFile)}
            className="h-10 w-10 rounded-full bg-wine-900 text-sand-100 flex items-center justify-center hover:bg-wine-800 transition-colors disabled:opacity-40 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      )}

      {/* Deal Confirmation Popup */}
      {confirmPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wine-950/80 backdrop-blur-sm">
          <div className="bg-sand-100 rounded-[28px] max-w-sm w-full p-8 text-center space-y-5 shadow-2xl">
            <span className="text-4xl block">🤝</span>
            <h3 className="text-xl font-serif-aesthetic font-normal">Deal Confirmation Request</h3>
            <p className="text-xs text-wine-900/60 font-medium">The other party has requested to finalize the barter. Do you confirm the deal is complete?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPopup(false)} className="flex-1 py-3 rounded-2xl bg-sand-200 text-wine-900 font-bold text-xs uppercase tracking-wider hover:bg-sand-300 transition-colors">Later</button>
              <button onClick={() => handleRespondConfirmation('decline')} disabled={dealAction === 'decline'} className="flex-1 py-3 rounded-2xl bg-red-100 text-red-800 font-bold text-xs uppercase tracking-wider hover:bg-red-200 transition-colors border border-red-200">Decline</button>
              <button onClick={() => handleRespondConfirmation('accept')} disabled={dealAction === 'accept'} className="flex-1 py-3 rounded-2xl bg-wine-900 text-sand-100 font-bold text-xs uppercase tracking-wider hover:bg-wine-800 transition-colors shadow-md">Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-show popup when deal confirmation is pending for this user */}
      {dealStatus && !isCompleted && (() => {
        const isUser1 = user?.username === interest?.requester_username;
        const otherConfirmed = isUser1 ? dealStatus.user2_confirmed : dealStatus.user1_confirmed;
        const myConfirmed = isUser1 ? dealStatus.user1_confirmed : dealStatus.user2_confirmed;
        const otherRequestCount = isUser1 ? dealStatus.user2_request_count : dealStatus.user1_request_count;
        if (otherRequestCount > 0 && otherConfirmed && !myConfirmed && !confirmPopup) {
          setTimeout(() => setConfirmPopup(true), 500);
        }
        return null;
      })()}
    </div>
  );
}
