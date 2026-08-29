import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Share2, MessageCircle, Repeat, Star, Shield, MapPin, Eye, ArrowRight, Edit3, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";
import ListingCard from "@/components/ListingCard";
import { toast } from "sonner";
import { DEFAULT_AVATAR } from "@/lib/constants";

const ListingDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { listings, users, saved, toggleSave, categories, user, deleteListing, boostListing, editListing, createProposal, startListingChat } = useApp();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  const listing = listings.find((l) => l.id === Number(id) || l.id === id);
  if (!listing) return <div className="p-10 text-center font-display text-xl text-[var(--text-2)]">Listing not found.</div>;

  const isOwner = Boolean(
    user && (
      listing.owner?.username === user.id ||
      listing.owner?.username === user.handle?.replace("@", "") ||
      listing.owner?.id === user.id ||
      listing.owner === user.id ||
      listing.owner === user.handle?.replace("@", "")
    )
  );

  const owner = isOwner
    ? {
        name: user.name || (typeof listing.owner === "object" ? listing.owner.name || listing.owner.username : listing.owner) || "You",
        avatar: user.avatar || (typeof listing.owner === "object" ? listing.owner.avatar : null) || DEFAULT_AVATAR,
        trustScore: user.trustScore ?? 50,
        rating: user.rating ?? 0.0,
        swapsCompleted: user.swapsCompleted ?? 0,
        verified: user.verified ?? false,
      }
    : (typeof listing.owner === "object" && listing.owner !== null)
    ? {
        name: listing.owner.name || listing.owner.display_name || listing.owner.username || "Anonymous",
        avatar: listing.owner.avatar || listing.owner.profile_picture_url || listing.owner.profile?.profile_picture_url || DEFAULT_AVATAR,
        trustScore: listing.owner.trustScore ?? listing.owner.trust_score ?? 50,
        rating: listing.owner.rating ?? listing.owner.average_rating ?? 0.0,
        swapsCompleted: listing.owner.swapsCompleted ?? listing.owner.swaps_completed ?? 0,
        verified: listing.owner.verified ?? listing.owner.is_verified ?? false,
      }
    : {
        name: listing.owner || "Anonymous",
        avatar: DEFAULT_AVATAR,
        trustScore: 50,
        rating: 0.0,
        swapsCompleted: 0,
        verified: false,
      };

  const handleChatClick = async () => {
    try {
      const chatId = await startListingChat(listing.id);
      nav(`/app/chat/${chatId}`);
    } catch (err) {
      // toast shown in startListingChat
    }
  };

  const handleBoost = async () => {
    try {
      await boostListing(listing.id);
    } catch (err) {
      // toast is already displayed inside boostListing helper
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteListing(listing.id);
      toast.success("Listing deleted successfully.");
      nav("/app/feed");
    } catch (err) {
      toast.error("Failed to delete listing.");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await editListing(listing.id, {
        ...listing,
        status: newStatus,
      });
      toast.success(`Listing marked as ${newStatus}!`);
    } catch (err) {
      toast.error(err.message || `Failed to update status to ${newStatus}.`);
    }
  };

  const category = categories.find((c) => c.id === listing.category);
  const isSaved = saved.has(listing.id);
  const myItems = listings.filter((l) => l.owner?.username === user.id || l.owner?.id === user.id || l.owner === user.id);
  const similar = listings.filter((l) => l.id !== listing.id && l.category === listing.category).slice(0, 4);

  const submitProposal = async () => {
    const isPureCoin = selectedItem === "coins" || !selectedItem;
    const offeredItemId = isPureCoin ? null : selectedItem;

    let finalCoins = Number(coins) || 0;
    if (isPureCoin) {
      if (finalCoins <= 0) {
        finalCoins = Math.max(1, Math.floor((listing.estValue || 0) / 100));
      }
    } else {
      const selectedOfferedItem = myItems.find(it => it.id === selectedItem);
      const priceDiff = (listing.estValue || 0) - (selectedOfferedItem?.estValue || 0);
      if (priceDiff > 0 && finalCoins <= 0) {
        finalCoins = Math.floor(priceDiff / 100);
      }
    }

    if (!offeredItemId && finalCoins <= 0) {
      toast.error("Pick an item to offer or enter coins.");
      return;
    }

    try {
      await createProposal(listing.id, offeredItemId, message.trim(), finalCoins);
      toast.success("Swap proposal sent! 🤝");
      setProposeOpen(false);
      nav("/app/proposals");
    } catch (err) {
      toast.error(err.message || "Failed to send proposal.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
      data-testid="listing-detail"
    >
      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Images */}
        <div className="lg:col-span-3 space-y-3">
          <div className="nb-card overflow-hidden aspect-[4/3] rounded-2xl">
            <img
              src={listing.images[activeImg]}
              className="w-full h-full object-cover"
              alt={listing.title}
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"; }}
            />
          </div>
          {listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square nb-border-2 rounded-xl overflow-hidden transition-all ${activeImg === i ? "ring-2 ring-black" : "opacity-75 hover:opacity-100"}`}
                  data-testid={`listing-thumb-${i}`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt=""
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {category && <span className={`nb-tag ${category.tint || "tint-lime"}`}>{category.emoji} {category.name}</span>}
            <span className="nb-tag tint-amber">{listing.condition}</span>
            {listing.type === "service" && <span className="nb-tag tint-blue">SERVICE</span>}
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]" data-testid="listing-title">
            {listing.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono2 text-[var(--text-2)] bg-[var(--surface-2)] px-3 py-2 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin size={13} className="text-[var(--text-3)]" strokeWidth={2} /> 
              <span>{listing.location}</span>
            </div>
            <span className="text-[var(--text-3)]">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Eye size={13} className="text-[var(--text-3)]" strokeWidth={2} /> 
              <span>{listing.views || 0} views</span>
            </div>
            <span className="text-[var(--text-3)]">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Heart size={13} className="text-[var(--text-3)]" strokeWidth={2} /> 
              <span>{listing.saves || 0} saves</span>
            </div>
          </div>

          <p className="text-sm font-normal text-[var(--text-2)] leading-relaxed">{listing.description}</p>

          {/* Estimated Value & Wants Box */}
          <div className="nb-card p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3">
            <div>
              <div className="font-mono2 text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold mb-0.5">Estimated Value</div>
              <div className="font-display text-2xl font-bold text-[var(--text)]">~₹{Number(listing.estValue || 0).toLocaleString('en-IN')}</div>
            </div>
            
            {(listing.wants || []).length > 0 && (
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="font-mono2 text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold mb-2">Owner wants</div>
                <div className="flex flex-wrap gap-1.5">
                  {(listing.wants || []).map((w) => {
                    const c = categories.find((c) => c.id === w);
                    return <span key={w} className={`nb-tag ${c?.tint || "tint-lime"}`}>{c?.emoji} {c?.name || w}</span>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Owner Profile Card */}
          <Link to="/app/profile" className="nb-card p-3.5 flex items-center gap-3 hover:border-[var(--border-hi)] transition-all bg-[var(--surface)]" data-testid="listing-owner">
            <img
              src={owner.avatar}
              className="w-11 h-11 rounded-full border border-[var(--border)] object-cover shrink-0"
              alt={owner.name}
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-semibold text-[var(--text)] flex items-center gap-1.5 truncate">
                <span>{owner.name}</span>
                {owner.verified && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--lime)] text-[8px] font-black text-black uppercase tracking-wider shrink-0">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono2 text-[var(--text-2)] mt-0.5">
                <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-500 shrink-0" /> {owner.rating}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Shield size={11} strokeWidth={2} className="text-blue-500 shrink-0" /> Trust {owner.trustScore}</span>
                <span>·</span>
                <span>{owner.swapsCompleted || 0} swaps</span>
              </div>
            </div>
            <ArrowRight size={16} strokeWidth={2} className="text-[var(--text-3)] shrink-0" />
          </Link>

          {/* History Timeline */}
          {listing.history && listing.history.length > 0 && (
            <div className="nb-card p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <div className="font-mono2 text-[10px] uppercase text-[var(--text-3)] mb-3 font-semibold tracking-wider">Listing History</div>
              <div className="relative border-l border-[var(--border)] ml-2 pl-3.5 space-y-3">
                {listing.history.map((h, i) => (
                  <div key={h.id || i} className="relative">
                    <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border border-black bg-[var(--lime)]" />
                    <div className="text-[11px] font-medium text-[var(--text)] uppercase">{(h.action || "").replace("_", " ")}</div>
                    <div className="text-[10px] text-[var(--text-3)] font-mono2">
                      {h.created_at ? new Date(h.created_at).toLocaleString() : ""} {h.performed_by_username ? `by @${h.performed_by_username}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {isOwner ? (
              <div className="col-span-2 space-y-2">
                <NbButton onClick={() => nav(`/app/edit/${listing.id}`)} className="w-full py-2.5 bg-[var(--lime)] text-black font-semibold text-sm" disabled={listing.status === "traded"}>
                  <Edit3 size={15} strokeWidth={2.5} className="mr-1.5 inline" /> Edit Listing
                </NbButton>

                {/* Status Transitions */}
                <div className="grid grid-cols-2 gap-1.5 bg-[var(--surface-2)] p-2 rounded-xl border border-[var(--border)]">
                  <div className="col-span-2 text-[10px] font-mono2 uppercase text-[var(--text-3)] text-center mb-1">
                    Current Status: <span className="font-semibold text-[var(--text)] uppercase">{listing.status}</span>
                  </div>
                  {listing.status === "active" && (
                    <>
                      <NbButton onClick={() => handleStatusChange("reserved")} className="text-xs py-1.5 bg-amber-500 text-black font-medium">
                        🟡 Reserve
                      </NbButton>
                      <NbButton onClick={() => handleStatusChange("archived")} className="text-xs py-1.5 bg-gray-500 text-white font-medium">
                        ⚪ Archive
                      </NbButton>
                    </>
                  )}
                  {listing.status === "reserved" && (
                    <>
                      <NbButton onClick={() => handleStatusChange("traded")} className="text-xs py-1.5 bg-blue-500 text-white font-medium">
                        🔵 Complete Swap
                      </NbButton>
                      <NbButton onClick={() => handleStatusChange("active")} className="text-xs py-1.5 bg-green-500 text-white font-medium">
                        🟢 Make Active
                      </NbButton>
                    </>
                  )}
                  {listing.status === "archived" && (
                    <NbButton onClick={() => handleStatusChange("active")} className="col-span-2 text-xs py-1.5 bg-green-500 text-white font-medium">
                      🟢 Restore (Make Active)
                    </NbButton>
                  )}
                  {listing.status === "traded" && (
                    <div className="col-span-2 text-center text-xs font-mono2 text-[var(--lime)] font-semibold py-1">
                      🔒 Completed (Read-Only)
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <NbButton onClick={handleDelete} className="py-2 text-xs font-semibold bg-[var(--pink)] text-white">
                    <Trash2 size={13} strokeWidth={2.5} className="mr-1 inline" /> Delete
                  </NbButton>
                  <NbButton onClick={handleBoost} className="py-2 text-xs font-semibold bg-[var(--purple)] text-white" disabled={listing.isBoosted || listing.status === "traded"}>
                    🚀 {listing.isBoosted ? "Boosted" : "Boost"}
                  </NbButton>
                </div>
              </div>
            ) : (
              <>
                <NbButton 
                  onClick={() => setProposeOpen(true)} 
                  className="col-span-2 py-3 text-sm font-semibold" 
                  data-testid="listing-propose"
                  disabled={listing.status === "traded"}
                >
                  <Repeat size={16} strokeWidth={2.5} /> {listing.status === "traded" ? "Completed / Traded" : "Propose a swap"}
                </NbButton>
                <NbButton variant="light" onClick={handleChatClick} data-testid="listing-chat" disabled={listing.status === "traded"} className="text-xs py-2.5">
                  <MessageCircle size={15} strokeWidth={2.5} /> Chat
                </NbButton>
                <NbButton variant="light" onClick={() => toggleSave(listing.id)} data-testid="listing-save" className="text-xs py-2.5">
                  <Heart size={15} strokeWidth={2.5} fill={isSaved ? "#FF5400" : "none"} /> {isSaved ? "Saved" : "Save"}
                </NbButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="pt-4">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-4">More like this</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* Proposal modal */}
      {proposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setProposeOpen(false)}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="nb-card p-6 bg-[var(--surface-2)] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl"
            data-testid="propose-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono2 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-medium">PROPOSE A SWAP</div>
                <div className="font-display text-lg font-bold text-[var(--text)]">For: {listing.title}</div>
              </div>
              <button onClick={() => setProposeOpen(false)} className="nb-btn bg-[var(--surface)] px-3 py-1.5 rounded-lg text-xs font-semibold">✕</button>
            </div>
            <div className="text-xs font-mono2 uppercase mb-2 text-[var(--text-2)] font-medium">Choose what you offer</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setSelectedItem("coins")}
                className={`nb-border-2 rounded-xl p-3 text-left transition-all col-span-2 flex items-center justify-between ${selectedItem === "coins" || (!selectedItem && myItems.length === 0) ? "nb-shadow tint-amber" : "bg-[var(--surface)]"}`}
                data-testid="propose-item-coins"
              >
                <div>
                  <div className="text-xs font-semibold font-display text-[var(--text)]">🪙 Pure Coin Proposal</div>
                  <div className="text-[10px] font-mono2 text-[var(--text-3)]">No item required · Offer Barter Coins directly</div>
                </div>
                <span className="nb-tag tint-lime text-[10px]">COINS ONLY</span>
              </button>
              {myItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedItem(it.id)}
                  className={`nb-border-2 rounded-xl p-2 text-left transition-all ${selectedItem === it.id ? "nb-shadow tint-lime" : "bg-[var(--surface)]"}`}
                  data-testid={`propose-item-${it.id}`}
                >
                  <img src={it.images[0]} className="w-full h-20 object-cover nb-border-2 rounded-lg" alt="" />
                  <div className="text-xs font-medium mt-1 line-clamp-1 text-[var(--text)]">{it.title}</div>
                </button>
              ))}
            </div>

            {(() => {
              const selectedOfferedItem = selectedItem && selectedItem !== "coins" ? myItems.find(it => it.id === selectedItem) : null;
              const isPureCoin = selectedItem === "coins" || (!selectedItem && myItems.length === 0);
              const targetVal = listing.estValue || 0;
              const offeredVal = selectedOfferedItem ? (selectedOfferedItem.estValue || 0) : 0;
              const gapInr = Math.abs(targetVal - offeredVal);
              const gapCoins = isPureCoin
                ? Math.ceil(targetVal / 100) || 1
                : (targetVal > offeredVal ? Math.ceil((targetVal - offeredVal) / 100) : 0);

              return (
                <div className="nb-card p-3.5 bg-[var(--surface)] mb-4 text-xs font-mono2 space-y-1 rounded-xl">
                  <div className="flex justify-between">
                    <span>Their Item Value:</span>
                    <span>₹{targetVal}</span>
                  </div>
                  {!isPureCoin && (
                    <div className="flex justify-between">
                      <span>Your Item Value:</span>
                      <span>₹{offeredVal}</span>
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] my-1 pt-1 flex justify-between font-bold">
                    <span>Valuation Gap:</span>
                    <span>₹{gapInr}</span>
                  </div>
                  {gapCoins > 0 && (
                    <div className="p-2 rounded-lg text-xs font-semibold text-center mt-2 bg-[var(--lime)] text-black">
                      💡 Suggested balance top-up: {gapCoins} Barter Coins
                    </div>
                  )}
                  {(!isPureCoin && gapCoins === 0 && targetVal === offeredVal) && (
                    <div className="p-2 rounded-lg text-xs font-semibold text-center mt-2 bg-[var(--surface-3)] text-[var(--text)]">
                      ✅ Even swap! No coins required.
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="text-xs font-mono2 uppercase mb-2 text-[var(--text-2)] font-medium">Message</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something friendly..."
              rows={3}
              className="nb-input mb-4 resize-none text-sm"
              data-testid="propose-message"
            />
            <NbButton onClick={submitProposal} className="w-full py-2.5 text-sm font-semibold" data-testid="propose-submit">
              Send proposal <ArrowRight size={15} strokeWidth={2.5} />
            </NbButton>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ListingDetail;

