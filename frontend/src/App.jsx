import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Sample initial data for the Barter Marketplace
const INITIAL_ITEMS = [
  {
    id: 1,
    title: "Sony A7 III Camera",
    description: "Mint condition body. Shutter count around 12k. Includes 2 batteries.",
    offering: "Sony A7 III Body",
    wanting: "DJI Mavic 3 Pro or similar drone",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    owner: "Alex M.",
    location: "New York, NY",
    date: "2 mins ago"
  },
  {
    id: 2,
    title: "iPad Pro 12.9\" (M1)",
    description: "128GB, Space Gray, Wi-Fi model. Always used with screen protector.",
    offering: "iPad Pro + Apple Pencil 2",
    wanting: "MacBook Pro M1 (16GB RAM preferred)",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    owner: "Sarah K.",
    location: "San Francisco, CA",
    date: "1 hour ago"
  },
  {
    id: 3,
    title: "Vintage Leather Jacket",
    description: "Genuine brown leather jacket, size L. Excellent patina, minor wear on cuffs.",
    offering: "Leather Jacket (Size L)",
    wanting: "Doc Martens Boots (Size 10)",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    owner: "Marcus T.",
    location: "Austin, TX",
    date: "3 hours ago"
  },
  {
    id: 4,
    title: "Fender Stratocaster",
    description: "Player Series Strat in 3-Color Sunburst. Maple fingerboard. Perfect setup.",
    offering: "Fender Stratocaster",
    wanting: "Analog Synthesizer / Drum Machine",
    category: "Music",
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80",
    owner: "Elena R.",
    location: "Seattle, WA",
    date: "5 hours ago"
  },
  {
    id: 5,
    title: "Ergonomic Office Chair",
    description: "High-back mesh chair with 3D armrests and lumbar support.",
    offering: "Ergonomic Office Chair",
    wanting: "Mechanical Keyboard (Custom/Hot-swap)",
    category: "Home & Living",
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
    owner: "David L.",
    location: "Chicago, IL",
    date: "1 day ago"
  },
  {
    id: 6,
    title: "UI/UX Design Mentorship",
    description: "Offering 5 hours of 1-on-1 design mentoring, portfolio reviews, and resume prep.",
    offering: "5h Design Mentorship",
    wanting: "React Native developer mentoring / code help",
    category: "Services",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    owner: "Chloe W.",
    location: "Remote",
    date: "2 days ago"
  }
];

const CATEGORIES = ["All", "Electronics", "Fashion", "Music", "Home & Living", "Services"];

function Marketplace() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Create listing modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOffering, setNewOffering] = useState("");
  const [newWanting, setNewWanting] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newLocation, setNewLocation] = useState("");

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!newTitle || !newOffering || !newWanting) return;

    const newItem = {
      id: Date.now(),
      title: newTitle,
      description: newDescription,
      offering: newOffering,
      wanting: newWanting,
      category: newCategory,
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80", // Default placeholder image
      owner: user?.username || "You",
      location: newLocation || "Local",
      date: "Just now"
    };

    setItems([newItem, ...items]);
    setIsModalOpen(false);

    // Reset Form
    setNewTitle("");
    setNewDescription("");
    setNewOffering("");
    setNewWanting("");
    setNewCategory("Electronics");
    setNewLocation("");
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.offering.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wanting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-violet-500/20 py-2 text-center text-xs font-semibold tracking-wider text-teal-300 border-b border-slate-800">
        🌟 DECENTRALIZED BARTERING: TRADE GOODS AND SERVICES DIRECTLY WITH ZERO FEE
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">BarterX</span>
              <span className="hidden sm:inline-block text-[10px] text-teal-400/80 bg-teal-400/10 px-1.5 py-0.5 rounded ml-2 font-mono">BETA</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-teal-400 transition-colors">Marketplace</a>
            <a href="#" className="hover:text-teal-400 transition-colors">How it Works</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Categories</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Active Swaps</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group overflow-hidden rounded-xl p-px font-semibold text-xs text-white uppercase tracking-wider"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-indigo-500 transition-all duration-300 group-hover:scale-105"></span>
                  <span className="relative block px-4 py-2.5 rounded-[11px] bg-slate-900 transition-colors duration-300 group-hover:bg-slate-900/90">
                    + Create Listing
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 cursor-pointer hover:border-teal-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <button onClick={logout} className="text-xs text-slate-400 hover:text-white transition-colors">Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl bg-teal-400 text-slate-950 font-bold text-xs hover:bg-teal-300 transition-colors">Join BarterX</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center relative py-12 px-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-400/10 text-teal-300 mb-6 border border-teal-500/25">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            Join the Cashless Economy
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Trade what you <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">have</span> <br className="hidden sm:inline" />
            for what you <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">need</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
            A decentralized ecosystem built to enable modern bartering. Exchange gear, electronics, apparel, and professional skills with like-minded traders worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#browse" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-teal-500/20 text-center">
              Explore Active Trades
            </a>
            <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 text-slate-200 font-semibold border border-slate-700 hover:bg-slate-750 transition-colors">
              List Your Swap Item
            </button>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section id="browse" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Active Swap Postings</h2>
              <p className="text-sm text-slate-400 mt-1">Showing {filteredItems.length} available items for trade</p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offer or wants..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm transition-all"
              />
              <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-teal-400 text-slate-950 shadow-md shadow-teal-400/10"
                    : "bg-slate-900 text-slate-400 border border-slate-850 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Listings Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <article key={item.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300 flex flex-col group hover:shadow-xl hover:shadow-indigo-500/5">
                {/* Image & Category Overlay */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>By {item.owner}</span>
                      <span>• {item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug group-hover:text-teal-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Swap Exchange Info */}
                  <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 block font-semibold uppercase tracking-wider text-[9px]">Offering</span>
                        <span className="text-slate-200 font-medium">{item.offering}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/50"></div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 block font-semibold uppercase tracking-wider text-[9px]">Seeking</span>
                        <span className="text-slate-200 font-medium">{item.wanting}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button className="flex-1 py-2.5 rounded-xl bg-slate-850 hover:bg-teal-400 hover:text-slate-950 font-bold text-xs text-slate-200 transition-all border border-slate-850 hover:border-teal-400 flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Propose Swap
                    </button>
                    <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border border-slate-900 rounded-2xl bg-slate-900/10">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold text-slate-350">No Listings Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try refining your search query or choosing another category.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">BarterX</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BarterX Inc. Crafted for cash-free peer-to-peer commerce. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>

      {/* Modal - Create Listing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create a New Barter Listing</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Item / Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Leather Jacket"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500 text-sm transition-colors cursor-pointer"
                  >
                    {CATEGORIES.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What are you offering? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Jacket (Size L)"
                  value={newOffering}
                  onChange={(e) => setNewOffering(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What are you seeking? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g.Doc Martens Boots (Size 10)"
                  value={newWanting}
                  onChange={(e) => setNewWanting(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell potential traders more details about the item..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 font-bold text-xs hover:scale-[1.01] transition-transform shadow-lg shadow-teal-500/10"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Marketplace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}
