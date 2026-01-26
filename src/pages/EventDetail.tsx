import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import { Heart, MapPin, Calendar, Plus, ArrowRight, Navigation, Loader2, ExternalLink, Share2, CalendarPlus, Copy, Mail, Flag, Info, ShoppingCart } from "lucide-react";
import ImageAttribution from "@/components/ImageAttribution";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { BuzzTracker } from "@/components/BuzzTracker";
import { ImageGallery } from "@/components/ImageGallery";
import { useState, useEffect, useRef } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEventReferral, isExternalReferral } from "@/services/buzzTracking";
import { getNearestPlace } from "@/utils/swissPlaces";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import all event images
import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOrchestra from "@/assets/weekend-orchestra.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";
import weekendComedy from "@/assets/weekend-comedy.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";
import swissGeneva from "@/assets/swiss-geneva.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissZermatt from "@/assets/swiss-zermatt.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissInterlaken from "@/assets/swiss-interlaken.jpg";
import swissBasel from "@/assets/swiss-basel.jpg";
import swissTrain from "@/assets/swiss-train.jpg";
import eventAbbey from "@/assets/event-abbey.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";
import eventVenue from "@/assets/event-venue.jpg";

// Rainy day images
import rainyKunsthaus from "@/assets/rainy-kunsthaus.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import rainyCinema from "@/assets/rainy-cinema.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";
import rainyFifa from "@/assets/rainy-fifa.jpg";

// Partner products
import partnerChampagne from "@/assets/partner-champagne.jpg";
import partnerRoses from "@/assets/partner-roses.jpg";
import partnerTeddy from "@/assets/partner-teddy.jpg";
import partnerChocolate from "@/assets/partner-chocolate.jpg";

