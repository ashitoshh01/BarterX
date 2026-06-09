import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StatsRow, TrustScoreWidget, RecentOffersWidget } from '../components/DashboardWidgets';
import CategoryGrid from '../components/CategoryGrid';

const API_URL = 'http://localhost:8000/api/';

// Greeting based on time
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '👋' };
  return { text: 'Good evening', emoji: '🌙' };
};

// Fallback recommended items (shown when not logged-in or API unavailable)
const SAMPLE_RECOMMENDED = [
  {
    id: 1, title: 'MacBook Pro M1', owner: 'Rahul K.', rating: 4.9, distance: '2 km away',
    wants: 'iPhone / Camera', badge: 'Recommended',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 2, title: 'Sony A7 III Camera', owner: 'Neha P.', rating: 4.8, distance: '3 km away',
    wants: 'Drone / MacBook', badge: 'Recommended',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 3, title: 'L-Shaped Sofa', owner: 'Priya S.', rating: 4.7, distance: '5 km away',
    wants: 'Dining Table / Bike', badge: 'Recommended',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 4, title: 'UI/UX Design Service', owner: 'DesignCraft', rating: 5.0, distance: 'Online',
    wants: 'Marketing / Dev', badge: 'Service',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&auto=format&fit=crop&q=80',
  },
];

const BADGE_COLORS = {
  Recommended: 'bg-emerald-500',
  Service: 'bg-purple-500',
};

// Trending swap pairs (static for now, real data comes from /api/trending/)
const TRENDING_PAIRS = [
  { a: 'Laptop', b: 'iPhone', count: 24, imgA: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&auto=format&fit=crop', imgB: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&auto=format&fit=crop' },
  { a: 'Bike', b: 'Laptop', count: 18, imgA: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=200&auto=format&fit=crop', imgB: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&auto=format&fit=crop' },
  { a: 'Camera', b: 'Headphones', count: 16, imgA: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&auto=format&fit=crop', imgB: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop' },
  { a: 'Design', b: 'Dev Work', count: 22, imgA: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=200&auto=format&fit=crop', imgB: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&auto=format&fit=crop' },
];

// Nearby traders (static sample)
const NEARBY_TRADERS = [
  { name: 'Sneha R.', rating: 4.9, distance: '2 km away', avatar: 'S', color: 'bg-pink-500' },
  { name: 'Arjun Mehta', rating: 4.8, distance: '3 km away', avatar: 'A', color: 'bg-blue-500' },
  { name: 'Kabir Singh', rating: 4.7, distance: '4 km away', avatar: 'K', color: 'bg-green-500' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, offersRes] = await Promise.all([
          axios.get(`${API_URL}user/stats/`),
          axios.get(`${API_URL}offers/`),
        ]);
        setStats(statsRes.data);
        setOffers(offersRes.data?.results || offersRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
      {/* Top greeting bar */}
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {greeting.text}, {user?.username || 'Trader'}! {greeting.emoji}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Ready to make your next great swap?</p>
        </div>
        <button
          onClick={() => navigate('/my-listings')}
          className="flex items-center gap-2 text-sm font-semibold text-wine-900 border border-wine-900/20 rounded-xl px-4 py-2 hover:bg-wine-900 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          View your profile
        </button>
      </div>

      {/* Main 3-column grid */}
      <div className="px-8 pb-10 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* LEFT: main content */}
        <div className="space-y-8">
          {/* Stats Row */}
          <StatsRow stats={stats} />

          {/* Recommended For You */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-700">Recommended for you</h2>
              <Link to="/browse" className="text-xs font-semibold text-wine-900 hover:underline">See all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
              {SAMPLE_RECOMMENDED.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 w-56 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <span className={`absolute top-2 left-2 text-[9px] font-bold text-white px-2 py-1 rounded-lg ${BADGE_COLORS[item.badge] || 'bg-gray-500'}`}>
                      {item.badge}
                    </span>
                    <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-gray-800 mb-1 truncate">{item.title}</div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">By {item.owner}</span>
                      <span className="text-[10px] font-semibold text-yellow-500">★ {item.rating}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">Wants: {item.wants}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {item.distance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Swaps */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-700">Trending swaps this week 🔥</h2>
              <Link to="/browse" className="text-xs font-semibold text-wine-900 hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRENDING_PAIRS.map((pair) => (
                <div key={pair.a} className="bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <img src={pair.imgA} alt={pair.a} className="w-full h-full object-cover"/>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <img src={pair.imgB} alt={pair.b} className="w-full h-full object-cover"/>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{pair.a} ↔ {pair.b}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{pair.count} new offers</div>
                </div>
              ))}
            </div>
          </section>

          {/* Category Grid */}
          <CategoryGrid />
        </div>

        {/* RIGHT: widgets column */}
        <div className="space-y-4">
          <TrustScoreWidget stats={stats} />

          {/* Nearby Traders */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">Nearby traders</h3>
              <button className="text-xs font-semibold text-wine-900 hover:underline">See all</button>
            </div>
            <ul className="space-y-3">
              {NEARBY_TRADERS.map((trader) => (
                <li key={trader.name} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${trader.color} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
                    {trader.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-700 truncate">{trader.name}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {trader.distance}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-yellow-500">★ {trader.rating}</span>
                    <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-wine-900 hover:text-white transition-all border border-gray-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <RecentOffersWidget offers={offers} />
        </div>
      </div>
    </div>
  );
}
