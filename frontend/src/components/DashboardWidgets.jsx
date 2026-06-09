// Stats Row — 4 metric cards shown at the top of the dashboard
export function StatsRow({ stats }) {
  const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const getMemberSince = (dateStr) => {
    if (!dateStr) return '—';
    const months = Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'New member';
    if (months === 1) return '1 Month';
    return `${months} Months`;
  };

  const cards = [
    {
      label: 'Trust Score',
      value: stats?.trust_score ?? '—',
      sub: stats?.trust_label ?? 'Loading...',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      bar: true,
    },
    {
      label: 'Successful Swaps',
      value: stats?.successful_swaps ?? '—',
      sub: 'Total completed',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
        </svg>
      ),
    },
    {
      label: 'Value Saved',
      value: formatCurrency(stats?.value_saved),
      sub: 'Approx. this year',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: (
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      label: 'Member Since',
      value: getMemberSince(stats?.member_since),
      sub: 'Active trader',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</div>
          </div>
          <div className={`text-2xl font-bold ${card.color} mb-0.5`}>{card.value}</div>
          <div className="text-xs text-gray-400 font-medium">{card.label}</div>
          {card.bar && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stats?.trust_score ?? 0, 100)}%` }}
              />
            </div>
          )}
          <div className="text-[10px] text-gray-400 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

// Trust Score Widget — circular gauge + checklist
export function TrustScoreWidget({ stats }) {
  const score = stats?.trust_score ?? 0;
  const label = stats?.trust_label ?? 'Loading';
  const checklist = stats?.trust_checklist ?? [];

  // SVG donut circle math
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Trust at a glance</h3>
      <div className="flex items-center gap-5 mb-4">
        {/* SVG Donut */}
        <div className="relative shrink-0">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10"/>
            <circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-gray-800">{score}</span>
            <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wide">{label}</span>
          </div>
        </div>
        {/* Checklist */}
        <ul className="space-y-2 flex-1">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? (
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              )}
              <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <button className="w-full text-xs font-semibold text-wine-900 border border-wine-900/20 hover:bg-wine-900 hover:text-white rounded-xl py-2 transition-all">
        Improve your score →
      </button>
    </div>
  );
}

// Recent Offers Widget
const STATUS_STYLES = {
  pending:   { label: 'New',      cls: 'bg-emerald-100 text-emerald-700' },
  accepted:  { label: 'Accepted', cls: 'bg-blue-100 text-blue-700' },
  rejected:  { label: 'Declined', cls: 'bg-red-100 text-red-700' },
  countered: { label: 'Replied',  cls: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled',cls: 'bg-gray-100 text-gray-500' },
};

const ITEM_IMAGES = {
  Electronics: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&auto=format&fit=crop&q=80',
  Fashion: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=80&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=80',
};

export function RecentOffersWidget({ offers }) {
  if (!offers || offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">Recent offers</h3>
          <button className="text-xs font-semibold text-wine-900 hover:underline">See all</button>
        </div>
        <p className="text-xs text-gray-400 text-center py-4">No offers yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700">Recent offers</h3>
        <button className="text-xs font-semibold text-wine-900 hover:underline">See all</button>
      </div>
      <ul className="space-y-3">
        {offers.slice(0, 4).map((offer) => {
          const st = STATUS_STYLES[offer.status] || STATUS_STYLES.pending;
          const timeAgo = (dateStr) => {
            const diff = Date.now() - new Date(dateStr);
            const h = Math.floor(diff / 3600000);
            if (h < 1) return 'Just now';
            if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
            return `${Math.floor(h/24)} days ago`;
          };
          return (
            <li key={offer.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-sand-100 shrink-0">
                <img
                  src={ITEM_IMAGES.default}
                  alt={offer.requested_item_title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {offer.sender_username === offer.receiver_username ? 'Offer' : `${offer.sender_username === undefined ? 'Offer' : `Offer ${offer.sender_username ? 'received' : 'sent'}`}`} for {offer.requested_item_title || 'an item'}
                </p>
                <p className="text-[10px] text-gray-400">{timeAgo(offer.updated_at || offer.created_at)}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${st.cls}`}>{st.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