// Event data mapping
const eventsData: Record<string, {
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  description: string;
  distance: string;
}> = {
  "jazz-quartet": {
    image: weekendJazz,
    title: "The Finezdara & Jazz Quartet Club",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 15, 2025",
    time: "20:00",
    distance: "2.5 km away",
    description: "Experience an unforgettable evening of smooth jazz in the intimate setting of Leonard House. The Finezdara Jazz Quartet brings together world-class musicians for a night of improvisation and musical excellence. The Käfigturm was the city's second western gateway. The tower was built between 1256 and 1344, served as a prison between 1641 and 1643 and retained that function until 1897. The clock was installed in 1691."
  },
  "kulturbetrieb-royal": {
    image: weekendOrchestra,
    title: "Kulturbetrieh Royal",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 18, 2025",
    time: "19:30",
    distance: "2.5 km away",
    description: "A royal evening of classical performances featuring the finest orchestral arrangements in Switzerland's most prestigious venue. Experience the grandeur of classical music in an intimate setting."
  },
  "art-exhibit": {
    image: weekendArt,
    title: "Art Exhibit Bimore",
    venue: "Tonhalla Orchestra",
    location: "Zürich • CH",
    date: "December 20, 2025",
    time: "10:00",
    distance: "8.2 km away",
    description: "Discover contemporary masterpieces and timeless classics in this curated exhibition showcasing the best of Swiss and international art."
  },
  "wine-dining": {
    image: weekendWine,
    title: "Freenstannee Wine & Fine Dining Event",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 22, 2025",
    time: "18:30",
    distance: "2.5 km away",
    description: "An exquisite pairing of fine wines and gourmet cuisine, guided by Switzerland's most renowned sommeliers and chefs."
  },
  "comedy-club": {
    image: weekendComedy,
    title: "Local Comedy Club Night",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 23, 2025",
    time: "21:00",
    distance: "2.5 km away",
    description: "Laugh the night away with Switzerland's funniest comedians in an intimate club setting."
  },
  "opera-festival": {
    image: weekendOpera,
    title: "Festival: Initial Musics for Opera",
    venue: "Opera House",
    location: "Zürich • CH",
    date: "December 28, 2025",
    time: "19:00",
    distance: "8.2 km away",
    description: "A grand operatic experience featuring world-renowned performers in Zürich's iconic Opera House."
  },
  "geneva-watch-fair": {
    image: swissGeneva,
    title: "The Geneva Watch & Art Fair",
    venue: "Palexpo Geneva",
    location: "Geneva • CH",
    date: "January 10, 2026",
    time: "09:00",
    distance: "275 km away",
    description: "The world's most prestigious watch and art fair, showcasing horological masterpieces alongside contemporary art."
  },
  "lucerne-classical": {
    image: swissLucerne,
    title: "Lucerne Classical Summer",
    venue: "KKL Luzern",
    location: "Lucerne • CH",
    date: "January 15, 2026",
    time: "19:30",
    distance: "45 km away",
    description: "World-class orchestras and soloists perform in the acoustically perfect KKL concert hall."
  },
  "bern-market": {
    image: swissBern,
    title: "Bern Federal Plaza Market",
    venue: "Bundesplatz",
    location: "Bern • CH",
    date: "January 20, 2026",
    time: "08:00",
    distance: "95 km away",
    description: "Experience the vibrant atmosphere of Bern's famous market at the historic Federal Plaza."
  },
  "zermatt-hiking": {
    image: swissZermatt,
    title: "Zermatt Matterhorn Hiking Week",
    venue: "Zermatt Village",
    location: "Zermatt • CH",
    date: "January 25, 2026",
    time: "All Day",
    distance: "180 km away",
    description: "A week of guided hiking adventures with breathtaking views of the iconic Matterhorn."
  },
  "zurich-film": {
    image: swissZurich,
    title: "Zurich Film Festival Specials",
    venue: "Corso Cinema",
    location: "Zürich • CH",
    date: "February 1, 2026",
    time: "14:00",
    distance: "8.2 km away",
    description: "Special screenings and premieres at Switzerland's most celebrated film festival."
  },
  "interlaken-adventure": {
    image: swissInterlaken,
    title: "Interlaken Adventure Days",
    venue: "Interlaken Ost",
    location: "Interlaken • CH",
    date: "February 10, 2026",
    time: "08:00",
    distance: "120 km away",
    description: "Paragliding, hiking, and extreme sports in the stunning Swiss Alps."
  },
  "basel-fair": {
    image: swissBasel,
    title: "Basel Autumn Fair",
    venue: "Messeplatz",
    location: "Basel • CH",
    date: "February 15, 2026",
    time: "11:00",
    distance: "85 km away",
    description: "Switzerland's largest autumn fair with rides, food, and entertainment for all ages."
  },
  "grand-train-tour": {
    image: swissTrain,
    title: "The Grand Train Tour Winter Edition",
    venue: "Swiss Rail",
    location: "Switzerland",
    date: "March 1, 2026",
    time: "08:00",
    distance: "Various",
    description: "Experience the breathtaking panoramic Glacier Express journey through snow-covered Swiss Alps."
  },
  "kunsthaus-zurich": {
    image: rainyKunsthaus,
    title: "Kunsthaus Zürich",
    venue: "Kunsthaus Zürich",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    distance: "8.2 km away",
    description: "Discover world-class art collections spanning from medieval times to contemporary masterpieces in one of Switzerland's most prestigious galleries."
  },
  "hurlimann-spa": {
    image: rainySpa,
    title: "Hürlimann Spa",
    venue: "Thermalbad & Spa",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "09:00 - 22:00",
    distance: "7.8 km away",
    description: "Relax in the historic thermal baths housed in a beautifully restored 19th-century brewery, featuring rooftop pools with panoramic city views."
  },
  "kosmos-cinema": {
    image: rainyCinema,
    title: "Kosmos Cinema",
    venue: "Kosmos Kulturhaus",
    location: "Zürich • CH",
    date: "Various Screenings",
    time: "Check Schedule",
    distance: "8.5 km away",
    description: "Experience cinema in style with luxurious velvet seating and carefully curated film selections in this iconic Zurich cultural venue."
  },
  "lindt-chocolate": {
    image: rainyChocolate,
    title: "Lindt Home of Chocolate",
    venue: "Lindt Museum",
    location: "Kilchberg • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    distance: "12 km away",
    description: "Experience the world's largest chocolate fountain and explore interactive exhibits showcasing the art of Swiss chocolate making."
  },
  "fifa-museum": {
    image: rainyFifa,
    title: "FIFA Museum",
    venue: "FIFA World Museum",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    distance: "8.2 km away",
    description: "Immerse yourself in the history of football with interactive exhibits, memorabilia, and the iconic World Cup trophy."
  }
};

