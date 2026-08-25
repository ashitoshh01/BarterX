import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Grid, List, Map, Compass, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import ListingMap from "@/components/ListingMap";
import { SectionTitle, EmptyState, NbButton } from "@/components/UI";
import { toast } from "sonner";

const RADIUS_OPTIONS = [
  { label: "Off", value: "all" },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
];

const Explore = () => {
  const { listings, categories, user, getNearbyListings } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState("grid"); // grid, list, map
  const [type, setType] = useState("all"); // all, product, service
  const [selectedRadius, setSelectedRadius] = useState("all"); // all, 5, 10, 25, 50

  const [nearbyListings, setNearbyListings] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const activeCat = params.get("cat") || "all";

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const setCat = (id) => {
    if (id === "all") params.delete("cat"); else params.set("cat", id);
    setParams(params);
  };

  // Fetch nearby listings when selectedRadius changes (or when filters update while radius is active)
  const fetchNearby = useCallback(async (radiusVal, customLat = null, customLng = null) => {
    setNearbyLoading(true);
    setLocationError(null);
    try {
      let lat = customLat ?? user?.latitude;
      let lng = customLng ?? user?.longitude;

      // If user has no saved coordinates, try browser geolocation on the fly
      if ((lat === null || lat === undefined || lng === null || lng === undefined) && navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr) {
          console.warn("Browser geolocation denied or failed:", geoErr);
        }
      }

      const paramsObj = {
        radius: radiusVal,
      };
      if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
        paramsObj.latitude = lat;
        paramsObj.longitude = lng;
      }

      if (activeCat !== "all") paramsObj.category = activeCat;
      if (type !== "all") paramsObj.item_type = type;
      if (debouncedQuery) paramsObj.q = debouncedQuery;

      const res = await getNearbyListings(paramsObj);
      setNearbyListings(res.listings);
    } catch (err) {
      console.warn("Failed to fetch nearby listings:", err);
      setLocationError(err.message || "Location is required to discover nearby listings. Please set your location in Profile.");
      setNearbyListings([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [user, activeCat, type, debouncedQuery, getNearbyListings]);

  const handleRadiusSelect = (radVal) => {
    setSelectedRadius(radVal);
    if (radVal === "all") {
      setNearbyListings(null);
      setLocationError(null);
    } else {
      fetchNearby(radVal);
    }
  };

  useEffect(() => {
    if (selectedRadius !== "all") {
      fetchNearby(selectedRadius);
    }
  }, [activeCat, type, debouncedQuery, selectedRadius, fetchNearby]);

  const displayListings = useMemo(() => {
    if (selectedRadius !== "all" && nearbyListings !== null) {
      return nearbyListings;
    }
    return listings.filter((l) => {
      if (activeCat !== "all" && String(l.category) !== String(activeCat)) return false;
      if (type !== "all" && l.type !== type) return false;
      if (debouncedQuery && !`${l.title} ${l.description} ${l.tags.join(" ")}`.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
      return true;
    });
  }, [selectedRadius, nearbyListings, listings, activeCat, type, debouncedQuery]);

  return (
    <div className="space-y-6" data-testid="explore-page">
      <SectionTitle kicker="EXPLORE">Browse the swap galaxy.</SectionTitle>

      {/* Search + filters */}
      <div className="nb-card p-4 bg-[var(--surface)] space-y-3">
        <div className="relative">
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skateboards, tutors, plants..."
            className="nb-input !pl-11 w-full"
            data-testid="explore-search"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Type:</span>
            <div className="nb-border-2 rounded-full p-0.5 bg-[var(--surface)] flex">
              {["all", "product", "service"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${type === t ? "bg-[var(--text)] text-white shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
                  data-testid={`explore-type-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Location Radius Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono2 uppercase font-bold text-[var(--lime)] flex items-center gap-1">
              <MapPin size={11} /> Nearby:
            </span>
            <div className="nb-border-2 rounded-full p-0.5 bg-[var(--surface-2)] flex flex-wrap gap-0.5" data-testid="explore-radius-selector">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleRadiusSelect(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${selectedRadius === opt.value ? "bg-[var(--lime)] text-black shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
                  data-testid={`explore-radius-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode (Grid, List, Map) */}
          <div className="nb-border-2 rounded-full p-0.5 bg-[var(--surface-2)] flex ml-auto items-center" data-testid="explore-view-switcher">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${view === "grid" ? "bg-[var(--lime)] text-black shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
              data-testid="explore-view-grid"
              aria-label="Grid View"
            >
              <Grid size={13} strokeWidth={2.5} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${view === "list" ? "bg-[var(--lime)] text-black shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
              data-testid="explore-view-list"
              aria-label="List View"
            >
              <List size={13} strokeWidth={2.5} />
              <span>List</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${view === "map" ? "bg-[var(--lime)] text-black shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
              data-testid="explore-view-map"
              aria-label="Map View"
            >
              <Map size={13} strokeWidth={2.5} />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Location warning banner if radius filter active but location is unavailable */}
      {locationError && selectedRadius !== "all" && (
        <div className="nb-card p-4 bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} className="shrink-0 text-amber-400" />
            <span>{locationError}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/app/profile" className="nb-btn text-xs px-3 py-1.5 bg-[var(--lime)] text-black font-bold rounded-lg">
              Set Location in Profile
            </Link>
            <button onClick={() => setSelectedRadius("all")} className="nb-btn text-xs px-3 py-1.5 bg-[var(--surface-3)] text-[var(--text)] font-bold rounded-lg">
              Show All Listings
            </button>
          </div>
        </div>
      )}

      {/* Category strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCat("all")}
          className={`nb-btn px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${activeCat === "all" ? "bg-[var(--text)] text-white" : "bg-[var(--surface)]"}`}
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

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="font-mono2 text-xs uppercase flex items-center gap-2">
          <span>{nearbyLoading ? "Searching nearby..." : `${displayListings.length} result${displayListings.length !== 1 ? "s" : ""}`}</span>
          {selectedRadius !== "all" && (
            <span className="nb-tag tint-lime py-0.5 px-2 text-[10px]">
              within {selectedRadius} km
            </span>
          )}
        </div>
      </div>

      {/* Interactive Map View */}
      {view === "map" && (
        <div className="space-y-4">
          <ListingMap
            userLocation={{
              latitude: user?.latitude,
              longitude: user?.longitude,
              locationName: user?.location,
            }}
            listings={displayListings}
            height="500px"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayListings.map((l) => (
              <ListingCard key={l.id} listing={l} compact />
            ))}
          </div>
        </div>
      )}

      {/* Results grid / list */}
      {view !== "map" && (
        nearbyLoading ? (
          <div className="p-12 text-center text-sm font-mono2 text-[var(--text-3)] flex items-center justify-center gap-2">
            <Compass size={20} className="animate-spin text-[var(--lime)]" /> Finding nearby items...
          </div>
        ) : displayListings.length === 0 ? (
          <EmptyState
            emoji="📍"
            title={selectedRadius !== "all" ? `No listings within ${selectedRadius} km` : "Nothing here yet"}
            subtitle={selectedRadius !== "all" ? "Try increasing the radius to 25 km or 50 km to find more items." : "Try broadening your search or picking a different category."}
            action={
              <NbButton
                onClick={() => {
                  setQuery("");
                  setCat("all");
                  setType("all");
                  setSelectedRadius("all");
                  setNearbyListings(null);
                  setLocationError(null);
                }}
                data-testid="explore-clear"
              >
                Clear all filters
              </NbButton>
            }
          />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {displayListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {displayListings.map((l) => (
              <Link
                to={`/app/listing/${l.id}`}
                key={l.id}
                className="nb-card p-3 flex gap-4 items-center hover:tint-amber transition-colors"
                data-testid={`explore-row-${l.id}`}
              >
                <img src={l.images[0]} className="w-24 h-24 object-cover nb-border-2 rounded-lg" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl truncate flex items-center justify-between gap-2">
                    <span>{l.title}</span>
                    {l.distance_formatted && (
                      <span className="nb-tag tint-lime text-[10px] shrink-0 font-bold text-black">
                        📍 {l.distance_formatted}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono2 text-[var(--text-3)] mt-1">{l.location} · {l.posted}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {l.tags.slice(0, 3).map((t) => <span key={t} className="nb-tag bg-[var(--surface)]">{t}</span>)}
                  </div>
                </div>
                <span className="nb-tag tint-amber">~₹{l.estValue}</span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Explore;
