import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, Grid, List } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { SectionTitle, EmptyState, NbButton } from "@/components/UI";

const Explore = () => {
  const { listings, categories } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState("grid");
  const [type, setType] = useState("all"); // all, product, service
  const activeCat = params.get("cat") || "all";

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const setCat = (id) => {
    if (id === "all") params.delete("cat"); else params.set("cat", id);
    setParams(params);
  };

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (activeCat !== "all" && String(l.category) !== String(activeCat)) return false;
      if (type !== "all" && l.type !== type) return false;
      if (debouncedQuery && !`${l.title} ${l.description} ${l.tags.join(" ")}`.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
      return true;
    });
  }, [listings, activeCat, type, debouncedQuery]);

  return (
    <div className="space-y-6" data-testid="explore-page">
      <SectionTitle kicker="EXPLORE">Browse the swap galaxy.</SectionTitle>

      {/* Search + filters */}
      <div className="nb-card p-4 bg-[var(--surface)] space-y-3">
        <div className="relative">
          <Search size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skateboards, tutors, plants..."
            className="nb-input pl-10"
            data-testid="explore-search"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="nb-border-2 rounded-full p-1 bg-[var(--surface)] flex">
            {["all", "product", "service"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${type === t ? "bg-black text-white" : ""}`}
                data-testid={`explore-type-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="nb-border-2 rounded-lg overflow-hidden flex">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-black text-white" : "bg-[var(--surface)]"}`}
              data-testid="explore-view-grid"
            ><Grid size={16} strokeWidth={2.5} /></button>
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-black text-white" : "bg-[var(--surface)]"}`}
              data-testid="explore-view-list"
            ><List size={16} strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCat("all")}
          className={`nb-btn px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${activeCat === "all" ? "bg-black text-white" : "bg-[var(--surface)]"}`}
          data-testid="explore-cat-all"
        >
          ALL
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`nb-btn px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${activeCat === c.id ? "bg-[var(--lime)] text-black border-transparent" : c.tint}`}
            data-testid={`explore-cat-${c.id}`}
          >
            <span>{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div className="font-mono2 text-xs uppercase">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Nothing here yet"
          subtitle="Try broadening your search or picking a different category."
          action={<NbButton onClick={() => { setQuery(""); setCat("all"); setType("all"); }} data-testid="explore-clear">Clear filters</NbButton>}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <Link
              to={`/app/listing/${l.id}`}
              key={l.id}
              className="nb-card p-3 flex gap-4 items-center hover:tint-amber transition-colors"
              data-testid={`explore-row-${l.id}`}
            >
              <img src={l.images[0]} className="w-24 h-24 object-cover nb-border-2 rounded-lg" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl truncate">{l.title}</div>
                <div className="text-xs font-mono2 text-[var(--text-3)] mt-1">{l.location} · {l.posted}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {l.tags.slice(0, 3).map((t) => <span key={t} className="nb-tag bg-[var(--surface)]">{t}</span>)}
                </div>
              </div>
              <span className="nb-tag tint-amber">~${l.estValue}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
