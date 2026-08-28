import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Sparkles, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api";

const conditionTint = {
  New: "tint-mint",
  "Like New": "tint-mint",
  "Like new": "tint-mint",
  Good: "tint-amber",
  Fair: "tint-pink",
  "Needs Repair": "tint-pink",
  Loved: "tint-pink",
  "Read once": "tint-amber",
  Vintage: "tint-purple",
  "Alive & thriving": "tint-mint",
  Service: "tint-blue",
  "Digital Item": "tint-purple",
};

export const ListingCard = ({ listing, compact = false }) => {
  const { saved, toggleSave } = useApp();
  const [imageError, setImageError] = React.useState(false);
  const owner = listing.owner || {
    name: "Anonymous",
    handle: "@anonymous",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    verified: false,
    trustScore: 50,
  };
  const isSaved = saved.has(listing.id);
  const tint = conditionTint[listing.condition] || "tint-amber";

  const fallbackImage = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800";
  const [imgSrc, setImgSrc] = React.useState(listing.images?.[0] || fallbackImage);

  React.useEffect(() => {
    setImgSrc(listing.images?.[0] || fallbackImage);
  }, [listing.images]);

  const cardRef = React.useRef(null);
  const viewTimer = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewTimer.current = setTimeout(() => {
            api.post(`/items/${listing.id}/log-view/`).catch(() => {});
          }, 1500);
        } else {
          if (viewTimer.current) clearTimeout(viewTimer.current);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      if (viewTimer.current) clearTimeout(viewTimer.current);
      observer.disconnect();
    };
  }, [listing.id]);

  return (
    <Link
      to={`/app/listing/${listing.id}`}
      className="group block"
      data-testid={`listing-card-${listing.id}`}
      ref={cardRef}
    >
      <div className="nb-card overflow-hidden flex flex-col h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
          <img
            src={imgSrc}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgSrc(fallbackImage)}
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
            <span className={`nb-tag ${tint}`} data-testid={`listing-condition-${listing.id}`}>
              {listing.condition}
            </span>
            {listing.type === "service" && (
              <span className="nb-tag tint-blue">
                <Sparkles size={9} strokeWidth={2.5} /> Service
              </span>
            )}
            {listing.isBoosted && (
              <span className="nb-tag tint-purple font-black flex items-center gap-1">
                <Zap size={9} strokeWidth={2.5} /> Featured
              </span>
            )}
            {listing.status === "archived" && (
              <span className="nb-tag bg-gray-100 text-gray-600 font-mono2 uppercase">
                Archived
              </span>
            )}
            {listing.status === "reserved" && (
              <span className="nb-tag bg-amber-50 text-amber-700 font-mono2 uppercase">
                Reserved
              </span>
            )}
            {listing.status === "traded" && (
              <span className="nb-tag bg-blue-50 text-blue-600 font-mono2 uppercase">
                Completed
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); toggleSave(listing.id); }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isSaved
                ? "bg-[var(--pink)] text-white shadow-md"
                : "bg-white/80 backdrop-blur-sm text-[var(--text-2)] hover:bg-white hover:text-[var(--text)]"
            }`}
            data-testid={`listing-save-${listing.id}`}
            aria-label="Save"
          >
            <Heart size={14} strokeWidth={2.5} fill={isSaved ? "white" : "none"} />
          </button>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <span className="font-mono2 text-[10px] uppercase tracking-widest text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              ~₹{listing.estValue}
            </span>
            <span className="font-mono2 text-[10px] uppercase tracking-widest text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {listing.posted}
            </span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3
            className="font-display text-lg leading-tight text-[var(--text)] line-clamp-2 mb-1.5"
            data-testid={`listing-title-${listing.id}`}
          >
            {listing.title}
          </h3>
          <p className="text-xs text-[var(--text-2)] line-clamp-2 mb-3">{listing.description}</p>
          {!compact && (
            <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] font-mono2 mb-3 uppercase tracking-wider flex-wrap gap-1">
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <MapPin size={10} strokeWidth={2} /> {listing.location}
              </span>
              {(listing.distance_formatted || listing.distance_km !== null) && (
                <span className="nb-tag tint-lime py-0 px-1.5 text-[9px] font-bold border-none flex items-center gap-1" data-testid={`listing-distance-${listing.id}`}>
                  <MapPin size={9} strokeWidth={2.5} /> {listing.distance_formatted || `${listing.distance_km} km away`}
                </span>
              )}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={owner.avatar}
                alt={owner.name}
                className="w-6 h-6 rounded-full border border-[var(--border)] object-cover shrink-0"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"; }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--text)] truncate flex items-center gap-1">
                  {owner.name}
                  {owner.verified && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)] flex items-center justify-center text-[6px] font-black text-black">
                      ✓
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-[var(--text-3)] font-mono2 truncate">{owner.handle} · Trust: {owner.trustScore}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-3)] font-mono2">
              <Heart size={9} strokeWidth={2} /> {listing.saves}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
