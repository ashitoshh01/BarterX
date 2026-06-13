import { Heart, Star, MapPin } from 'lucide-react';
import type { BarterItem } from '../types';

interface RecommendedCardsProps {
  items: BarterItem[];
  loading: boolean;
  onItemClick: (item: BarterItem) => void;
}

export default function RecommendedCards({ items, loading, onItemClick }: RecommendedCardsProps) {
  if (loading) {
    return (
      <div className="animate-fadeUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Recommended for you</h3>
          <span className="text-sm font-semibold text-primary cursor-pointer hover:underline">See all</span>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[220px] h-[290px] bg-white rounded-[20px] border border-border animate-shimmer flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fadeUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Recommended for you</h3>
        </div>
        <div className="bg-white rounded-[20px] border border-border p-8 text-center">
          <p className="text-sm text-text-secondary">No recommendations yet. Start listing items to get personalized suggestions!</p>
        </div>
      </div>
    );
  }

  const getImage = (item: BarterItem) =>
    item.image_url || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80';

  const isService = (item: BarterItem) =>
    (item.category_name || '').toLowerCase().includes('service');

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-primary">Recommended for you</h3>
        <span className="text-sm font-semibold text-primary cursor-pointer hover:underline">See all</span>
      </div>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="min-w-[220px] max-w-[220px] bg-white rounded-[20px] border border-border overflow-hidden hover:shadow-lg transition-all duration-300 flex-shrink-0 group cursor-pointer"
          >
            {/* Image */}
            <div className="relative h-[140px] overflow-hidden bg-gray-50">
              <img
                src={getImage(item)}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Category Badge */}
              <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-md text-white ${isService(item) ? 'bg-purple-500' : 'bg-primary'}`}>
                {isService(item) ? 'Service' : 'Recommended'}
              </span>
              {/* Wishlist */}
              <button 
                onClick={(e) => { e.stopPropagation(); alert('Added to wishlist!'); }}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border-none"
              >
                <Heart size={14} className="text-text-secondary hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3.5">
              <h4 className="text-sm font-bold text-text-primary mb-1 truncate">{item.title}</h4>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-secondary">By {item.owner_username}</span>
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-warning fill-warning" />
                  <span className="text-xs font-semibold text-text-primary">4.9</span>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mb-1.5 truncate">
                Wants: {item.wanting}
              </p>
              <div className="flex items-center gap-1 text-text-muted">
                <MapPin size={11} />
                <span className="text-[11px]">{item.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
