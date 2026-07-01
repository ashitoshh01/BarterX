import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { NbButton, SectionTitle } from "@/components/UI";
import Marquee from "@/components/Marquee";

const Feed = () => {
  const { user, listings, aiMatches, categories } = useApp();

  const forYou = listings.slice(0, 4);
  const trending = listings.slice(4, 8);
  const local = listings.filter((l) => l.owner !== "u_me").slice(0, 4);
  const topMatch = aiMatches[0];
  const topMatchListing = listings.find((l) => l.id === topMatch?.theirItem);

  return (
    <div className="space-y-10" data-testid="feed-page">
      {/* Hello banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="nb-card p-6 md:p-8 tint-amber relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <div className="font-mono2 text-xs uppercase tracking-widest text-[var(--text-2)] mb-1">
              GM, {user.handle}
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-none">
              You've got <span className="text-[var(--lime)]">{aiMatches.length} fresh matches</span>.
            </h1>
            <p className="mt-2 text-sm font-medium max-w-md">
              Your Monstera cutting is popping off — 3 swappers want it.
            </p>
          </div>
          <Link to="/app/matches">
            <NbButton variant="dark" data-testid="feed-see-matches">
              See matches <ArrowRight size={16} strokeWidth={3} />
            </NbButton>
          </Link>
        </div>
      </motion.div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((c) => (
          <Link
            to={`/app/explore?cat=${c.id}`}
            key={c.id}
            className={`nb-btn px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${c.tint}`}
            data-testid={`feed-cat-${c.id}`}
          >
            <span>{c.emoji}</span> {c.name}
          </Link>
        ))}
      </div>

      {/* Top AI Match highlight */}
      {topMatchListing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="nb-card p-6 bg-[var(--surface)] relative overflow-hidden"
          data-testid="top-match"
        >
          <div className="absolute top-4 right-4 nb-tag bg-[var(--lime)] text-black">
            <Sparkles size={12} strokeWidth={3} /> {topMatch.score}% MATCH
          </div>
          <div className="font-mono2 text-xs uppercase text-[var(--text-3)] mb-1">TOP AI MATCH</div>
          <div className="font-display text-2xl mb-4">Your plant ↔ Their book</div>
          <p className="text-sm font-medium text-[var(--text-2)] mb-4">{topMatch.reason}</p>
          <Link to={`/app/listing/${topMatchListing.id}`}>
            <div className="flex items-center gap-4 nb-border-2 bg-[var(--surface-2)] p-3 rounded-xl hover:bg-[var(--surface)] transition-colors">
              <img src={topMatchListing.images[0]} className="w-16 h-16 object-cover nb-border-2 rounded" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{topMatchListing.title}</div>
                <div className="text-xs font-mono2 text-[var(--text-3)]">~${topMatchListing.estValue}</div>
              </div>
              <ArrowRight size={20} strokeWidth={3} />
            </div>
          </Link>
        </motion.div>
      )}

      {/* For you */}
      <section>
        <SectionTitle kicker="FOR YOU">Fresh finds.</SectionTitle>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {forYou.map((l) => (
            <motion.div key={l.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <ListingCard listing={l} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Marquee variant="line" items={["◈ FRESH LISTINGS DROPPED", "◈ BARTER YOUR SKILLS", "◈ NO MONEY ALLOWED"]} />

      {/* Trending */}
      <section>
        <SectionTitle kicker="TRENDING">
          <div className="flex items-center gap-3">Hot right now <TrendingUp size={32} strokeWidth={3} className="text-[var(--lime)]" /></div>
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trending.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* Local */}
      <section>
        <SectionTitle kicker="NEAR YOU">
          <div className="flex items-center gap-3">Local swaps <MapPin size={28} strokeWidth={3} /></div>
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {local.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>
    </div>
  );
};

export default Feed;
