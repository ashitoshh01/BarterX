import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

export default function SwapProposal() {
  const { itemId } = useParams();
  const { tokens } = useAuth();
  const navigate = useNavigate();

  const [requestedItem, setRequestedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdChatRoomId, setCreatedChatRoomId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/items/${itemId}/`);
        setRequestedItem(res.data);
      } catch (err) {
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    if (tokens?.access) fetchData();
    else navigate('/login');
  }, [itemId, tokens, navigate]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/interests/`, {
        requested_item: requestedItem.id
      }, { headers: { Authorization: `Bearer ${tokens?.access}` } });
      if (res.data.chat_room_id) {
        setCreatedChatRoomId(res.data.chat_room_id);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send interest.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-wine-900 border-r-2"></div>
          <span className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">Loading Product...</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center p-4">
        <div className="bg-sand-100 border border-sand-500/20 max-w-md w-full rounded-[28px] p-8 text-center space-y-5 shadow-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-green-900/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900">Interest Submitted!</h3>
          <p className="text-sm text-wine-900/60 font-medium leading-relaxed">
            You have notified the owner about your interest! They will connect with you soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {createdChatRoomId && (
              <Link to={`/chat/${createdChatRoomId}`} className="flex-1 py-3 rounded-2xl bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-md">
                Chat with Owner
              </Link>
            )}
            <Link to="/" className="flex-1 py-3 rounded-2xl bg-sand-200 hover:bg-sand-300 text-wine-900 font-bold text-xs uppercase tracking-wider text-center transition-colors border border-sand-500/10">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-400 text-wine-900 flex flex-col">
      {/* Header */}
      <header className="bg-sand-400/85 backdrop-blur-md border-b border-sand-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-wine-900 border-2 border-sand-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-sand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-wide font-serif-aesthetic text-wine-900">BarterX</span>
          </Link>
          <button onClick={() => navigate(-1)} className="text-xs font-bold uppercase tracking-wider text-wine-900/70 hover:text-wine-900 transition-colors">
            ← Back
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif-aesthetic font-normal text-wine-900 mb-2">Product Details</h1>
          <p className="text-sm text-wine-900/60 font-medium">Review the product information below and let the owner know if you're interested</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-sm text-red-800 font-medium">
            {error}
          </div>
        )}

        {requestedItem && (
          <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] overflow-hidden shadow-sm">
            {/* Image Gallery Container */}
            <div className="aspect-[16/9] w-full bg-sand-200 p-3">
              <div className="w-full h-full rounded-[22px] overflow-hidden shadow-inner">
                <img
                  src={requestedItem.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"}
                  alt={requestedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Body Details */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full bg-wine-900/10 text-wine-900 text-[10px] font-bold uppercase tracking-widest inline-block">
                  {requestedItem.category_name || 'Uncategorized'}
                </span>
                <h2 className="text-3xl font-serif-aesthetic font-normal leading-tight text-wine-900">
                  {requestedItem.title}
                </h2>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-wine-900/40">Description</h4>
                <p className="text-sm text-wine-900/80 font-medium leading-relaxed">
                  {requestedItem.description}
                </p>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-sand-200/40 rounded-2xl p-4 border border-sand-500/10">
                  <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[9px] mb-1">Condition</span>
                  <span className="font-bold text-wine-950 text-sm capitalize">{requestedItem.condition?.replace('_', ' ')}</span>
                </div>
                <div className="bg-sand-200/40 rounded-2xl p-4 border border-sand-500/10">
                  <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[9px] mb-1">Location</span>
                  <span className="font-bold text-wine-950 text-sm">{requestedItem.location}</span>
                </div>
                <div className="bg-sand-200/40 rounded-2xl p-4 border border-sand-500/10">
                  <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[9px] mb-1">Owner</span>
                  <span className="font-bold text-wine-950 text-sm">{requestedItem.owner_username}</span>
                </div>
                <div className="bg-sand-200/40 rounded-2xl p-4 border border-sand-500/10">
                  <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[9px] mb-1">Owner Seeking</span>
                  <span className="font-bold text-wine-950 text-sm">{requestedItem.wanting || 'Open Discussion'}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-sand-500/15 pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 rounded-full bg-sand-200 hover:bg-sand-300 text-wine-900 font-bold text-xs uppercase tracking-wider transition-colors border border-sand-500/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-10 py-4 rounded-full bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-sand-100"></div>
                      Notifying Owner...
                    </>
                  ) : (
                    'I\'m Interested'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
