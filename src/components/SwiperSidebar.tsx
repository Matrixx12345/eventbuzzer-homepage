import { X } from "lucide-react";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { memo, useState, useEffect, useMemo } from "react";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";

interface SwiperSidebarEvent {
  id: string;
  title: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  address_city?: string;
  location?: string;
  short_description?: string;
}

export interface FilterCriteria {
  type: "city" | "route" | "category" | "none";
  city?: string;
  radius?: number;
  routeA?: string;
  routeB?: string;
  corridorWidth?: number;
  categoryId?: number;
}

interface SwiperSidebarProps {
  currentEvent: SwiperSidebarEvent | null;
  onEventClick?: (eventId: string) => void;
  onFilterApply?: (criteria: FilterCriteria) => void;
}

// Swiss cities for autocomplete
const ALL_SWISS_CITIES = [
  "Zürich", "Basel", "Bern", "Genf", "Luzern", "Lausanne",
  "St. Gallen", "Winterthur", "Lugano", "Biel",
  "St. Moritz", "Zermatt", "Interlaken", "Davos", "Grindelwald"
];

interface Category {
  id: number;
  slug: string;
  name: string;
}

// Separate memoized map component to prevent re-renders
const SwissMap = memo(({ latitude, longitude }: { latitude?: number; longitude?: number }) => {
  const eventPoint = useMemo(() => {
    if (!latitude || !longitude) return null;

    const anchorLat = 46.2;
    const stretch = latitude <= anchorLat ? 1.1 : 1.1 - ((latitude - anchorLat) / (47.8 - anchorLat)) * 0.23;

    return {
      left: `${((longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
      top: `${((1 - ((latitude - 45.8) / (47.8 - 45.8)) * stretch) * 100) - 1.5}%`,
    };
  }, [latitude, longitude]);

  return (
    <div className="relative w-full rounded overflow-hidden">
      <svg viewBox="0 0 1348.8688 865.04437" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <image href="/swiss-outline.svg" width="1348.8688" height="865.04437" opacity="0.3" />

        {/* Städte-Marker */}
        <circle cx="765" cy="213" r="7.5" fill="#6b7280" />
        <text x="775" y="223" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zürich</text>

        <circle cx="71.3" cy="672.8" r="7.5" fill="#6b7280" />
        <text x="82" y="682" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Genf</text>

        <circle cx="495.2" cy="147" r="7.5" fill="#6b7280" />
        <text x="506" y="157" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Basel</text>

        <circle cx="214.7" cy="545" r="7.5" fill="#6b7280" />
        <text x="225" y="555" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lausanne</text>

        <circle cx="453.8" cy="362" r="7.5" fill="#6b7280" />
        <text x="464" y="372" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Bern</text>

        <circle cx="576" cy="490" r="6" fill="#6b7280" />
        <text x="586" y="500" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Interlaken</text>

        <circle cx="828.0" cy="168" r="7" fill="#6b7280" />
        <text x="838" y="178" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Winterthur</text>

        <circle cx="706.5" cy="351" r="7.5" fill="#6b7280" />
        <text x="717" y="361" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Luzern</text>

        <circle cx="989" cy="167" r="7" fill="#6b7280" />
        <text x="999" y="177" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Gallen</text>

        <circle cx="865" cy="768.2" r="7" fill="#6b7280" />
        <text x="875" y="778" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lugano</text>

        <circle cx="1154" cy="546" r="6" fill="#6b7280" />
        <text x="1164" y="556" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Moritz</text>

        <circle cx="542" cy="750" r="6" fill="#6b7280" />
        <text x="552" y="760" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zermatt</text>

        <circle cx="395.0" cy="301" r="6" fill="#6b7280" />
        <text x="405" y="311" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Biel</text>
      </svg>
      {eventPoint && (
        <div
          className="absolute w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-md"
          style={eventPoint}
        />
      )}
    </div>
  );
});

function SwiperSidebar({ currentEvent, onEventClick, onFilterApply }: SwiperSidebarProps) {
  const { plannedEventsByDay, activeDay, removeEventFromTrip } = useTripPlanner();
  const { favorites, toggleFavorite } = useFavorites();

  // Filter State - Accordion toggles
  const [showCity, setShowCity] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [radius, setRadius] = useState<number>(25);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [routeA, setRouteA] = useState<string>("");
  const [routeB, setRouteB] = useState<string>("");
  const [corridorWidth, setCorridorWidth] = useState<number>(10);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");

  const dayEvents = plannedEventsByDay[activeDay] || [];

  // Load categories from DB
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await externalSupabase
        .from("event_taxonomy")
        .select("id, slug, name")
        .eq("type", "main")
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setCategories(data);
      }
    };
    loadCategories();
  }, []);

  return (
    <div className="bg-gray-100 rounded-none shadow-lg border-l-2 border-gray-300 h-screen overflow-y-auto custom-scrollbar">
      {/* SVG Switzerland Map */}
      <div className="px-6 pt-3 pb-4">
        <SwissMap latitude={currentEvent?.latitude} longitude={currentEvent?.longitude} />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-400 mx-6 my-2" />

      {/* FILTER SEKTION */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900">Filter</h3>
          {(selectedCity || (routeA && routeB) || selectedCategory) && (
            <button
              onClick={() => {
                setSelectedCity("");
                setCitySearch("");
                setRouteA("");
                setRouteB("");
                setSelectedCategory(null);
                onFilterApply?.({ type: "none" });
              }}
              className="text-xs text-gray-600 hover:text-red-600 font-medium underline"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        {/* Erste Reihe Pills */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => {
              setShowCity(!showCity);
              setShowRoute(false);
              setShowCategory(false);
              setShowAdvanced(false);
            }}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              showCity
                ? "bg-gray-700 text-white shadow-md"
                : "bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md"
            }`}
          >
            Stadt + Umkreis
          </button>
          <button
            onClick={() => {
              setShowRoute(!showRoute);
              setShowCity(false);
              setShowCategory(false);
              setShowAdvanced(false);
            }}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              showRoute
                ? "bg-gray-700 text-white shadow-md"
                : "bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md"
            }`}
          >
            Route A→B
          </button>
        </div>

        {/* Stadt + Umkreis Content */}
        {showCity && (
          <div className="space-y-2 mb-3">
            {/* Stadt-Suchfeld mit Auto-Complete */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Stadt wählen</label>
              <input
                type="text"
                list="cities"
                placeholder="Stadt eingeben..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <datalist id="cities">
                {ALL_SWISS_CITIES.map(city => <option key={city} value={city} />)}
              </datalist>
            </div>

            {/* Radius-Slider */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Umkreis: {radius} km
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                <span>10 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Suchbutton */}
            <button
              onClick={() => {
                const matchedCity = ALL_SWISS_CITIES.find(c => c.toLowerCase() === citySearch.toLowerCase());
                if (matchedCity) {
                  setSelectedCity(matchedCity);
                  onFilterApply?.({
                    type: "city",
                    city: matchedCity,
                    radius: radius,
                  });
                } else {
                  setSelectedCity("");
                }
              }}
              disabled={!citySearch}
              className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Filter anwenden
            </button>

            {selectedCity && (
              <p className="text-xs text-gray-500 italic mt-2">
                ✓ Aktiv: {selectedCity} ({radius} km)
              </p>
            )}
          </div>
        )}

        {/* Route A→B Content */}
        {showRoute && (
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <select
                value={routeA}
                onChange={(e) => setRouteA(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">Von...</option>
                {ALL_SWISS_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select
                value={routeB}
                onChange={(e) => setRouteB(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">Nach...</option>
                {ALL_SWISS_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            {routeA && routeB && (
              <>
                <div className="pt-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Korridor: {corridorWidth} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={corridorWidth}
                    onChange={(e) => setCorridorWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span>5 km</span>
                    <span>30 km</span>
                  </div>
                </div>

                {/* Route Filter Button */}
                <button
                  onClick={() => {
                    onFilterApply?.({
                      type: "route",
                      routeA: routeA,
                      routeB: routeB,
                      corridorWidth: corridorWidth,
                    });
                  }}
                  className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
                >
                  Filter anwenden
                </button>

                <p className="text-xs text-gray-500 italic mt-2">
                  ✓ Route: {routeA} → {routeB} ({corridorWidth} km)
                </p>
              </>
            )}
          </div>
        )}

        {/* Kategorie Content */}
        {showCategory && (
          <div className="space-y-1 mb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  const newCategoryId = selectedCategory === cat.id ? null : cat.id;
                  setSelectedCategory(newCategoryId);
                  onFilterApply?.(
                    newCategoryId
                      ? { type: "category", categoryId: newCategoryId }
                      : { type: "none" }
                  );
                }}
                className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gray-700 text-white shadow-md"
                    : "bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Erweitert Content */}
        {showAdvanced && (
          <div className="space-y-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Weitere Filter kommen hier...</p>
          </div>
        )}

        {/* Zweite Reihe Pills - erscheint UNTER dem Content */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => {
              setShowCategory(!showCategory);
              setShowCity(false);
              setShowRoute(false);
              setShowAdvanced(false);
            }}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              showCategory
                ? "bg-gray-700 text-white shadow-md"
                : "bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md"
            }`}
          >
            Kategorie
          </button>
          <button
            onClick={() => {
              setShowAdvanced(!showAdvanced);
              setShowCity(false);
              setShowRoute(false);
              setShowCategory(false);
            }}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              showAdvanced
                ? "bg-gray-700 text-white shadow-md"
                : "bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md"
            }`}
          >
            Erweitert
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-400 mx-6 my-2" />

      {/* Tagesplaner */}
      <div className="px-6 pb-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">Tagesplaner</h3>
        {dayEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dayEvents.map((planned) => (
              <div
                key={planned.eventId}
                className="bg-white rounded shadow-md hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => onEventClick?.(planned.eventId)}
              >
                <div className="flex items-start">
                  <div className="bg-white p-2.5 rounded-md shadow-md border border-gray-200 flex-shrink-0">
                    <img
                      src={planned.event.image_url || "/placeholder.svg"}
                      alt={planned.event.title}
                      className="w-20 h-16 rounded object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-start px-3 pt-3 pb-2 pr-10 flex-1 min-w-0">
                    <span className="text-sm text-gray-800 font-semibold leading-tight truncate mb-1.5">
                      {planned.event.title}
                    </span>
                    <span className="text-xs text-gray-700 truncate">
                      {planned.event.latitude && planned.event.longitude
                        ? (() => {
                            const loc = getLocationWithMajorCity(
                              planned.event.latitude,
                              planned.event.longitude,
                              planned.event.address_city || planned.event.location
                            );
                            // Only show if it contains "km" (distance info)
                            return loc.includes('km') ? loc : `In ${loc}`;
                          })()
                        : planned.event.address_city || planned.event.location || 'Schweiz'
                      }
                    </span>
                    {planned.event.short_description && (
                      <span className="text-xs text-gray-500 mt-0.5 truncate">
                        {planned.event.short_description}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEventFromTrip(planned.eventId);
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-all p-1 opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Noch keine Events geplant</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-400 mx-6 my-2" />

      {/* Favoriten - Thumbnail + Text (wie gewünscht!) */}
      <div className="px-6 pb-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">Favoriten</h3>
        {favorites.length > 0 ? (
          <div className="flex flex-col gap-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded shadow-md hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => onEventClick?.(fav.id)}
              >
                <div className="flex items-start">
                  <div className="bg-white p-2.5 rounded-md shadow-md border border-gray-200 flex-shrink-0">
                    <img
                      src={fav.image || fav.image_url || "/placeholder.svg"}
                      alt={fav.title}
                      className="w-20 h-16 rounded object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-start px-3 pt-3 pb-2 pr-10 flex-1 min-w-0">
                    <span className="text-sm text-gray-800 font-semibold leading-tight truncate mb-1.5">
                      {fav.title}
                    </span>
                    <span className="text-xs text-gray-700 truncate">
                      {fav.latitude && fav.longitude
                        ? (() => {
                            const loc = getLocationWithMajorCity(
                              fav.latitude,
                              fav.longitude,
                              fav.address_city || fav.location
                            );
                            // Only show if it contains "km" (distance info)
                            return loc.includes('km') ? loc : `In ${loc}`;
                          })()
                        : fav.address_city || fav.location || 'Schweiz'
                      }
                    </span>
                    {fav.short_description && (
                      <span className="text-xs text-gray-500 mt-0.5 truncate">
                        {fav.short_description}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(fav);
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-all p-1 opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Noch keine Favoriten</p>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SwiperSidebar);
