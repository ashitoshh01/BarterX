import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { logout, tokens } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile from api/profile/ using context tokens
        const profileRes = await axios.get('http://localhost:8000/api/profile/', {
          headers: {
            Authorization: `Bearer ${tokens?.access}`
          }
        });
        setProfile(profileRes.data);

        // Fetch user's listings
        const listingsRes = await axios.get('http://localhost:8000/api/items/my_items/', {
          headers: {
            Authorization: `Bearer ${tokens?.access}`
          }
        });
        setListings(listingsRes.data);

        // Fetch user's reviews
        const reviewsRes = await axios.get('http://localhost:8000/api/reviews/', {
          headers: {
            Authorization: `Bearer ${tokens?.access}`
          }
        });
        const userReviews = reviewsRes.data.filter(
          review => review.reviewed_user_username === profileRes.data.username
        );
        setReviews(userReviews);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load profile. Please try again.');
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tokens?.access) {
      fetchProfileData();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [tokens, navigate, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-wine-900 border-r-2"></div>
          <span className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-sand-400 flex items-center justify-center p-4">
        <div className="bg-sand-100 border border-red-500/20 max-w-md w-full rounded-[28px] p-8 text-center space-y-4 shadow-md">
          <svg className="w-12 h-12 text-red-500/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-normal font-serif-aesthetic text-wine-900">Failed to Load Profile</h3>
          <p className="text-xs text-wine-900/60 leading-relaxed font-medium">{error || 'Unauthorized access.'}</p>
          <div className="pt-2">
            <Link to="/" className="inline-block px-6 py-3 rounded-full bg-wine-900 hover:bg-wine-800 text-sand-100 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Set default values for empty fields
  const displayBio = profile.bio || "Bio not added yet";
  const displayLocation = profile.location || "Location not added yet";
  const displayPhone = profile.phone_number || "Phone number not added yet";

  return (
    <div className="min-h-screen bg-sand-400 text-wine-900 flex flex-col">
      {/* Header Banner */}
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
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-wine-900/70 hover:text-wine-900 transition-colors">
              Registry Ledger
            </Link>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="px-4 py-2 rounded-full bg-wine-900 text-sand-100 text-xs font-bold uppercase tracking-wider hover:bg-wine-800 transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Profile Header Cards */}
        <section className="bg-sand-100 border border-sand-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-sm">
          {/* Avatar Area */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-wine-900/10 border-2 border-wine-900/20 overflow-hidden flex items-center justify-center text-wine-900 shrink-0">
            {profile.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-12 h-12 text-wine-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          {/* User Details */}
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
              <h2 className="text-3xl font-serif-aesthetic font-normal leading-tight">{profile.display_name || profile.username}</h2>
              {profile.is_verified && (
                <span className="self-center inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-900/10 text-green-900 border border-green-950/20 uppercase tracking-widest">
                  Verified Member
                </span>
              )}
            </div>
            
            <p className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">
              {profile.account_type === 'business' ? 'Business Account' : 'Individual Account'}
            </p>
            
            <p className="text-sm font-medium text-wine-950/70">{profile.email}</p>
          </div>
        </section>

        {/* Tab Selection */}
        <section className="flex border-b border-sand-500/30 overflow-x-auto pb-px">
          {['overview', 'listings', 'reviews', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'border-wine-900 text-wine-900'
                  : 'border-transparent text-wine-900/50 hover:text-wine-900'
              }`}
            >
              {tab === 'listings' ? 'My Listings' : tab}
            </button>
          ))}
        </section>

        {/* Dynamic Tab Body */}
        <section className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Profile details column */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900 border-b border-sand-500/20 pb-3">About User</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Display Name</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">{profile.display_name || 'Not Added'}</span>
                    </div>
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Account Category</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">
                        {profile.account_type === 'business' ? (profile.business_category || 'General Business') : 'Individual Swapper'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Bio</span>
                      <p className="text-sm font-medium text-wine-950/70 leading-relaxed">{displayBio}</p>
                    </div>
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Location</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">{displayLocation}</span>
                    </div>
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Phone Number</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">{displayPhone}</span>
                    </div>
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Member Since</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">{profile.member_since || 'June 2026'}</span>
                    </div>
                    <div>
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px] mb-1">Verification Status</span>
                      <span className="text-wine-950 font-bold font-serif-aesthetic text-base">
                        {profile.is_verified ? 'Verified Address & Identity' : 'Basic Member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics/Completion Sidebar */}
              <div className="space-y-6">
                {/* Trust Score Card */}
                <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">Trust Score</h4>
                  <div className="text-center space-y-3">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
                      (profile.trust_score || 50) >= 80 ? 'bg-green-900/10 text-green-900 border-green-900/20'
                        : (profile.trust_score || 50) >= 50 ? 'bg-amber-900/10 text-amber-800 border-amber-800/20'
                        : 'bg-red-900/10 text-red-800 border-red-800/20'
                    }`}>
                      <span className="font-serif-aesthetic text-xl font-bold">{profile.trust_score ?? 50}</span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">/ 100</span>
                    </div>
                    <div className="w-full bg-sand-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          (profile.trust_score || 50) >= 80 ? 'bg-green-800'
                            : (profile.trust_score || 50) >= 50 ? 'bg-amber-700'
                            : 'bg-red-700'
                        }`}
                        style={{ width: `${profile.trust_score ?? 50}%` }}
                      ></div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${
                      (profile.trust_score || 50) >= 80 ? 'text-green-800' : (profile.trust_score || 50) >= 50 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {(profile.trust_score || 50) >= 80 ? 'High Trust' : (profile.trust_score || 50) >= 50 ? 'Medium Trust' : 'Low Trust'}
                    </span>
                  </div>
                </div>

                {/* Reward Points Card */}
                <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">Reward Points</h4>
                  <div className="text-center">
                    <span className="font-serif-aesthetic text-3xl font-bold text-wine-900">{profile.reward_points ?? 0}</span>
                    <p className="text-[9px] font-bold text-wine-900/50 uppercase tracking-widest mt-1">Points Earned</p>
                  </div>
                </div>

                {/* Stats Summary cards */}
                <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-wine-900/60 uppercase tracking-widest">Account Registry Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-sand-500/10 text-sm">
                      <span className="text-wine-900/60 font-medium">Total Listings</span>
                      <span className="font-serif-aesthetic font-bold text-base">{listings.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-sand-500/10 text-sm">
                      <span className="text-wine-900/60 font-medium">Completed Exchanges</span>
                      <span className="font-serif-aesthetic font-bold text-base">
                        {listings.filter(item => item.status === 'traded' || item.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-wine-900/60 font-medium">Average Rating</span>
                      <span className="font-serif-aesthetic font-bold text-base">
                        {profile.average_rating > 0 ? `${profile.average_rating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900">My Swap Registry Items</h3>
              
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <article key={item.id} className="bg-sand-100 border border-sand-500/20 rounded-[24px] overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-[16/10] overflow-hidden bg-sand-200 relative p-2">
                        <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                          <img 
                            src={item.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"} 
                            alt={item.title} 
                            className="w-full h-full object-cover" 
                          />
                          <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                            item.status === 'active' 
                              ? 'bg-green-900/90 text-sand-100 border-green-200/20' 
                              : item.status === 'traded'
                              ? 'bg-blue-900/90 text-sand-100 border-blue-200/20'
                              : 'bg-amber-900/90 text-sand-100 border-amber-200/20'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[9px] font-bold text-wine-900/50 uppercase tracking-wider block">
                          {item.category_name || "Uncategorized"}
                        </span>
                        <h4 className="text-lg font-serif-aesthetic font-normal text-wine-900 leading-snug">{item.title}</h4>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-sand-500/40 rounded-[28px] bg-sand-100/50">
                  <svg className="w-10 h-10 text-wine-900/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h4 className="text-base font-serif-aesthetic font-normal text-wine-900">No Registry Items Added</h4>
                  <p className="text-[10px] font-bold text-wine-900/60 uppercase tracking-widest mt-1">Start by adding a listing from the dashboard</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sand-500/20 pb-4">
                <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900">Exchange Reviews</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-wine-900/60 uppercase tracking-widest">Average Score:</span>
                  <span className="font-serif-aesthetic font-bold text-xl text-wine-900">
                    {profile.average_rating > 0 ? `${profile.average_rating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
                  </span>
                </div>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-sand-100 border border-sand-500/20 rounded-[20px] p-5 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-serif-aesthetic font-bold text-wine-950 text-base">{review.reviewer_username}</h4>
                          <span className="text-[10px] text-wine-900/50 font-semibold">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-wine-900/5 px-2 py-0.5 rounded-full border border-wine-900/10">
                          <span className="text-xs font-bold text-wine-900">{review.rating}</span>
                          <svg className="w-3.5 h-3.5 text-wine-900 fill-wine-900" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-wine-900/80 font-medium leading-relaxed italic">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-sand-500/40 rounded-[28px] bg-sand-100/50">
                  <svg className="w-10 h-10 text-wine-900/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.6 1.792l-3.962 2.88a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.962-2.88a1 1 0 00-1.176 0l-3.962 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.962-2.88c-.76-.546-.362-1.792.6-1.792h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                  </svg>
                  <h4 className="text-base font-serif-aesthetic font-normal text-wine-900">No Reviews Received</h4>
                  <p className="text-[10px] font-bold text-wine-900/60 uppercase tracking-widest mt-1">Feedback from finalized swaps will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-serif-aesthetic font-normal text-wine-900">Profile Settings</h3>
              
              <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-sm max-w-md">
                <button 
                  type="button" 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full py-3.5 rounded-2xl bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  Logout from Account
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-wine-950 text-sand-100 border-t border-wine-950 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sand-200 flex items-center justify-center border border-sand-300">
              <svg className="w-5 h-5 text-wine-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-xl font-normal font-serif-aesthetic tracking-wide">BarterX Registry</span>
          </div>
          <p className="text-xs text-sand-300/70 font-sans">
            &copy; {new Date().getFullYear()} BarterX Inc. Curating sustainable, cash-free commerce.
          </p>
        </div>
      </footer>
    </div>
  );
}
