import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Repeat, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";

const AIMatches = () => {
  const { aiMatches, listings, users, user } = useApp();

  return (
    <div className="space-y-6" data-testid="matches-page">
      <div className="nb-card p-8 md:p-10 relative overflow-hidden">
        <div className="aurora" style={{ opacity: 0.4 }} />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 tint-lime border px-3 py-1 rounded-full mb-4 font-mono2 uppercase text-[10px] tracking-widest">
            <Sparkles size={12} strokeWidth={2.5} /> AI + LOCATION POWERED
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-white">
            Swaps built<br /><span className="font-serif-i italic text-[var(--lime)]">just</span> for you.
          </h1>
          <p className="mt-4 max-w-md text-[var(--text-2)]">Our smart matcher combines AI compatibility, geographic proximity, and swapper trust scores.</p>
        </div>
      </div>

      <SectionTitle kicker={`${aiMatches.length} MATCHES`}>Fresh recommendations.</SectionTitle>

      {aiMatches.length === 0 ? (
        <EmptyState
          emoji="✨"
          title="No recommendations yet"
          subtitle="Create an active listing with what you offer and what you are looking for to generate smart barter recommendations!"
          action={
            <Link to="/app/create">
              <NbButton variant="primary">Create a Listing</NbButton>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {aiMatches.map((m, i) => {
            // Flexible type-agnostic lookup
            let yourItem = listings.find((l) => String(l.id) === String(m.yourItem));
            let theirItem = listings.find((l) => String(l.id) === String(m.theirItem));

            if (!theirItem) {
              return null;
            }

            if (!yourItem) {
              yourItem = {
                title: "Your Active Item",
                estValue: 100,
                images: [theirItem.images?.[0] || "/placeholder.png"],
              };
            }

            const owner = users[theirItem.owner] || { handle: "@swapper", name: "Trusted Swapper" };

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="nb-card p-4 md:p-6 bg-[var(--surface)]"
                data-testid={`match-card-${m.id}`}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[var(--lime)] flex items-center justify-center text-black font-display text-xl shrink-0 shadow-[2px_2px_0_0_#000]">
                      {m.score}%
                    </div>
                    <div>
                      <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">MATCH SCORE</div>
                      <div className="font-display text-2xl flex items-center gap-2">
                        <span>{m.score}% Compatibility</span>
                        {m.distanceFormatted && (
                          <span className="nb-tag tint-lime py-0.5 px-2 text-[10px] font-bold text-black border-none flex items-center gap-1">
                            <MapPin size={10} /> {m.distanceFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to={`/app/listing/${theirItem.id}`}>
                    <NbButton variant="primary" data-testid={`match-view-${m.id}`}>
                      View <ArrowRight size={14} strokeWidth={3} />
                    </NbButton>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="nb-border-2 rounded-xl p-3 bg-[var(--surface-2)]">
                    <div className="text-xs font-mono2 uppercase text-[var(--text-3)] mb-1">YOU OFFER</div>
                    <div className="flex gap-3 items-center">
                      <img src={yourItem.images?.[0] || "/placeholder.png"} className="w-16 h-16 object-cover nb-border-2 rounded" alt="" />
                      <div className="min-w-0">
                        <div className="font-display text-sm truncate">{yourItem.title}</div>
                        <div className="text-xs font-mono2">~₹{yourItem.estValue}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                      <Repeat size={18} strokeWidth={3} />
                    </div>
                  </div>
                  <div className="nb-border-2 rounded-xl p-3 tint-amber">
                    <div className="text-xs font-mono2 uppercase text-[var(--text-3)] mb-1">THEY OFFER</div>
                    <div className="flex gap-3 items-center">
                      <img src={theirItem.images?.[0] || "/placeholder.png"} className="w-16 h-16 object-cover nb-border-2 rounded" alt="" />
                      <div className="min-w-0">
                        <div className="font-display text-sm truncate">{theirItem.title}</div>
                        <div className="text-xs font-mono2">{owner?.handle || owner?.name} · ~₹{theirItem.estValue}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 nb-border-2 rounded-lg tint-lime p-3 text-sm font-medium">
                  <span className="font-mono2 text-xs uppercase font-bold">Why: </span>{m.reason}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIMatches;
