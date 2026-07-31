import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { NbButton, SectionTitle, EmptyState } from "@/components/UI";
import Marquee from "@/components/Marquee";

const Feed = () => {
  const { user, listings, aiMatches, categories } = useApp();

  // "For You" — most recent listings not owned by the user (real recency sort)
  const forYou = useMemo(() => {
    return listings
      .filter((l) => l.owner?.username !== user.id && l.status !== "traded")
      .slice(0, 4);
  }, [listings, user.id]);

  // "Trending" — sort by views (descending), not by array position
  const trending = useMemo(() => {
    return [...listings]
      .filter((l) => l.status !== "traded")
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);
  }, [listings]);

  // "Near You" — same location as user (or all if no location set)
  const local = useMemo(() => {
    const userLoc = (user.location || "").toLowerCase().trim();
    if (!userLoc) {
      return listings
        .filter((l) => l.owner?.username !== user.id && l.status !== "traded")
        .slice(0, 4);
    }
    const locationItems = listings.filter((l) => {
      if (l.owner?.username === user.id || l.status === "traded") return false;
      const itemLoc = (l.location || "").toLowerCase();
      // Match on city/state overlap
      return userLoc.split(",").some((part) =>
        itemLoc.includes(part.trim())
      ) || itemLoc.split(",").some((part) =>
        userLoc.includes(part.trim())
      );
    });
    return locationItems.length > 0 ? locationItems.slice(0, 4) : listings.filter((l) => l.owner?.username !== user.id).slice(0, 4);
  }, [listings, user.id, user.location]);

  const topMatch = aiMatches[0];
  const topMatchListing = topMatch ? listings.find((l) => l.id === topMatch.theirItem) : null;
  const topMatchYourItem = topMatch ? listings.find((l) => l.id === topMatch.yourItem) : null;

  // Dynamic match title
  const matchTitle = topMatchYourItem && topMatchListing
    ? `Your ${topMatchYourItem.title.split(" ")[0]} ↔ Their ${topMatchListing.title.split(" ")[0]}`
    : topMatchListing
      ? `Check out: ${topMatchListing.title}`
      : "View your matches";

  // Dynamic banner text
  const userItems = listings.filter((l) => l.owner?.username === user.id);
  const bannerSubtext = userItems.length > 0
    ? `Your ${userItems[0]?.title || "listing"} has ${userItems[0]?.views || 0} views.`
    : "Post your first listing to start swapping.";

  // Dynamic marquee items
  const marqueeItems = useMemo(() => {
    const items = ["◈ FRESH LISTINGS DROPPED", "◈ BARTER YOUR SKILLS", "◈ NO MONEY ALLOWED"];
    if (trending[0]) items.push(`◈ HOT: ${trending[0].title.toUpperCase()}`);
    if (categories.length > 0) items.push(`◈ ${categories.length} CATEGORIES AVAILABLE`);
    return items;
  }, [trending, categories]);

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
              GM, {user.handle || `@${user.name || "swapper"}`}
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-none">
              {aiMatches.length > 0 ? (
                <>You've got <span className="text-[var(--lime)]">{aiMatches.length} fresh matches</span>.</>
              ) : (
                <>Welcome to <span className="text-[var(--lime)]">BAARTER</span>.</>
              )}
            </h1>
            <p className="mt-2 text-sm font-medium max-w-md">
              {bannerSubtext}
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
      {categories.length > 0 && (
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
      )}

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
          <div className="font-display text-2xl mb-4">{matchTitle}</div>
          <p className="text-sm font-medium text-[var(--text-2)] mb-4">{topMatch.reason}</p>
          <Link to={`/app/listing/${topMatchListing.id}`}>
            <div className="flex items-center gap-4 nb-border-2 bg-[var(--surface-2)] p-3 rounded-xl hover:bg-[var(--surface)] transition-colors">
              <img src={topMatchListing.images[0]} className="w-16 h-16 object-cover nb-border-2 rounded" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{topMatchListing.title}</div>
                <div className="text-xs font-mono2 text-[var(--text-3)]">~₹{topMatchListing.estValue}</div>
              </div>
              <ArrowRight size={20} strokeWidth={3} />
            </div>
          </Link>
        </motion.div>
      )}

      {/* For you */}
      <section>
        <SectionTitle kicker="FOR YOU">Fresh finds.</SectionTitle>
        {forYou.length === 0 ? (
          <EmptyState emoji="🌱" title="Nothing yet" subtitle="Check back soon — new listings are added daily." />
        ) : (
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
        )}
      </section>

      <Marquee variant="line" items={marqueeItems} />

      {/* Trending */}
      <section>
        <SectionTitle kicker="TRENDING">
          <div className="flex items-center gap-3">Hot right now <TrendingUp size={32} strokeWidth={3} className="text-[var(--lime)]" /></div>
        </SectionTitle>
        {trending.length === 0 ? (
          <EmptyState emoji="🔥" title="No trending items" subtitle="Post a listing to get the marketplace started." />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* Local */}
      <section>
        <SectionTitle kicker="NEAR YOU">
          <div className="flex items-center gap-3">Local swaps <MapPin size={28} strokeWidth={3} /></div>
        </SectionTitle>
        {local.length === 0 ? (
          <EmptyState emoji="📍" title="No local swaps" subtitle="Update your location in profile settings to find nearby swappers." />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {local.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Feed;
