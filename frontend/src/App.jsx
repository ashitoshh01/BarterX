import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HowItWorks from './pages/HowItWorks';
import Dashboard from './pages/Dashboard';
import MyListings from './pages/MyListings';
import Offers from './pages/Offers';
import SwapHistory from './pages/SwapHistory';
import Messages from './pages/Messages';
import Trust from './pages/Trust';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import axios from 'axios';

// ─── Route guard: redirects to /login if not authenticated ───────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const API_URL = 'http://localhost:8000/api/';

// Sample initial data for the Barter Marketplace
const INITIAL_ITEMS = [
  {
    id: 6,
    title: "Sony A7 III Camera",
    description: "Mint condition body. Shutter count around 12k. Includes 2 batteries.",
    offering: "Sony A7 III Body",
    wanting: "DJI Mavic 3 Pro or similar drone",
    category: "Electronics & Gadgets",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    owner: "Alex M.",
    location: "Mumbai, MH",
    date: "2 mins ago"
  },
  {
    id: 5,
    title: "iPad Pro 12.9\" (M1)",
    description: "128GB, Space Gray, Wi-Fi model. Always used with screen protector.",
    offering: "iPad Pro + Apple Pencil 2",
    wanting: "MacBook Pro M1 (16GB RAM preferred)",
    category: "Electronics & Gadgets",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    owner: "Sarah K.",
    location: "Bengaluru, KA",
    date: "1 hour ago"
  },
  {
    id: 4,
    title: "Vintage Leather Jacket",
    description: "Genuine brown leather jacket, size L. Excellent patina, minor wear on cuffs.",
    offering: "Leather Jacket (Size L)",
    wanting: "Doc Martens Boots (Size 10)",
    category: "Fashion & Apparel",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    owner: "Marcus T.",
    location: "New Delhi, DL",
    date: "3 hours ago"
  },
  {
    id: 3,
    title: "Fender Stratocaster",
    description: "Player Series Strat in 3-Color Sunburst. Maple fingerboard. Perfect setup.",
    offering: "Fender Stratocaster",
    wanting: "Analog Synthesizer / Drum Machine",
    category: "Media & Entertainment",
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80",
    owner: "Elena R.",
    location: "Pune, MH",
    date: "5 hours ago"
  },
  {
    id: 2,
    title: "Ergonomic Office Chair",
    description: "High-back mesh chair with 3D armrests and lumbar support.",
    offering: "Ergonomic Office Chair",
    wanting: "Mechanical Keyboard (Custom/Hot-swap)",
    category: "Lifestyle & Home",
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
    owner: "David L.",
    location: "Hyderabad, TS",
    date: "1 day ago"
  },
  {
    id: 1,
    title: "UI/UX Design Mentorship",
    description: "Offering 5 hours of 1-on-1 design mentoring, portfolio reviews, and resume prep.",
    offering: "5h Design Mentorship",
    wanting: "React Native developer mentoring / code help",
    category: "Technology & IT Services",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    owner: "Chloe W.",
    location: "Remote",
    date: "2 days ago"
  }
];

const CATEGORIES = [
  "All",
  "Fashion & Apparel",
  "Lifestyle & Home",
  "Media & Entertainment",
  "Jewellery & Accessories",
  "Automotive & Accessories",
  "Electronics & Gadgets",
  "Hospitality & Equipment",
  "Travel & Luggage",
  "Beauty & Personal Care",
  "Healthcare & Wellness",
  "Entertainment & Gaming",
  "Events & Celebrations",
  "Marketing & Advertising",
  "Finance & Accounting",
  "Operations & Supply Chain",
  "Human Resources & Recruitment",
  "Legal & Compliance",
  "Sales & Business Development",
  "Technology & IT Services",
  "Agriculture & Farming",
  "Construction & Real Estate",
  "Transport & Logistics",
  "Household & Craftsman Services"
];

// ─── Marketplace (Browse) Page ───────────────────────────────────────────────
function Marketplace({ onOpenModal }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const location = useLocation();
  const navigate = useNavigate();

  // Pick up ?category= query param from CategoryGrid
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location.search]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.offering.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wanting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
    if (sortBy === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Browse Listings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Showing {sortedItems.length} active trades</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offers or wants..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 w-64 transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-wine-900/20 appearance-none cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">A–Z</option>
          </select>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              selectedCategory === cat
                ? 'bg-wine-900 text-white border-wine-900 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-wine-900/30 hover:text-wine-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedItems.length > 0 ? sortedItems.map((item) => (
          <article key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-wine-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-widest">
                {item.category}
              </span>
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:text-red-500 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-1.5">
                  <span>{item.owner}</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="text-base font-bold text-gray-800 group-hover:text-wine-900 transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase tracking-widest text-[8px] font-bold block">Offering</span>
                    <span className="text-gray-800 font-semibold">{item.offering}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100"/>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase tracking-widest text-[8px] font-bold block">Seeking</span>
                    <span className="text-gray-800 font-semibold">{item.wanting}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <button className="flex-1 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-xs uppercase tracking-wide transition-colors shadow-sm">
                  Propose Swap
                </button>
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {item.location}
                </span>
              </div>
            </div>
          </article>
        )) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-bold text-gray-600">No listings found</h3>
            <p className="text-sm text-gray-400 mt-1">Try a different category or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Placeholder pages for sidebar nav items ─────────────────────────────────
