import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400' },
  accepted:  { label: 'Accepted',  bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
  countered: { label: 'Countered', bg: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-300' },
};

function OfferCard({ offer, currentUserId, onAction }) {
  const isReceiver = offer.receiver === currentUserId || offer.receiver?.id === currentUserId;
  const isSender   = offer.sender  === currentUserId || offer.sender?.id  === currentUserId;
  const status = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
  const [acting, setActing] = useState(false);

  const doAction = async (newStatus) => {
    setActing(true);
    await onAction(offer.id, newStatus);
    setActing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Top bar */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dot}`}/>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.bg}`}>
            {status.label}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {isReceiver ? 'Incoming' : 'Outgoing'}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          {new Date(offer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Swap visual */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          {/* Offered item */}
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5">Offered</div>
            {offer.offered_item?.image_url ? (
              <img src={offer.offered_item.image_url} alt={offer.offered_item.title} className="w-full h-20 object-cover rounded-lg mb-2"/>
            ) : (
              <div className="w-full h-20 bg-emerald-100/50 rounded-lg mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
            )}
            <div className="text-xs font-bold text-gray-800 truncate">{offer.offered_item?.title || 'Item'}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{offer.offered_item?.offering || offer.offered_item?.category_name || ''}</div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>

          {/* Requested item */}
          <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-1.5">Requested</div>
            {offer.requested_item?.image_url ? (
              <img src={offer.requested_item.image_url} alt={offer.requested_item.title} className="w-full h-20 object-cover rounded-lg mb-2"/>
            ) : (
              <div className="w-full h-20 bg-blue-100/50 rounded-lg mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
            )}
            <div className="text-xs font-bold text-gray-800 truncate">{offer.requested_item?.title || 'Item'}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{offer.requested_item?.wanting || offer.requested_item?.category_name || ''}</div>
          </div>
        </div>

        {/* Message */}
        {offer.message && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-2.5 text-xs text-gray-600 border border-gray-100">
            <span className="font-semibold text-gray-400 text-[9px] uppercase tracking-widest block mb-0.5">Note</span>
            {offer.message}
          </div>
        )}

        {/* Parties */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
          <span>From: <span className="font-semibold text-gray-600">{offer.sender_username || offer.sender}</span></span>
          <span>To: <span className="font-semibold text-gray-600">{offer.receiver_username || offer.receiver}</span></span>
        </div>

        {/* Actions */}
        {offer.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            {isReceiver && (
              <>
                <button
                  disabled={acting}
                  onClick={() => doAction('accepted')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  disabled={acting}
                  onClick={() => doAction('rejected')}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors border border-red-100 disabled:opacity-60"
                >
                  Reject
                </button>
              </>
            )}
            {isSender && (
              <button
                disabled={acting}
                onClick={() => doAction('cancelled')}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs transition-colors disabled:opacity-60"
              >
                Cancel Offer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('received');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API_URL}offers/`);
        setOffers(res.data?.results || res.data || []);
      } catch (err) {
        console.error('Fetch offers error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleAction = async (offerId, newStatus) => {
    try {
      const res = await axios.patch(`${API_URL}offers/${offerId}/`, { status: newStatus });
      setOffers(prev => prev.map(o => o.id === offerId ? res.data : o));
      const msgs = { accepted: 'Offer accepted! Trade recorded.', rejected: 'Offer rejected.', cancelled: 'Offer cancelled.' };
      showToast(msgs[newStatus] || 'Updated.');
    } catch (err) {
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const userId = user?.id;
  const received = offers.filter(o => o.receiver === userId || o.receiver?.id === userId);
  const sent     = offers.filter(o => o.sender   === userId || o.sender?.id   === userId);
  const displayed = tab === 'received' ? received : sent;

  const pendingReceived = received.filter(o => o.status === 'pending').length;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Barter Offers</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your incoming and outgoing trade offers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Offers', value: offers.length, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'Pending Received', value: pendingReceived, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Accepted', value: offers.filter(o => o.status === 'accepted').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sent Offers', value: sent.length, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl border border-gray-100 p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('received')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === 'received' ? 'bg-wine-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:text-wine-900'
          }`}
        >
          Received
          {pendingReceived > 0 && (
            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'received' ? 'bg-white text-wine-900' : 'bg-wine-900 text-white'}`}>
              {pendingReceived}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === 'sent' ? 'bg-wine-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:text-wine-900'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
          </div>
          <h3 className="text-base font-bold text-gray-500">No {tab} offers yet</h3>
          <p className="text-sm text-gray-400">
            {tab === 'received' ? 'When others propose a swap, it will appear here.' : 'Browse listings and propose swaps to others.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayed.map(offer => (
            <OfferCard key={offer.id} offer={offer} currentUserId={userId} onAction={handleAction}/>
          ))}
        </div>
      )}
    </div>
  );
}