// Similar events for carousel
const similarEvents = [
  { slug: "kulturbetrieb-royal", image: eventAbbey, title: "Photo Spot Einsiedeln Abbey", venue: "Leonard House", location: "Einsiedeln • CH", date: "Dec 20" },
  { slug: "art-exhibit", image: eventConcert, title: "Kulturbetrieb Royal", venue: "Leonard House", location: "Baden • CH", date: "Dec 22" },
  { slug: "wine-dining", image: eventSymphony, title: "Zurich Tonhalle", venue: "Tonhalle Orchestra", location: "Zürich • CH", date: "Dec 25" },
  { slug: "opera-festival", image: eventVenue, title: "Volver", venue: "Bern Venue", location: "Bern • CH", date: "Dec 28" },
];

// Partner products with masonry layout info
const partnerProducts = [
  { image: partnerRoses, name: "12 Red Roses Bouquet", price: "CHF 39", partner: "Fleurop", size: "tall" as const },
  { image: partnerChampagne, name: "Moët & Chandon Impérial", price: "CHF 49", partner: "Galaxus", size: "standard" as const },
  { image: partnerChocolate, name: "Lindt Pralinés Selection", price: "CHF 29", partner: "Lindt", size: "standard" as const },
  { image: eventVenue, name: "VIP Chauffeur Service", price: "CHF 189", partner: "Blacklane", size: "wide" as const },
  { image: partnerTeddy, name: "Premium Teddy Bear", price: "CHF 35", partner: "Manor", size: "standard" as const },
  { image: rainySpa, name: "Late Night Spa Access", price: "CHF 79", partner: "Hürlimann", size: "tall" as const },
  { image: weekendWine, name: "Scented Candle Set", price: "CHF 45", partner: "Westwing", size: "standard" as const },
  { image: swissGeneva, name: "Premium Earphones", price: "CHF 129", partner: "Digitec", size: "standard" as const },
  { image: weekendArt, name: "Cashmere Red Gloves", price: "CHF 89", partner: "Globus", size: "tall" as const },
  { image: swissLucerne, name: "Luxury Silk Scarf", price: "CHF 159", partner: "Jelmoli", size: "wide" as const },
  { image: rainyChocolate, name: "Artisan Coffee Set", price: "CHF 55", partner: "Sprüngli", size: "standard" as const },
  { image: weekendOpera, name: "Crystal Wine Glasses", price: "CHF 75", partner: "Manor", size: "standard" as const },
];

// Similar Event Card - Clean White Design with Swap Support
const SimilarEventCard = ({ slug, image, title, venue, location, date, onSwap }: {
  slug: string;
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
  onSwap: (slug: string) => void;
}) => {
  const handleClick = () => {
    onSwap(slug);
  };

  return (
    <button onClick={handleClick} className="block group h-full w-full text-left">
      <article className="bg-white rounded-xl overflow-hidden h-full border border-neutral-200 hover:shadow-lg transition-shadow duration-300">
        {/* Image - 16:9 Landscape */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-neutral-500 text-xs mb-1">{date}</p>
          <h3 className="font-serif text-neutral-900 text-base font-semibold leading-tight mb-1">{title}</h3>
          <p className="text-neutral-500 text-sm">{venue} • {location}</p>
          <span className="mt-3 text-neutral-900 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            View Details <ArrowRight size={14} />
          </span>
        </div>
      </article>
    </button>
  );
};

// Masonry Product Card - Pinterest Style
const MasonryProductCard = ({ image, name, price, partner, size }: {
  image: string;
  name: string;
  price: string;
  partner: string;
  size: "standard" | "tall" | "wide";
}) => {
  const sizeClasses = {
    standard: "",
    tall: "row-span-2",
    wide: "col-span-2",
  };

  return (
    <article className={`relative rounded-2xl overflow-hidden group cursor-pointer ${sizeClasses[size]}`}>
      {/* Full-bleed Image */}
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[200px]"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white/70 text-[10px] uppercase tracking-wider mb-1">via {partner}</p>
        <h3 className="text-white font-serif text-lg font-semibold leading-tight mb-1">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{price}</span>
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
    </article>
  );
};

// Dynamic event interface for Supabase data
interface DynamicEvent {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  long_description?: string;
  short_description?: string;
  venue_name?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  image_author?: string | null;
  image_license?: string | null;
  price_from?: number;
  price_to?: number;
  price_label?: string;
  ticket_link?: string;
  latitude?: number;
  longitude?: number;
  category_sub_id?: string;
  created_at?: string;
  gallery_urls?: string[];
  buzz_score?: number | null;
}

// Country name list for filtering
const COUNTRY_NAMES = [
  "schweiz", "switzerland", "suisse", "svizzera",
  "germany", "deutschland", "france", "frankreich",
  "austria", "österreich", "italy", "italien", "liechtenstein",
];

const isCountryName = (str?: string) => {
  if (!str) return true;
  return COUNTRY_NAMES.includes(str.toLowerCase().trim());
};

// Get clean location name (like in Listings) - with coordinates fallback
const getEventLocation = (event: DynamicEvent): string => {
  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountryName(city)) {
    return city;
  }

  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountryName(event.venue_name)) {
    return event.venue_name.trim();
  }

  if (event.location && !isCountryName(event.location)) {
    return event.location.trim();
  }

  // Fallback: Use coordinates to find nearest Swiss place
  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }

  return "";
};

