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
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");
  const [, setMapEvents] = useState<any[]>([]);
  
  // Get favorite IDs for map highlighting
  const favoriteIds = favorites.map(f => f.id);

  // Mock suggested events for expanded view
  const suggestedEvents = [
    { id: "1", title: "Kunsthaus Zürich", location: "Zürich", buzzScore: 87, image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&q=80" },
    { id: "2", title: "Rheinfall Schaffhausen", location: "Schaffhausen", buzzScore: 92, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80" },
    { id: "3", title: "Berner Altstadt", location: "Bern", buzzScore: 88, image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=200&q=80" },
    { id: "4", title: "Luzerner Kapellbrücke", location: "Luzern", buzzScore: 85, image: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=200&q=80" },
  ];

  if (isExpanded) {
    const gridFavorites = favorites.slice(0, 6);
    
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FDFBF7] overflow-auto">
        {/* X Button top right */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-[10000] p-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-xl transition-all hover:scale-105"
        >
          <X size={24} className="text-stone-700" />
        </button>

        <div className="flex min-h-screen">
          {/* Left Sidebar: Vorschläge - Clean white cards on sand background */}
          <div className="w-80 bg-[#F5F3EF] p-5 flex-shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="font-medium text-stone-600 text-sm">Vorschläge für dich</h3>
            </div>
            <div className="space-y-3">
              {suggestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-3 flex gap-3 cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 border border-stone-100"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-stone-800 font-medium text-sm leading-tight truncate">{event.title}</p>
                    <p className="text-stone-400 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={10} />
                      {event.location}
                    </p>
                  </div>
                  <button 
                    className="self-center p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus size={14} className="text-stone-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content: Map + Trip Grid */}
          <div className="flex-1 flex flex-col overflow-y-auto pt-16 pr-16 pl-8">
            {/* Map - with padding/border around it */}
            <div className="h-56 rounded-2xl overflow-hidden shadow-lg border border-stone-200">
              <Suspense fallback={
                <div className="w-full h-full bg-[#F5F3EF] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
              }>
                <EventsMap 
                  onEventClick={onEventClick}
                  onEventsChange={setMapEvents}
                  isVisible={true}
                  selectedEventIds={favoriteIds}
                />
              </Suspense>
            </div>

            {/* Transport Toggle */}
            <div className="flex items-center gap-3 py-5">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white shadow-md"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Car size={16} />
                Auto
              </button>
              <button
                onClick={() => setTransportMode("bahn")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  transportMode === "bahn"
                    ? "bg-stone-800 text-white shadow-md"
                    : "bg-white text-stone-500 hover:text-stone-700 shadow-sm border border-stone-200"
                )}
              >
                <Train size={16} />
                Bahn
              </button>
            </div>

            {/* Trip Grid - Cards flush with map edges */}
            <div className="flex-1">
              {favorites.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <Heart size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
                  <p className="text-lg">Füge Favoriten hinzu, um deinen Trip zu planen</p>
                </div>
              ) : (
                <TripGrid 
                  favorites={gridFavorites} 
                  transportMode={transportMode}
                  onEventClick={onEventClick}
                  onRemoveFavorite={(id) => {
                    const fav = favorites.find(f => f.id === id);
                    if (fav) toggleFavorite(fav);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed State - KEIN internes Scrolling, Content fließt normal
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200/80 overflow-visible">
      {/* Map - QUADRATISCH bündig oben */}
      <div className="aspect-square w-full relative overflow-hidden">
        <Suspense fallback={
          <div className="w-full h-full bg-[hsl(var(--listings-bg))] flex items-center justify-center">
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
            selectedEventIds={favoriteIds}
          />
        </Suspense>
      </div>

      {/* Favorites List or Empty State - KEIN overflow-y-auto, normaler Flow */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart size={48} className="text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500 leading-relaxed">
              Wähle Favoriten (❤️) – wir erstellen deinen perfekten Ablauf.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer group transition-colors"
                onClick={() => onEventClick?.(fav.id)}
              >
                <img
                  src={fav.image}
                  alt={fav.title}
                  className="w-11 h-11 rounded-lg object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{fav.title}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {fav.location || "Schweiz"}
                  </p>
                </div>
                {/* Abwählbares Herz */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(fav);
                  }}
                  className="flex-shrink-0 p-1.5 hover:scale-110 transition-transform"
                  aria-label="Remove from favorites"
                >
                  <Heart 
                    size={16} 
                    className="text-red-500 fill-red-500 hover:fill-red-400 hover:text-red-400 transition-colors" 
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Button */}
      <div className="p-4 pt-0">
        <button
          disabled={favorites.length === 0}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300",
            favorites.length > 0
              ? "bg-stone-800 text-white hover:bg-stone-900 shadow-md hover:shadow-lg"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          )}
        >
          <Sparkles size={16} />
          Deinen Trip planen ✨
        </button>
      </div>
    </div>
  );
};

// Trip Grid Component - Clean 3-column layout like reference image
interface TripGridProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
  onRemoveFavorite?: (id: string) => void;
}

const TripGrid = ({ favorites, onEventClick, onRemoveFavorite }: TripGridProps) => {
  // Fill to 6 slots
  const slots = [...favorites];
  while (slots.length < 6) {
    slots.push(null as any);
  }

  // Mock transport data for connections
  const transportData = [
    { minutes: 45, km: 52 },
    { minutes: 32, km: 38 },
    { minutes: 63, km: 72 },
    { minutes: 28, km: 31 },
    { minutes: 55, km: 64 },
  ];

  // Row 1: slots 0, 1, 2
  // Row 2: slots 3, 4, 5 (directly below)
  const row1 = [slots[0], slots[1], slots[2]];
  const row2 = [slots[3], slots[4], slots[5]];

  return (
    <div className="space-y-5">
      {/* Row 1 - 3 cards with full-width connections between */}
      <div className="flex items-center">
        {row1.map((fav, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <TripCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            {/* Connection line - fills remaining space between cards */}
            {idx < 2 && (
              <div className="flex-1 flex items-center justify-center relative mx-1">
                {/* The line */}
                <div className="w-full h-[2px] bg-stone-300" />
                {/* Centered pills with frosted glass */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/50 shadow-sm mb-1">
                    <span className="text-[11px] text-stone-600 font-medium">{transportData[idx].minutes} min</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/50 shadow-sm">
                    <span className="text-[11px] text-stone-500">{transportData[idx].km} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 2 - directly below */}
      <div className="flex items-center">
        {row2.map((fav, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <TripCard 
              event={fav} 
              onClick={() => fav && onEventClick?.(fav.id)} 
              onRemove={() => fav && onRemoveFavorite?.(fav.id)}
            />
            {/* Connection line */}
            {idx < 2 && (
              <div className="flex-1 flex items-center justify-center relative mx-1">
                <div className="w-full h-[2px] bg-stone-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/50 shadow-sm mb-1">
                    <span className="text-[11px] text-stone-600 font-medium">{transportData[idx + 2].minutes} min</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/50 shadow-sm">
                    <span className="text-[11px] text-stone-500">{transportData[idx + 2].km} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Trip Card Component - 30% bigger
interface TripCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
}

const TripCard = ({ event, onClick, onRemove }: TripCardProps) => {
  if (!event) {
    return (
      <div className="w-full max-w-[240px] aspect-[4/3] rounded-xl bg-stone-100/50 border-2 border-dashed border-stone-200 flex items-center justify-center flex-shrink-0">
        <Plus size={28} className="text-stone-300" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="w-full max-w-[240px] aspect-[4/3] rounded-xl overflow-hidden relative cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
    >
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-white font-medium text-base leading-tight line-clamp-1 drop-shadow-lg">{event.title}</h4>
        <p className="text-white/80 text-sm flex items-center gap-1 mt-1 drop-shadow-md">
          <MapPin size={12} />
          {event.location || "Schweiz"}
        </p>
      </div>
      
      {/* Heart button top right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all hover:scale-110"
      >
        <Heart size={14} className="text-red-500 fill-red-500 hover:fill-red-400 transition-colors" />
      </button>
    </div>
  );
};

export default ListingsTripSidebar;
