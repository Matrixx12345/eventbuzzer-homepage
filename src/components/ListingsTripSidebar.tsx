import { useState, lazy, Suspense, useEffect, useCallback } from "react";
import { useFavorites, FavoriteEvent } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Sparkles, Car, Train, X, Plus, Loader2, Map, Scale, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import StaticMapTeaser from "./StaticMapTeaser";
import TripPreviewAvatars from "./TripPreviewAvatars";

// Lazy load the EventsMap for Mapbox
const EventsMap = lazy(() => import("@/components/EventsMap"));

interface ListingsTripSidebarProps {
  onEventClick?: (eventId: string) => void;
}

interface FavoriteWithCoords {
  id: string;
  latitude?: number;
  longitude?: number;
  title?: string;
  image?: string;
}

interface SuggestedEvent {
  id: string;
  title: string;
  location: string;
  image: string;
  buzzScore?: number;
  distance?: string;
}

type FocusMode = "map" | "split" | "plan";

const ListingsTripSidebar = ({ onEventClick }: ListingsTripSidebarProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");
  const [focusMode, setFocusMode] = useState<FocusMode>("split");
  const [mapEvents, setMapEvents] = useState<any[]>([]);
  const [favoriteEventsWithCoords, setFavoriteEventsWithCoords] = useState<FavoriteWithCoords[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  
  // Get favorite IDs for map highlighting
  const favoriteIds = favorites.map(f => f.id);

  // Fetch coordinates for favorites from the backend
  useEffect(() => {
    const fetchFavoriteCoords = async () => {
      if (favorites.length === 0) {
        setFavoriteEventsWithCoords([]);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-external-events', {
          body: {
            limit: 100,
            offset: 0,
            filters: {
              ids: favoriteIds
            }
          }
        });

        if (error) {
          console.error('Error fetching favorite coords:', error);
          return;
        }

        if (data?.events && Array.isArray(data.events)) {
          const coordsMap: Record<string, FavoriteWithCoords> = {};
          data.events.forEach((e: any) => {
            const id = e.external_id || String(e.id);
            if (e.latitude && e.longitude) {
              coordsMap[id] = {
                id,
                latitude: e.latitude,
                longitude: e.longitude,
                title: e.title,
                image: e.image_url
              };
            }
          });

          // Map favorites to include coordinates
          const withCoords = favorites.map(f => ({
            id: f.id,
            latitude: coordsMap[f.id]?.latitude,
            longitude: coordsMap[f.id]?.longitude,
            title: f.title,
            image: f.image
          })).filter(f => f.latitude && f.longitude);

          setFavoriteEventsWithCoords(withCoords);
        }
      } catch (err) {
        console.error('Failed to fetch favorite coords:', err);
      }
    };

    fetchFavoriteCoords();
  }, [favorites, favoriteIds]);

  // Update suggestions based on map events
  const handleEventsChange = useCallback((events: any[]) => {
    setMapEvents(events);
    // Transform map events to suggestions (16 for 2x8 grid)
    const suggestions = events.slice(0, 16).map((e: any) => ({
      id: e.id || e.external_id,
      title: e.title,
      location: e.address_city || e.venue_name || "Schweiz",
      image: e.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80",
      buzzScore: e.buzz_score,
      distance: "~1.2 km"
    }));
    setSuggestedEvents(suggestions);
  }, []);

  // Handle marker click - highlight in grid/plan
  const handleMarkerClick = useCallback((eventId: string) => {
    setHighlightedEventId(eventId);
    onEventClick?.(eventId);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedEventId(null), 3000);
  }, [onEventClick]);

  // Grid classes based on focus mode
  const getGridClasses = () => {
    switch (focusMode) {
      case "map":
        return "grid-cols-[80%_20%]";
      case "plan":
        return "grid-cols-[20%_80%]";
      default:
        return "grid-cols-2";
    }
  };

  if (isExpanded) {
    const gridFavorites = favorites.slice(0, 6);
    
    return (
      <div 
        className="fixed inset-0 z-[9999] overflow-auto"
        style={{ 
          backgroundColor: '#FDFBF7'
        }}
      >
        {/* X Button top right */}
        <button
          onClick={() => setIsExpanded(false)}
          className="fixed top-6 right-6 z-[10000] p-3 rounded-full shadow-xl transition-all hover:scale-105"
          style={{
            backgroundColor: 'rgba(253, 251, 247, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(212, 200, 180, 0.3)'
          }}
        >
          <X size={24} style={{ color: '#333333' }} />
        </button>

        <div className="flex flex-col min-h-screen p-6">
          {/* Focus Toggle Bar */}
          <div className="flex justify-center mb-6">
            <div 
              className="inline-flex items-center gap-1 p-1 rounded-xl"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(212, 200, 180, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
              }}
            >
              <button
                onClick={() => setFocusMode("map")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                )}
                style={{
                  backgroundColor: focusMode === "map" ? '#FDFBF7' : 'transparent',
                  color: focusMode === "map" ? '#1a1a1a' : '#666666',
                  border: focusMode === "map" ? '2px solid #d4d0c8' : '2px solid transparent'
                }}
              >
                <Map size={16} />
                Karte Fokus
              </button>
              <button
                onClick={() => setFocusMode("split")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                )}
                style={{
                  backgroundColor: focusMode === "split" ? '#FDFBF7' : 'transparent',
                  color: focusMode === "split" ? '#1a1a1a' : '#666666',
                  border: focusMode === "split" ? '2px solid #d4d0c8' : '2px solid transparent'
                }}
              >
                <Scale size={16} />
                Split View
              </button>
              <button
                onClick={() => setFocusMode("plan")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                )}
                style={{
                  backgroundColor: focusMode === "plan" ? '#FDFBF7' : 'transparent',
                  color: focusMode === "plan" ? '#1a1a1a' : '#666666',
                  border: focusMode === "plan" ? '2px solid #d4d0c8' : '2px solid transparent'
                }}
              >
                <GitBranch size={16} />
                Plan Fokus
              </button>
            </div>
          </div>

          {/* TOP: 2x8 Suggestions Grid - Only in split mode */}
          {focusMode === "split" && (
            <div className="mb-6">
              <div className="grid grid-cols-8 gap-3">
                {/* Row 1 */}
                {suggestedEvents.slice(0, 8).map((event) => (
                  <SuggestionCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => handleMarkerClick(event.id)}
                    isHighlighted={highlightedEventId === event.id}
                  />
                ))}
                {Array.from({ length: Math.max(0, 8 - suggestedEvents.slice(0, 8).length) }).map((_, i) => (
                  <EmptySuggestionCard key={`empty-1-${i}`} />
                ))}
                {/* Row 2 */}
                {suggestedEvents.slice(8, 16).map((event) => (
                  <SuggestionCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => handleMarkerClick(event.id)}
                    isHighlighted={highlightedEventId === event.id}
                  />
                ))}
                {Array.from({ length: Math.max(0, 8 - suggestedEvents.slice(8, 16).length) }).map((_, i) => (
                  <EmptySuggestionCard key={`empty-2-${i}`} />
                ))}
              </div>
            </div>
          )}

          {/* Main Content: Map + Plan with dynamic grid */}
          <div className={cn(
            "grid gap-6 flex-1 transition-all duration-300 ease-in-out",
            getGridClasses()
          )}>
            {/* LEFT: Map */}
            <div className="min-h-[500px]">
              <div 
                className="rounded-3xl overflow-hidden h-full relative"
                style={{
                  backgroundColor: 'rgba(253, 251, 247, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(212, 200, 180, 0.35)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                }}
              >
                {focusMode === "plan" && (
                  <div 
                    className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(253, 251, 247, 0.9)',
                      backdropFilter: 'blur(10px)',
                      color: '#666666'
                    }}
                  >
                    Übersicht
                  </div>
                )}
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F3EF' }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#999999' }} />
                  </div>
                }>
                  <EventsMap 
                    onEventClick={handleMarkerClick}
                    onEventsChange={handleEventsChange}
                    isVisible={true}
                    selectedEventIds={favoriteIds}
                    favoriteEvents={favoriteEventsWithCoords}
                  />
                </Suspense>
              </div>
            </div>

            {/* RIGHT: Dein Tagesplan */}
            <div className="flex flex-col">
              {/* Header - Only in split and plan mode */}
              {focusMode !== "map" && (
                <div className="flex items-center justify-between mb-6">
                  <h2 
                    className="font-serif font-bold" 
                    style={{ 
                      color: '#333333',
                      fontSize: focusMode === "plan" ? '2.5rem' : '1.75rem'
                    }}
                  >
                    Dein Tagesplan
                  </h2>
                  
                  {/* Auto/Bahn Toggle */}
                  <div 
                    className="flex items-center gap-1 rounded-full p-1.5"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(212, 200, 180, 0.4)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                    }}
                  >
                    <button
                      onClick={() => setTransportMode("auto")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                      )}
                      style={{
                        backgroundColor: transportMode === "auto" ? '#4a5568' : 'transparent',
                        color: transportMode === "auto" ? '#fff' : '#666666'
                      }}
                    >
                      <Car size={16} />
                      Auto
                    </button>
                    <button
                      onClick={() => setTransportMode("bahn")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                      )}
                      style={{
                        backgroundColor: transportMode === "bahn" ? '#64748b' : 'transparent',
                        color: transportMode === "bahn" ? '#fff' : '#666666'
                      }}
                    >
                      <Train size={16} />
                      Bahn
                    </button>
                  </div>
                </div>
              )}

              {/* Plan Content */}
              <div 
                className="flex-1 rounded-3xl"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid rgba(212, 200, 180, 0.35)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  padding: focusMode === "plan" ? '2.5rem' : focusMode === "map" ? '1rem' : '2rem'
                }}
              >
                {favorites.length === 0 ? (
                  <div className="text-center py-16" style={{ color: '#999999' }}>
                    <Heart size={44} className="mx-auto mb-4" style={{ color: '#cccccc' }} strokeWidth={1.5} />
                    <p className="text-lg">Füge Favoriten hinzu, um deinen Trip zu planen</p>
                  </div>
                ) : focusMode === "map" ? (
                  /* Compact Icon View for Map Focus */
                  <div className="flex flex-col gap-2 items-center">
                    {gridFavorites.map((fav) => (
                      <div 
                        key={fav.id}
                        className="group relative cursor-pointer"
                        onClick={() => handleMarkerClick(fav.id)}
                      >
                        <div 
                          className="w-16 h-16 rounded-full overflow-hidden transition-all duration-200 hover:scale-110"
                          style={{
                            border: highlightedEventId === fav.id ? '3px solid #D4AF37' : '2px solid white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        >
                          <img 
                            src={fav.image} 
                            alt={fav.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Hover tooltip */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-10">
                          <div 
                            className="px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                              backgroundColor: 'white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              color: '#333333'
                            }}
                          >
                            {fav.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Full Snake Flow */
                  <SnakeTripFlow 
                    favorites={gridFavorites} 
                    transportMode={transportMode}
                    onEventClick={handleMarkerClick}
                    onRemoveFavorite={(id) => {
                      const fav = favorites.find(f => f.id === id);
                      if (fav) toggleFavorite(fav);
                    }}
                    highlightedId={highlightedEventId}
                    expanded={focusMode === "plan"}
                  />
                )}
              </div>

              {/* SBB Footer - Only in split and plan mode */}
              {focusMode !== "map" && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">SBB</div>
                    <span className="text-xs" style={{ color: '#999999' }}>Fahrplanvorschläge</span>
                  </div>
                  <span className="text-xs" style={{ color: '#999999' }}>
                    {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} | {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed State - Now using StaticMapTeaser and TripPreviewAvatars
  return (
    <div className="rounded-2xl overflow-visible space-y-4">
      {/* Static Map Teaser */}
      <StaticMapTeaser 
        eventCount={mapEvents.length || 150}
        onOpenPlanner={() => setIsExpanded(true)}
      />
      
      {/* Trip Preview Avatars */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(212, 200, 180, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
        }}
      >
        <div className="p-4">
          <TripPreviewAvatars onOpenPlanner={() => setIsExpanded(true)} />
        </div>
        
        {/* Plan Button */}
        <div className="px-4 pb-4">
          <button
            disabled={favorites.length === 0}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300"
            )}
            style={{
              backgroundColor: favorites.length > 0 ? '#333333' : '#f5f5f5',
              color: favorites.length > 0 ? 'white' : '#999999',
              cursor: favorites.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: favorites.length > 0 ? '0 4px 15px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            <Sparkles size={16} />
            Deinen Trip planen ✨
          </button>
        </div>
      </div>
    </div>
  );
};

// Suggestion Card - Square aspect ratio
interface SuggestionCardProps {
  event: SuggestedEvent;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const SuggestionCard = ({ event, onClick, isHighlighted }: SuggestionCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative transition-all duration-300"
      style={{
        backgroundColor: 'white',
        border: isHighlighted ? '2px solid #D4AF37' : '1px solid rgba(212, 200, 180, 0.4)',
        boxShadow: isHighlighted 
          ? '0 0 15px rgba(212, 175, 55, 0.4), 0 6px 20px rgba(0,0,0,0.1)' 
          : '0 4px 15px rgba(0,0,0,0.06)'
      }}
    >
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white font-medium text-[10px] leading-tight line-clamp-2 drop-shadow-lg">
          {event.title}
        </p>
        <p className="text-white/80 text-[8px] mt-0.5 flex items-center gap-0.5">
          <MapPin size={8} />
          {event.distance}
        </p>
      </div>
    </div>
  );
};

const EmptySuggestionCard = () => (
  <div 
    className="aspect-square rounded-xl" 
    style={{
      backgroundColor: 'rgba(253, 251, 247, 0.3)',
      border: '1px dashed rgba(212, 200, 180, 0.5)'
    }}
  />
);

// Snake Trip Flow
interface SnakeTripFlowProps {
  favorites: FavoriteEvent[];
  transportMode: "auto" | "bahn";
  onEventClick?: (eventId: string) => void;
  onRemoveFavorite?: (id: string) => void;
  highlightedId?: string | null;
  expanded?: boolean;
}

const SnakeTripFlow = ({ favorites, transportMode, onEventClick, onRemoveFavorite, highlightedId, expanded }: SnakeTripFlowProps) => {
  const transportData = [
    { minutes: 12, km: 8.5 },
    { minutes: 24, km: 18.2 },
    { minutes: 18, km: 12.4 },
    { minutes: 15, km: 9.8 },
    { minutes: 9, km: 5.2 },
  ];

  const slots: (FavoriteEvent | null)[] = [...favorites];
  while (slots.length < 6) {
    slots.push(null);
  }

  const row1 = [slots[0], slots[1], slots[2]];
  const row2 = [slots[5], slots[4], slots[3]];

  const cardSize = expanded ? 120 : 92;
  const lineWidth = expanded ? 100 : 80;
  const strokeWidth = expanded ? 3 : 2;
  const lineColor = expanded ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 200, 180, 0.6)';

  return (
    <div className={cn("flex flex-col gap-4 relative py-2", expanded && "gap-6")}>
      {/* Row 1: Left to Right */}
      <div className="flex items-center justify-center gap-4">
        {row1.map((event, idx) => (
          <div key={idx} className="flex items-center">
            <CircularEventCard 
              event={event}
              onClick={() => event && onEventClick?.(event.id)}
              onRemove={() => event && onRemoveFavorite?.(event.id)}
              label={idx === 0 ? "Zürich HB: Start" : undefined}
              subLabel={idx === 0 ? "Abfahrt: 09:00" : `Aufenthalt: ~2h`}
              isHighlighted={event?.id === highlightedId}
              size={cardSize}
            />
            {idx < 2 && (
              <div className="flex items-center relative mx-3">
                <div 
                  style={{ 
                    width: `${lineWidth}px`,
                    height: `${strokeWidth}px`,
                    background: `linear-gradient(90deg, ${lineColor} 0%, ${lineColor} 100%)`
                  }} 
                />
                <TransportPill 
                  minutes={transportData[idx]?.minutes || 15} 
                  km={transportData[idx]?.km || 10}
                  mode={transportMode}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical connection */}
      <div className="flex justify-end pr-20 relative">
        <div className="flex flex-col items-center">
          <div 
            style={{ 
              width: `${strokeWidth}px`,
              height: expanded ? '70px' : '56px',
              background: `linear-gradient(180deg, ${lineColor} 0%, ${lineColor} 100%)`
            }} 
          />
          <TransportPill 
            minutes={transportData[2]?.minutes || 18} 
            km={transportData[2]?.km || 12}
            mode={transportMode}
            vertical
          />
          <div 
            style={{ 
              width: `${strokeWidth}px`,
              height: expanded ? '40px' : '32px',
              background: `linear-gradient(180deg, ${lineColor} 0%, ${lineColor} 100%)`
            }} 
          />
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div className="flex items-center justify-center gap-4">
        {row2.map((event, idx) => (
          <div key={idx} className="flex items-center">
            {idx > 0 && (
              <div className="flex items-center relative mx-3">
                <div 
                  style={{ 
                    width: `${lineWidth}px`,
                    height: `${strokeWidth}px`,
                    background: `linear-gradient(90deg, ${lineColor} 0%, ${lineColor} 100%)`
                  }} 
                />
                <TransportPill 
                  minutes={transportData[3 + idx - 1]?.minutes || 15} 
                  km={transportData[3 + idx - 1]?.km || 10}
                  mode={transportMode}
                />
              </div>
            )}
            <CircularEventCard 
              event={event}
              onClick={() => event && onEventClick?.(event.id)}
              onRemove={() => event && onRemoveFavorite?.(event.id)}
              label={idx === 0 ? "Zürich HB: Ende" : undefined}
              subLabel={idx === 0 ? "Ankunft: 18:30" : `Aufenthalt: ~2h`}
              isHighlighted={event?.id === highlightedId}
              size={cardSize}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Circular Event Card
interface CircularEventCardProps {
  event: FavoriteEvent | null;
  onClick?: () => void;
  onRemove?: () => void;
  label?: string;
  subLabel?: string;
  isHighlighted?: boolean;
  size?: number;
}

const CircularEventCard = ({ event, onClick, onRemove, label, subLabel, isHighlighted, size = 92 }: CircularEventCardProps) => {
  if (!event) {
    return (
      <div className="flex flex-col items-center">
        <div 
          className="rounded-full flex items-center justify-center"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: 'rgba(253, 251, 247, 0.5)',
            border: '2px dashed rgba(212, 200, 180, 0.5)'
          }}
        >
          <Plus size={24} style={{ color: '#cccccc' }} />
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: '#999999' }}>Leer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={onClick}
        className="relative rounded-full overflow-hidden cursor-pointer group transition-all duration-300"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: isHighlighted 
            ? '0 0 20px rgba(212, 175, 55, 0.6), 0 8px 25px rgba(0,0,0,0.15)' 
            : '0 8px 25px rgba(0,0,0,0.12)',
          border: isHighlighted ? '4px solid #D4AF37' : '4px solid rgba(255,255,255,0.9)'
        }}
      >
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="absolute top-1.5 right-1.5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <Heart size={12} className="text-red-500 fill-red-500" />
        </button>
      </div>
      <div className="mt-3 text-center" style={{ maxWidth: `${size + 10}px` }}>
        {label ? (
          <>
            <p className="text-xs font-semibold line-clamp-1" style={{ color: '#333333' }}>{label}</p>
            <p className="text-[11px]" style={{ color: '#666666' }}>{subLabel}</p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium line-clamp-1" style={{ color: '#333333' }}>{event.title.split(':')[0]}</p>
            <p className="text-[11px]" style={{ color: '#666666' }}>{subLabel}</p>
          </>
        )}
      </div>
    </div>
  );
};

// Transport Pill Component
interface TransportPillProps {
  minutes: number;
  km: number;
  mode: "auto" | "bahn";
  vertical?: boolean;
}

const TransportPill = ({ minutes, km, mode, vertical }: TransportPillProps) => {
  return (
    <div className={cn(
      "absolute flex flex-col items-center gap-1 pointer-events-none",
      vertical ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    )}>
      <div 
        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(212, 200, 180, 0.4)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}
      >
        {mode === "bahn" ? (
          <Train size={11} className="text-red-600" />
        ) : (
          <Car size={11} style={{ color: '#555555' }} />
        )}
        <span className="text-[11px] font-medium" style={{ color: '#333333' }}>{minutes}min</span>
      </div>
      <div 
        className="px-2.5 py-0.5 rounded-full"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(212, 200, 180, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <span className="text-[10px]" style={{ color: '#666666' }}>{km}km</span>
      </div>
    </div>
  );
};

export default ListingsTripSidebar;