// Get distance from nearest major city (like in Listings)
const getDistanceInfo = (lat: number, lng: number): { city: string; distance: string } => {
  const centers = [
    { name: "Zürich", lat: 47.3769, lng: 8.5417 },
    { name: "Genf", lat: 46.2044, lng: 6.1432 },
    { name: "Basel", lat: 47.5596, lng: 7.5886 },
    { name: "Bern", lat: 46.948, lng: 7.4474 },
    { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
    { name: "Luzern", lat: 47.0502, lng: 8.3093 },
    { name: "St. Gallen", lat: 47.4245, lng: 9.3767 },
    { name: "Lugano", lat: 46.0037, lng: 8.9511 },
    { name: "Montreux", lat: 46.4312, lng: 6.9107 },
    { name: "Interlaken", lat: 46.6863, lng: 7.8632 },
    { name: "Chur", lat: 46.8503, lng: 9.5334 },
    { name: "Sion", lat: 46.2293, lng: 7.3586 },
    { name: "Winterthur", lat: 47.4984, lng: 8.7246 },
  ];

  let nearest = centers[0],
    minDist = Infinity;

  centers.forEach((c) => {
    const d = Math.sqrt(Math.pow((lat - c.lat) * 111, 2) + Math.pow((lng - c.lng) * 85, 2));
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  });

  if (minDist < 5) {
    return { city: nearest.name, distance: `In ${nearest.name}` };
  }

  const dLat = lat - nearest.lat;
  const dLng = lng - nearest.lng;
  let direction = "";
  if (Math.round(minDist) > 2) {
    if (dLat > 0.02) direction += "N";
    else if (dLat < -0.02) direction += "S";
    if (dLng > 0.02) direction += "O";
    else if (dLng < -0.02) direction += "W";
  }

  const distanceText = direction
    ? `~${Math.round(minDist)} km ${direction} von ${nearest.name}`
    : `~${Math.round(minDist)} km von ${nearest.name}`;

  return { city: nearest.name, distance: distanceText };
};

const EventDetail = () => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const [currentSlug, setCurrentSlug] = useState(urlSlug);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dynamicEvent, setDynamicEvent] = useState<DynamicEvent | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const referralTrackedRef = useRef(false);

  // Sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (urlSlug && urlSlug !== currentSlug) {
      setCurrentSlug(urlSlug);
    }
  }, [urlSlug]);

  // Swap to another event without page reload
  const swapToEvent = (newSlug: string) => {
    setCurrentSlug(newSlug);
    setDynamicEvent(null);
    setShowFullDescription(false);
    window.history.pushState(null, "", `/event/${newSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Use currentSlug instead of slug throughout
  const slug = currentSlug;

  // Check if slug is a static event or needs to be fetched from Supabase
  const isStaticEvent = slug && eventsData[slug];
  const isDynamicEvent = slug && !isStaticEvent;

  // Fetch dynamic event from Supabase - optimized single event lookup
  useEffect(() => {
    if (isDynamicEvent) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke("get-external-events", {
            body: { eventId: slug }
          });
          if (error) throw error;
          
          if (data?.events?.[0]) {
            setDynamicEvent(data.events[0]);
          }
        } catch (err) {
          console.error("Error fetching event:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [slug, isDynamicEvent]);

  // Track referral visits (once per page load)
  useEffect(() => {
    if (dynamicEvent && !referralTrackedRef.current && isExternalReferral()) {
      referralTrackedRef.current = true;
      trackEventReferral(dynamicEvent.id);
    }
  }, [dynamicEvent]);

  // Add Schema.org structured data (JSON-LD) for SEO
  useEffect(() => {
    if (!event || loading) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "description": event.description || "Event in der Schweiz",
      "image": event.image,
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
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "EventBuzzer",
        "url": SITE_URL
      }
    };

    // Add price if available
    if (event.priceFrom) {
      schema["offers"] = {
        "@type": "Offer",
        "price": event.priceFrom,
        "priceCurrency": "CHF",
        "url": event.ticketLink || window.location.href,
        "availability": "https://schema.org/InStock"
      };
    }

    // Add performer for certain categories
    if (dynamicEvent?.category_sub_id?.includes('music') || dynamicEvent?.category_sub_id?.includes('concert')) {
      schema["performer"] = {
        "@type": "PerformingGroup",
        "name": event.title
      };
    }

    // Create and inject script tag
    const scriptId = 'event-schema-ld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schema);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [event, dynamicEvent, loading]);

  // Format date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // Build event data from either static or dynamic source
  const eventId = slug || "unknown";
  let event: {
    image: string;
    title: string;
    venue: string;
    location: string;
    address?: string;
    date: string;
    time: string;
    distance: string;
    description: string;
    ticketLink?: string;
    priceFrom?: number;
    priceTo?: number;
    priceLabel?: string;
    latitude?: number;
    longitude?: number;
    imageAuthor?: string | null;
    imageLicense?: string | null;
    isMuseum?: boolean;
    buzzScore?: number | null;
    galleryUrls?: string[];
  };

  if (isStaticEvent) {
    event = eventsData[slug!];
  } else if (dynamicEvent) {
    // Build full address: street, PLZ + city, country
    const addressParts = [
      dynamicEvent.address_street,
      [dynamicEvent.address_zip, dynamicEvent.address_city].filter(Boolean).join(" "),
      "Schweiz"
    ].filter(Boolean);
    // Use real image if available, otherwise fallback to placeholder
    const hasValidImage = dynamicEvent.image_url && dynamicEvent.image_url.trim() !== '';
    
    // Check if it's a museum (permanent attraction without date display)
    // Either by category_sub_id OR by external_id pattern (manual_ entries are museums)
    const isMuseum = dynamicEvent.category_sub_id === 'museum-kunst' || dynamicEvent.external_id?.startsWith('manual_');
    
    // Check if it's a MySwitzerland event (permanent attraction without date)
    const isMySwitzerland = dynamicEvent.external_id?.startsWith('mys_');
    const isPermanentAttraction = !dynamicEvent.start_date;
    
    // Determine date and time display - hide for museums
    let dateDisplay: string;
    let timeDisplay: string;
    
    if (isMuseum) {
      dateDisplay = "";  // Don't show date for museums
      timeDisplay = "";
    } else if (isPermanentAttraction) {
      dateDisplay = "Jederzeit verfügbar";
      timeDisplay = "";  // Don't show time for permanent attractions
    } else {
      dateDisplay = formatDate(dynamicEvent.start_date) || "Datum folgt";
      timeDisplay = formatTime(dynamicEvent.start_date) || "";
    }
    
    // Use the smart location extraction
    const locationName = getEventLocation(dynamicEvent);
    const distanceInfo = dynamicEvent.latitude && dynamicEvent.longitude
      ? getDistanceInfo(dynamicEvent.latitude, dynamicEvent.longitude)
      : null;
    
    
    event = {
      image: hasValidImage ? dynamicEvent.image_url! : weekendJazz,
      title: dynamicEvent.title,
      venue: dynamicEvent.venue_name || (dynamicEvent.location !== dynamicEvent.title ? dynamicEvent.location : null) || "",
      location: locationName || "Schweiz",
      address: addressParts.length > 0 ? addressParts.join(", ") : "",
      date: dateDisplay,
      time: timeDisplay,
      distance: distanceInfo?.distance || "",
      description: dynamicEvent.long_description || dynamicEvent.description || dynamicEvent.short_description || "Beschreibung folgt.",
      ticketLink: dynamicEvent.ticket_link,
      priceFrom: dynamicEvent.price_from,
      priceTo: dynamicEvent.price_to,
      priceLabel: dynamicEvent.price_label,
      latitude: dynamicEvent.latitude,
      longitude: dynamicEvent.longitude,
      imageAuthor: dynamicEvent.image_author,
      imageLicense: dynamicEvent.image_license,
      isMuseum: isMuseum,
      buzzScore: dynamicEvent.buzz_score,
      galleryUrls: dynamicEvent.gallery_urls || [],
    };
  } else {
    event = {
      image: weekendJazz,
      title: loading ? "Lädt..." : "Event nicht gefunden",
      venue: "",
      location: "",
      date: "",
      time: "",
      distance: "",
      description: loading ? "" : "Dieses Event konnte nicht gefunden werden.",
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  // Generate dynamic meta tags for SEO
  const pageTitle = `${event.title} | EventBuzzer`;
  const pageDescription = event.description
    ? event.description.substring(0, 155) + (event.description.length > 155 ? '...' : '')
    : `${event.title} in ${event.location} - Entdecke Events in der Schweiz auf EventBuzzer`;
  const pageUrl = `${SITE_URL}/event/${slug}`;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={event.image} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={pageUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content={event.image} />

        {/* Canonical URL */}
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <Navbar />

      {/* HERO SECTION - 50/50 Split Layout */}
      <section className="min-h-[80vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left - Event Image */}
        <div className="relative h-[50vh] lg:h-[80vh] overflow-hidden group">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = weekendJazz;
            }}
          />
          {/* Image Attribution - always visible on detail page */}
          <ImageAttribution 
            author={event.imageAuthor} 
            license={event.imageLicense} 
            alwaysVisible 
          />
        </div>

        {/* Right - Content Panel */}
        <div className="bg-white flex flex-col justify-between px-6 py-10 lg:px-12 xl:px-16 lg:h-[80vh]">
          {/* Title */}
          <h1 className="font-serif text-neutral-900 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {event.title}
          </h1>

          {/* Meta Info - flat row with plain text labels */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-[12px] text-gray-500">
            {/* Museum label - plain text, no badge */}
            {event.isMuseum && (
              <span className="uppercase tracking-wide">Museum</span>
            )}
            
            {/* Date & Time - only for non-museums */}
            {!event.isMuseum && event.date && (
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                <span>{event.date}{event.time ? `, ${event.time}` : ''}</span>
              </div>
            )}
            
            {/* Location */}
            {event.location && (
              <div className="group/map relative cursor-pointer flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                <span>
                  {event.location}
                  {event.distance && <span className="text-gray-400 ml-1">• {event.distance}</span>}
                </span>
                {event.latitude && event.longitude && (
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-2 rounded-lg shadow-xl border w-36 h-28">
                      <div className="relative w-full h-full bg-slate-50 rounded overflow-hidden">
                        <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-60" alt="Map" />
                        <div
                          className="absolute w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow"
                          style={{
                            left: `${6 + ((event.longitude - 5.85) / 4.7) * 88}%`,
                            top: `${3 + (1 - (event.latitude - 45.75) / 2.1) * 94}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Venue */}
            {event.venue && event.venue !== event.location && (
              <div className="flex items-center gap-1.5">
                <Navigation size={14} className="text-gray-400" />
                <span>{event.venue}</span>
              </div>
            )}
            
            {/* Price */}
            {(event.priceLabel || event.priceFrom) && (
              <span className="text-gray-700 font-medium">
                {event.priceLabel 
                  ? event.priceLabel 
                  : event.priceTo && event.priceTo !== event.priceFrom
                    ? `CHF ${event.priceFrom} – ${event.priceTo}`
                    : `ab CHF ${event.priceFrom}`}
              </span>
            )}
            
            {/* Buzz Tracker - inline */}
            <BuzzTracker buzzScore={event.buzzScore} />
          </div>


          {/* Actions */}
          <div className="flex items-center gap-3 mb-8">
            {event.ticketLink ? (
              <a 
                href={event.ticketLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-3.5 rounded-lg transition-colors flex-1 lg:flex-none flex items-center justify-center gap-2"
              >
                Tickets kaufen <ExternalLink size={16} />
              </a>
            ) : (
              <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-3.5 rounded-lg transition-colors flex-1 lg:flex-none">
                Get Tickets
              </button>
            )}
            <button
              onClick={() => toggleFavorite({
                id: eventId,
                slug: slug || "",
                image: event.image,
                title: event.title,
                venue: event.venue,
                location: event.location,
                date: event.date
              })}
              className="p-3.5 rounded-lg hover:bg-neutral-50 transition-colors"
              title="Zu Favoriten hinzufügen"
            >
              <Heart size={20} className={isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-neutral-400"} />
            </button>
            
            {/* Smart Share Button - Mobile: native share, Desktop: popover */}
            {isMobile ? (
              <button
                onClick={async () => {
                  const shareData = {
                    title: event.title,
                    text: `Schau dir dieses Event an: ${event.title}`,
                    url: window.location.href,
                  };
                  
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch {
                      // User cancelled - ignore
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link kopiert!",
                        description: "Der Event-Link wurde in die Zwischenablage kopiert.",
                      });
                    } catch {
                      toast({
                        title: "Fehler",
                        description: "Link konnte nicht kopiert werden.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                title="Teilen"
              >
                <Share2 size={20} className="text-neutral-400" />
              </button>
            ) : (
              <Popover open={shareOpen} onOpenChange={setShareOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    title="Teilen"
                  >
                    <Share2 size={20} className="text-neutral-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-white shadow-lg border border-neutral-200" align="end">
                  <div className="flex flex-col">
                    {/* Copy Link */}
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link kopiert!",
                            description: "Der Event-Link wurde in die Zwischenablage kopiert.",
                          });
                          setShareOpen(false);
                        } catch {
                          toast({
                            title: "Fehler",
                            description: "Link konnte nicht kopiert werden.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                    >
                      <Copy size={18} className="text-neutral-500" />
                      <span className="text-sm text-neutral-700">Link kopieren</span>
                    </button>
                    
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Schau dir dieses Event an: ${event.title}\n${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShareOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-green-600" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span className="text-sm text-neutral-700">WhatsApp</span>
                    </a>
                    
                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Schau dir dieses Event an:\n\n${event.title}\n${window.location.href}`)}`}
                      onClick={() => setShareOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <Mail size={18} className="text-neutral-500" />
                      <span className="text-sm text-neutral-700">E-Mail</span>
                    </a>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Ticket kaufen - with border to highlight */}
            <button
              onClick={() => {
                if (dynamicEvent?.ticket_url || dynamicEvent?.url) {
                  window.open(dynamicEvent.ticket_url || dynamicEvent.url, '_blank');
                } else {
                  toast({
                    title: "Demnächst verfügbar",
                    description: "Ticket-Verkauf wird bald verfügbar sein.",
                  });
                }
              }}
              className="p-3.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
              title="Ticket kaufen"
            >
              <ShoppingCart size={20} className="text-neutral-600" />
            </button>

            {/* Calendar Export */}
            <button
              onClick={() => {
                const startDate = dynamicEvent?.start_date 
                  ? new Date(dynamicEvent.start_date) 
                  : new Date();
                
                const endDate = dynamicEvent?.end_date 
                  ? new Date(dynamicEvent.end_date) 
                  : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                
                const formatICSDate = (date: Date) => {
                  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                
                const escapeICS = (text: string) => {
                  return text
                    .replace(/\\/g, '\\\\')
                    .replace(/;/g, '\\;')
                    .replace(/,/g, '\\,')
                    .replace(/\n/g, '\\n');
                };
                
                const eventUrl = window.location.href;
                const shortDesc = event.description?.substring(0, 200) || '';
                const fullDescription = `${shortDesc}${shortDesc.length >= 200 ? '...' : ''}\\n\\nMehr Infos auf EventBuzzer: ${eventUrl}`;
                
                const locationStr = [event.venue, event.address].filter(Boolean).join(', ');
                const uid = `${eventId}-${Date.now()}@eventbuzzer.ch`;
                
                const icsContent = [
                  'BEGIN:VCALENDAR',
                  'VERSION:2.0',
                  'PRODID:-//EventBuzzer//Event Calendar//DE',
                  'CALSCALE:GREGORIAN',
                  'METHOD:PUBLISH',
                  'BEGIN:VEVENT',
                  `UID:${uid}`,
                  `DTSTAMP:${formatICSDate(new Date())}`,
                  `DTSTART:${formatICSDate(startDate)}`,
                  `DTEND:${formatICSDate(endDate)}`,
                  `SUMMARY:${escapeICS(event.title)}`,
                  `DESCRIPTION:${escapeICS(fullDescription)}`,
                  `LOCATION:${escapeICS(locationStr)}`,
                  `URL:${eventUrl}`,
                  'END:VEVENT',
                  'END:VCALENDAR'
                ].join('\r\n');
                
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${event.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '_')}.ics`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                toast({
                  title: "Kalender-Export",
                  description: "Die .ics Datei wurde heruntergeladen.",
                });
              }}
              className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="In Kalender eintragen"
            >
              <CalendarPlus size={20} className="text-neutral-400" />
            </button>
          </div>

          {/* Description - Fills remaining space with "mehr lesen" at bottom */}
          <div className="border-t border-neutral-100 pt-6 flex-1 flex flex-col min-h-0">
            <h2 className="font-serif text-neutral-900 text-lg font-semibold mb-3">Über dieses Event</h2>
            <div className={`text-neutral-600 leading-relaxed flex-1 overflow-hidden ${!showFullDescription ? 'line-clamp-6' : 'overflow-y-auto'}`}>
              <p>{event.description}</p>
            </div>
            {event.description && event.description.length > 300 && !showFullDescription && (
              <button 
                onClick={() => setShowFullDescription(true)}
                className="text-neutral-900 text-sm underline mt-4 hover:text-neutral-600 transition-colors self-start"
              >
                mehr lesen
              </button>
            )}
            
            {/* Report Error - Subtle maintenance function */}
            <div className="mt-6 pt-4 border-t border-neutral-100">
              <EventRatingButtons eventId={eventId} eventTitle={event.title} />
            </div>

            {/* Image Gallery - only show if there are gallery images */}
            {event.galleryUrls && event.galleryUrls.length > 0 && (
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <ImageGallery images={event.galleryUrls} alt={event.title} />
              </div>
            )}

            {/* Contact Link for Venues */}
            <div className="mt-8 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 italic">
                Event verwalten oder Bilder ergänzen?{" "}
                <a 
                  href={`mailto:hello@eventbuzzer.ch?subject=Event: ${encodeURIComponent(event.title)}`}
                  className="text-neutral-500 hover:text-neutral-700 underline transition-colors"
                >
                  Kontakt aufnehmen
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIMILAR EVENTS - Soft Stone Background */}
      <section className="bg-stone-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-neutral-900 text-2xl sm:text-3xl font-bold">Ähnliche Events</h2>
            <Link to="/" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {similarEvents.map((evt, index) => (
                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                  <SimilarEventCard {...evt} onSwap={swapToEvent} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50" />
            <CarouselNext className="hidden sm:flex -right-4 bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50" />
          </Carousel>
        </div>
      </section>

      {/* PARTNER PRODUCTS - Pinterest Masonry Grid */}
      <section className="bg-stone-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-neutral-900 text-2xl sm:text-3xl font-bold mb-2">Unvergessliche Augenblicke</h2>
            <p className="text-neutral-500">Curated additions to enhance your experience</p>
          </div>

          {/* Masonry Grid - 3 columns with varied spans */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[180px] md:auto-rows-[200px]">
            {partnerProducts.map((product, index) => (
              <MasonryProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-8 bg-white" />
    </div>
  );
};

export default EventDetail;
