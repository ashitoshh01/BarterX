import type { RecentOffer } from '../types';

interface RecentOffersProps {
  offers: RecentOffer[];
  loading: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  New: { bg: 'bg-primary/10', text: 'text-primary' },
  Viewed: { bg: 'bg-warning/10', text: 'text-warning' },
  Replied: { bg: 'bg-success/10', text: 'text-success' },
};

export default function RecentOffers({ offers, loading }: RecentOffersProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-[20px] border border-border p-5 animate-shimmer h-[280px]" />
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-border p-5 animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary">Recent offers</h3>
        <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">See all</span>
      </div>

      {offers.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-4">No recent offers.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {offers.slice(0, 3).map(offer => {
            const style = STATUS_STYLES[offer.status] || STATUS_STYLES.New;
            return (
              <div key={offer.id} className="flex items-start gap-3">
                {/* Image */}
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {offer.image ? (
                    <img src={offer.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary font-medium truncate">{offer.description}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{offer.timestamp}</p>
                </div>

                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${style.bg} ${style.text}`}>
                  {offer.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
