import math
from typing import Optional


def haversine_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculates the great-circle distance between two points on the Earth
    in kilometers using the Haversine formula.

    Earth radius R = 6371.0 km
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        raise ValueError("Latitude and longitude coordinates cannot be None.")

    try:
        phi1 = math.radians(float(lat1))
        phi2 = math.radians(float(lat2))
        delta_phi = math.radians(float(lat2) - float(lat1))
        delta_lambda = math.radians(float(lon2) - float(lon1))
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid coordinate values: {e}")

    a = (
        math.sin(delta_phi / 2.0) ** 2 +
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_km = 6371.0 * c

    return round(distance_km, 1)


def format_distance(distance_km: float) -> str:
    """
    Formats distance in kilometers or meters into a human-readable string.
    - Below 1.0 km -> e.g. "850 m away"
    - 1.0 km or above -> e.g. "2.4 km away"
    """
    if distance_km is None:
        return ""

    if distance_km < 1.0:
        meters = int(round(distance_km * 1000))
        return f"{meters} m away"

    if distance_km.is_integer():
        return f"{int(distance_km)} km away"

    return f"{round(distance_km, 1)} km away"
