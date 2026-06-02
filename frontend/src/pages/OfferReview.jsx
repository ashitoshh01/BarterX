import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

export default function OfferReview() {
  const { interestId } = useParams();
  const { tokens } = useAuth();
  const navigate = useNavigate();

  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // 'accepted' | 'rejected'

  useEffect(() => {
    const fetchInterest = async () => {
      try {
        const res = await axios.get(`${API}/interests/${interestId}/`, {
          headers: { Authorization: `Bearer ${tokens?.access}` }
        });
        setInterest(res.data);
      } catch { setError('Failed to load offer details.'); }
      finally { setLoading(false); }
    };
    if (tokens?.access) fetchInterest();
    else navigate('/login');
  }, [interestId, tokens, navigate]);

  const handleAction = async (action) => {
    setActing(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/interests/${interestId}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${tokens?.access}` }
      });
      setResult(action === 'accept' ? 'accepted' : 'rejected');
      if (action === 'accept' && res.data.chat_room_id) {
        setTimeout(() => navigate(`/chat/${res.data.chat_room_id}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} interest.`);
    } finally { setActing(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-wine-900 border-r-2"></div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center p-4">
        <div className="bg-sand-100 border border-sand-500/20 max-w-md w-full rounded-[28px] p-8 text-center space-y-5 shadow-md">
          <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${result === 'accepted' ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
            {result === 'accepted' ? (
              <svg className="w-8 h-8 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900">
            {result === 'accepted' ? 'Interest Accepted!' : 'Interest Declined'}
          </h3>
          <p className="text-sm text-wine-900/60 font-medium">
            {result === 'accepted' ? 'Redirecting to chat...' : 'The requester has been notified.'}
          </p>
          {result === 'rejected' && (
            <Link to="/" className="inline-block px-6 py-3 rounded-full bg-wine-900 text-sand-100 text-xs font-bold uppercase tracking-wider hover:bg-wine-800 transition-colors">
              Back to Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  const requested = interest?.requested_item_detail;
  const offered = interest?.offered_item_detail;

  const ItemCard = ({ item, label, borderColor }) => (
    <div className={`bg-sand-100 border-2 ${borderColor} rounded-[28px] overflow-hidden shadow-sm`}>
      <div className="aspect-[16/10] overflow-hidden bg-sand-200 p-2.5">
        <div className="w-full h-full rounded-[18px] overflow-hidden">
          <img
            src={item?.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"}
            alt={item?.title} className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <span className="text-[9px] font-bold text-wine-900/50 uppercase tracking-wider block">{label}</span>
        <h3 className="text-xl font-serif-aesthetic font-normal leading-snug">{item?.title}</h3>
        <p className="text-xs text-wine-900/70 font-medium line-clamp-3">{item?.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-sand-200/50 rounded-xl p-2.5">
            <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Category</span>
            <span className="font-bold text-wine-950">{item?.category_name}</span>
          </div>
          <div className="bg-sand-200/50 rounded-xl p-2.5">
            <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Condition</span>
            <span className="font-bold text-wine-950 capitalize">{item?.condition?.replace('_', ' ')}</span>
          </div>
          <div className="bg-sand-200/50 rounded-xl p-2.5">
            <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Owner</span>
            <span className="font-bold text-wine-950">{item?.owner_display_name}</span>
          </div>
          <div className="bg-sand-200/50 rounded-xl p-2.5">
            <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Trust</span>
            <span className={`font-bold capitalize ${item?.owner_trust_level === 'high' ? 'text-green-800' : item?.owner_trust_level === 'medium' ? 'text-amber-700' : 'text-red-700'}`}>
              {item?.owner_trust_score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );

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
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif-aesthetic font-normal text-wine-900 mb-2">Review Swap Offer</h1>
          <p className="text-sm text-wine-900/60 font-medium">
            <span className="font-bold">{interest?.requester_display_name}</span> wants to swap with you
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-sm text-red-800 font-medium">{error}</div>
        )}

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ItemCard item={requested} label="Your Item (Requested)" borderColor="border-wine-900/15" />
          <ItemCard item={offered} label="Their Offer" borderColor="border-green-800/15" />
        </div>

        {/* Swap Arrow Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 bg-sand-100 border border-sand-500/20 rounded-full px-6 py-3 shadow-sm">
            <span className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">{offered?.title}</span>
            <svg className="w-5 h-5 text-wine-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">{requested?.title}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {interest?.status === 'pending' && (
          <div className="flex gap-4 justify-center pt-2">
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="px-8 py-3.5 rounded-2xl bg-sand-200 hover:bg-red-100 border border-sand-500/20 hover:border-red-300 text-wine-900 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Reject Interest
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={acting}
              className="px-8 py-3.5 rounded-2xl bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {acting ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-sand-100"></div> : null}
              Accept Interest
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
