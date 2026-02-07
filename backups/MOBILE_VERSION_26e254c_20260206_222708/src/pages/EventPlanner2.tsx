import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { EventDetailModal } from "@/components/EventDetailModal";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { 
  Heart, 
  MapPin, 
  Star, 
  MessageCircle, 
  X, 
  Send,
  Loader2,
  Flame,
  Sparkles,
  Music,
  Palette,
  Mountain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trackEventClick } from "@/services/buzzTracking";

// Map teaser image
import mapTeaser from "@/assets/map-teaser.jpg";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
  category_sub_id?: string;
}

// Get distance info from coordinates
const getDistanceInfo = (lat: number, lng: number): { city: string; distance: string; direction: string } => {
  const centers = [
    { name: "Zürich", lat: 47.3769, lng: 8.5417 },
    { name: "Genf", lat: 46.2044, lng: 6.1432 },
    { name: "Basel", lat: 47.5596, lng: 7.5886 },
    { name: "Bern", lat: 46.948, lng: 7.4474 },
    { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
    { name: "Luzern", lat: 47.0502, lng: 8.3093 },
  ];

  let nearest = centers[0], minDist = Infinity;
  centers.forEach((c) => {
    const d = Math.sqrt(Math.pow((lat - c.lat) * 111, 2) + Math.pow((lng - c.lng) * 85, 2));
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  });

  if (minDist < 5) {
    return { city: nearest.name, distance: `In ${nearest.name}`, direction: "" };
  }

  const dLat = lat - nearest.lat;
  const dLng = lng - nearest.lng;
  let direction = "";
  if (dLat > 0.02) direction += "N";
  else if (dLat < -0.02) direction += "S";
  if (dLng > 0.02) direction += "O";
  else if (dLng < -0.02) direction += "W";

  return { 
    city: nearest.name, 
    distance: `${Math.round(minDist)} km`,
    direction: direction || ""
  };
};

// Tag/Pill configuration
const PILL_CONFIG: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  'elite': { label: 'MUST-SEE', icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  'trending': { label: 'TRENDING', icon: Flame, color: 'bg-red-100 text-red-800 border-red-300' },
  'neu': { label: 'NEU', icon: Sparkles, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  'konzert': { label: 'KONZERT', icon: Music, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  'kunst': { label: 'KUNST', icon: Palette, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  'natur': { label: 'NATUR', icon: Mountain, color: 'bg-green-100 text-green-800 border-green-300' },
};

// Golden Star Rating Component (single star with score)
const GoldenStarRating = ({ score, className }: { score: number; className?: string }) => {
  const normalizedScore = Math.min(5, Math.max(0, score / 20)).toFixed(1);
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star size={16} className="fill-amber-400 text-amber-400" />
      <span className="text-sm font-semibold text-amber-700">({normalizedScore})</span>
    </div>
  );
};

// Buzz Progress Bar
const BuzzBar = ({ score }: { score: number }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
      <span className="text-xs font-medium text-orange-600 whitespace-nowrap">BUZZ {Math.round(normalizedScore)}</span>
      <Flame size={12} className="text-orange-500" />
    </div>
  );
};

// Pill/Tag Component
const EventPill = ({ tag }: { tag: string }) => {
  const config = PILL_CONFIG[tag.toLowerCase()];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
      config.color
    )}>
      <Icon size={10} />
      {config.label}
    </span>
  );
};

