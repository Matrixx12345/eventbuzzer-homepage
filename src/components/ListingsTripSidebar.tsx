import { useState, lazy, Suspense } from "react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Sparkles, Car, Train, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the EventsMap for Mapbox
const EventsMap = lazy(() => import("@/components/EventsMap"));

interface ListingsTripSidebarProps {
  onEventClick?: (eventId: string) => void;
}

// Transport pills data for snake connections
const transportOptions = [
  { label: "IC 8", duration: "5h 12m" },
  { label: "S3", duration: "24m" },
  { label: "IR 50", duration: "1h 05m" },
  { label: "PE", duration: "1h 50m" },
  { label: "IC 3", duration: "45m" },
];

const ListingsTripSidebar = ({ onEventClick }: ListingsTripSidebarProps) => {
  const { favorites } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");
  const [, setMapEvents] = useState<any[]>([]); // Dummy setter to trigger map loading

  // Mock suggested events for expanded view
  const suggestedEvents = [
    { id: "1", title: "Kunsthaus Zürich", location: "Zürich", buzzScore: 87, image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&q=80" },
    { id: "2", title: "Rheinfall Schaffhausen", location: "Schaffhausen", buzzScore: 92, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
    { id: "3", title: "Berner Altstadt", location: "Bern", buzzScore: 88, image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=200&q=80" },
    { id: "4", title: "Luzerner Kapellbrücke", location: "Luzern", buzzScore: 85, image: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=200&q=80" },
  ];

  // Convert favorites to map events format
  const mapEvents = favorites.map((fav, idx) => ({
    id: fav.id,
    title: fav.title,
    latitude: 46.8 + (idx * 0.3),
    longitude: 8.2 + (idx * 0.4),
    image_url: fav.image,
  }));

  if (isExpanded) {
    // Get up to 6 favorites for the snake grid
    const gridFavorites = favorites.slice(0, 6);
    
    return (
      <div className="fixed inset-0 z-50 bg-[#FDFBF7] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FDFBF7] border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Trip Composer</p>
            <h2 className="text-xl font-serif font-bold text-stone-900">Dein Trip-Entwurf</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X size={20} className="text-stone-600" />
          </button>
        </div>

        <div className="flex min-h-[calc(100vh-80px)]">
          {/* Left Sidebar: Suggestions */}
          <div className="w-72 border-r border-stone-200 p-4 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="font-semibold text-stone-800">Vorschläge für dich</h3>
            </div>
            <div className="space-y-3">
              {suggestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer group border border-stone-100"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 line-clamp-2 leading-tight">{event.title}</p>
                    <p className="text-xs text-stone-500">{event.location}</p>
                    <p className="text-xs text-stone-400">Buzz {event.buzzScore}</p>
                  </div>
                  <button className="p-1.5 rounded-full bg-stone-100 hover:bg-amber-100 transition-colors">
                    <Plus size={14} className="text-stone-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content: Map + Timeline */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            {/* Real Mapbox Map */}
            <div className="rounded-2xl h-64 overflow-hidden border border-stone-200">
              <Suspense fallback={
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                </div>
              }>
                <EventsMap 
                  onEventClick={onEventClick}
                  onEventsChange={setMapEvents}
                  isVisible={true}
                />
              </Suspense>
            </div>

            {/* Transport Toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                )}
              >
                <Car size={16} />
                Auto
              </button>
              <button
                onClick={() => setTransportMode("bahn")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                  transportMode === "bahn"
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                )}
              >
                <Train size={16} />
                Bahn
              </button>
            </div>

            {/* Trip Timeline - Snake Grid */}
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                Trip-Zeitstrahl
              </h3>
              
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Heart size={32} className="mx-auto mb-3 text-red-300" strokeWidth={1.5} />
                  <p>Füge Favoriten hinzu, um deinen Trip zu planen</p>
                </div>
              ) : (
                <SnakeGrid 
                  favorites={gridFavorites} 
                  transportMode={transportMode}
                  onEventClick={onEventClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed State
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Real Mapbox Map in Collapsed State */}
      <div className="h-44 relative overflow-hidden">
        <Suspense fallback={
          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
            <img 
              src="/swiss-outline.svg" 
              className="w-full h-full object-contain opacity-20 p-4" 
              alt="Switzerland" 
            />
          </div>
        }>
          <EventsMap 
            onEventClick={onEventClick}
            onEventsChange={setMapEvents}
            isVisible={true}
          />
        </Suspense>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Trip Composer</p>
        <h3 className="font-serif font-bold text-stone-900 text-lg">Dein Trip-Entwurf</h3>
      </div>

      {/* Favorites List or Empty State */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-6">
            <Heart size={48} className="text-red-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500 leading-relaxed">
              Wähle Favoriten (❤️) – wir erstellen deinen perfekten Ablauf.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.slice(0, 4).map((fav) => (
              <div
                key={fav.id}
                onClick={() => onEventClick?.(fav.id)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <img
                  src={fav.image}
                  alt={fav.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{fav.title}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {fav.location || "Schweiz"}
                  </p>
                </div>
                <Heart size={14} className="text-red-500 flex-shrink-0" fill="currentColor" />
              </div>
            ))}
            {favorites.length > 4 && (
              <p className="text-xs text-stone-400 text-center pt-2">
                +{favorites.length - 4} weitere
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plan Button */}
      <div className="p-4 pt-0">
        <button
          disabled={favorites.length === 0}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
            favorites.length > 0
              ? "bg-stone-800 text-white hover:bg-stone-900"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          )}
        >
          <Sparkles size={16} />
          Ablauf jetzt planen ✨
        </button>
      </div>
    </div>
  );
};

// Snake Grid Component - 3x2 Grid with Snake Pattern Connections
interface SnakeGridProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
}

const SnakeGrid = ({ favorites, transportMode, onEventClick }: SnakeGridProps) => {
  // Fill up to 6 slots
  const slots = [...favorites];
  while (slots.length < 6) {
    slots.push(null as any);
  }

  // Row 1: indices 0, 1, 2 (left to right)
  // Row 2: indices 5, 4, 3 (right to left - snake pattern)
  const row1 = [slots[0], slots[1], slots[2]];
  const row2 = [slots[5], slots[4], slots[3]]; // Reversed for snake

  const getTransportPill = (idx: number) => {
    const opt = transportOptions[idx % transportOptions.length];
    const icon = transportMode === "bahn" ? "🚆" : "🚗";
    return `${icon} ${opt.label} | ${opt.duration}`;
  };

  return (
    <div className="relative">
      {/* Row 1 - kleinere Karten */}
      <div className="grid grid-cols-3 gap-6 relative">
        {row1.map((fav, idx) => (
          <div key={idx} className="relative">
            <SnakeCard event={fav} onClick={() => fav && onEventClick?.(fav.id)} />
            
            {/* Horizontal connection line to the right (except last card) */}
            {idx < 2 && fav && row1[idx + 1] && (
              <>
                <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-stone-300" />
                <div className="absolute top-1/2 right-[-2rem] -translate-y-1/2 z-10">
                  <TransportPill text={getTransportPill(idx)} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Vertical connection on the RIGHT side (from card 3 to card 4) */}
      {row1[2] && row2[2] && (
        <div className="relative h-8">
          {/* Vertical line on the right */}
          <div className="absolute right-[calc(16.67%-0.5rem)] top-0 w-0.5 h-full bg-stone-300" />
          {/* Transport pill on vertical line */}
          <div className="absolute right-[calc(16.67%-2.5rem)] top-1/2 -translate-y-1/2 z-10">
            <TransportPill text={getTransportPill(2)} />
          </div>
        </div>
      )}

      {/* Row 2 (reversed order visually: shows 6, 5, 4 from left to right) */}
      <div className="grid grid-cols-3 gap-6 relative">
        {row2.map((fav, idx) => (
          <div key={idx} className="relative">
            <SnakeCard event={fav} onClick={() => fav && onEventClick?.(fav.id)} />
            
            {/* Horizontal connection line (reversed direction: line to the LEFT, except first visual card) */}
            {idx > 0 && fav && row2[idx - 1] && (
              <>
                <div className="absolute top-1/2 -left-2 w-4 h-0.5 bg-stone-300" />
                <div className="absolute top-1/2 left-[-2rem] -translate-y-1/2 z-10">
                  <TransportPill text={getTransportPill(3 + idx)} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Transport Pill Component
const TransportPill = ({ text }: { text: string }) => (
  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-medium text-stone-600 shadow-sm border border-stone-100 whitespace-nowrap">
    {text}
  </div>
);

// Snake Card Component - Square card with overlay
interface SnakeCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
}

const SnakeCard = ({ event, onClick }: SnakeCardProps) => {
  if (!event) {
    return (
      <div className="w-32 h-32 rounded-xl bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center mx-auto">
        <Plus size={20} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="w-32 h-32 rounded-xl overflow-hidden relative cursor-pointer group flex-shrink-0 mx-auto"
    >
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
      />
      
      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Content - lesbar */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <h4 className="text-white font-semibold text-xs leading-tight line-clamp-2">{event.title}</h4>
        <p className="text-white/70 text-[10px] mt-1 flex items-center gap-1">
          <MapPin size={10} />
          {event.location || "Schweiz"}
        </p>
      </div>
      
      {/* Heart outline top right */}
      <div className="absolute top-1.5 right-1.5">
        <Heart size={14} className="text-white" strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default ListingsTripSidebar;
