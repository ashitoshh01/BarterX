import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Repeat, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, EmptyState } from "@/components/UI";
import { toast } from "sonner";

const statusColors = {
  pending: "tint-amber",
  negotiating: "tint-purple",
  countered: "tint-purple",
  accepted: "tint-lime",
  declined: "tint-pink",
  cancelled: "tint-pink",
};

const Proposals = () => {
  const { proposals, listings, users, respondProposal } = useApp();
  const [tab, setTab] = useState("incoming");

  const filtered = proposals.filter((p) => p.direction === tab);

  const act = async (p, action) => {
    try {
      await respondProposal(p.id, action);
    } catch (err) {
      toast.error(err.message || "Failed to update proposal.");
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
            className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${tab === t ? "bg-black text-white" : ""}`}
            data-testid={`proposals-tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📭"
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
                    <img src={other.avatar} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt="" />
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
                  <div className={`nb-border-2 rounded-lg p-2.5 text-xs font-mono2 font-bold text-center mb-3 ${
                    p.coinsOffered > 0 
                      ? (p.direction === "incoming" ? "bg-[var(--lime)] text-black" : "bg-[var(--pink)] text-white")
                      : (p.direction === "incoming" ? "bg-[var(--pink)] text-white" : "bg-[var(--lime)] text-black")
                  }`}>
                    {p.coinsOffered > 0 ? (
                      p.direction === "incoming" 
                        ? `💰 You will receive ${p.coinsOffered} coins on swap completion.`
                        : `⚠️ You will pay ${p.coinsOffered} coins on swap completion.`
                    ) : (
                      p.direction === "incoming"
                        ? `⚠️ You will pay ${Math.abs(p.coinsOffered)} coins on swap completion.`
                        : `💰 You will receive ${Math.abs(p.coinsOffered)} coins on swap completion.`
                    )}
                  </div>
                )}

                {p.message && (
                  <div className="nb-border-2 rounded-lg bg-[var(--surface-2)] p-3 text-sm font-medium mb-3">
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
                  {p.status === "accepted" && (
                    <Link to={`/app/tracker/${p.id}`}>
                      <button className="nb-btn bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1" data-testid={`proposal-track-${p.id}`}>
                        Track swap <ArrowRight size={14} strokeWidth={3} />
                      </button>
                    </Link>
                  )}
                  <Link to="/app/chat" className="nb-btn bg-[var(--surface)] px-4 py-2 rounded-lg text-sm font-bold">
                    Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Proposals;
