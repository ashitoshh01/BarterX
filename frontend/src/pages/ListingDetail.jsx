import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Share2, MessageCircle, Repeat, Star, Shield, MapPin, Eye, ArrowRight, Edit3, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";
import ListingCard from "@/components/ListingCard";
import { toast } from "sonner";

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
  if (!listing) return <div className="p-10 text-center font-display text-3xl">Listing not found.</div>;

  const isOwner = user && (listing.owner?.username === user.id || listing.owner?.id === user.id);

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

  const owner = listing.owner || {
    name: "Anonymous",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    trustScore: 50,
    rating: 0.0,
    swapsCompleted: 0,
    verified: false,
  };
  const category = categories.find((c) => c.id === listing.category);
  const isSaved = saved.has(listing.id);
  const myItems = listings.filter((l) => l.owner?.username === user.id);
  const similar = listings.filter((l) => l.id !== listing.id && l.category === listing.category).slice(0, 4);

  const submitProposal = async () => {
    if (!selectedItem) { toast.error("Pick an item to offer"); return; }
    try {
      const selectedOfferedItem = myItems.find(it => it.id === selectedItem);
      const priceDiff = (listing.estValue || 0) - (selectedOfferedItem?.estValue || 0);
      const calculatedCoins = Math.floor(priceDiff / 100);
      await createProposal(listing.id, selectedItem, message.trim(), calculatedCoins);
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
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Images */}
        <div className="lg:col-span-3 space-y-3">
          <div className="nb-card overflow-hidden aspect-[4/3]">
            <img
              src={listing.images[activeImg]}
              className="w-full h-full object-cover"
              alt={listing.title}
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"; }}
            />
          </div>
          {listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square nb-border-2 rounded-lg overflow-hidden ${activeImg === i ? "nb-shadow" : ""}`}
                  data-testid={`listing-thumb-${i}`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt=""
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`nb-tag ${category?.tint}`}>{category?.emoji} {category?.name}</span>
            <span className="nb-tag tint-amber">{listing.condition}</span>
            {listing.type === "service" && <span className="nb-tag tint-blue">SERVICE</span>}
          </div>

          <h1 className="font-display text-4xl md:text-5xl leading-none" data-testid="listing-title">
            {listing.title}
          </h1>

          <div className="flex items-center gap-2 text-sm font-mono2 text-[var(--text-2)]">
            <MapPin size={14} strokeWidth={2.5} /> {listing.location} <span>·</span>
            <Eye size={14} strokeWidth={2.5} /> {listing.views} views <span>·</span>
            <Heart size={14} strokeWidth={2.5} /> {listing.saves} saves
          </div>

          <p className="font-medium text-white/90">{listing.description}</p>

          <div className="nb-card p-4 bg-[var(--surface)]">
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mb-2">Estimated Value</div>
            <div className="font-display text-4xl">~₹{listing.estValue}</div>
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mt-3 mb-2">Owner wants</div>
            <div className="flex flex-wrap gap-1.5">
              {(listing.wants || []).map((w) => {
                const c = categories.find((c) => c.id === w);
                return <span key={w} className={`nb-tag ${c?.tint}`}>{c?.emoji} {c?.name}</span>;
              })}
            </div>
          </div>

          {/* Owner */}
          <Link to="/app/profile" className="nb-card p-4 flex items-center gap-3 hover:tint-amber transition-colors" data-testid="listing-owner">
            <img
              src={owner.avatar}
              className="w-14 h-14 rounded-full nb-border-2 object-cover"
              alt={owner.name}
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"; }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg flex items-center gap-1.5">
                {owner.name}
                {owner.verified && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--lime)] text-[8px] font-black text-black uppercase tracking-wider">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono2">
                <Star size={12} className="fill-black text-white" /> {owner.rating}
                <span>·</span>
                <Shield size={12} strokeWidth={2.5} /> Trust {owner.trustScore}
                <span>·</span> {owner.swapsCompleted || 0} swaps
              </div>
            </div>
            <ArrowRight size={20} strokeWidth={3} />
          </Link>

          {/* History Timeline */}
          {listing.history && listing.history.length > 0 && (
            <div className="nb-card p-4 bg-[var(--surface)]">
              <div className="font-mono2 text-[10px] uppercase text-[var(--text-3)] mb-3 font-bold tracking-wider">Listing History Timeline</div>
              <div className="relative border-l-2 border-white/10 ml-2 pl-4 space-y-3.5">
                {listing.history.map((h, i) => (
                  <div key={h.id || i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 border-black bg-[var(--lime)]" />
                    <div className="text-[11px] font-bold text-white uppercase">{(h.action || "").replace("_", " ")}</div>
                    <div className="text-[9px] text-[var(--text-3)] font-mono2">
                      {h.created_at ? new Date(h.created_at).toLocaleString() : ""} {h.performed_by_username ? `by @${h.performed_by_username}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            {isOwner ? (
              <div className="col-span-2 space-y-2">
                <NbButton onClick={() => nav(`/app/edit/${listing.id}`)} className="w-full py-3 bg-[var(--lime)] text-black" disabled={listing.status === "traded"}>
                  <Edit3 size={16} strokeWidth={3} className="mr-1 inline" /> Edit Listing
                </NbButton>

                {/* Status Transitions */}
                <div className="grid grid-cols-2 gap-1.5 bg-black/20 p-2 rounded-xl border-2 border-white/5">
                  <div className="col-span-2 text-[10px] font-mono2 uppercase text-[var(--text-3)] text-center mb-1">
                    Current Status: <span className="font-bold text-white uppercase">{listing.status}</span>
                  </div>
                  {listing.status === "active" && (
                    <>
                      <NbButton onClick={() => handleStatusChange("reserved")} className="text-[11px] py-1 bg-amber-500 text-black">
                        🟡 Reserve
                      </NbButton>
                      <NbButton onClick={() => handleStatusChange("archived")} className="text-[11px] py-1 bg-gray-500 text-white">
                        ⚪ Archive
                      </NbButton>
                    </>
                  )}
                  {listing.status === "reserved" && (
                    <>
                      <NbButton onClick={() => handleStatusChange("traded")} className="text-[11px] py-1 bg-blue-500 text-white">
                        🔵 Complete Swap
                      </NbButton>
                      <NbButton onClick={() => handleStatusChange("active")} className="text-[11px] py-1 bg-green-500 text-white">
                        🟢 Make Active
                      </NbButton>
                    </>
                  )}
                  {listing.status === "archived" && (
                    <NbButton onClick={() => handleStatusChange("active")} className="col-span-2 text-[11px] py-1 bg-green-500 text-white">
                      🟢 Restore (Make Active)
                    </NbButton>
                  )}
                  {listing.status === "traded" && (
                    <div className="col-span-2 text-center text-xs font-mono2 text-[var(--lime)] font-bold py-1">
                      🔒 Completed (Read-Only)
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <NbButton onClick={handleDelete} className="py-2 bg-[var(--pink)] text-white">
                    <Trash2 size={14} strokeWidth={3} className="mr-1 inline" /> Delete
                  </NbButton>
                  <NbButton onClick={handleBoost} className="py-2 bg-[var(--purple)] text-white" disabled={listing.isBoosted || listing.status === "traded"}>
                    🚀 {listing.isBoosted ? "Boosted" : "Boost"}
                  </NbButton>
                </div>
              </div>
            ) : (
              <>
                <NbButton 
                  onClick={() => setProposeOpen(true)} 
                  className="col-span-2 py-4 text-base" 
                  data-testid="listing-propose"
                  disabled={listing.status === "traded"}
                >
                  <Repeat size={18} strokeWidth={3} /> {listing.status === "traded" ? "Completed / Traded" : "Propose a swap"}
                </NbButton>
                <NbButton variant="light" onClick={handleChatClick} data-testid="listing-chat" disabled={listing.status === "traded"}>
                  <MessageCircle size={16} strokeWidth={3} /> Chat
                </NbButton>
                <NbButton variant="light" onClick={() => toggleSave(listing.id)} data-testid="listing-save">
                  <Heart size={16} strokeWidth={3} fill={isSaved ? "#FF5400" : "none"} /> {isSaved ? "Saved" : "Save"}
                </NbButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-3xl mb-4">More like this</h2>
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
            className="nb-card p-6 bg-[var(--surface-2)] w-full max-w-lg max-h-[85vh] overflow-y-auto"
            data-testid="propose-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">PROPOSE A SWAP</div>
                <div className="font-display text-2xl">For: {listing.title}</div>
              </div>
              <button onClick={() => setProposeOpen(false)} className="nb-btn bg-[var(--surface)] px-3 py-1.5 rounded-lg text-sm">✕</button>
            </div>
            <div className="text-xs font-mono2 uppercase mb-2">Choose what you offer</div>
            {myItems.length === 0 ? (
              <div className="nb-card p-4 bg-[var(--surface)] text-center mb-4 border-2 border-dashed border-white/20">
                <p className="text-sm mb-3 text-[var(--text-2)]">You don't have any active listings to offer.</p>
                <NbButton onClick={() => { setProposeOpen(false); nav("/app/create"); }} className="py-2 text-xs bg-[var(--lime)] text-black font-bold">
                  Post a Listing First
                </NbButton>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {myItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSelectedItem(it.id)}
                    className={`nb-border-2 rounded-lg p-2 text-left transition-all ${selectedItem === it.id ? "nb-shadow tint-lime" : "bg-[var(--surface)]"}`}
                    data-testid={`propose-item-${it.id}`}
                  >
                    <img src={it.images[0]} className="w-full h-20 object-cover nb-border-2 rounded" alt="" />
                    <div className="text-xs font-bold mt-1 line-clamp-1">{it.title}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedItem && (
              (() => {
                const selectedOfferedItem = myItems.find(it => it.id === selectedItem);
                if (!selectedOfferedItem) return null;
                const priceDiff = (listing.estValue || 0) - (selectedOfferedItem.estValue || 0);
                const calculatedCoins = Math.floor(priceDiff / 100);
                return (
                  <div className="nb-card p-3 bg-[var(--surface)] mb-4 text-sm font-mono2 space-y-1">
                    <div className="flex justify-between">
                      <span>Their Item Value:</span>
                      <span>₹{listing.estValue || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Item Value:</span>
                      <span>₹{selectedOfferedItem.estValue || 0}</span>
                    </div>
                    <div className="border-t border-white/10 my-1 pt-1 flex justify-between font-bold">
                      <span>Valuation Gap:</span>
                      <span>₹{priceDiff}</span>
                    </div>
                    <div className={`p-2 rounded text-xs font-bold text-center mt-2 ${
                      calculatedCoins > 0 ? "bg-[var(--pink)] text-white" : calculatedCoins < 0 ? "bg-[var(--lime)] text-black" : "bg-[var(--surface-3)] text-white"
                    }`}>
                      {calculatedCoins > 0 && `⚠️ You will owe ${calculatedCoins} coins to the other swapper.`}
                      {calculatedCoins < 0 && `🎉 The other swapper will owe you ${Math.abs(calculatedCoins)} coins.`}
                      {calculatedCoins === 0 && `✅ Even swap! No coins required.`}
                    </div>
                  </div>
                );
              })()
            )}
            <div className="text-xs font-mono2 uppercase mb-2">Message</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something friendly..."
              rows={3}
              className="nb-input mb-4 resize-none"
              data-testid="propose-message"
            />
            <NbButton onClick={submitProposal} className="w-full py-3" data-testid="propose-submit">
              Send proposal <ArrowRight size={16} strokeWidth={3} />
            </NbButton>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ListingDetail;
