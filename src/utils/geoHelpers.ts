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
  // Distance from A to point
  const distAP = haversineDistance(lat1, lng1, pointLat, pointLng);

  // Distance from A to B
  const distAB = haversineDistance(lat1, lng1, lat2, lng2);

  // Distance from B to point
  const distBP = haversineDistance(lat2, lng2, pointLat, pointLng);

  // If route is basically a point, return distance to that point
  if (distAB < 0.001) {
    console.log(`[distanceToLine] Route is a point, distance: ${distAP.toFixed(2)} km`);
    return distAP;
  }

  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  // Bearing from A to B
  const dLng = toRad(lng2) - toRad(lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  const bearingAB = Math.atan2(y, x);

  // Bearing from A to point
  const dLngP = toRad(pointLng) - toRad(lng1);
  const pointLatRad = toRad(pointLat);
  const yP = Math.sin(dLngP) * Math.cos(pointLatRad);
  const xP = Math.cos(lat1Rad) * Math.sin(pointLatRad) -
             Math.sin(lat1Rad) * Math.cos(pointLatRad) * Math.cos(dLngP);
  const bearingAP = Math.atan2(yP, xP);

  // Angular difference
  const angleDiff = bearingAP - bearingAB;

  // Cross-track distance (perpendicular distance from point to infinite line through A-B)
  const crossTrack = Math.asin(
    Math.sin(distAP / R) * Math.sin(angleDiff)
  ) * R;

  // Along-track distance (signed distance along the route)
  // Use atan2 to preserve sign (positive = towards B, negative = opposite direction)
  const alongTrack = Math.acos(
    Math.cos(distAP / R) / Math.cos(Math.abs(crossTrack) / R)
  ) * R;

  // Check if point is in the direction of B or opposite direction
  // Normalize angle difference to [-π, π]
  let normalizedAngle = angleDiff;
  while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
  while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

  // If angle is > 90° or < -90°, point is in opposite direction from route
  const isOppositeDirection = Math.abs(normalizedAngle) > Math.PI / 2;

  console.log(`[distanceToLine] Point: (${pointLat.toFixed(4)}, ${pointLng.toFixed(4)}), ` +
              `A: (${lat1.toFixed(4)}, ${lng1.toFixed(4)}), ` +
              `B: (${lat2.toFixed(4)}, ${lng2.toFixed(4)}), ` +
              `distAB: ${distAB.toFixed(2)} km, distAP: ${distAP.toFixed(2)} km, distBP: ${distBP.toFixed(2)} km, ` +
              `crossTrack: ${Math.abs(crossTrack).toFixed(2)} km, alongTrack: ${alongTrack.toFixed(2)} km, ` +
              `angleDiff: ${(normalizedAngle * 180 / Math.PI).toFixed(1)}°, oppositeDir: ${isOppositeDirection}`);

  // If perpendicular point is beyond the route segment, use endpoint distance
  if (isOppositeDirection || alongTrack < 0) {
    console.log(`  → Before A (opposite direction), returning distAP: ${distAP.toFixed(2)} km`);
    return distAP;
  } else if (alongTrack > distAB) {
    console.log(`  → After B, returning distBP: ${distBP.toFixed(2)} km`);
    return distBP;
  }

  console.log(`  → On corridor, returning crossTrack: ${Math.abs(crossTrack).toFixed(2)} km`);
  return Math.abs(crossTrack);
}
