import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

export default function SwapHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get(`${API_URL}transactions/`);
        setTransactions(res.data?.results || res.data || []);
      } catch (err) {
        console.error('Fetch transactions error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalTrades = transactions.length;
  const valueSaved = totalTrades * 5000;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Swap History</h1>
        <p className="text-sm text-gray-400 mt-0.5">A record of all your completed barter trades</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
            </div>
            <span className="text-sm font-semibold text-gray-600">Total Trades</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalTrades}</div>
          <div className="text-xs text-gray-400 mt-1">Completed swaps</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <span className="text-sm font-semibold text-gray-600">Value Saved</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">₹{valueSaved.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-400 mt-1">Estimated value exchanged</div>
        </div>

        <div className="bg-gradient-to-br from-wine-900 to-wine-800 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <span className="text-sm font-semibold text-white/80">Trust Earned</span>
          </div>
          <div className="text-3xl font-bold">{Math.min(totalTrades * 5, 25)} pts</div>
          <div className="text-xs text-white/60 mt-1">From successful trades</div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 className="text-base font-bold text-gray-500">No trades yet</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">Your completed trade history will appear here once you successfully exchange items with other traders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Trade Timeline</h2>
          {transactions.map((tx, idx) => {
            const isUser1 = tx.user_1 === user?.id || tx.user_1?.id === user?.id;
            const partner = isUser1
              ? (tx.user_2_username || tx.user_2 || 'Trader')
              : (tx.user_1_username || tx.user_1 || 'Trader');
            const myItem = isUser1 ? tx.item_1 : tx.item_2;
            const theirItem = isUser1 ? tx.item_2 : tx.item_1;

            return (
              <div key={tx.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  {idx < transactions.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2"/>}
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Trade Completed</span>
                      <span className="text-xs text-gray-400">with <span className="font-semibold text-gray-600">{partner}</span></span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* My item */}
                    <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">You gave</div>
                      {myItem?.image_url ? (
                        <img src={myItem.image_url} alt={myItem?.title} className="w-full h-16 object-cover rounded-lg mb-2"/>
                      ) : (
                        <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                      )}
                      <div className="text-xs font-bold text-gray-700 truncate">{myItem?.title || '—'}</div>
                    </div>

                    {/* Swap icon */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-wine-900 flex items-center justify-center shadow">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                    </div>

                    {/* Their item */}
                    <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">You received</div>
                      {theirItem?.image_url ? (
                        <img src={theirItem.image_url} alt={theirItem?.title} className="w-full h-16 object-cover rounded-lg mb-2"/>
                      ) : (
                        <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                      )}
                      <div className="text-xs font-bold text-gray-700 truncate">{theirItem?.title || '—'}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-3">
                    <span>Trade #{tx.id}</span>
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                      +5 trust points earned
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