function PlaceholderPage({ title, emoji }) {
  return (
    <div className="flex-1 bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">{emoji}</div>
      <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
      <p className="text-sm text-gray-400">This page is coming soon.</p>
    </div>
  );
}

// ─── Sidebar Shell layout wrapper ────────────────────────────────────────────
function SidebarShell({ children, fullHeight = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}user/stats/`).then(r => setStats(r.data)).catch(() => {});
    }
  }, [user, location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar stats={stats} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        <DashboardHeader stats={stats} onListItem={() => setIsModalOpen(true)} />
        <div className={fullHeight ? 'flex-1 flex overflow-hidden' : 'flex-1 overflow-y-auto'}>
          {children}
        </div>
      </div>
      {isModalOpen && <CreateListingModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

// ─── Legacy Marketplace (public home page) ────────────────────────────────────
function LegacyMarketplace() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setIsModalOpen(true);
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.offering.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wanting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
    if (sortBy === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-sand-400 text-wine-900">
      {/* Top Banner */}
      <div className="bg-wine-900 py-2.5 text-center text-xs font-semibold tracking-widest text-sand-100 border-b border-wine-950/20 uppercase font-sans">
        🌟 DECENTRALIZED BARTERING: TRADE GOODS AND SERVICES DIRECTLY WITH ZERO FEES
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-sand-400/85 backdrop-blur-md border-b border-sand-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-wine-900 border-2 border-sand-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-sand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-wide font-serif text-wine-900">BarterX</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-wine-900/80">
            <Link to="/how-it-works" className="hover:text-wine-900 hover:underline transition-all">How it Works</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="rounded-full bg-wine-900 border-2 border-wine-900 text-sand-100 hover:bg-wine-800 px-5 py-2.5 font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-md"
                >
                  My Dashboard
                </button>
                <button onClick={logout} className="text-xs font-bold text-wine-900/70 hover:text-wine-900 transition-colors uppercase tracking-wider">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-wine-900/80 hover:text-wine-900 transition-colors uppercase tracking-wider">Sign In</Link>
                <Link to="/signup" className="px-5 py-2.5 rounded-full bg-wine-900 border border-wine-900 text-sand-100 font-bold text-xs tracking-wider uppercase hover:bg-wine-800 transition-all duration-200 shadow-md">Join BarterX</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center relative py-16 px-6 rounded-[32px] bg-sand-100 border-2 border-wine-900/10 overflow-hidden shadow-sm">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-sand-200/50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-wine-100/30 rounded-full blur-3xl -z-10"></div>

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-wine-900/10 text-wine-900 mb-6 border border-wine-900/15">
            <span className="h-1.5 w-1.5 rounded-full bg-wine-900 animate-pulse"></span>
            A cashless, resource-rich collaborative society
          </span>

          <h1 className="text-5xl sm:text-7xl font-normal tracking-wide text-wine-900 mb-6 leading-tight font-serif">
            Trade what you <span className="italic font-medium">have</span> <br className="hidden sm:inline" />
            for what you <span className="italic font-medium">need</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-wine-950/70 mb-10 leading-relaxed font-sans font-medium">
            An elegant peer-to-peer digital bartering registry. List products or professional talents and receive tailored swap proposals from your local community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#browse" className="w-full sm:w-auto px-8 py-4 rounded-full bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold transition-all duration-200 shadow-lg tracking-wider text-center uppercase text-xs">
              Explore Listings
            </a>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 rounded-full bg-sand-200 text-wine-900 font-bold border-2 border-wine-900/10 hover:bg-sand-300 transition-colors uppercase text-xs tracking-wider">
                Go to Dashboard
              </button>
            ) : (
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-sand-200 text-wine-900 font-bold border-2 border-wine-900/10 hover:bg-sand-300 transition-colors uppercase text-xs tracking-wider">
                Join BarterX
              </Link>
            )}
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section id="browse" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-normal font-serif tracking-wide text-wine-900">Current Listings</h2>
              <p className="text-sm text-wine-900/60 mt-1 font-medium">Showing {sortedItems.length} trades</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="w-full sm:w-80 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search offers or wants..."
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-sand-100 border border-sand-500/30 text-wine-950 placeholder-sand-500 focus:outline-none focus:border-wine-800 focus:ring-1 focus:ring-wine-800 text-sm transition-all"
                />
                <svg className="w-4 h-4 text-wine-900/50 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="w-full sm:w-48 relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-full bg-sand-100 border border-sand-500/30 text-wine-950 focus:outline-none focus:border-wine-800 text-sm appearance-none cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-wine-900 text-sand-100 shadow-md border border-wine-900"
                    : "bg-sand-200 text-wine-900 border border-sand-500/20 hover:bg-sand-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Listings Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedItems.length > 0 ? sortedItems.map((item) => (
            <article key={item.id} className="bg-sand-100 border border-sand-500/20 rounded-[28px] overflow-hidden hover:border-wine-900/20 hover:shadow-xl transition-all duration-300 flex flex-col group relative">
              <div className="relative aspect-[16/10] overflow-hidden bg-sand-200 p-2.5">
                <div className="w-full h-full rounded-[18px] overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"/>
                  <span className="absolute top-3 left-3 bg-wine-900/90 backdrop-blur-sm border border-sand-200/20 px-3 py-1 rounded-full text-[9px] font-bold text-sand-100 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-5 text-wine-900">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-wine-900/60 font-semibold uppercase tracking-wider">
                    <span>Owner: {item.owner}</span>
                    <span>• {item.date}</span>
                  </div>
                  <h3 className="text-2xl font-normal font-serif leading-snug group-hover:text-wine-800 transition-colors">{item.title}</h3>
                  <p className="text-xs text-wine-900/70 font-medium line-clamp-2">{item.description}</p>
                </div>
                <div className="bg-sand-200/50 border border-sand-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-wine-900/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    </div>
                    <div className="text-xs">
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Offering</span>
                      <span className="text-wine-950 font-bold font-serif text-sm">{item.offering}</span>
                    </div>
                  </div>
                  <div className="border-t border-sand-500/15"></div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-wine-900/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                    </div>
                    <div className="text-xs">
                      <span className="text-wine-900/50 block font-bold uppercase tracking-widest text-[8px]">Seeking</span>
                      <span className="text-wine-950 font-bold font-serif text-sm">{item.wanting}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button className="flex-1 py-3 rounded-2xl bg-sand-200 hover:bg-wine-900 hover:text-sand-100 font-bold text-xs uppercase tracking-wider text-wine-900 transition-all border border-sand-500/20 hover:border-wine-900">
                    Propose Swap
                  </button>
                  <span className="text-xs text-wine-900/60 font-semibold shrink-0 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-wine-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {item.location}
                  </span>
                </div>
              </div>
            </article>
          )) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-sand-500/40 rounded-[28px]">
              <h3 className="text-xl font-normal text-wine-900 font-serif">No Swaps Found</h3>
              <p className="text-xs text-wine-900/50 mt-1">Try a different category or search term.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-wine-950 text-sand-100 border-t border-wine-950 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xl font-normal font-serif tracking-wide">BarterX Registry</span>
          <p className="text-xs text-sand-300/70">© {new Date().getFullYear()} BarterX Inc.</p>
        </div>
      </footer>

      {isModalOpen && <CreateListingModal onClose={() => setIsModalOpen(false)} items={items} setItems={setItems} />}
    </div>
  );
}

// ─── Create Listing Modal ─────────────────────────────────────────────────────
function CreateListingModal({ onClose, items, setItems }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', offering: '', wanting: '', category: 'Electronics & Gadgets', location: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.offering || !form.wanting) return;
    if (setItems) {
      setItems(prev => [{
        id: Date.now(), ...form,
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        owner: user?.username || "You", date: "Just now"
      }, ...prev]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">List a New Item</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Item / Service Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Vintage Leather Jacket" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-wine-900/20 cursor-pointer">
                {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. Mumbai, MH" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">What are you offering? *</label>
            <input required value={form.offering} onChange={set('offering')} placeholder="e.g. Leather Jacket (Size L)" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">What are you seeking? *</label>
            <input required value={form.wanting} onChange={set('wanting')} placeholder="e.g. Doc Martens Boots (Size 10)" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows="3" value={form.description} onChange={set('description')} placeholder="Tell potential traders more details..." className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all resize-none"/>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-colors">Publish Listing</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LegacyMarketplace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

      {/* Authenticated sidebar routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <SidebarShell><Dashboard /></SidebarShell>
        </ProtectedRoute>
      } />
      <Route path="/browse" element={
        <ProtectedRoute>
          <SidebarShell><Marketplace /></SidebarShell>
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute><SidebarShell fullHeight><Messages /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/offers" element={
        <ProtectedRoute><SidebarShell><Offers /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/my-listings" element={
        <ProtectedRoute><SidebarShell><MyListings /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/saved" element={
        <ProtectedRoute><SidebarShell><PlaceholderPage title="Saved Items" emoji="❤️" /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/swap-history" element={
        <ProtectedRoute><SidebarShell><SwapHistory /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/trust" element={
        <ProtectedRoute><SidebarShell><Trust /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><SidebarShell><Notifications /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute><SidebarShell><PlaceholderPage title="Wallet" emoji="💰" /></SidebarShell></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><SidebarShell><Settings /></SidebarShell></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
