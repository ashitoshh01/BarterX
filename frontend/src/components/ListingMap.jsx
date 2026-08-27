import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

// Fix standard Leaflet default marker icons broken by Webpack/Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom user marker icon (Lime pulse dot)
const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: #ccff00;
    border: 3px solid #000000;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(204,255,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    color: #000;
  ">•</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Custom listing marker icon (Black & Amber pin)
const createListingIcon = (distanceText) => {
  return L.divIcon({
    className: "custom-listing-marker",
    html: `<div style="
      background: #000000;
      color: #ffffff;
      border: 2px solid #ccff00;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: bold;
      font-family: monospace;
      box-shadow: 2px 2px 0px #000;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <span style="color: #ccff00;">✦</span>
      <span>${distanceText || "Item"}</span>
    </div>`,
    iconSize: [80, 26],
    iconAnchor: [40, 26],
    popupAnchor: [0, -26],
  });
};

const ListingMap = ({
  userLocation,
  listings = [],
  selectedListingId = null,
  onSelectListing,
  height = "450px",
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultLat = Number(userLocation?.latitude) || 18.5204;
      const defaultLng = Number(userLocation?.longitude) || 73.8567;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures map is NOT destroyed during user re-renders/zooming

  // Update Markers & Bounds stably
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers safely
    markersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch (e) {
        // Ignore if marker already removed
      }
    });
    markersRef.current = [];

    const bounds = L.latLngBounds();
    let validMarkerCount = 0;

    // Add User Marker if coordinates exist
    if (userLocation?.latitude && userLocation?.longitude) {
      const userLat = Number(userLocation.latitude);
      const userLng = Number(userLocation.longitude);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        const userMarker = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui, sans-serif; padding: 4px;">
              <strong style="color: #000; font-size: 13px;">You (Current Location)</strong>
              <div style="font-size: 11px; color: #555;">${userLocation.locationName || "Saved Profile Location"}</div>
            </div>
          `);

        markersRef.current.push(userMarker);
        bounds.extend([userLat, userLng]);
        validMarkerCount++;
      }
    }

    // Add Listing Markers
    listings.forEach((item) => {
      if (item.latitude !== null && item.longitude !== null && item.latitude !== undefined && item.longitude !== undefined) {
        const itemLat = Number(item.latitude);
        const itemLng = Number(item.longitude);

        if (isNaN(itemLat) || isNaN(itemLng)) return;

        const distText = item.distance_formatted || (item.distance_km ? `${item.distance_km} km` : "");
        const markerIcon = createListingIcon(distText);

        const popupContent = document.createElement("div");
        popupContent.style.fontFamily = "system-ui, sans-serif";
        popupContent.style.padding = "6px";
        popupContent.style.maxWidth = "220px";

        popupContent.innerHTML = `
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #000;">${item.title}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${item.location || "Nearby"}</div>
          ${distText ? `<div style="font-size: 11px; font-weight: bold; color: #2563eb; margin-bottom: 6px;">✦ ${distText} away</div>` : ""}
          <div style="display: inline-block; background: #e2e8f0; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
            ${item.condition || "Item"}
          </div>
          <button id="view-listing-${item.id}" style="
            width: 100%;
            background: #000;
            color: #ccff00;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
          ">View Listing →</button>
        `;

        const marker = L.marker([itemLat, itemLng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("popupopen", () => {
          const btn = document.getElementById(`view-listing-${item.id}`);
          if (btn) {
            btn.onclick = () => {
              navigate(`/app/listing/${item.id}`);
            };
          }
          if (onSelectListing) {
            onSelectListing(item.id);
          }
        });

        markersRef.current.push(marker);
        bounds.extend([itemLat, itemLng]);
        validMarkerCount++;
      }
    });

    // Fit map bounds safely without animating to avoid zoom race conditions
    if (validMarkerCount > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: false });
      } catch (e) {
        // Ignore fitBounds error if map is detached
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, listings, navigate, onSelectListing]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden nb-border-2 bg-[var(--surface-2)]" style={{ height }} data-testid="interactive-map">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {listings.length === 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white text-xs font-mono2 px-3 py-2 rounded-lg nb-border-2 z-[1000] flex items-center gap-2">
          <span>✦</span> No nearby listings found for this radius.
        </div>
      )}
    </div>
  );
};

export default ListingMap;
