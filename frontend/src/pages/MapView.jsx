import React, { useState, useEffect } from "react";
import { Compass, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { SectionTitle, EmptyState } from "@/components/UI";
import ListingMap from "@/components/ListingMap";

const MapView = () => {
  const { user, getNearbyListings } = useApp();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMapData = async () => {
      setLoading(true);
      setError(null);
      try {
        let lat = user?.latitude;
        let lng = user?.longitude;

        if ((!lat || !lng) && navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (geoErr) {
            console.warn("Geolocation denied or failed", geoErr);
          }
        }

        if (!lat || !lng) {
          throw new Error("Location is required to view nearby items on the map. Please update your profile.");
        }

        const res = await getNearbyListings({ latitude: lat, longitude: lng, radius: 25 });
        if (isMounted) {
          setListings(res.listings || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load nearby items.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMapData();

    return () => {
      isMounted = false;
    };
  }, [user, getNearbyListings]);

  return (
    <div className="space-y-6" data-testid="map-view-page">
      <SectionTitle kicker="NEARBY">Map View</SectionTitle>
      
      {error && (
        <div className="nb-card p-4 bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} className="shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          <Link to="/app/profile" className="nb-btn text-xs px-3 py-1.5 bg-[var(--lime)] text-black font-bold rounded-lg shrink-0">
            Set Location in Profile
          </Link>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm font-mono2 text-[var(--text-3)] flex items-center justify-center gap-2 nb-card bg-[var(--surface)]">
          <Compass size={20} className="animate-spin text-[var(--lime)]" /> Locating nearby swappers...
        </div>
      ) : !error && listings.length === 0 ? (
        <EmptyState 
          emoji="🗺️" 
          title="No nearby items found" 
          subtitle="There are no items within 25km of your location right now."
        />
      ) : !error && (
        <div className="space-y-4">
          <ListingMap
            userLocation={{
              latitude: user?.latitude,
              longitude: user?.longitude,
              locationName: user?.location,
            }}
            listings={listings}
            height="650px"
          />
        </div>
      )}
    </div>
  );
};

export default MapView;
