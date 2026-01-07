import { useState } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, ChevronUp, ChevronDown, MapPin, Sparkles, Car, Train, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingsTripSidebarProps {
  onEventClick?: (eventId: string) => void;
}

const ListingsTripSidebar = ({ onEventClick }: ListingsTripSidebarProps) => {
  const { favorites } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<"auto" | "bahn">("bahn");

  // Mock suggested events for expanded view
  const suggestedEvents = [
    { id: "1", title: "Kunsthaus Zürich", image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=100&q=80" },
    { id: "2", title: "Rheinfall Schaffhausen", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&q=80" },
    { id: "3", title: "Berner Altstadt", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=100&q=80" },
  ];

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FDFBF7] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FDFBF7] border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Trip Composer</p>
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
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer group"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{event.title}</p>
                  </div>
                  <button className="p-1.5 rounded-full bg-stone-100 hover:bg-amber-100 transition-colors opacity-0 group-hover:opacity-100">
                    <Plus size={14} className="text-stone-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content: Map + Timeline */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            {/* Map Placeholder */}
            <div className="bg-stone-100 rounded-2xl h-64 flex items-center justify-center relative overflow-hidden">
              <img 
                src="/swiss-outline.svg" 
                className="w-full h-full object-contain opacity-20 p-8" 
                alt="Switzerland" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-stone-400 text-sm">Mapbox-Karte mit Route</p>
              </div>
              {/* Favorite pins */}
              {favorites.map((fav, idx) => (
                <div
                  key={fav.id}
                  className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden"
                  style={{
                    left: `${20 + idx * 15}%`,
                    top: `${30 + (idx % 2) * 20}%`,
                  }}
                >
                  <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Transport Toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTransportMode("auto")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  transportMode === "auto"
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                <Car size={16} />
                Auto
              </button>
              <div className="w-8 h-0.5 bg-stone-300 rounded-full" />
              <button
                onClick={() => setTransportMode("bahn")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  transportMode === "bahn"
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                <Train size={16} />
                Bahn
              </button>
            </div>

            {/* Trip Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                Trip-Zeitstrahl
              </h3>
              
              {favorites.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  Füge Favoriten hinzu, um deinen Trip zu planen
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {favorites.map((fav, idx) => (
                    <div key={fav.id} className="flex items-center gap-2">
                      {/* Event Card */}
                      <div
                        onClick={() => onEventClick?.(fav.id)}
                        className="w-24 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square relative">
                          <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-stone-800 line-clamp-1">{fav.title}</p>
                        </div>
                      </div>
                      
                      {/* Transport Connector */}
                      {idx < favorites.length - 1 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-full">
                          <Train size={12} className="text-stone-500" />
                          <span className="text-[10px] font-medium text-stone-500">
                            {transportMode === "bahn" ? "IC 8" : "A1"}
                          </span>
                          <span className="text-[10px] text-stone-400">|</span>
                          <span className="text-[10px] text-stone-500">
                            {Math.floor(Math.random() * 60 + 20)} min
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
      {/* Map Placeholder */}
      <div className="h-40 bg-stone-100 relative overflow-hidden">
        <img 
          src="/swiss-outline.svg" 
          className="w-full h-full object-contain opacity-20 p-4" 
          alt="Switzerland" 
        />
        {/* Show favorite pins on map */}
        {favorites.slice(0, 5).map((fav, idx) => (
          <div
            key={fav.id}
            className="absolute w-6 h-6 rounded-full border-2 border-white shadow-md overflow-hidden"
            style={{
              left: `${20 + idx * 12}%`,
              top: `${35 + (idx % 2) * 15}%`,
            }}
          >
            <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Trip Composer</p>
            <h3 className="font-serif font-bold text-stone-900">Dein Trip-Entwurf</h3>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <ChevronUp size={18} className="text-stone-500" />
          </button>
        </div>
      </div>

      {/* Favorites List or Empty State */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-50 flex items-center justify-center">
              <Heart size={28} className="text-amber-400" fill="currentColor" />
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Wähle Favoriten (❤️) –<br />
              wir erstellen deinen<br />
              perfekten Ablauf.
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
          Ablauf jetzt planen
        </button>
      </div>
    </div>
  );
};

export default ListingsTripSidebar;
