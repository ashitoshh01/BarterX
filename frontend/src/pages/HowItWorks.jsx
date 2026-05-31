import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HowItWorks() {
  const { user } = useAuth();

  const STEPS = [
    {
      num: "01",
      title: "Catalog Your Value",
      desc: "Register your goods or professional talents. Create rich listings detailing exactly what you have (Offering) and what you want in return (Seeking)."
    },
    {
      num: "02",
      title: "Discover Collaborative Swaps",
      desc: "Browse the active community ledger or rely on our AI engine to suggest high-compatibility matches across products, services, or multi-party chains."
    },
    {
      num: "03",
      title: "Negotiate & Draft Contracts",
      desc: "Use the real-time chat interface to converse with other traders, verify specifications, and establish a digital exchange agreement specifying dates and locations."
    },
    {
      num: "04",
      title: "Execute and Review",
      desc: "Meet in person or coordinate courier delivery. Verify items using the verification checklist, finalize the trade, and write a trusted community review."
    }
  ];

  const PRODUCT_CATEGORIES = [
    "Fashion & Apparel", "Lifestyle & Home", "Media & Entertainment", "Jewellery & Accessories",
    "Automotive & Accessories", "Electronics & Gadgets", "Hospitality & Equipment", "Travel & Luggage",
    "Beauty & Personal Care", "Healthcare & Wellness", "Entertainment & Gaming", "Events & Celebrations"
  ];

  const SERVICE_CATEGORIES = [
    "Marketing & Advertising", "Finance & Accounting", "Operations & Supply Chain", "Human Resources & Recruitment",
    "Legal & Compliance", "Sales & Business Development", "Technology & IT Services", "Agriculture & Farming",
    "Construction & Real Estate", "Transport & Logistics", "Household & Craftsman Services"
  ];

  return (
    <div className="min-h-screen bg-sand-400 text-wine-900 flex flex-col">
      {/* Top Banner */}
      <div className="bg-wine-900 py-2.5 text-center text-xs font-semibold tracking-widest text-sand-100 uppercase font-sans">
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
            <div>
              <span className="text-2xl font-bold tracking-wide font-serif-aesthetic text-wine-900">BarterX</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-wine-900/80">
            <Link to="/" className="hover:text-wine-900 hover:underline transition-all">Exchange Ledger</Link>
            <Link to="/how-it-works" className="text-wine-900 underline transition-all">How it Works</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-8">
                <span className="text-xs font-bold uppercase tracking-wider text-wine-900/70">Welcome, {user.username}</span>
                <Link 
                  to="/?create=true" 
                  className="rounded-full bg-wine-900 border-2 border-wine-900 text-sand-100 hover:bg-wine-800 px-5 py-2.5 font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-md"
                >
                  + Create Listing
                </Link>
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

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col gap-16">
        <section className="text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-wine-900/10 text-wine-900 border border-wine-900/15 uppercase tracking-wider">
            User Operations Manual
          </span>
          <h1 className="text-5xl sm:text-7xl font-normal text-wine-900 leading-tight font-serif-aesthetic">
            The Art of <span className="italic font-medium">Cashless Exchange</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-wine-950/70 leading-relaxed font-medium">
            BarterX is built to remove the friction from direct trade. By establishing structured, trust-driven pathways, we make exchanging goods and professional talents as secure as standard transactions.
          </p>
        </section>

        {/* Steps Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {STEPS.map((step, idx) => (
            <div key={idx} className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-8 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-wine-900/20 transition-all">
              <span className="text-6xl font-normal font-serif-aesthetic italic text-wine-900/10 absolute right-6 top-4 group-hover:text-wine-900/15 transition-colors">{step.num}</span>
              <h3 className="text-2xl font-normal font-serif-aesthetic text-wine-900 pr-12">{step.title}</h3>
              <p className="text-sm text-wine-900/70 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </section>

        {/* Core Exchange Modules */}
        <section className="bg-wine-900 rounded-[32px] text-sand-100 p-8 sm:p-12 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-wine-800/50 rounded-full blur-3xl -z-10"></div>
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-4xl font-normal font-serif-aesthetic text-sand-100">Exchange Paradigms</h2>
              <p className="text-xs text-sand-200/70 font-bold uppercase tracking-widest">Four ways to collaborate</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-sand-400/20 rounded-2xl p-6 space-y-2">
                <span className="text-xs font-bold text-wine-200 uppercase tracking-widest">Module 01</span>
                <h4 className="text-lg font-bold">Product-to-Product (P2P)</h4>
                <p className="text-xs text-sand-100/70 leading-relaxed">Exchange physical assets like fashion items, electronics, and home decor directly with fellow members.</p>
              </div>
              <div className="border border-sand-400/20 rounded-2xl p-6 space-y-2">
                <span className="text-xs font-bold text-wine-200 uppercase tracking-widest">Module 02</span>
                <h4 className="text-lg font-bold">Product-to-Service (P2S)</h4>
                <p className="text-xs text-sand-100/70 leading-relaxed">Trade spare equipment or items for professional support, such as camera gear for video editing services.</p>
              </div>
              <div className="border border-sand-400/20 rounded-2xl p-6 space-y-2">
                <span className="text-xs font-bold text-wine-200 uppercase tracking-widest">Module 03</span>
                <h4 className="text-lg font-bold">Service-to-Product (S2P)</h4>
                <p className="text-xs text-sand-100/70 leading-relaxed">Offer your specialized skills—like web development—in exchange for raw inventory or assets you need.</p>
              </div>
              <div className="border border-sand-400/20 rounded-2xl p-6 space-y-2">
                <span className="text-xs font-bold text-wine-200 uppercase tracking-widest">Module 04</span>
                <h4 className="text-lg font-bold">Service-to-Service (S2S)</h4>
                <p className="text-xs text-sand-100/70 leading-relaxed">Swap professional competencies directly, such as marketing strategy consults for accounting bookkeeping.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Registry Breakdown */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-4xl font-normal font-serif-aesthetic text-wine-900">Supported Categories</h2>
            <p className="text-sm text-wine-900/60 font-medium">Explore the scope of the BarterX registry taxonomy</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Products */}
            <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-8 space-y-6">
              <h3 className="text-2xl font-normal font-serif-aesthetic text-wine-900 border-b border-wine-900/10 pb-3 flex items-center justify-between">
                <span>Consumer Products</span>
                <span className="text-xs font-bold text-wine-900/50 bg-wine-900/5 px-2.5 py-0.5 rounded-full">12 Categories</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-wine-900/80">
                {PRODUCT_CATEGORIES.map((cat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-wine-900/40 rounded-full shrink-0"></span>
                    {cat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="bg-sand-100 border border-sand-500/20 rounded-[28px] p-8 space-y-6">
              <h3 className="text-2xl font-normal font-serif-aesthetic text-wine-900 border-b border-wine-900/10 pb-3 flex items-center justify-between">
                <span>Talents & Services</span>
                <span className="text-xs font-bold text-wine-900/50 bg-wine-900/5 px-2.5 py-0.5 rounded-full">11 Categories</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-wine-900/80">
                {SERVICE_CATEGORIES.map((cat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-wine-900/40 rounded-full shrink-0"></span>
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          {user ? (
            <Link to="/" className="inline-flex px-8 py-4 rounded-full bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold uppercase text-xs tracking-widest shadow-lg transition-transform hover:scale-[1.02]">
              Browse the Exchange Ledger
            </Link>
          ) : (
            <Link to="/signup" className="inline-flex px-8 py-4 rounded-full bg-wine-900 hover:bg-wine-800 text-sand-100 font-bold uppercase text-xs tracking-widest shadow-lg transition-transform hover:scale-[1.02]">
              Create Your Account & Start Swapping
            </Link>
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
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-sand-300/80">
            <Link to="/" className="hover:text-white hover:underline transition-colors">Registry Ledger</Link>
            <Link to="/how-it-works" className="hover:text-white hover:underline transition-colors">Operations T&C</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
