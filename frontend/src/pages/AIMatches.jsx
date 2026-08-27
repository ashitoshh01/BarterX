import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Repeat, MapPin, ShieldCheck, Cpu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";

const AIMatches = () => {
  const { aiMatches, listings, users } = useApp();

  return (
    <div className="space-y-6" data-testid="matches-page">
      {/* Header Banner */}
      <div className="nb-card p-8 md:p-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-black border border-[var(--border)]">
        <div className="aurora" style={{ opacity: 0.3 }} />
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[var(--lime)]/10 text-[var(--lime)] border border-[var(--lime)]/30 px-3 py-1 rounded-full mb-4 font-mono2 uppercase text-xs font-semibold tracking-wider">
            <Sparkles size={13} strokeWidth={2.5} /> AI + LOCATION MATCHMAKER
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] text-[var(--text)]">
            Swaps built <span className="font-serif-i italic text-[var(--lime)]">just</span> for you.
          </h1>
          <p className="mt-3 max-w-lg text-[var(--text-2)] text-sm md:text-base">
            Our multi-objective recommendation engine ranks candidates by AI intent similarity, geographic proximity, and user trust scores.
          </p>
        </div>
      </div>

      <SectionTitle kicker={`${aiMatches.length} MATCHES`}>Recommended Swaps</SectionTitle>

      {aiMatches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          subtitle="Create an active listing with what you offer and what you are looking for to generate smart barter recommendations!"
          action={
            <Link to="/app/create">
              <NbButton variant="primary">Create a Listing</NbButton>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {aiMatches.map((m, i) => {
            let yourItem = listings.find((l) => String(l.id) === String(m.yourItem));
            let theirItem = listings.find((l) => String(l.id) === String(m.theirItem));

            if (!theirItem) {
              return null;
            }

            if (!yourItem) {
              yourItem = {
                title: "Your Active Item",
                estValue: 100,
                images: [theirItem.images?.[0] || "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"],
              };
            }

            const owner = (typeof theirItem.owner === "object" && theirItem.owner !== null)
              ? theirItem.owner
              : (users[theirItem.owner] || { handle: "@swapper", name: "Trusted Swapper" });

            const fallbackImage = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800";

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="nb-card p-5 md:p-6 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-hi)] transition-all rounded-2xl shadow-xl"
                data-testid={`match-card-${m.id}`}
              >
                {/* Header Row: Score Badge, Match Title, View Action */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--lime)] text-black flex items-center justify-center font-mono2 font-black text-sm shrink-0 border-2 border-black shadow-sm overflow-hidden">
                      <span className="text-black leading-none">{m.score}%</span>
                    </div>
                    <div>
                      <div className="font-mono2 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-bold">MATCH SCORE</div>
                      <div className="font-display text-xl sm:text-2xl font-bold text-[var(--text)] flex items-center gap-2 flex-wrap">
                        <span>Match Compatibility</span>
                        {m.distanceFormatted && (
                          <span className="inline-flex items-center gap-1 bg-[var(--lime)]/15 text-[var(--lime)] border border-[var(--lime)]/30 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                            <MapPin size={11} /> {m.distanceFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link to={`/app/listing/${theirItem.id}`}>
                    <NbButton variant="primary" data-testid={`match-view-${m.id}`}>
                      View Swap <ArrowRight size={14} strokeWidth={2.5} />
                    </NbButton>
                  </Link>
                </div>

                {/* Offer Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  {/* YOU OFFER */}
                  <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 transition-all hover:border-[var(--border-hi)]">
                    <div className="text-[11px] font-mono2 uppercase tracking-wider text-[var(--text-3)] font-bold mb-2">YOU OFFER</div>
                    <div className="flex gap-3.5 items-center">
                      <img
                        src={yourItem.images?.[0] || fallbackImage}
                        className="w-16 h-16 object-cover rounded-lg border border-[var(--border)] shrink-0"
                        alt={yourItem.title}
                        onError={(e) => { e.target.src = fallbackImage; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-semibold text-[var(--text)] truncate">{yourItem.title}</div>
                        <div className="text-xs font-mono2 text-[var(--lime)] mt-0.5 font-medium">Est. ~₹{yourItem.estValue || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Swap Arrow Icon */}
                  <div className="flex justify-center my-1 md:my-0">
                    <div className="w-11 h-11 bg-[var(--lime)] text-black rounded-full flex items-center justify-center shadow-lg border border-black/20 shrink-0">
                      <Repeat size={20} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* THEY OFFER */}
                  <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 transition-all hover:border-[var(--border-hi)]">
                    <div className="text-[11px] font-mono2 uppercase tracking-wider text-[var(--text-3)] font-bold mb-2">THEY OFFER</div>
                    <div className="flex gap-3.5 items-center">
                      <img
                        src={theirItem.images?.[0] || fallbackImage}
                        className="w-16 h-16 object-cover rounded-lg border border-[var(--border)] shrink-0"
                        alt={theirItem.title}
                        onError={(e) => { e.target.src = fallbackImage; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-semibold text-[var(--text)] truncate">{theirItem.title}</div>
                        <div className="text-xs text-[var(--text-2)] mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[var(--text)]">{owner?.handle || owner?.name || "@swapper"}</span>
                          <span className="text-[var(--lime)] font-mono2">~₹{theirItem.estValue || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown & AI Explanation */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Sparkles size={14} className="text-[var(--lime)] shrink-0" />
                    <span><strong className="text-[var(--text)] font-semibold">Why match: </strong>{m.reason}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono2 text-gray-400">
                    {m.aiScore && (
                      <span className="inline-flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 rounded">
                        <Cpu size={10} className="text-emerald-400" /> AI {m.aiScore}%
                      </span>
                    )}
                    {m.trustScore && (
                      <span className="inline-flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 rounded">
                        <ShieldCheck size={10} className="text-blue-400" /> Trust {m.trustScore}%
                      </span>
                    )}
                  </div>
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
