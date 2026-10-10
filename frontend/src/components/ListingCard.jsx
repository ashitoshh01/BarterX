import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Sparkles, Zap } from "lucide-react";
import { useApp, getAbsoluteUrl } from "@/context/AppContext";
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from "@/lib/constants";
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
  brand_new: "tint-mint",
  like_new: "tint-mint",
  used: "tint-amber",
  refurbished: "tint-pink",
  not_applicable: "tint-blue",
};

const conditionLabels = {
  brand_new: "New",
  like_new: "Like New",
  used: "Good",
  refurbished: "Fair",
  not_applicable: "Service",
};

const resolveItemImage = (item) => {
  if (!item) return DEFAULT_ITEM_IMAGE;
  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }
  if (item.image) {
    return getAbsoluteUrl(item.image);
  }
  if (item.image_url) {
    return getAbsoluteUrl(item.image_url);
  }
  if (Array.isArray(item.additional_images) && item.additional_images.length > 0) {
    const first = item.additional_images[0];
    const img = typeof first === "object" ? first.image : first;
    if (img) return getAbsoluteUrl(img);
  }
  return DEFAULT_ITEM_IMAGE;
};

export const ListingCard = ({ listing, compact = false }) => {
  const { saved, toggleSave } = useApp();

  const rawOwner = listing.owner;
  const owner = (typeof rawOwner === "object" && rawOwner !== null)
    ? {
        name: rawOwner.name || rawOwner.display_name || rawOwner.username || "Anonymous",
        handle: rawOwner.handle || (rawOwner.username ? `@${rawOwner.username}` : "@anonymous"),
        avatar: getAbsoluteUrl(rawOwner.avatar || rawOwner.profile_picture_url || rawOwner.profile_picture) || DEFAULT_AVATAR,
        verified: rawOwner.verified || rawOwner.is_verified || false,
        trustScore: rawOwner.trustScore ?? rawOwner.trust_score ?? 50,
      }
    : {
        name: "Anonymous",
        handle: "@anonymous",
        avatar: DEFAULT_AVATAR,
        verified: false,
        trustScore: 50,
      };

  const isSaved = saved.has(listing.id);
  const rawCondition = listing.condition;
  const isService = listing.type === "service" || (listing.category_name && listing.category_name.toLowerCase().includes("service")) || rawCondition === "not_applicable";
  const conditionLabel = conditionLabels[rawCondition] || rawCondition || (isService ? "Service" : "Good");
  const tint = conditionTint[conditionLabel] || conditionTint[rawCondition] || "tint-amber";

  const initialImage = resolveItemImage(listing);
  const [imgSrc, setImgSrc] = React.useState(initialImage);

  React.useEffect(() => {
    setImgSrc(resolveItemImage(listing));
  }, [listing]);

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

  const estValue = listing.estValue ?? (listing.purchase_price ? parseFloat(listing.purchase_price) : 0);
  const savesCount = listing.saves ?? listing.saves_count ?? 0;
  const postedDate = listing.posted || (listing.created_at ? new Date(listing.created_at).toLocaleDateString() : "Recently");

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
            onError={() => setImgSrc(DEFAULT_ITEM_IMAGE)}
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
            <span className={`nb-tag ${tint}`} data-testid={`listing-condition-${listing.id}`}>
              {conditionLabel}
            </span>
            {isService && (
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
              ~₹{estValue}
            </span>
            <span className="font-mono2 text-[10px] uppercase tracking-widest text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {postedDate}
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
                <MapPin size={10} strokeWidth={2} /> {listing.location_name || listing.location || "Remote"}
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
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
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
              <Heart size={9} strokeWidth={2} /> {savesCount}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
