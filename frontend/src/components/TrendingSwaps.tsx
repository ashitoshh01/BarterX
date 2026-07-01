import { ArrowRight } from 'lucide-react';
import type { TrendingSwap } from '../types';

interface TrendingSwapsProps {
  swaps: TrendingSwap[];
  loading: boolean;
}

export default function TrendingSwaps({ swaps, loading }: TrendingSwapsProps) {
  if (loading) {
    return (
      <div className="animate-fadeUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Trending swaps this week 🔥</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[200px] h-[160px] bg-white rounded-[20px] border border-border animate-shimmer flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (swaps.length === 0) {
    return (
      <div className="animate-fadeUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Trending swaps this week 🔥</h3>
        </div>
        <div className="bg-white rounded-[20px] border border-border p-8 text-center">
          <p className="text-sm text-text-secondary">No trending swaps this week yet.</p>
        </div>
      </div>
    );
  }

  const fallbackImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-primary">Trending swaps this week 🔥</h3>
        <span className="text-sm font-semibold text-primary cursor-pointer hover:underline">See all</span>
      </div>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {swaps.map(swap => (
          <div
            key={swap.id}
            className="min-w-[200px] max-w-[200px] bg-white rounded-[20px] border border-border overflow-hidden hover:shadow-lg transition-all duration-300 flex-shrink-0 cursor-pointer"
          >
            {/* Images */}
            <div className="flex h-[100px] relative">
              <div className="w-1/2 overflow-hidden bg-gray-50">
                <img
                  src={swap.item1_image || fallbackImg}
                  alt={swap.item1_title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full border-2 border-border flex items-center justify-center shadow-sm">
                <ArrowRight size={12} className="text-primary" />
              </div>
              <div className="w-1/2 overflow-hidden bg-gray-50">
                <img
                  src={swap.item2_image || fallbackImg}
                  alt={swap.item2_title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="text-xs font-bold text-text-primary truncate">
                {swap.item1_title} ↔ {swap.item2_title}
              </h4>
              <p className="text-[11px] text-text-muted mt-1">
                {swap.offer_count} new offer{swap.offer_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
