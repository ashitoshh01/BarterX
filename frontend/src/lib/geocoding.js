/**
 * Client-side reverse geocoding service wrapper.
 * Delegates reverse geocoding to the Django backend endpoint POST /api/geocode/reverse/.
 *
 * Coordinates (lat, lng) remain the source of truth if backend lookup fails.
 */

import api from "@/lib/api";

export const reverseGeocode = async (lat, lng) => {
  const fallback = {
    city: "",
    state: "",
    country: "",
    location_name: "Coordinates captured",
    latitude: Number(lat),
    longitude: Number(lng),
  };

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return fallback;
  }

  try {
    const res = await api.post("/geocode/reverse/", {
      latitude: Number(lat),
      longitude: Number(lng),
    });

    if (res.data && res.data.location_name) {
      return {
        city: res.data.city || "",
        state: res.data.state || "",
        country: res.data.country || "",
        location_name: res.data.location_name || fallback.location_name,
        latitude: Number(lat),
        longitude: Number(lng),
      };
    }
    return fallback;
  } catch (err) {
    console.warn(
      "Backend reverse geocoding endpoint error/unreachable, preserving captured coordinates as source of truth:",
      err
    );
    return fallback;
  }
};
