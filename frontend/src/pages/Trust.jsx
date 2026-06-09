import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type={readOnly ? 'button' : 'button'}
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`text-xl transition-transform ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wine-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {(review.reviewer_username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">{review.reviewer_username || `User ${review.reviewer}`}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <StarRating value={review.rating} readOnly />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          "{review.comment}"
        </p>
      )}
    </div>
  );
}

function WriteReviewModal({ offers, onClose, onSubmit }) {
  const [form, setForm] = useState({ offer: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Write a Review</h3>
            <p className="text-xs text-gray-400 mt-0.5">Share your experience with this trader</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {offers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Related Trade (optional)</label>
              <select
                value={form.offer}
                onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-wine-900/20"
              >
                <option value="">Select a trade...</option>
                {offers.filter(o => o.status === 'accepted').map(o => (
                  <option key={o.id} value={o.id}>Offer #{o.id} — {o.offered_item?.title || 'Trade'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating *</label>
            <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            {!form.rating && <p className="text-xs text-gray-400 mt-1">Click a star to rate</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Comment</label>
            <textarea
              rows="4"
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Describe your experience with this trader..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!form.rating || submitting} className="flex-1 py-3 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Trust() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, reviewsRes, offersRes] = await Promise.all([
          axios.get(`${API_URL}user/stats/`),
          axios.get(`${API_URL}reviews/`),
          axios.get(`${API_URL}offers/`),
        ]);
        setStats(statsRes.data);
        setReviews(reviewsRes.data?.results || reviewsRes.data || []);
        setOffers(offersRes.data?.results || offersRes.data || []);
      } catch (err) {
        console.error('Trust fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSubmitReview = async (form) => {
    try {
      const payload = {
        rating: form.rating,
        comment: form.comment,
        ...(form.offer ? { offer: parseInt(form.offer) } : {}),
      };
      const res = await axios.post(`${API_URL}reviews/`, payload);
      setReviews(prev => [res.data, ...prev]);
      setShowModal(false);
      showToast('Review submitted successfully!');
    } catch (err) {
      showToast('Failed to submit review.', 'error');
    }
  };

  const trustScore = stats?.trust_score ?? 0;
  const trustLabel = stats?.trust_label ?? 'New';
  const trustChecklist = stats?.trust_checklist ?? [];

  const trustColor =
    trustScore >= 80 ? 'text-emerald-500' :
    trustScore >= 60 ? 'text-blue-500' :
    trustScore >= 40 ? 'text-yellow-500' : 'text-gray-400';

  const trustRingColor =
    trustScore >= 80 ? '#10b981' :
    trustScore >= 60 ? '#3b82f6' :
    trustScore >= 40 ? '#f59e0b' : '#d1d5db';

  const avgRating = stats?.average_rating ?? 0;
  const reviewsReceived = reviews.filter(r =>
    r.reviewed_user === user?.id || r.reviewed_user?.id === user?.id
  );

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (trustScore / 100) * circumference;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trust & Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your trust score and community feedback</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          Write Review
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* LEFT: Reviews */}
          <div className="space-y-6">
            {/* Reviews summary bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-6">
              <div className="text-center shrink-0">
                <div className="text-4xl font-bold text-gray-800">{avgRating.toFixed(1)}</div>
                <StarRating value={Math.round(avgRating)} readOnly />
                <div className="text-xs text-gray-400 mt-1">{reviewsReceived.length} reviews</div>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviewsReceived.filter(r => r.rating === star).length;
                  const pct = reviewsReceived.length ? (count / reviewsReceived.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4 shrink-0">{star}</span>
                      <span className="text-yellow-400 text-xs shrink-0">★</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-[10px] text-gray-400 w-5 shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews list */}
            <div>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Reviews Received ({reviewsReceived.length})</h2>
              {reviewsReceived.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  </div>
                  <p className="text-sm text-gray-400">No reviews yet. Complete trades to earn reviews!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsReceived.map(review => <ReviewCard key={review.id} review={review}/>)}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Trust Score */}
          <div className="space-y-4">
            {/* Trust Score Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-5">Trust Score</h3>

              {/* Circular Progress */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8"/>
                  <circle
                    cx="48" cy="48" r="42"
                    fill="none"
                    stroke={trustRingColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${trustColor}`}>{trustScore}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 ${
                trustScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                trustScore >= 60 ? 'bg-blue-100 text-blue-700' :
                trustScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>
                {trustLabel}
              </div>

              {/* Checklist */}
              <div className="space-y-2.5 text-left">
                {trustChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.done ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      {item.done ? (
                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      )}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{item.label}</span>
                    {item.done && <span className="ml-auto text-[10px] font-bold text-emerald-500">+pts</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Avg Rating', value: `${avgRating.toFixed(1)} ★`, color: 'text-yellow-500' },
                  { label: 'Reviews Received', value: reviewsReceived.length, color: 'text-gray-800' },
                  { label: 'Successful Trades', value: stats?.successful_swaps ?? 0, color: 'text-emerald-600' },
                  { label: 'Member Since', value: stats?.member_since ? new Date(stats.member_since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—', color: 'text-gray-600' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <WriteReviewModal
          offers={offers}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
