import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Simple in-memory cache to prevent redundant requests for identical coordinates (rounded to 4 decimal places)
_GEOCODE_CACHE: Dict[tuple, Dict[str, str]] = {}
MAX_CACHE_SIZE = 500

USER_AGENT = "BAARTER-BarterMarketplace/1.0 (https://github.com/ashitoshh01/barter-marketplace)"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"


def reverse_geocode(latitude: float, longitude: float) -> Dict[str, str]:
    """
    Modular reverse-geocoding service.
    Converts latitude & longitude coordinates into location metadata:
    - location_name
    - city
    - state
    - country

    Validates coordinates and handles Nominatim HTTP/network errors gracefully.
    """
    fallback_result = {
        "location_name": "Coordinates captured",
        "city": "",
        "state": "",
        "country": ""
    }

    # Validate coordinate ranges
    if latitude is None or longitude is None:
        return fallback_result

    try:
        lat = float(latitude)
        lng = float(longitude)
    except (ValueError, TypeError):
        return fallback_result

    if lat < -90.0 or lat > 90.0 or lng < -180.0 or lng > 180.0:
        raise ValueError(f"Invalid coordinates range: lat={lat}, lng={lng}")

    # Check cache (round to 4 decimal places ~11 meters precision)
    cache_key = (round(lat, 4), round(lng, 4))
    if cache_key in _GEOCODE_CACHE:
        logger.debug("Returning cached reverse geocoding result for %s", cache_key)
        return _GEOCODE_CACHE[cache_key]

    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
    }
    params = {
        "format": "json",
        "lat": str(lat),
        "lon": str(lng),
        "zoom": 18,
        "addressdetails": 1,
    }

    try:
        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params=params,
            headers=headers,
            timeout=5.0
        )
        if response.status_code != 200:
            logger.warning("Nominatim API returned non-200 status code: %s", response.status_code)
            return fallback_result

        data = response.json()
        address = data.get("address", {}) if isinstance(data, dict) else {}

        city = (
            address.get("city") or
            address.get("town") or
            address.get("village") or
            address.get("municipality") or
            address.get("suburb") or
            address.get("county") or
            address.get("city_district") or
            ""
        )

        state = address.get("state") or address.get("state_district") or ""
        country = address.get("country") or ""

        parts = [p for p in [city, state, country] if p]
        if parts:
            location_name = ", ".join(parts)
        elif isinstance(data, dict) and data.get("display_name"):
            location_name = str(data.get("display_name"))
        else:
            location_name = "Coordinates captured"

        result = {
            "location_name": location_name,
            "city": city,
            "state": state,
            "country": country
        }

        # Cache result
        if len(_GEOCODE_CACHE) >= MAX_CACHE_SIZE:
            _GEOCODE_CACHE.pop(next(iter(_GEOCODE_CACHE)))
        _GEOCODE_CACHE[cache_key] = result

        return result

    except requests.exceptions.Timeout:
        logger.warning("Reverse geocoding request to Nominatim timed out.")
        return fallback_result
    except requests.exceptions.RequestException as e:
        logger.warning("Reverse geocoding network error: %s", str(e))
        return fallback_result
    except Exception as e:
        logger.error("Unexpected error in reverse_geocode: %s", str(e))
        return fallback_result
