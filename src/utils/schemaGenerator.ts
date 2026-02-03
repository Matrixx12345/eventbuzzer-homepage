/**
 * Schema.org Event structured data generator
 *
 * Generates comprehensive Event schema for Google Rich Results:
 * - ImageObject with dimensions
 * - GeoCoordinates for location
 * - AggregateRating from buzz_score
 * - Offer with validFrom
 */

import { SITE_URL } from "@/config/constants";

interface DynamicEvent {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  venue_name?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  price_from?: number;
  ticket_link?: string;
  buzz_score?: number | null;
  category_sub_id?: string;
}

interface StaticEvent {
  title: string;
  description: string;
  image: string;
  venue: string;
  location: string;
  priceFrom?: number;
  ticketLink?: string;
}

export function generateEventSchema(
  event: StaticEvent,
  dynamicEvent?: DynamicEvent | null
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description || "Event in der Schweiz",

    // Image as ImageObject (required for Rich Results)
    "image": [
      {
        "@type": "ImageObject",
        "url": event.image,
        "width": 1200,
        "height": 630
      }
    ],

    "startDate": dynamicEvent?.start_date || new Date().toISOString(),
    "endDate": dynamicEvent?.end_date || dynamicEvent?.start_date || new Date().toISOString(),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",

    "location": {
      "@type": "Place",
      "name": event.venue || event.location,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": dynamicEvent?.address_street || "",
        "addressLocality": event.location,
        "postalCode": dynamicEvent?.address_zip || "",
        "addressCountry": "CH"
      },
      // Add geo coordinates if available (improves local SEO)
      ...(dynamicEvent?.latitude && dynamicEvent?.longitude ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": dynamicEvent.latitude,
          "longitude": dynamicEvent.longitude
        }
      } : {})
    },

    "organizer": {
      "@type": "Organization",
      "name": "EventBuzzer",
      "url": SITE_URL
    }
  };

  // Add aggregate rating based on buzz_score (star ratings in search results!)
  if (dynamicEvent?.buzz_score && dynamicEvent.buzz_score > 0) {
    const ratingValue = Math.min(5, Math.max(1, (dynamicEvent.buzz_score / 20)));
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": Math.max(10, Math.floor(dynamicEvent.buzz_score / 2))
    };
  }

  // Add offer with price and validity (important for Google Events)
  if (event.priceFrom) {
    schema["offers"] = {
      "@type": "Offer",
      "price": event.priceFrom,
      "priceCurrency": "CHF",
      "url": event.ticketLink || window.location.href,
      "availability": "https://schema.org/InStock",
      "validFrom": dynamicEvent?.start_date || new Date().toISOString()
    };
  }

  // Add performer for music/concert events
  const categoryId = String(dynamicEvent?.category_sub_id || '');
  if (categoryId.includes('music') || categoryId.includes('concert')) {
    schema["performer"] = {
      "@type": "PerformingGroup",
      "name": event.title
    };
  }

  return schema;
}
