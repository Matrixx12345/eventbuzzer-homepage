import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Star, Maximize2, Minimize2, MessageCircle, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
}

// Star Rating Component - aligned left
const StarRating = ({ score, className }: { score: number; className?: string }) => {
  const starCount = Math.min(5, Math.max(0, Math.round((score / 100) * 5)));
  
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={cn(
            "transition-colors",
            star <= starCount
              ? "fill-amber-500 text-amber-500"
              : "fill-transparent text-amber-300"
          )}
        />
      ))}
    </div>
  );
};

// Event Card Component
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
}) => {
  const imageUrl = event.image_url || getPlaceholderImage(index);
  const location = event.venue_name || event.address_city || event.location || "Schweiz";
  const description = event.short_description || event.description || "Entdecke dieses einzigartige Event in der Schweiz.";
  const buzzScore = event.buzz_score || event.relevance_score || 75;

  return (
    <article className="group bg-[hsl(var(--listings-card))] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[hsl(var(--trip-border))]">
      <div className="flex gap-0">
        {/* Image Section */}
        <div className="relative w-44 h-36 flex-shrink-0 overflow-hidden">
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
              "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md",
              isFavorited
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
            )}
          >
            <Heart size={14} className={isFavorited ? "fill-current" : ""} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Title */}
            <h3 className="font-serif text-base font-semibold text-[hsl(var(--listings-text))] mb-1 line-clamp-1 group-hover:text-amber-700 transition-colors">
              {event.title}
            </h3>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--listings-text-muted))] mb-2">
              <MapPin size={12} className="text-amber-600 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-[hsl(var(--listings-text-muted))] line-clamp-2 leading-relaxed mb-2">
              {description}
            </p>
          </div>

          {/* Star Rating - Left aligned */}
          <div className="flex items-center gap-1.5">
            <StarRating score={buzzScore} />
            <span className="text-xs text-amber-600 font-medium">({Math.round(buzzScore / 20)}/5)</span>
          </div>
        </div>
      </div>
    </article>
  );
};

// Chatbot Widget Component (collapsed state)
const ChatbotWidget = ({ onExpand }: { onExpand: () => void }) => {
  return (
    <button
      onClick={onExpand}
      className="w-full bg-white rounded-xl shadow-md border border-[hsl(var(--trip-border))] p-3 flex items-center gap-3 hover:shadow-lg transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
        <MessageCircle size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-[hsl(var(--listings-text))]">Event-Assistent</p>
        <p className="text-xs text-[hsl(var(--listings-text-muted))]">Frag mich nach Empfehlungen...</p>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
    </button>
  );
};

// Expanded Chatbot Modal
const ChatbotExpanded = ({ onClose }: { onClose: () => void }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hi! 👋 Was suchst du heute? Ich helfe dir, das perfekte Event zu finden!" }
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[hsl(var(--trip-border))] overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Event-Assistent</h3>
            <p className="text-xs text-white/80">Powered by AI</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] px-3 py-2 rounded-xl text-sm",
              msg.role === "user" 
                ? "bg-amber-500 text-white rounded-br-sm" 
                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Schreib eine Nachricht..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          <button className="w-10 h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const EventList1 = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [chatbotExpanded, setChatbotExpanded] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

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

  const isFavorited = (eventId: string) => favorites.some(f => f.id === eventId);

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

  return (
    <div className="min-h-screen bg-[hsl(var(--listings-bg))]">
      <Navbar />
      
      {/* Full-width Filter Bar */}
      <div className="sticky top-16 z-40 bg-[hsl(var(--listings-bg))] border-b border-[hsl(var(--trip-border))]">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
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
      
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-[hsl(var(--listings-text))] mb-1">
            Eventliste 1
          </h1>
          <p className="text-sm text-[hsl(var(--listings-text-muted))]">
            Entdecke die besten Events in der Schweiz
          </p>
        </div>

        {/* Split Layout */}
        <div className="flex gap-6 items-start">
          {/* Left: Fixed-width Event List */}
          <div 
            className="space-y-3 flex-shrink-0 transition-all duration-300"
            style={{ width: mapExpanded ? '550px' : '100%', maxWidth: mapExpanded ? '550px' : '600px' }}
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
                ))}
              </div>
            ) : (
              events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  isFavorited={isFavorited(event.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>

          {/* Right: Expandable Map + Chatbot */}
          <div 
            className={cn(
              "flex-shrink-0 space-y-4 transition-all duration-300 sticky top-36",
              mapExpanded ? "flex-1" : "w-80"
            )}
          >
            {/* Map Container */}
            <div 
              className={cn(
                "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-[hsl(var(--trip-border))] transition-all duration-300",
                mapExpanded ? "h-[500px]" : "h-52"
              )}
            >
              <img
                src={mapTeaser}
                alt="Karte der Schweiz"
                className="w-full h-full object-cover"
              />
              
              {/* Map pins overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
                <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
                <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
              </div>

              {/* Toggle Button with hover tooltip */}
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="absolute bottom-3 right-3 w-10 h-10 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform group"
              >
                {mapExpanded ? (
                  <Minimize2 size={18} className="text-gray-700" />
                ) : (
                  <Maximize2 size={18} className="text-gray-700" />
                )}
                {/* Tooltip */}
                <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {mapExpanded ? "Karte verkleinern" : "Karte vergrößern"}
                </span>
              </button>

              {/* Label */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/95 rounded-full text-xs font-medium text-[hsl(var(--listings-text-muted))] shadow-sm">
                Switzerland
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
    </div>
  );
};

export default EventList1;
