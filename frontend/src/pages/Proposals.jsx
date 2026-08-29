import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, Repeat, ArrowRight, MessageCircle, Inbox, AlertCircle, Coins } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, EmptyState } from "@/components/UI";
import { toast } from "sonner";
import api from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/constants";

const statusColors = {
  pending: "tint-amber",
  negotiating: "tint-purple",
  countered: "tint-purple",
  accepted: "tint-lime",
  declined: "tint-pink",
  cancelled: "tint-pink",
};

// ─── Counter Offer Modal ─────────────────────────────────────────────────────
const CounterModal = ({ proposal, myListings, onClose, onSubmit }) => {
  const [coinsOffered, setCoinsOffered] = useState(String(proposal.coinsOffered || 0));
  const [offeredItemId, setOfferedItemId] = useState(
    proposal.direction === "outgoing"
      ? String(proposal.yourItem || "")
      : String(proposal.theirItem || "")
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const coins = parseInt(coinsOffered, 10) || 0;
    const itemId = offeredItemId ? parseInt(offeredItemId, 10) : null;
    if (!itemId && coins <= 0) {
      toast.error("You must offer at least one item or some coins.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ coins_offered: coins, offered_item_id: itemId });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="nb-card w-full max-w-md bg-[var(--surface)] p-6 space-y-5" data-testid="counter-modal">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl">Counter Offer</div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full nb-border-2 hover:tint-pink">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Current offer context */}
        <div className="nb-border-2 rounded-lg p-3 bg-[var(--surface-2)] text-sm">
          <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mb-1">Current Offer</div>
          <div className="font-bold">{proposal.direction === "incoming" ? proposal.offeredItemDetail?.title || "Their item" : proposal.requestedItemDetail?.title || "Your item"}</div>
          {(proposal.coinsOffered || 0) !== 0 && (
            <div className="text-xs mt-1 font-mono2">+ {Math.abs(proposal.coinsOffered)} ◈ Barter Coins</div>
          )}
        </div>

        {/* Your counter item */}
        <div>
          <label className="font-mono2 text-xs uppercase font-bold block mb-1.5">Your Counter Item</label>
          <select
            value={offeredItemId}
            onChange={(e) => setOfferedItemId(e.target.value)}
            className="w-full nb-border-2 rounded-lg p-2.5 bg-[var(--surface)] text-sm font-medium focus:outline-none"
          >
            <option value="">— No item (coins only) —</option>
            {myListings.filter(l => l.status === "active").map((l) => (
              <option key={l.id} value={String(l.id)}>{l.title}</option>
            ))}
          </select>
        </div>

        {/* Coins */}
        <div>
          <label className="font-mono2 text-xs uppercase font-bold block mb-1.5">
            Coins to Add <span className="text-[var(--text-3)] font-normal normal-case">(0 = no coins)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl">◈</span>
            <input
              type="number"
              min="0"
              value={coinsOffered}
              onChange={(e) => setCoinsOffered(e.target.value)}
              placeholder="0"
              className="flex-1 nb-border-2 rounded-lg p-2.5 bg-[var(--surface)] text-sm font-medium focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full nb-btn tint-purple py-3 font-bold rounded-lg text-sm disabled:opacity-50"
          data-testid="counter-submit"
        >
          {loading ? "Sending…" : "Send Counter Offer"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Proposals = () => {
  const { proposals, listings, users, respondProposal, startListingChat, user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("incoming");
  const [counterTarget, setCounterTarget] = useState(null);

  const filtered = proposals.filter((p) => p.direction === tab);

  // My own listings for item selection in counter modal
  const myListings = listings.filter((l) => {
    const ownerUsername = typeof l.owner === "object" ? l.owner?.username : l.owner;
    return ownerUsername === user?.id;
  });

  const act = async (p, action) => {
    if (action === "counter") {
      setCounterTarget(p);
      return;
    }
    try {
      await respondProposal(p.id, action);
    } catch (err) {
      // error already toasted by respondProposal
    }
  };

  const handleCounter = async (payload) => {
    try {
      await respondProposal(counterTarget.id, "counter", payload);
    } catch (err) {
      // error already toasted
    }
  };

  const handleChat = async (p) => {
    try {
      // If we already have a chat room from the proposal, navigate straight to thread
      if (p.chatRoomId) {
        navigate(`/app/chat/${p.chatRoomId}`);
        return;
      }
      // Otherwise open via the listing
      const itemId = p.requestedItemDetail?.id || p.theirItem || p.yourItem;
      if (itemId) {
        const roomId = await startListingChat(itemId);
        navigate(`/app/chat/${roomId}`);
      } else {
        navigate("/app/chat");
      }
    } catch (err) {
      navigate("/app/chat");
    }
  };

  return (
    <div className="space-y-6" data-testid="proposals-page">
      <SectionTitle kicker="SWAP PROPOSALS">Deals on the table.</SectionTitle>

      <div className="nb-border-2 rounded-full p-1 bg-[var(--surface)] flex w-fit">
        {["incoming", "outgoing"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${tab === t ? "bg-[var(--text)] text-white" : ""}`}
            data-testid={`proposals-tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          subtitle={tab === "incoming" ? "When people propose swaps to you, they'll show up here." : "Propose a swap from any listing to get started."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const otherId = p.direction === "incoming" ? p.from : p.to;
            const other = users?.[otherId] || {};
            const otherName = other.name || (p.direction === "incoming" ? p.fromName : p.toName) || "Unknown user";
            const otherHandle = other.handle || (otherId ? `@${otherId}` : "");
            const theirItem = listings.find((l) => String(l.id) === String(p.theirItem)) || (p.direction === "incoming" ? p.offeredItemDetail : p.requestedItemDetail);
            const yourItem = listings.find((l) => String(l.id) === String(p.yourItem)) || (p.direction === "incoming" ? p.requestedItemDetail : p.offeredItemDetail);
            const displayStatus = (p.status || "pending").replace(/_/g, " ");
            return (
              <div key={p.id} className="nb-card p-4 md:p-5 bg-[var(--surface)]" data-testid={`proposal-${p.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={other.avatar || DEFAULT_AVATAR} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt="" />
                    <div>
                      <div className="font-bold text-sm">{otherName} <span className="font-mono2 text-[var(--text-3)] font-normal">{otherHandle}</span></div>
                      <div className="text-xs font-mono2 text-[var(--text-3)]">{p.created}</div>
                    </div>
                  </div>
                  <span className={`nb-tag ${statusColors[p.status] || "tint-amber"}`}>{displayStatus}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-3">
                  <Link to={theirItem ? `/app/listing/${theirItem.id}` : "#"} className="nb-border-2 rounded-lg p-2 bg-[var(--surface-2)] hover:tint-amber transition-colors">
                    <img src={theirItem?.images?.[0] || theirItem?.image || theirItem?.image_url || "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"} className="w-full h-20 object-cover nb-border-2 rounded" alt="" />
                    <div className="text-xs font-bold mt-1 line-clamp-1">{theirItem?.title || "Requested item"}</div>
                  </Link>
                  <Repeat size={20} strokeWidth={3} />
                  <Link to={yourItem ? `/app/listing/${yourItem.id}` : "#"} className="nb-border-2 rounded-lg p-2 tint-amber hover:bg-[var(--surface)] transition-colors">
                    <img src={yourItem?.images?.[0] || yourItem?.image || yourItem?.image_url || "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"} className="w-full h-20 object-cover nb-border-2 rounded" alt="" />
                    <div className="text-xs font-bold mt-1 line-clamp-1">{yourItem?.title || "Offered item"}</div>
                  </Link>
                </div>

                {p.coinsOffered !== 0 && (
                  <div className={`nb-border-2 rounded-lg p-2.5 text-xs font-mono2 font-bold text-center mb-3 flex items-center justify-center gap-1.5 ${
                    p.coinsOffered > 0
                      ? (p.direction === "incoming" ? "bg-[var(--lime)] text-black" : "bg-[var(--pink)] text-[var(--text)]")
                      : (p.direction === "incoming" ? "bg-[var(--pink)] text-[var(--text)]" : "bg-[var(--lime)] text-black")
                  }`}>
                    {p.coinsOffered > 0 ? (
                      p.direction === "incoming"
                        ? <><Coins size={14} /> You will receive {p.coinsOffered} ◈ coins on swap completion.</>
                        : <><AlertCircle size={14} /> You will pay {p.coinsOffered} ◈ coins on swap completion.</>
                    ) : (
                      p.direction === "incoming"
                        ? <><AlertCircle size={14} /> You will pay {Math.abs(p.coinsOffered)} ◈ coins on swap completion.</>
                        : <><Coins size={14} /> You will receive {Math.abs(p.coinsOffered)} ◈ coins on swap completion.</>
                    )}
                  </div>
                )}

                {p.message && (
                  <div className="nb-border-2 rounded-lg bg-[var(--surface-2)] p-3 text-sm font-medium mb-3 italic text-[var(--text-2)]">
                    "{p.message}"
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {p.direction === "incoming" && (
                    <>
                      {p.canAccept && (
                        <button
                          onClick={() => act(p, "accept")}
                          className="nb-btn tint-lime px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                          data-testid={`proposal-accept-${p.id}`}
                        >
                          <Check size={14} strokeWidth={3} /> Accept
                        </button>
                      )}
                      {p.canCounter && (
                        <button
                          onClick={() => act(p, "counter")}
                          className="nb-btn tint-purple px-4 py-2 rounded-lg text-sm font-bold"
                          data-testid={`proposal-counter-${p.id}`}
                        >
                          Counter
                        </button>
                      )}
                      {p.canDecline && (
                        <button
                          onClick={() => act(p, "decline")}
                          className="nb-btn tint-pink px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                          data-testid={`proposal-reject-${p.id}`}
                        >
                          <X size={14} strokeWidth={3} /> Decline
                        </button>
                      )}
                    </>
                  )}
                  {p.direction === "outgoing" && p.canCancel && (
                    <button
                      onClick={() => act(p, "cancel")}
                      className="nb-btn tint-pink px-4 py-2 rounded-lg text-sm font-bold"
                      data-testid={`proposal-cancel-${p.id}`}
                    >
                      Cancel
                    </button>
                  )}
                  {p.status === "accepted" && p.tradeId && (
                    <Link to={`/app/tracker/${p.tradeId}`}>
                      <button className="nb-btn bg-[var(--text)] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1" data-testid={`proposal-track-${p.id}`}>
                        Track swap <ArrowRight size={14} strokeWidth={3} />
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => handleChat(p)}
                    className="nb-btn bg-[var(--surface)] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5"
                    data-testid={`proposal-chat-${p.id}`}
                  >
                    <MessageCircle size={14} strokeWidth={3} /> Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {counterTarget && (
        <CounterModal
          proposal={counterTarget}
          myListings={myListings}
          onClose={() => setCounterTarget(null)}
          onSubmit={handleCounter}
        />
      )}
    </div>
  );
};

export default Proposals;
