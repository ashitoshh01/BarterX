import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Share2, MessageCircle, Repeat, Star, Shield, MapPin, Eye, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton } from "@/components/UI";
import ListingCard from "@/components/ListingCard";
import { toast } from "sonner";

const ListingDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { listings, users, saved, toggleSave, categories } = useApp();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  const listing = listings.find((l) => l.id === id);
  if (!listing) return <div className="p-10 text-center font-display text-3xl">Listing not found.</div>;

  const owner = users[listing.owner];
  const category = categories.find((c) => c.id === listing.category);
  const isSaved = saved.has(listing.id);
  const myItems = listings.filter((l) => l.owner === "u_me");
  const similar = listings.filter((l) => l.id !== listing.id && l.category === listing.category).slice(0, 4);

  const submitProposal = () => {
    if (!selectedItem) { toast.error("Pick an item to offer"); return; }
    toast.success("Swap proposal sent! 🤝");
    setProposeOpen(false);
    nav("/app/proposals");
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
            <img src={listing.images[activeImg]} className="w-full h-full object-cover" alt={listing.title} />
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
                  <img src={img} className="w-full h-full object-cover" alt="" />
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
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mb-2">Est. value</div>
            <div className="font-display text-4xl">~${listing.estValue}</div>
            <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mt-3 mb-2">Owner wants</div>
            <div className="flex flex-wrap gap-1.5">
              {listing.wants.map((w) => {
                const c = categories.find((c) => c.id === w);
                return <span key={w} className={`nb-tag ${c?.tint}`}>{c?.emoji} {c?.name}</span>;
              })}
            </div>
          </div>

          {/* Owner */}
          <Link to="/app/profile" className="nb-card p-4 flex items-center gap-3 hover:tint-amber transition-colors" data-testid="listing-owner">
            <img src={owner.avatar} className="w-14 h-14 rounded-full nb-border-2 object-cover" alt={owner.name} />
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg">{owner.name}</div>
              <div className="flex items-center gap-2 text-xs font-mono2">
                <Star size={12} className="fill-black text-white" /> {owner.rating}
                <span>·</span>
                <Shield size={12} strokeWidth={2.5} /> Trust {owner.trustScore}
                <span>·</span> {owner.swapsCompleted} swaps
              </div>
            </div>
            <ArrowRight size={20} strokeWidth={3} />
          </Link>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <NbButton onClick={() => setProposeOpen(true)} className="col-span-2 py-4 text-base" data-testid="listing-propose">
              <Repeat size={18} strokeWidth={3} /> Propose a swap
            </NbButton>
            <NbButton variant="light" onClick={() => nav("/app/chat")} data-testid="listing-chat">
              <MessageCircle size={16} strokeWidth={3} /> Chat
            </NbButton>
            <NbButton variant="light" onClick={() => toggleSave(listing.id)} data-testid="listing-save">
              <Heart size={16} strokeWidth={3} fill={isSaved ? "#FF5400" : "none"} /> {isSaved ? "Saved" : "Save"}
            </NbButton>
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
            <div className="text-xs font-mono2 uppercase mb-2">Sweeten with coins? (optional)</div>
            <input
              type="number"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              placeholder="0"
              className="nb-input mb-4"
              data-testid="propose-coins"
            />
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
