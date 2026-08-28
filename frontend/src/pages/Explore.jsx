import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Grid, List, Map, Compass, AlertCircle, LocateFixed, Navigation, RefreshCw } from "lucide-react";
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

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

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

  const [gpsCoords, setGpsCoords] = useState({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);

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

  // Request device GPS location explicitly with user feedback
  const requestGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return Promise.resolve(null);
    }

    setIsLocating(true);
    const toastId = toast.loading("📡 Turning on GPS... Requesting device location");

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsCoords({ lat, lng });
          setLocationError(null);
          toast.success(`📍 GPS location locked! (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: toastId });
          setIsLocating(false);
          resolve({ lat, lng });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setIsLocating(false);
          let errorMsg = "Unable to retrieve device location.";
          if (err.code === 1) {
            errorMsg = "Location permission denied. Please allow browser location access or set profile location.";
          } else if (err.code === 2) {
            errorMsg = "GPS signal unavailable. Please check location settings on your device.";
          } else if (err.code === 3) {
            errorMsg = "GPS location request timed out.";
          }
          setLocationError(errorMsg);
          toast.error(`⚠️ ${errorMsg}`, { id: toastId });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const fetchNearby = useCallback(async (radiusVal, customLat = null, customLng = null) => {
    if (radiusVal === "all") {
      setNearbyListings(null);
      setLocationError(null);
      return;
    }

    setNearbyLoading(true);
    setLocationError(null);
    try {
      let lat = customLat ?? gpsCoords.lat ?? user?.latitude;
      let lng = customLng ?? gpsCoords.lng ?? user?.longitude;

      // If user has no active coordinates, try browser GPS on the fly
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        const coords = await requestGPSLocation();
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        } else if (user?.latitude && user?.longitude) {
          lat = user.latitude;
          lng = user.longitude;
        }
      }

      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        setLocationError("Device GPS is turned off or profile location is missing. Turn on GPS or set location in Profile.");
        setNearbyListings([]);
        return;
      }

      const paramsObj = {
        radius: radiusVal,
        latitude: lat,
        longitude: lng,
      };

      if (activeCat !== "all") paramsObj.category = activeCat;
      if (type !== "all") paramsObj.item_type = type;
      if (debouncedQuery) paramsObj.q = debouncedQuery;

      const res = await getNearbyListings(paramsObj);
      let items = res.listings || [];

      // Calculate client-side distance fallback for items if needed
      items = items.map((item) => {
        if ((item.distance_km === null || item.distance_km === undefined) && item.latitude && item.longitude) {
          const dist = calculateDistanceKm(lat, lng, item.latitude, item.longitude);
          return {
            ...item,
            distance_km: dist,
            distance_formatted: dist !== null ? `${dist} km away` : null,
          };
        }
        return item;
      });

      setNearbyListings(items);
    } catch (err) {
      console.warn("Failed to fetch nearby listings:", err);
      setLocationError(err.message || "Failed to discover nearby listings.");
      setNearbyListings([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [gpsCoords, user, activeCat, type, debouncedQuery, getNearbyListings, requestGPSLocation]);

  const handleRadiusSelect = (radVal) => {
    setSelectedRadius(radVal);
    if (radVal === "all") {
      setNearbyListings(null);
      setLocationError(null);
    } else {
      fetchNearby(radVal);
    }
  };

  const handleGPSButtonClick = async () => {
    const coords = await requestGPSLocation();
    if (coords && selectedRadius !== "all") {
      fetchNearby(selectedRadius, coords.lat, coords.lng);
    } else if (coords && selectedRadius === "all") {
      setSelectedRadius(10);
      fetchNearby(10, coords.lat, coords.lng);
    }
  };

  useEffect(() => {
    if (selectedRadius !== "all") {
      fetchNearby(selectedRadius);
    }
  }, [activeCat, type, debouncedQuery, selectedRadius, fetchNearby]);

  const activeLat = gpsCoords.lat ?? user?.latitude;
  const activeLng = gpsCoords.lng ?? user?.longitude;

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

          {/* Location Radius Filter + GPS Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono2 uppercase font-bold text-[var(--lime)] flex items-center gap-1">
              <MapPin size={11} /> Nearby:
            </span>
            
            <button
              onClick={handleGPSButtonClick}
              disabled={isLocating}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                gpsCoords.lat !== null
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border-[var(--border)]"
              }`}
              title="Turn on browser GPS location"
              data-testid="explore-gps-toggle"
            >
              {isLocating ? (
                <RefreshCw size={11} className="animate-spin text-[var(--lime)]" />
              ) : (
                <LocateFixed size={11} className={gpsCoords.lat !== null ? "text-emerald-400" : "text-[var(--text-3)]"} />
              )}
              <span>{isLocating ? "Locating..." : gpsCoords.lat !== null ? "GPS Active" : "Enable GPS"}</span>
            </button>

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
        <div className="nb-card p-4 bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-testid="location-error-banner">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} className="shrink-0 text-amber-400" />
            <span>{locationError}</span>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button onClick={handleGPSButtonClick} className="nb-btn text-xs px-3 py-1.5 bg-[var(--lime)] text-black font-bold rounded-lg flex items-center gap-1">
              <Navigation size={12} /> Enable GPS Location
            </button>
            <Link to="/app/profile" className="nb-btn text-xs px-3 py-1.5 bg-[var(--surface-2)] text-white font-bold rounded-lg">
              Set Profile Location
            </Link>
            <button onClick={() => handleRadiusSelect("all")} className="nb-btn text-xs px-3 py-1.5 bg-[var(--surface-3)] text-[var(--text)] font-bold rounded-lg">
              Show All Listings
            </button>
          </div>
        </div>
      )}

      {/* Active GPS status banner if GPS is active */}
      {gpsCoords.lat !== null && selectedRadius !== "all" && !locationError && (
        <div className="nb-card p-2.5 px-4 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-200 flex items-center justify-between text-xs font-mono2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>📍 Active GPS Coordinates: <strong>{gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</strong> (Searching within {selectedRadius} km)</span>
          </div>
          <button onClick={() => fetchNearby(selectedRadius)} className="text-[10px] underline hover:text-white">Refresh</button>
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
              latitude: activeLat,
              longitude: activeLng,
              locationName: user?.location || "Your Location",
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
            icon={Compass}
            title={selectedRadius !== "all" ? `No listings within ${selectedRadius} km` : "Nothing here yet"}
            subtitle={selectedRadius !== "all" ? "Try increasing the radius to 25 km or 50 km to find more items, or enable browser GPS." : "Try broadening your search or picking a different category."}
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
                    {(l.distance_formatted || l.distance_km !== null) && (
                      <span className="nb-tag tint-lime text-[10px] shrink-0 font-bold text-black flex items-center gap-1">
                        <MapPin size={10} strokeWidth={2.5} /> {l.distance_formatted || `${l.distance_km} km away`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono2 text-[var(--text-3)] mt-1">{l.location} · {l.posted}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {l.tags?.slice(0, 3).map((t) => <span key={t} className="nb-tag bg-[var(--surface)]">{t}</span>)}
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
