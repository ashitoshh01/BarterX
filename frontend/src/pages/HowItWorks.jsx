import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const STEPS = [
  { num: '01', title: 'List Your Item', desc: 'Create a listing with details of what you have (Offering) and what you want in return (Seeking). Add images and a location.' },
  { num: '02', title: 'Discover Matches', desc: 'Browse the marketplace or use our smart engine to find high-compatibility swap matches across products and services.' },
  { num: '03', title: 'Negotiate via Chat', desc: 'Use the real-time chat to discuss details, verify specs, and agree on exchange terms directly with the other trader.' },
  { num: '04', title: 'Execute & Review', desc: 'Meet up or arrange delivery. Verify items on both sides, finalize the trade, and leave a trusted community review.' },
];
const PRODUCT_CATS = ['Fashion & Apparel','Lifestyle & Home','Media & Entertainment','Jewellery & Accessories','Automotive & Accessories','Electronics & Gadgets','Hospitality & Equipment','Travel & Luggage','Beauty & Personal Care','Healthcare & Wellness','Entertainment & Gaming','Events & Celebrations'];
const SERVICE_CATS = ['Marketing & Advertising','Finance & Accounting','Operations & Supply Chain','Human Resources & Recruitment','Legal & Compliance','Sales & Business Development','Technology & IT Services','Agriculture & Farming','Construction & Real Estate','Transport & Logistics','Household & Craftsman Services'];

const MODULES = [
  { code: '01', title: 'Product ↔ Product (P2P)', desc: 'Exchange physical assets like fashion items, electronics, and home decor directly with fellow members.' },
  { code: '02', title: 'Product ↔ Service (P2S)', desc: 'Trade spare equipment for professional support — e.g. camera gear for video editing services.' },
  { code: '03', title: 'Service ↔ Product (S2P)', desc: 'Offer your skills like web development in exchange for raw inventory or assets you need.' },
  { code: '04', title: 'Service ↔ Service (S2S)', desc: 'Swap professional competencies — e.g. marketing strategy for accounting bookkeeping.' },
];

export default function HowItWorks() {
  const { user } = useAuth();
  const S = { ff: { fontFamily: "'Inter',-apple-system,sans-serif" } };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', color: '#1d1d1f', ...S.ff }}>
      <NavBar activeLink="how" />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', backgroundColor: '#e8f4fd', color: '#0071e3', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.04em', marginBottom: 20, border: '1px solid rgba(0,113,227,0.15)' }}>
            User Guide
          </span>
          <h1 style={{ fontSize: 52, fontWeight: 700, color: '#1d1d1f', margin: '0 0 18px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            The Art of <em style={{ fontStyle: 'italic', fontWeight: 300 }}>Cashless Exchange</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73', maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
            BarterX removes the friction from direct trade. Structured, trust-driven pathways make exchanging goods and talents as secure as standard transactions.
          </p>
        </section>

        {/* Steps */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20, marginBottom: 56 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <span style={{ position: 'absolute', top: 12, right: 16, fontSize: 52, fontWeight: 700, color: 'rgba(0,113,227,0.07)', fontStyle: 'italic', lineHeight: 1 }}>{step.num}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0071e3' }}>{step.num}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{step.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6e6e73', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </section>

        {/* Exchange Paradigms */}
        <section style={{ borderRadius: 20, background: 'linear-gradient(140deg,#0047ab 0%,#0071e3 55%,#2997ff 100%)', padding: '48px', marginBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Exchange Paradigms</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Four ways to collaborate on BarterX</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {MODULES.map(m => (
              <div key={m.code} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '22px 20px', border: '1.5px solid rgba(255,255,255,0.18)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Module {m.code}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '6px 0 8px', lineHeight: 1.3 }}>{m.title}</h4>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Supported Categories</h2>
            <p style={{ fontSize: 14, color: '#6e6e73' }}>23 categories across products and services</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[{ title: 'Consumer Products', count: 12, cats: PRODUCT_CATS }, { title: 'Talents & Services', count: 11, cats: SERVICE_CATS }].map(col => (
              <div key={col.title} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e8e8ed' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{col.title}</h3>
                  <span style={{ backgroundColor: '#e8f4fd', color: '#0071e3', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{col.count} categories</span>
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  {col.cats.map(cat => (
                    <li key={cat} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 500, color: '#424245' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#0071e3', flexShrink: 0 }} />
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center' }}>
          <Link to={user ? '/' : '/signup'} style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 36px', borderRadius: 25, background: '#0071e3', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,113,227,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0064d0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0071e3'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            {user ? 'Browse the Marketplace' : 'Create Account & Start Swapping'}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1d1d1f', color: '#f5f5f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>BarterX</span>
          <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.4)', margin: 0 }}>© {new Date().getFullYear()} BarterX. Trade smarter, live better.</p>
          <div style={{ display: 'flex', gap: 22 }}>
            {['Privacy','Terms','Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12.5, color: 'rgba(245,245,247,0.55)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
