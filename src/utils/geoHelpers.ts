/**
 * Geo Helper Functions for Magic Trip Selector
 * Contains utilities for distance calculation and event clustering
 */

export interface Event {
  id: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 First latitude
 * @param lng1 First longitude
 * @param lat2 Second latitude
 * @param lng2 Second longitude
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find N nearby events using geographic clustering
 * Algorithm: Calculate centroid of all events, then find closest events to centroid
 * @param events Array of events with latitude/longitude
 * @param count Number of events to return
 * @returns Array of N closest events
 */
export function findNearbyEvents<T extends Event>(events: T[], count: number): T[] {
  if (events.length === 0) return [];
  if (events.length <= count) return events;

  // Calculate centroid (average lat/lng of all events)
  const avgLat =
    events.reduce((sum, e) => sum + (e.latitude || 0), 0) / events.length;
  const avgLng =
    events.reduce((sum, e) => sum + (e.longitude || 0), 0) / events.length;

  // Calculate distance from centroid for each event
  const withDistance = events.map((event) => ({
    event,
    distance: haversineDistance(
      avgLat,
      avgLng,
      event.latitude || 0,
      event.longitude || 0
    ),
  }));

  // Sort by distance (closest first)
  withDistance.sort((a, b) => a.distance - b.distance);

  // Return top N events
  return withDistance.slice(0, count).map((item) => item.event);
}

/**
 * Get time recommendation based on event start time
 * @param startDate ISO 8601 date string
 * @returns "Morgen", "Mittag", or "Abend"
 */
export function getTimeRecommendation(startDate: string): string {
  const date = new Date(startDate);
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return "Morgen";
  if (hour >= 12 && hour < 17) return "Mittag";
  return "Abend";
}

/**
 * Get vibe pills for an event based on category, tags, and price
 * @param event Event object
 * @returns Array of vibe pills (max 3)
 */
export function getVibePills(event: {
  category_main_id?: number;
  tags?: string[];
  price_from?: number;
}): string[] {
  const pills: string[] = [];

  // Category mapping
  const categoryMap: Record<number, string> = {
    1: "Musik",
    2: "Wellness",
    3: "Natur",
    4: "Sport",
    5: "Familie",
    6: "Märkte",
    7: "Kultur",
    8: "Food",
    9: "Nightlife",
    10: "Shopping",
    11: "Sightseeing",
    12: "Adventure",
    13: "Festivals",
    14: "Business",
    15: "Other",
  };

  if (event.category_main_id) {
    pills.push(categoryMap[event.category_main_id] || "Event");
  }

  // Indoor/Outdoor from tags
  if (event.tags?.includes("outdoor")) {
    pills.push("Outdoor");
  } else if (event.tags?.includes("indoor")) {
    pills.push("Indoor");
  }

  // Price tier
  if (event.price_from === 0 || event.price_from === undefined) {
    pills.push("Gratis");
  } else if (event.price_from > 50) {
    pills.push("Premium");
  }

  return pills.slice(0, 3); // Max 3 pills
}

/**
 * Swiss city coordinates for filters
 */
export const SWISS_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Zürich": { lat: 47.3769, lng: 8.5417 },
  "Basel": { lat: 47.5596, lng: 7.5886 },
  "Bern": { lat: 46.9480, lng: 7.4474 },
  "Genf": { lat: 46.2044, lng: 6.1432 },
  "Luzern": { lat: 47.0502, lng: 8.3093 },
  "Lausanne": { lat: 46.5197, lng: 6.6323 },
  "St. Gallen": { lat: 47.4245, lng: 9.3767 },
  "Winterthur": { lat: 47.5000, lng: 8.7240 },
  "Lugano": { lat: 46.0037, lng: 8.9511 },
  "Biel": { lat: 47.1368, lng: 7.2468 },
  "St. Moritz": { lat: 46.4989, lng: 9.8355 },
  "Zermatt": { lat: 46.0207, lng: 7.7491 },
  "Interlaken": { lat: 46.6863, lng: 7.8632 },
  "Davos": { lat: 46.8029, lng: 9.8363 },
  "Grindelwald": { lat: 46.6244, lng: 8.0411 },
};

/**
 * Calculate perpendicular distance from a point to a line segment (A to B)
 * Used for Route A→B corridor filtering
 * @param pointLat Event latitude
 * @param pointLng Event longitude
 * @param lat1 Route start latitude
 * @param lng1 Route start longitude
 * @param lat2 Route end latitude
 * @param lng2 Route end longitude
 * @returns Distance in kilometers from point to line
 */
export function distanceToLine(
  pointLat: number,
  pointLng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const p = { lat: toRad(pointLat), lng: toRad(pointLng) };
  const a = { lat: toRad(lat1), lng: toRad(lng1) };
  const b = { lat: toRad(lat2), lng: toRad(lng2) };

  // Calculate cross-track distance
  const R = 6371; // Earth radius in km

  // Distance from A to point
  const distAP = haversineDistance(lat1, lng1, pointLat, pointLng);

  // Distance from A to B
  const distAB = haversineDistance(lat1, lng1, lat2, lng2);

  // If route is basically a point, return distance to that point
  if (distAB < 0.001) return distAP;

  // Bearing from A to B
  const dLng = b.lng - a.lng;
  const y = Math.sin(dLng) * Math.cos(b.lat);
  const x = Math.cos(a.lat) * Math.sin(b.lat) -
            Math.sin(a.lat) * Math.cos(b.lat) * Math.cos(dLng);
  const bearingAB = Math.atan2(y, x);

  // Bearing from A to point
  const dLngP = p.lng - a.lng;
  const yP = Math.sin(dLngP) * Math.cos(p.lat);
  const xP = Math.cos(a.lat) * Math.sin(p.lat) -
             Math.sin(a.lat) * Math.cos(p.lat) * Math.cos(dLngP);
  const bearingAP = Math.atan2(yP, xP);

  // Cross-track distance
  const crossTrack = Math.asin(
    Math.sin(distAP / R) * Math.sin(bearingAP - bearingAB)
  ) * R;

  // Along-track distance (how far along the route the perpendicular point is)
  const alongTrack = Math.acos(
    Math.cos(distAP / R) / Math.cos(crossTrack / R)
  ) * R;

  // If perpendicular point is beyond the route segment, use endpoint distance
  if (alongTrack < 0) {
    return distAP; // Before point A
  } else if (alongTrack > distAB) {
    return haversineDistance(lat2, lng2, pointLat, pointLng); // After point B
  }

  return Math.abs(crossTrack);
}
