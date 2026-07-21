import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

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
  const owner = listing.owner || {
    name: "Anonymous",
    handle: "@anonymous",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    verified: false,
    trustScore: 50,
  };
  const isSaved = saved.has(listing.id);
  const tint = conditionTint[listing.condition] || "tint-amber";

  return (
    <Link
      to={`/app/listing/${listing.id}`}
      className="group block"
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="nb-card overflow-hidden flex flex-col h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
              <span className="nb-tag tint-purple font-black">
                ⚡ Featured
              </span>
            )}
            {listing.status === "archived" && (
              <span className="nb-tag bg-gray-500 text-white font-mono2 uppercase">
                Archived
              </span>
            )}
            {listing.status === "reserved" && (
              <span className="nb-tag bg-amber-500 text-black font-mono2 uppercase">
                Reserved
              </span>
            )}
            {listing.status === "traded" && (
              <span className="nb-tag bg-blue-500 text-white font-mono2 uppercase">
                Completed
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); toggleSave(listing.id); }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
              isSaved
                ? "bg-[var(--pink)] text-white shadow-[0_0_20px_-4px_var(--pink-glow)]"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
            data-testid={`listing-save-${listing.id}`}
            aria-label="Save"
          >
            <Heart size={14} strokeWidth={2.5} fill={isSaved ? "white" : "none"} />
          </button>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <span className="font-mono2 text-[10px] uppercase tracking-widest text-white/70">
              ~₹{listing.estValue}
            </span>
            <span className="font-mono2 text-[10px] uppercase tracking-widest text-white/70">
              {listing.posted}
            </span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3
            className="font-display text-lg leading-tight text-white line-clamp-2 mb-1.5"
            data-testid={`listing-title-${listing.id}`}
          >
            {listing.title}
          </h3>
          <p className="text-xs text-[var(--text-2)] line-clamp-2 mb-3">{listing.description}</p>
          {!compact && (
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-3)] font-mono2 mb-3 uppercase tracking-wider">
              <MapPin size={10} strokeWidth={2} /> {listing.location}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={owner.avatar}
                alt={owner.name}
                className="w-6 h-6 rounded-full border border-white/10 object-cover shrink-0"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"; }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate flex items-center gap-1">
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
