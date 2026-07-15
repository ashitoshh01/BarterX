import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Shield, MapPin, Award, Settings, Share2, Edit3 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { NbButton, SectionTitle } from "@/components/UI";

const Profile = () => {
  const { user, listings, reviews, users, saved } = useApp();
  const [tab, setTab] = useState("listings");

  const myListings = listings.filter((l) => l.owner === "u_me");
  const savedItems = listings.filter((l) => saved.has(l.id));

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Cover */}
      <div className="relative">
        <div
          className="h-36 md:h-52 rounded-3xl relative overflow-hidden border border-white/10"
          style={{
            background: "radial-gradient(120% 200% at 0% 0%, rgba(219,254,1,0.35), transparent 50%), radial-gradient(120% 200% at 100% 0%, rgba(255,46,136,0.35), transparent 50%), radial-gradient(120% 200% at 50% 100%, rgba(110,123,255,0.35), transparent 50%), #0D0D10"
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-30" />
        </div>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <img src={user.avatar} className="w-24 h-24 rounded-full border-2 border-[var(--bg)] object-cover" alt={user.name} />
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="nb-btn bg-black/30 backdrop-blur border border-white/10 px-3 py-2 rounded-full text-xs font-medium text-white" data-testid="profile-share">
            <Share2 size={14} strokeWidth={2.5} />
          </button>
          <button className="nb-btn bg-black/30 backdrop-blur border border-white/10 px-3 py-2 rounded-full text-xs font-medium text-white" data-testid="profile-settings">
            <Settings size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="pt-8 flex items-start justify-between">
        <div>
          <div className="font-display text-4xl">{user.name}</div>
          <div className="font-mono2 text-sm text-[var(--text-3)]">{user.handle} · <MapPin size={11} strokeWidth={2.5} className="inline" /> {user.location}</div>
          {user.verified && (
            <span className="nb-tag tint-lime mt-2 inline-flex">
              <Shield size={11} strokeWidth={3} /> VERIFIED
            </span>
          )}
        </div>
        <NbButton variant="light" data-testid="profile-edit">
          <Edit3 size={14} strokeWidth={3} /> Edit
        </NbButton>
      </div>

      <p className="text-sm font-medium max-w-lg">{user.bio}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Trust", v: user.trustScore, t: "tint-lime" },
          { l: "Rating", v: `${user.rating}★`, t: "tint-amber" },
          { l: "Swaps", v: user.swapsCompleted, t: "tint-pink" },
          { l: "Coins", v: user.coins, t: "tint-purple" },
        ].map((s) => (
          <div key={s.l} className={`nb-card p-4 border ${s.t}`}>
            <div className="font-display text-3xl md:text-4xl text-white">{s.v}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <div className="text-xs font-mono2 uppercase mb-2">BADGES</div>
        <div className="flex gap-2 flex-wrap">
          {user.badges.map((b) => (
            <span key={b} className="nb-tag tint-amber">
              <Award size={11} strokeWidth={3} /> {b}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="nb-border-2 rounded-full p-1 bg-[var(--surface)] flex w-fit overflow-x-auto">
        {[
          { k: "listings", l: "My listings", n: myListings.length },
          { k: "saved", l: "Saved", n: savedItems.length },
          { k: "reviews", l: "Reviews", n: reviews.length },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold ${tab === t.k ? "bg-black text-white" : ""}`}
            data-testid={`profile-tab-${t.k}`}
          >
            {t.l} ({t.n})
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      {tab === "saved" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.map((r) => {
            const from = users[r.from];
            return (
              <div key={r.id} className="nb-card p-4 bg-[var(--surface)]" data-testid={`review-${r.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <img src={from.avatar} className="w-9 h-9 rounded-full nb-border-2 object-cover" alt="" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{from.name}</div>
                    <div className="text-[10px] font-mono2 text-[var(--text-3)]">{r.time}</div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-[var(--lime)] text-[var(--lime)]" : "text-white/15"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium">{r.text}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-white/10">
        <Link to="/app/verification"><NbButton variant="light" className="w-full text-xs" data-testid="profile-verify">Get verified</NbButton></Link>
        <Link to="/app/disputes"><NbButton variant="light" className="w-full text-xs" data-testid="profile-disputes">Disputes</NbButton></Link>
        <Link to="/app/service-swap"><NbButton variant="light" className="w-full text-xs" data-testid="profile-services">Services</NbButton></Link>
        <Link to="/app/contracts"><NbButton variant="light" className="w-full text-xs" data-testid="profile-contracts">Contracts</NbButton></Link>
      </div>
    </div>
  );
};

export default Profile;
