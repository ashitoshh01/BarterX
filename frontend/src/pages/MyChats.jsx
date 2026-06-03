import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const API = 'http://localhost:8000/api';
const ff = { fontFamily: "'Inter',-apple-system,sans-serif" };

export default function MyChats() {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API}/chatrooms/`, { headers: { Authorization: `Bearer ${tokens?.access}` } });
        setRooms(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    if (tokens?.access) fetchRooms(); else navigate('/login');
  }, [tokens, navigate]);

  const timeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ff }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...ff }}>
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 72px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Barter Chats</h1>
        <p style={{ fontSize: 13.5, color: '#86868b', margin: '0 0 28px' }}>{rooms.length} active conversation{rooms.length !== 1 ? 's' : ''}</p>

        {rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 32px', backgroundColor: '#fff', borderRadius: 20, border: '2px dashed #d2d2d7' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>No active chats</h3>
            <p style={{ fontSize: 13.5, color: '#86868b', margin: '0 0 24px' }}>When a swap interest is accepted, a chat room will appear here.</p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 20px', borderRadius: 9, background: '#0071e3', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Browse Listings</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rooms.map(room => {
              const otherName = room.user1_username === user?.username ? room.user2_display_name : room.user1_display_name;
              const interest = room.barter_interest_detail;
              const itemTitle = interest?.requested_item_detail?.title || 'Item';
              const statusColor = interest?.status === 'completed' ? '#16a34a' : interest?.status === 'accepted' ? '#0071e3' : '#6e6e73';
              const statusBg = interest?.status === 'completed' ? '#f0fdf4' : interest?.status === 'accepted' ? '#e8f4fd' : '#f5f5f7';

              return (
                <Link key={room.id} to={`/chat/${room.id}`} style={{ display: 'block', backgroundColor: '#fff', borderRadius: 14, padding: '18px 20px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid transparent', transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0071e3'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0071e3,#2997ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{(otherName || '?').charAt(0).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{otherName}</h4>
                        <span style={{ fontSize: 11, color: '#86868b', fontWeight: 500, flexShrink: 0 }}>{room.last_message ? timeAgo(room.last_message.created_at) : ''}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#6e6e73', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.last_message ? room.last_message.message : `Swap: ${itemTitle}`}
                      </p>
                      <span style={{ display: 'inline-block', backgroundColor: statusBg, color: statusColor, fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, textTransform: 'capitalize' }}>
                        {interest?.status}
                      </span>
                    </div>
                    {room.unread_count > 0 && (
                      <div style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#0071e3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, padding: '0 5px' }}>
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
