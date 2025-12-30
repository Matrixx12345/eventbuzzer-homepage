import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Heart, MapPin, Calendar, Plus, ArrowRight, Navigation, Loader2, ExternalLink, Share2, CalendarPlus } from "lucide-react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useState, useEffect } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { supabase } from "@/integrations/supabase/client";
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

// Similar Event Card - Clean White Design
const SimilarEventCard = ({ slug, image, title, venue, location, date }: {
  slug: string;
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
}) => {
  return (
    <Link to={`/event/${slug}`} className="block group h-full">
      <article className="bg-white rounded-xl overflow-hidden h-full border border-neutral-200 hover:shadow-lg transition-shadow duration-300">
        {/* Image - 16:9 Landscape */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-neutral-500 text-xs mb-1">{date}</p>
          <h3 className="font-serif text-neutral-900 text-base font-semibold leading-tight mb-1">{title}</h3>
          <p className="text-neutral-500 text-sm">{venue} • {location}</p>
          <button className="mt-3 text-neutral-900 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View Details <ArrowRight size={14} />
          </button>
        </div>
      </article>
    </Link>
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
  price_from?: number;
  price_to?: number;
  price_label?: string;
  ticket_link?: string;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dynamicEvent, setDynamicEvent] = useState<DynamicEvent | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if slug is a static event or needs to be fetched from Supabase
  const isStaticEvent = slug && eventsData[slug];
  const isDynamicEvent = slug && !isStaticEvent;

  // Fetch dynamic event from Supabase
  useEffect(() => {
    if (isDynamicEvent) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke("get-external-events", {
            body: { limit: 500 }
          });
          if (error) throw error;
          
          // Find event by external_id OR id (supports both linking methods)
          const found = data?.events?.find((e: DynamicEvent & { external_id?: string }) => 
            e.external_id === slug || String(e.id) === slug
          );
          if (found) {
            setDynamicEvent(found);
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
    
    // Check if it's a MySwitzerland event (permanent attraction without date)
    const isMySwitzerland = dynamicEvent.external_id?.startsWith('mys_');
    const isPermanentAttraction = !dynamicEvent.start_date;
    
    // Determine date and time display
    let dateDisplay: string;
    let timeDisplay: string;
    
    if (isPermanentAttraction) {
      dateDisplay = "Jederzeit verfügbar";
      timeDisplay = "";  // Don't show time for permanent attractions
    } else {
      dateDisplay = formatDate(dynamicEvent.start_date) || "Datum folgt";
      timeDisplay = formatTime(dynamicEvent.start_date) || "";
    }
    
    event = {
      image: hasValidImage ? dynamicEvent.image_url! : weekendJazz,
      title: dynamicEvent.title,
      venue: dynamicEvent.venue_name || dynamicEvent.location || dynamicEvent.address_city || "Veranstaltungsort",
      location: dynamicEvent.address_city || (dynamicEvent.location !== dynamicEvent.title ? dynamicEvent.location : null) || "Schweiz",
      address: addressParts.length > 0 ? addressParts.join(", ") : "",
      date: dateDisplay,
      time: timeDisplay,
      distance: "",
      description: dynamicEvent.long_description || dynamicEvent.description || dynamicEvent.short_description || "Beschreibung folgt.",
      ticketLink: dynamicEvent.ticket_link,
      priceFrom: dynamicEvent.price_from,
      priceTo: dynamicEvent.price_to,
      priceLabel: dynamicEvent.price_label,
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO SECTION - 50/50 Split Layout */}
      <section className="min-h-[80vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left - Event Image */}
        <div className="relative h-[50vh] lg:h-[80vh] overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = weekendJazz;
            }}
          />
        </div>

        {/* Right - Content Panel */}
        <div className="bg-white flex flex-col justify-between px-6 py-10 lg:px-12 xl:px-16 lg:h-[80vh]">
          {/* Title */}
          <h1 className="font-serif text-neutral-900 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            {event.title}
          </h1>

          {/* Meta Info - All icons on one row */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-neutral-600">
            {event.date && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-neutral-400" />
                <span className="text-base">
                  {event.date}{event.time ? `, ${event.time}` : ''}
                </span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-neutral-400" />
                <span className="text-base">{event.venue}</span>
              </div>
            )}
            {event.address && (
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-neutral-400" />
                <span className="text-base">{event.address}</span>
              </div>
            )}
            {(event.priceLabel || event.priceFrom) && (
              <div className="flex items-center gap-2 text-neutral-900 font-medium">
                <span className="text-base">
                  {event.priceLabel 
                    ? event.priceLabel 
                    : event.priceTo && event.priceTo !== event.priceFrom
                      ? `CHF ${event.priceFrom} – ${event.priceTo}`
                      : `ab CHF ${event.priceFrom}`}
                </span>
              </div>
            )}
            {event.distance && (
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-neutral-900" />
                <span className="text-base font-medium text-neutral-900">{event.distance}</span>
              </div>
            )}
          </div>

          {/* Rating Buttons */}
          <div className="mb-6">
            <EventRatingButtons eventId={eventId} eventTitle={event.title} />
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
              className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="Zu Favoriten hinzufügen"
            >
              <Heart size={20} className={isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-neutral-400"} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: `Schau dir dieses Event an: ${event.title}`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link kopiert!");
                }
              }}
              className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="Teilen"
            >
              <Share2 size={20} className="text-neutral-400" />
            </button>
            <button
              onClick={() => {
                const startDate = dynamicEvent?.start_date ? new Date(dynamicEvent.start_date) : new Date();
                const endDate = dynamicEvent?.end_date ? new Date(dynamicEvent.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                
                const formatICSDate = (date: Date) => {
                  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                
                const icsContent = [
                  'BEGIN:VCALENDAR',
                  'VERSION:2.0',
                  'BEGIN:VEVENT',
                  `DTSTART:${formatICSDate(startDate)}`,
                  `DTEND:${formatICSDate(endDate)}`,
                  `SUMMARY:${event.title}`,
                  `DESCRIPTION:${event.description?.substring(0, 200) || ''}`,
                  `LOCATION:${event.venue}${event.address ? ', ' + event.address : ''}`,
                  'END:VEVENT',
                  'END:VCALENDAR'
                ].join('\r\n');
                
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
                link.click();
              }}
              className="p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="In Kalender exportieren"
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
                  <SimilarEventCard {...evt} />
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
