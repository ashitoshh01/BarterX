import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

export default function MyChats() {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API}/chatrooms/`, {
          headers: { Authorization: `Bearer ${tokens?.access}` }
        });
        setRooms(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    if (tokens?.access) fetchRooms();
    else navigate('/login');
  }, [tokens, navigate]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
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
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-wine-900 border-2 border-sand-200 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-sand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-wide font-serif-aesthetic">BarterX</span>
          </Link>
          <Link to="/" className="text-xs font-bold uppercase tracking-wider text-wine-900/70 hover:text-wine-900">← Home</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="text-3xl font-serif-aesthetic font-normal">Barter Chats</h1>

        {rooms.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-sand-500/40 rounded-[28px] bg-sand-100/50">
            <span className="text-4xl block mb-3">💬</span>
            <h3 className="text-xl font-serif-aesthetic font-normal">No Active Chats</h3>
            <p className="text-xs text-wine-900/50 mt-1 font-medium">When a swap interest is accepted, a chat will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map(room => {
              const otherName = room.user1_username === user?.username ? room.user2_display_name : room.user1_display_name;
              const interest = room.barter_interest_detail;
              const itemTitle = interest?.requested_item_detail?.title || 'Item';
              return (
                <Link
                  key={room.id}
                  to={`/chat/${room.id}`}
                  className="block bg-sand-100 border border-sand-500/20 rounded-[20px] p-5 hover:border-wine-900/20 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-wine-900/10 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-wine-900/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm">{otherName}</h4>
                        <span className="text-[10px] text-wine-900/50 font-semibold shrink-0">
                          {room.last_message ? timeAgo(room.last_message.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-wine-900/60 font-medium mt-0.5 truncate">
                        {room.last_message ? room.last_message.message : `Swap: ${itemTitle}`}
                      </p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                        interest?.status === 'completed' ? 'bg-green-900/10 text-green-900 border-green-900/20'
                          : interest?.status === 'accepted' ? 'bg-blue-900/10 text-blue-900 border-blue-900/20'
                          : 'bg-sand-200 text-wine-900/60 border-sand-500/20'
                      }`}>
                        {interest?.status}
                      </span>
                    </div>
                    {room.unread_count > 0 && (
                      <div className="h-6 min-w-6 rounded-full bg-wine-900 text-sand-100 flex items-center justify-center text-[10px] font-bold px-1.5">
                        {room.unread_count}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
