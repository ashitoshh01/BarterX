import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { name: 'Electronics',   emoji: '💻', color: 'bg-blue-50   text-blue-600   border-blue-100',   path: 'Electronics & Gadgets' },
  { name: 'Fashion',       emoji: '👕', color: 'bg-pink-50   text-pink-600   border-pink-100',   path: 'Fashion & Apparel' },
  { name: 'Vehicles',      emoji: '🏍️', color: 'bg-orange-50 text-orange-600 border-orange-100', path: 'Automotive & Accessories' },
  { name: 'Home & Living', emoji: '🛋️', color: 'bg-amber-50  text-amber-600  border-amber-100',  path: 'Lifestyle & Home' },
  { name: 'Services',      emoji: '🔧', color: 'bg-teal-50   text-teal-600   border-teal-100',   path: 'Technology & IT Services' },
  { name: 'Books',         emoji: '📚', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', path: 'Media & Entertainment' },
  { name: 'Sports',        emoji: '⚽', color: 'bg-green-50  text-green-600  border-green-100',  path: 'Sports' },
  { name: 'More',          emoji: '⋯',  color: 'bg-gray-50   text-gray-600   border-gray-100',   path: 'all' },
];

export default function CategoryGrid({ onCategorySelect }) {
  const navigate = useNavigate();

  const handleClick = (cat) => {
    if (cat.path === 'all') {
      navigate('/browse');
    } else if (onCategorySelect) {
      onCategorySelect(cat.path);
    } else {
      navigate(`/browse?category=${encodeURIComponent(cat.path)}`);
    }
  };

  return (
    <section>
      <h2 className="text-base font-bold text-gray-700 mb-3">Popular categories</h2>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleClick(cat)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 hover:scale-105 hover:shadow-md ${cat.color}`}
          >
            <span className="text-2xl leading-none">{cat.emoji}</span>
            <span className="text-[10px] font-semibold text-center leading-tight">{cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
