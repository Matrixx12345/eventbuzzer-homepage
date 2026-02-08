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
