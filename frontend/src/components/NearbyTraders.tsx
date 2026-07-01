import { Star, MessageSquare } from 'lucide-react';
import type { NearbyTrader } from '../types';

interface NearbyTradersProps {
  traders: NearbyTrader[];
  loading: boolean;
}

export default function NearbyTraders({ traders, loading }: NearbyTradersProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-[20px] border border-border p-5 animate-shimmer h-[260px]" />
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-border p-5 animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary">Nearby traders</h3>
        <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">See all</span>
      </div>

      {traders.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-4">No traders found nearby.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {traders.slice(0, 3).map((trader, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {trader.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {trader.display_name}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Star size={11} className="text-warning fill-warning" />
                    <span className="text-xs font-semibold text-text-primary">
                      {trader.average_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted">{trader.distance}</p>
              </div>

              {/* Message Button */}
              <button className="w-8 h-8 rounded-lg border border-border hover:bg-bg flex items-center justify-center transition-colors flex-shrink-0">
                <MessageSquare size={14} className="text-text-secondary" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