// Event Card Component - Premium Design
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
  onClick,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
  onClick: () => void;
}) => {
  const imageUrl = event.image_url || getPlaceholderImage(index);
  const location = event.venue_name || event.address_city || event.location || "Schweiz";
  const description = event.short_description || event.description || "Entdecke dieses einzigartige Event in der Schweiz.";
  const buzzScore = event.buzz_score || event.relevance_score || 75;
  
  // Get distance info
  const distanceInfo = event.latitude && event.longitude 
    ? getDistanceInfo(event.latitude, event.longitude)
    : null;

  // Get pills from tags
  const eventTags = Array.isArray(event.tags) ? event.tags.slice(0, 2) : [];
  // Add category-based pill - ensure category_sub_id is a string before using includes
  const categoryStr = typeof event.category_sub_id === 'string' ? event.category_sub_id : '';
  if (categoryStr.includes('konzert') || categoryStr.includes('musik')) {
    eventTags.unshift('konzert');
  } else if (categoryStr.includes('kunst') || categoryStr.includes('museum')) {
    eventTags.unshift('kunst');
  }

  return (
    <article 
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-200/60 cursor-pointer hover:-translate-y-0.5"
    >
      <div className="flex gap-0">
        {/* Image Section - Wider */}
        <div className="relative w-48 h-44 flex-shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(event);
            }}
            className={cn(
              "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg",
              isFavorited
                ? "bg-red-500 text-white"
                : "bg-white/95 text-gray-500 hover:bg-white hover:text-red-500"
            )}
          >
            <Heart size={15} className={isFavorited ? "fill-current" : ""} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Title Row with Golden Star */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-serif text-lg font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors flex-1">
                {event.title}
              </h3>
              <GoldenStarRating score={buzzScore} className="flex-shrink-0" />
            </div>
            
            {/* Location with Distance */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
              <MapPin size={12} className="text-amber-600 flex-shrink-0" />
              <span className="truncate">{location}</span>
              {distanceInfo && distanceInfo.distance !== `In ${distanceInfo.city}` && (
                <span className="text-stone-400">
                  · {distanceInfo.distance} {distanceInfo.direction} von {distanceInfo.city}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-3">
              {description}
            </p>
          </div>

          {/* Bottom Row: Buzz Bar + Pills */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <BuzzBar score={buzzScore} />
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {eventTags.slice(0, 2).map((tag, i) => (
                <EventPill key={i} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

// Chatbot Widget Component
const ChatbotWidget = ({ onExpand }: { onExpand: () => void }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200/60 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Dein Event-Assistent</h3>
          </div>
        </div>
      </div>
      
      {/* Teaser Message */}
      <div className="p-4">
        <div className="bg-amber-50/80 rounded-xl p-3 mb-3">
          <p className="text-sm text-stone-700">
            Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨
          </p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            onClick={onExpand}
            className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
          >
            👤 Solo
          </button>
          <button 
            onClick={onExpand}
            className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
          >
            👨‍👩‍👧 Familie
          </button>
          <button 
            onClick={onExpand}
            className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
          >
            🎉 Freunde
          </button>
          <button 
            onClick={onExpand}
            className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
          >
            💕 Zu zweit
          </button>
        </div>
        
        {/* Input Teaser */}
        <button
          onClick={onExpand}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-400 hover:border-amber-400 transition-colors"
        >
          <span className="flex-1 text-left">Ich möchte diesen Samstag...</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Send size={14} className="text-white" />
          </div>
        </button>
      </div>
    </div>
  );
};

// Expanded Chatbot Modal
const ChatbotExpanded = ({ onClose }: { onClose: () => void }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "bot" | "user"; content: string }>>([
    { role: "bot", content: "Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨" }
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-stone-200/60 overflow-hidden flex flex-col h-[450px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Event-Assistent</h3>
            <p className="text-xs text-white/80">Powered by AI</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-stone-50 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
              msg.role === "user" 
                ? "bg-amber-500 text-white rounded-br-md" 
                : "bg-white text-stone-800 shadow-sm border border-stone-100 rounded-bl-md"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Quick Actions in Chat */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors">
            👤 Solo
          </button>
          <button className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors">
            👨‍👩‍👧 Familie
          </button>
          <button className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors">
            🎉 Freunde
          </button>
          <button className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-400 hover:bg-amber-50 transition-colors">
            💕 Zu zweit
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-stone-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ich möchte diesen Samstag..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-stone-50"
          />
          <button className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const EventPlanner2 = () => {
  useScrollToTop();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatbotExpanded, setChatbotExpanded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    category: null as string | null,
    categoryId: null as number | null,
    mood: null as string | null,
    city: "",
    radius: 25,
    time: null as string | null,
    date: undefined as Date | undefined,
    search: "",
  });

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await externalSupabase
          .from("events")
          .select("*")
          .eq("hide_from_homepage", false)
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${futureDate}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(20);

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        toast.error("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleToggleFavorite = useCallback(async (event: Event) => {
    const slug = event.external_id || event.id;
    const favoriteData = {
      id: event.id,
      slug: slug,
      title: event.title,
      image: event.image_url || getPlaceholderImage(0),
      location: event.venue_name || event.address_city || event.location || "Schweiz",
      venue: event.venue_name || "",
      date: event.start_date || "",
    };

    toggleFavorite(favoriteData);
  }, [toggleFavorite]);

  const handleEventClick = useCallback((eventId: string) => {
    trackEventClick(eventId);
    setSelectedEventId(eventId);
    setModalOpen(true);
  }, []);

  // Map event click handler (unused for now, but kept for future integration)
  const handleMapEventClick = useCallback((eventId: string) => {
    trackEventClick(eventId);
    setSelectedEventId(eventId);
    setModalOpen(true);
  }, []);

  // Filter handlers
  const handleCategoryChange = (categoryId: number | null, categorySlug: string | null) => {
    setFilters(prev => ({ ...prev, categoryId, category: categorySlug }));
  };

  const handleMoodChange = (mood: string | null) => {
    setFilters(prev => ({ ...prev, mood }));
  };

  const handleCityChange = (city: string) => {
    setFilters(prev => ({ ...prev, city }));
  };

  const handleRadiusChange = (radius: number) => {
    setFilters(prev => ({ ...prev, radius }));
  };

  const handleTimeChange = (time: string | null) => {
    setFilters(prev => ({ ...prev, time }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, date }));
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  // Get all event IDs for modal navigation
  const eventIds = events.map(e => e.id);

  return (
    <div className="min-h-screen bg-[hsl(var(--listings-bg))]">
      <Navbar />
      
      {/* Full-width Filter Bar */}
      <div className="sticky top-16 z-40 bg-[hsl(var(--listings-bg))] border-b border-stone-200/60">
        <div className="container mx-auto px-4 py-3 max-w-[1400px]">
          <ListingsFilterBar
            initialCategory={filters.category}
            initialMood={filters.mood}
            initialCity={filters.city}
            initialRadius={filters.radius}
            initialTime={filters.time}
            initialDate={filters.date}
            initialSearch={filters.search}
            onCategoryChange={handleCategoryChange}
            onMoodChange={handleMoodChange}
            onCityChange={handleCityChange}
            onRadiusChange={handleRadiusChange}
            onTimeChange={handleTimeChange}
            onDateChange={handleDateChange}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Split Layout - More space between columns, less edge padding */}
        <div className="flex gap-8 items-start">
          {/* Left: Event List - Fixed width */}
          <div 
            className="space-y-4 flex-shrink-0"
            style={{ width: '580px' }}
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-44 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : (
              events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  isFavorited={isFavorite(event.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={() => handleEventClick(event.id)}
                />
              ))
            )}
          </div>

          {/* Right: Map + Chatbot */}
          <div className="flex-1 space-y-4 sticky top-36 min-w-[320px]">
            {/* Map Teaser */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-stone-200/60 h-[420px]">
              <img
                src={mapTeaser}
                alt="Karte der Schweiz"
                className="w-full h-full object-cover"
              />
              {/* Event count badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-stone-800/80 text-white rounded-lg text-sm font-medium backdrop-blur-sm">
                {events.length} Events
              </div>
              {/* Expand hint */}
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 text-stone-700 rounded-lg text-xs font-medium shadow-md">
                🗺️ Karte vergrößern
              </div>
            </div>

            {/* Chatbot Widget */}
            {chatbotExpanded ? (
              <ChatbotExpanded onClose={() => setChatbotExpanded(false)} />
            ) : (
              <ChatbotWidget onExpand={() => setChatbotExpanded(true)} />
            )}
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      <EventDetailModal
        eventId={selectedEventId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventIds={eventIds}
        onNavigatePrev={() => {
          const currentIndex = eventIds.indexOf(selectedEventId || "");
          if (currentIndex > 0) {
            setSelectedEventId(eventIds[currentIndex - 1]);
          }
        }}
        onNavigateNext={() => {
          const currentIndex = eventIds.indexOf(selectedEventId || "");
          if (currentIndex < eventIds.length - 1) {
            setSelectedEventId(eventIds[currentIndex + 1]);
          }
        }}
      />
    </div>
  );
};

export default EventPlanner2;
