import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Repeat, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, EmptyState } from "@/components/UI";
import { toast } from "sonner";

const statusColors = {
  pending: "tint-amber",
  accepted: "tint-lime",
  rejected: "tint-pink",
  counter: "tint-purple",
};

const Proposals = () => {
  const { proposals, listings, users, respondProposal } = useApp();
  const [tab, setTab] = useState("incoming");

  const filtered = proposals.filter((p) => p.direction === tab);

  const act = (p, action) => {
    respondProposal(p.id, action);
    toast.success(`Proposal ${action}`);
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
            const other = users[otherId];
            const theirItem = listings.find((l) => l.id === p.theirItem);
            const yourItem = listings.find((l) => l.id === p.yourItem);
            return (
              <div key={p.id} className="nb-card p-4 md:p-5 bg-[var(--surface)]" data-testid={`proposal-${p.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={other.avatar} className="w-10 h-10 rounded-full nb-border-2 object-cover" alt="" />
                    <div>
                      <div className="font-bold text-sm">{other.name} <span className="font-mono2 text-[var(--text-3)] font-normal">{other.handle}</span></div>
                      <div className="text-xs font-mono2 text-[var(--text-3)]">{p.created}</div>
                    </div>
                  </div>
                  <span className={`nb-tag ${statusColors[p.status]}`}>{p.status}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-3">
                  <Link to={theirItem ? `/app/listing/${theirItem.id}` : "#"} className="nb-border-2 rounded-lg p-2 bg-[var(--surface-2)] hover:tint-amber transition-colors">
                    <img src={theirItem?.images[0]} className="w-full h-20 object-cover nb-border-2 rounded" alt="" />
                    <div className="text-xs font-bold mt-1 line-clamp-1">{theirItem?.title}</div>
                  </Link>
                  <Repeat size={20} strokeWidth={3} />
                  <Link to={yourItem ? `/app/listing/${yourItem.id}` : "#"} className="nb-border-2 rounded-lg p-2 tint-amber hover:bg-[var(--surface)] transition-colors">
                    <img src={yourItem?.images[0]} className="w-full h-20 object-cover nb-border-2 rounded" alt="" />
                    <div className="text-xs font-bold mt-1 line-clamp-1">{yourItem?.title}</div>
                  </Link>
                </div>

                {p.message && (
                  <div className="nb-border-2 rounded-lg bg-[var(--surface-2)] p-3 text-sm font-medium mb-3">
                    "{p.message}"
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {p.direction === "incoming" && p.status === "pending" && (
                    <>
                      <button
                        onClick={() => act(p, "accepted")}
                        className="nb-btn tint-lime px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                        data-testid={`proposal-accept-${p.id}`}
                      >
                        <Check size={14} strokeWidth={3} /> Accept
                      </button>
                      <button
                        onClick={() => act(p, "counter")}
                        className="nb-btn tint-purple px-4 py-2 rounded-lg text-sm font-bold"
                        data-testid={`proposal-counter-${p.id}`}
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => act(p, "rejected")}
                        className="nb-btn tint-pink px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                        data-testid={`proposal-reject-${p.id}`}
                      >
                        <X size={14} strokeWidth={3} /> Decline
                      </button>
                    </>
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
