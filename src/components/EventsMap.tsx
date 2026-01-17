import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MapEvent, CategoryType, CATEGORY_COLORS, CATEGORY_FILTERS } from "@/types/map";

// Mapbox public token
mapboxgl.accessToken = "pk.eyJ1IjoibWF0cml4eDEyMyIsImEiOiJjbWp6eXUwOTAwZTk4M2ZzaTkycTg4eGs1In0.fThJ64zR4-7gi-ONMtglfQ";

interface FavoriteEventWithCoords {
  id: string;
  latitude?: number;
  longitude?: number;
  title?: string;
}

interface EventsMapProps {
  events?: MapEvent[];
  onEventClick?: (eventId: string) => void;
  onEventsChange?: (events: MapEvent[]) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void;
  isVisible?: boolean;
  selectedEventIds?: string[];
  hoveredEventId?: string | null;
  favoriteEvents?: FavoriteEventWithCoords[];
  showOnlyEliteAndFavorites?: boolean;
  customControls?: boolean;
  showSearchButton?: boolean;
  onSearchThisArea?: () => void;
  totalEventsCount?: number;
}

// Define GeoJSON feature type for Supercluster
interface EventFeature {
  type: "Feature";
  properties: {
    cluster: false;
    eventId: string;
    event: MapEvent;
    category: CategoryType;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

// Get category for an event based on buzz_boost, category_main_id, or tags
function getCategoryForEvent(event: MapEvent): CategoryType {
  // Elite check first (buzz_boost === 100)
  if (event.buzz_boost === 100) {
    return "elite";
  }

  const tags = event.tags || [];
  const tagsLower = tags.map((t) => t.toLowerCase());

  // Wellness: category_main_id = 2 or tags contain wellness-related terms
  if (
    event.category_main_id === 2 ||
    tagsLower.some((t) => t.includes("wellness") || t.includes("spa") || t.includes("therme"))
  ) {
    return "wellness";
  }

  // Nature: category_main_id = 3 or tags contain nature-related terms
  if (
    event.category_main_id === 3 ||
    tagsLower.some((t) => t.includes("berg") || t.includes("gletscher") || t.includes("natur") || t.includes("wandern"))
  ) {
    return "nature";
  }

  // Markets: category_main_id = 6
  if (event.category_main_id === 6 || tagsLower.some((t) => t.includes("markt") || t.includes("weihnacht"))) {
    return "markets";
  }

  // Culture: tags contain culture-related terms
  if (
    tagsLower.some(
      (t) =>
        t.includes("museum") ||
        t.includes("konzert") ||
        t.includes("ausstellung") ||
        t.includes("theater") ||
        t.includes("oper"),
    )
  ) {
    return "culture";
  }

  // Food: tags contain food-related terms
  if (
    tagsLower.some(
      (t) => t.includes("restaurant") || t.includes("food") || t.includes("kulinarisch") || t.includes("wein"),
    )
  ) {
    return "food";
  }

  // Sports: category_main_id = 4 or tags contain sports terms
  if (
    event.category_main_id === 4 ||
    tagsLower.some((t) => t.includes("sport") || t.includes("ski") || t.includes("bike") || t.includes("action"))
  ) {
    return "sports";
  }

  // Family: category_main_id = 5 or tags contain family terms
  if (
    event.category_main_id === 5 ||
    tagsLower.some((t) => t.includes("familie") || t.includes("kinder") || t.includes("family"))
  ) {
    return "family";
  }

  return "default";
}

// Get dominant category for a cluster
function getDominantCategory(categories: Record<CategoryType, number>): CategoryType {
  let maxCount = 0;
  let dominant: CategoryType = "default";

  for (const [category, count] of Object.entries(categories)) {
    // Elite always takes priority if present
    if (category === "elite" && count > 0) {
      return "elite";
    }
    if (count > maxCount) {
      maxCount = count;
      dominant = category as CategoryType;
    }
  }

  return dominant;
}

export function EventsMap({
  events = [],
  onEventClick,
  onEventsChange,
  onBoundsChange,
  isVisible = true,
  selectedEventIds = [],
  hoveredEventId = null,
  showOnlyEliteAndFavorites = false,
  favoriteEvents = [],
  customControls = false,
  showSearchButton = false,
  onSearchThisArea,
  totalEventsCount = 0,
}: EventsMapProps) {
  // DEBUG: Log what selectedEventIds we're receiving
  console.log('🎯 EventsMap received selectedEventIds:', selectedEventIds);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const favoriteMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const superclusterRef = useRef<Supercluster | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  const [loading, setLoading] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [internalEvents, setInternalEvents] = useState<MapEvent[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);

  // Toggle filter
  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilters((prev) => {
      if (filterKey === "all") {
        return ["all"];
      }

      const newFilters = prev.filter((f) => f !== "all");

      if (newFilters.includes(filterKey)) {
        const filtered = newFilters.filter((f) => f !== filterKey);
        return filtered.length === 0 ? ["all"] : filtered;
      } else {
        return [...newFilters, filterKey];
      }
    });
  }, []);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    if (activeFilters.includes("all")) {
      return internalEvents;
    }

    return internalEvents.filter((event) => {
      const category = getCategoryForEvent(event);
      return activeFilters.includes(category);
    });
  }, [internalEvents, activeFilters]);

  // Stable Set for selectedEventIds (O(1) lookup statt O(n))
  const selectedIdsSet = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);

  // Load events from Edge Function based on map bounds
  const loadEventsInView = useCallback(async () => {
    if (!map.current || !onEventsChange) return;

    setLoading(true);

    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;

      // NO PADDING: Load only events in actual viewport
      // Previous 25% padding was loading 1011 events (nearly entire Switzerland)
      const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0;
      const lngPadding = (bounds.getEast() - bounds.getWest()) * 0;

      const paddedBounds = {
        minLat: bounds.getSouth() - latPadding,
        maxLat: bounds.getNorth() + latPadding,
        minLng: bounds.getWest() - lngPadding,
        maxLng: bounds.getEast() + lngPadding,
      };

      // Debug: Log actual bounds being used
      console.log('🗺️ Viewport bounds:', {
        center: map.current.getCenter(),
        minLat: paddedBounds.minLat.toFixed(4),
        maxLat: paddedBounds.maxLat.toFixed(4),
        minLng: paddedBounds.minLng.toFixed(4),
        maxLng: paddedBounds.maxLng.toFixed(4),
        zoom: map.current.getZoom().toFixed(1)
      });

      let uniqueEvents: any[];

      if (showOnlyEliteAndFavorites) {
        // Performance-Modus: Nur Elite Events laden
        const { data: eliteData, error: eliteError } = await supabase
          .from("events")
          .select("*")
          .eq("buzz_boost", 100)
          .limit(50);

        if (eliteError) {
          console.error("Error loading elite events:", eliteError);
          return;
        }

        uniqueEvents = eliteData || [];
        console.log(`🚀 Performance mode: Loaded ${uniqueEvents.length} elite events only`);
      } else {
        // VOLLE Logik: Viewport + Elite events
        const [viewportResponse, eliteResponse] = await Promise.all([
          // Regular events in viewport
          supabase.functions.invoke("get-external-events", {
            body: {
              limit: 2000,
              offset: 0,
              filters: {
                minLat: paddedBounds.minLat,
                maxLat: paddedBounds.maxLat,
                minLng: paddedBounds.minLng,
                maxLng: paddedBounds.maxLng,
              },
            },
          }),
          // Elite events (buzz_boost = 100) - ONLY in viewport (not whole Switzerland)
          supabase
            .from("events")
            .select("*")
            .eq("buzz_boost", 100)
            .gte("latitude", paddedBounds.minLat)
            .lte("latitude", paddedBounds.maxLat)
            .gte("longitude", paddedBounds.minLng)
            .lte("longitude", paddedBounds.maxLng)
            .limit(20),
        ]);

        const { data, error } = viewportResponse;
        const { data: eliteData } = eliteResponse;

        if (error) {
          console.error("Edge Function Error:", error);
          return;
        }

        // Merge viewport events + elite events (remove duplicates by id)
        const allEvents = [...(data?.events || []), ...(eliteData || [])];
        uniqueEvents = Array.from(
          new Map(allEvents.map(e => [e.external_id || e.id, e])).values()
        );
      }

      if (uniqueEvents && Array.isArray(uniqueEvents)) {
        const mappedEvents: MapEvent[] = uniqueEvents
          .map((e: any) => ({
            id: e.external_id || String(e.id),
            external_id: e.external_id,
            title: e.title,
            description: e.description,
            short_description: e.short_description,
            venue_name: e.venue_name,
            address_city: e.address_city,
            location: e.location,
            image_url: e.image_url,
            start_date: e.start_date,
            end_date: e.end_date,
            latitude: e.latitude,
            longitude: e.longitude,
            // IGNORIERE mapbox_lng/mapbox_lat - die sind falsch in der DB!
            // Nutze NUR longitude und latitude Felder
            mapbox_lng: e.longitude,
            mapbox_lat: e.latitude,
            buzz_score: e.buzz_score,
            relevance_score: e.relevance_score,
            price_from: e.price_from,
            price_to: e.price_to,
            category_main_id: e.category_main_id,
            tags: Array.isArray(e.tags) ? e.tags : [],
            buzz_boost: e.buzz_boost,
            source: e.source,
          }))
          .filter((e: MapEvent) => e.latitude && e.longitude);

        console.log(`Loaded ${mappedEvents.length} events with coordinates`);

        // Debug: Show first 5 events to verify correct region
        if (mappedEvents.length > 0) {
          console.log('📍 First 5 events loaded:', mappedEvents.slice(0, 5).map(e => ({
            title: e.title.substring(0, 40),
            location: e.location || e.address_city,
            lat: e.latitude?.toFixed(4),
            lng: e.longitude?.toFixed(4)
          })));
        }

        setInternalEvents(mappedEvents);
        setEventCount(mappedEvents.length);

        if (onEventsChange) {
          onEventsChange(mappedEvents);
        }
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, [onEventsChange, showOnlyEliteAndFavorites]);

  // REMOVED: debouncedLoad - replaced by handleMapMove with 800ms debounce

  // Create popup HTML
  const createPopupHTML = (event: MapEvent) => {
    const imageUrl = event.image_url || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400";
    const city = event.address_city || event.venue_name || "";
    const category = getCategoryForEvent(event);
    const categoryColor = CATEGORY_COLORS[category];
    // Use ONLY description (not short_description) to avoid duplication - FULL length, no truncation
    const description = event.description || "";

    return `
      <div style="width: 200px; cursor: pointer;" class="event-popup">
        <img
          src="${imageUrl}"
          alt="${event.title}"
          style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px 6px 0 0;"
          onerror="this.src='https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400'"
        />
        <div style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${categoryColor};"></div>
            <span style="font-size: 10px; color: ${categoryColor}; font-weight: 600; text-transform: uppercase;">
              ${category === "elite" ? "⭐ Elite" : category}
            </span>
          </div>
          <div style="font-weight: 600; font-size: 14px; line-height: 1.3; color: #1a1a1a; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.title}
          </div>
          ${city ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">${city}</div>` : ""}
          ${description ? `<div style="font-size: 11px; color: #555; line-height: 1.4;">${description}</div>` : ""}
          ${event.buzz_score ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">🔥 Buzz: ${event.buzz_score.toFixed(1)}</div>` : ""}
        </div>
      </div>
    `;
  };

  // Update markers using Supercluster
  const updateMarkers = useCallback(() => {
    if (!map.current || !superclusterRef.current) return;

    const bounds = map.current.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    const zoom = Math.floor(map.current.getZoom());
    const clusters = superclusterRef.current.getClusters(bbox, zoom);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (showOnlyEliteAndFavorites) {
      // ========================================
      // PERFORMANCE MODE: NUR Elite ⭐ + Favoriten ❤️
      // ========================================
      clusters.forEach((feature) => {
        if (feature.properties.cluster) return; // Skip clusters in performance mode

        const [longitude, latitude] = feature.geometry.coordinates;
        const event = feature.properties.event;
        const isElite = event.buzz_boost === 100 || event.buzz_boost === "100";
        const isFavorite = selectedIdsSet.has(event.id);  // ← O(1) lookup

        // Nur Elite ODER Favoriten rendern
        if (!isElite && !isFavorite) return;

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.cursor = 'pointer';
        wrapper.style.zIndex = isFavorite ? '10001' : '10000';

        const inner = document.createElement('div');

        if (isElite) {
          // Goldener Stern - 35% kleiner (48px -> 31px)
          inner.style.cssText = `
            font-size: 31px;
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 4px 12px rgba(0,0,0,0.3));
            transition: transform 0.2s;
          `;
          inner.textContent = '⭐';
        } else if (isFavorite) {
          // Rotes Herz - 35% kleiner (44px -> 29px)
          inner.style.cssText = `
            font-size: 29px;
            filter: drop-shadow(0 0 20px rgba(220, 38, 38, 0.8)) drop-shadow(0 4px 12px rgba(0,0,0,0.3));
            transition: transform 0.2s;
          `;
          inner.textContent = '❤️';
        }

        wrapper.appendChild(inner);

        // Hover-Animation
        wrapper.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.2)';
        });
        wrapper.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
        });

        // Click-Handler
        wrapper.addEventListener('click', () => {
          if (onEventClick) onEventClick(event.id);
        });

        // Create popup for performance mode event
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '220px'
        }).setHTML(createPopupHTML(event));

        // Marker erstellen
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      console.log('🚀 Performance mode: Rendered only Elite ⭐ and Favorites ❤️');
      return; // Exit early - skip Phase 1
    }

    // ========================================
    // FULL MODE: PHASE 1 + PHASE 2
    // ========================================

    // ========================================
    // PHASE 1: Clusters & Normal Events
    // z-index: 100 (clusters) / 500 (normal)
    // ========================================
    clusters.forEach((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount } = feature.properties;

      if (isCluster) {
        // ==================
        // CLUSTER RENDERING
        // ==================
        const clusterId = feature.properties.cluster_id;
        const clusterLeaves = superclusterRef.current!.getLeaves(clusterId, Infinity);

        // Check cluster content
        const hasElite = clusterLeaves.some(leaf => {
          const bb = leaf.properties.event.buzz_boost;
          return bb === 100 || bb === "100";
        });
        const hasFavorite = clusterLeaves.some(leaf =>
          selectedIdsSet.has(leaf.properties.event.id)  // ← O(1) lookup
        );
        const hasHovered = clusterLeaves.some(leaf =>
          leaf.properties.event.id === hoveredEventId
        );

        const wrapper = document.createElement('div');
        // Higher z-index when hovered event is inside cluster
        wrapper.style.cssText = `cursor: pointer; z-index: ${hasHovered ? '15000' : '1'};`;

        // Google Maps Style: Visible cluster dots (NO numbers)
        // RED ring if hovered event is inside cluster
        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 20px;
          height: 20px;
          background: #5f6368;
          border: 3px solid ${hasHovered ? '#ef4444' : 'white'};
          border-radius: 50%;
          box-shadow: ${hasHovered ? '0 0 0 2px #ef4444' : '0 2px 6px rgba(0,0,0,0.3)'};
          transition: all 0.3s ease;
        `;

        wrapper.appendChild(inner);

        wrapper.addEventListener('click', () => {
          const expansionZoom = Math.min(
            superclusterRef.current!.getClusterExpansionZoom(clusterId),
            20
          );
          map.current?.easeTo({
            center: [longitude, latitude],
            zoom: expansionZoom
          });
        });

        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
        markersRef.current.push(marker);

      } else {
        // ==================
        // NORMAL EVENT PIN (Photo Circle)
        // Skip Elite & Favorites - they render in Phase 2
        // ==================
        const event = feature.properties.event;
        const isElite = event.buzz_boost === 100 || event.buzz_boost === "100";
        const isFavorite = selectedIdsSet.has(event.id);  // ← O(1) lookup

        if (isElite || isFavorite) {
          return; // Skip - render in Phase 2
        }

        // Normal Event: Zoom-dependent rendering (Google Maps style)
        const isHovered = event.id === hoveredEventId;

        const wrapper = document.createElement('div');
        // Higher z-index when hovered to appear above other markers
        wrapper.style.cssText = `cursor: pointer; z-index: ${isHovered ? '15000' : '2'};`;

        const currentZoom = map.current?.getZoom() || 7;
        const inner = document.createElement('div');

        if (currentZoom < 9) {
          // Größerer Punkt für bessere Sichtbarkeit und Klickbarkeit
          // RED ring when hovered
          inner.style.cssText = `
            width: ${isHovered ? '28px' : '20px'};
            height: ${isHovered ? '28px' : '20px'};
            border-radius: 50%;
            background: #5f6368;
            border: 3px solid ${isHovered ? '#ef4444' : 'white'};
            box-shadow: ${isHovered ? '0 0 0 2px #ef4444, 0 4px 12px rgba(239,68,68,0.6)' : '0 2px 6px rgba(0,0,0,0.3)'};
            cursor: pointer;
            transition: all 0.3s ease;
            transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
          `;
        } else {
          // Event image for medium-close zoom (9+)
          // RED ring when hovered
          inner.style.cssText = `
            width: ${isHovered ? '56px' : '40px'};
            height: ${isHovered ? '56px' : '40px'};
            border-radius: 50%;
            border: 3px solid ${isHovered ? '#ef4444' : '#D8CDB8'};
            overflow: hidden;
            background: white;
            box-shadow: ${isHovered ? '0 0 0 2px #ef4444, 0 6px 20px rgba(239,68,68,0.5)' : '0 2px 8px rgba(0,0,0,0.2)'};
            transition: all 0.3s ease;
            transform: ${isHovered ? 'scale(1.3)' : 'scale(1)'};
          `;

          if (event.image_url) {
            const img = document.createElement('img');
            img.src = event.image_url;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            inner.appendChild(img);
          } else {
            inner.style.background = '#E8DCC8';
            inner.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">📅</div>';
          }
        }

        wrapper.appendChild(inner);
        wrapper.addEventListener('click', () => {
          if (onEventClick) onEventClick(event.id);
        });

        // Create popup for normal event
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '220px',
          className: 'event-popup' // For custom z-index styling
        }).setHTML(createPopupHTML(event));

        // Close any active popup when opening a new one
        popup.on('open', () => {
          if (activePopupRef.current && activePopupRef.current !== popup) {
            activePopupRef.current.remove();
          }
          activePopupRef.current = popup;
        });

        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current!);
        markersRef.current.push(marker);
      }
    });

    // ========================================
    // PHASE 2: Elite Stars & Favorite Hearts
    // z-index: 10000 (Elite) / 10001 (Favorites)
    // ========================================
    clusters.forEach((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const { cluster: isCluster } = feature.properties;

      if (!isCluster) {
        const event = feature.properties.event;

        // Log ALL events to see what we're working with
        const logData: any = {
          title: event.title,
          buzz_boost: event.buzz_boost,
          buzz_boost_type: typeof event.buzz_boost,
          id: event.id,
          in_selectedEventIds: selectedEventIds.includes(event.id)
        };

        // Extra debug for known events
        if (event.title?.toLowerCase().includes('beyeler') ||
            event.title?.toLowerCase().includes('vitra') ||
            event.title?.toLowerCase().includes('spalentor')) {
          logData.DEBUG_COORDS = {
            original_lat: event.latitude,
            original_lng: event.longitude,
            mapbox_lat_field: event.mapbox_lat,
            mapbox_lng_field: event.mapbox_lng,
            feature_coords: feature.geometry.coordinates
          };
        }

        console.log('📍 Event loaded:', logData);

        const isElite = event.buzz_boost === 100 || event.buzz_boost === "100";
        const isFavorite = selectedIdsSet.has(event.id);  // ← O(1) lookup

        // Debug logging for Elite/Favorites
        if (isElite || isFavorite) {
          console.log('🌟 Elite/Favorite found:', {
            title: event.title,
            isElite,
            isFavorite,
            buzz_boost: event.buzz_boost,
            id: event.id
          });
        }

        if (isElite) {
          // ⭐ ELITE EVENT - Gold Star (ALWAYS visible at any zoom)
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'cursor: pointer; z-index: 10000;';

          const inner = document.createElement('div');
          inner.style.cssText = `
            font-size: 31px;
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 4px 12px rgba(0,0,0,0.3));
            transition: transform 0.2s;
          `;
          inner.textContent = '⭐';

          wrapper.appendChild(inner);

          wrapper.addEventListener('mouseenter', () => {
            inner.style.transform = 'scale(1.2)';
          });
          wrapper.addEventListener('mouseleave', () => {
            inner.style.transform = 'scale(1)';
          });
          wrapper.addEventListener('click', () => {
            if (onEventClick) onEventClick(event.id);
          });

          // Create popup for elite event
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '220px',
            className: 'event-popup' // For custom z-index styling
          }).setHTML(createPopupHTML(event));

          // Close any active popup when opening a new one
          popup.on('open', () => {
            if (activePopupRef.current && activePopupRef.current !== popup) {
              activePopupRef.current.remove();
            }
            activePopupRef.current = popup;
          });

          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(map.current!);
          markersRef.current.push(marker);

        } else if (isFavorite) {
          // ❤️ FAVORITE EVENT - Red Heart (ALWAYS visible at any zoom)
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'cursor: pointer; z-index: 10001;';

          const inner = document.createElement('div');
          inner.style.cssText = `
            font-size: 29px;
            filter: drop-shadow(0 0 20px rgba(220, 38, 38, 0.8)) drop-shadow(0 4px 12px rgba(0,0,0,0.3));
            transition: transform 0.2s;
          `;
          inner.textContent = '❤️';

          wrapper.appendChild(inner);

          wrapper.addEventListener('mouseenter', () => {
            inner.style.transform = 'scale(1.2)';
          });
          wrapper.addEventListener('mouseleave', () => {
            inner.style.transform = 'scale(1)';
          });
          wrapper.addEventListener('click', () => {
            if (onEventClick) onEventClick(event.id);
          });

          // Create popup for favorite event
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '220px',
            className: 'event-popup' // For custom z-index styling
          }).setHTML(createPopupHTML(event));

          // Close any active popup when opening a new one
          popup.on('open', () => {
            if (activePopupRef.current && activePopupRef.current !== popup) {
              activePopupRef.current.remove();
            }
            activePopupRef.current = popup;
          });

          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(map.current!);
          markersRef.current.push(marker);
        }
      }
    });

    console.log('✅ Markers rendered - Elite (⭐), Favorites (❤️), Normal (📸), Clusters (⭐/❤️/gray)');
  }, [onEventClick, selectedIdsSet, showOnlyEliteAndFavorites, hoveredEventId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/matrixx123/cmk9rkcqj009i01sc771e6gxw",
      center: [8.3, 46.85],
      zoom: 6.5,
      pitch: 0,
      minZoom: 6.5,
      maxBounds: [
        [5.5, 45.5],
        [11.0, 48.0],
      ],
    });

    // Nur Mapbox Controls hinzufügen wenn NICHT customControls
    if (!customControls) {
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right",
      );
    }

    map.current.on("load", () => {
      if (map.current) {
        map.current.addSource("countries", {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });

        map.current.addLayer({
          id: "country-dim",
          type: "fill",
          source: "countries",
          "source-layer": "country_boundaries",
          filter: ["!=", ["get", "iso_3166_1"], "CH"],
          paint: {
            "fill-color": "#6b7280",
            "fill-opacity": 0.35,
          },
        });

        map.current.addLayer({
          id: "switzerland-border",
          type: "line",
          source: "countries",
          "source-layer": "country_boundaries",
          filter: ["==", ["get", "iso_3166_1"], "CH"],
          paint: {
            "line-color": "#B0A090",
            "line-width": 2.5,
            "line-opacity": 0.8,
          },
        });
      }

      setMapReady(true);
      loadEventsInView();  // Initial load
    });

    // ENTFERNT: map.current.on("moveend", debouncedLoad) - wird durch handleMapMove ersetzt

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [loadEventsInView]);

  // Initialize Supercluster when filtered events change
  useEffect(() => {
    if (filteredEvents.length === 0) {
      superclusterRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }

    // Create Supercluster instance with Google Maps style clustering
    // radius: 60 = larger radius for fewer, more consolidated clusters
    // maxZoom: 12 = clusters disappear at zoom 12, event images appear earlier
    // minPoints: 5 = need more events to form a cluster (less cluttered)
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 12,
      minZoom: 0,
      minPoints: 5,
      map: (props: any) => ({
        category: props.category,
        categoryCounts: { [props.category]: 1 },
      }),
      reduce: (accumulated: any, props: any) => {
        accumulated.categoryCounts = accumulated.categoryCounts || {};
        for (const [cat, count] of Object.entries(props.categoryCounts || {})) {
          accumulated.categoryCounts[cat] = (accumulated.categoryCounts[cat] || 0) + (count as number);
        }
      },
    });

    // Convert events to GeoJSON features with category
    // Use mapbox_lng/lat for accurate positioning (already normalized in mapping above)
    // Round to 6 decimal places for consistent precision (~0.1m accuracy)
    const points: EventFeature[] = filteredEvents.map((event) => {
      const lng = Number((event.mapbox_lng ?? event.longitude).toFixed(6));
      const lat = Number((event.mapbox_lat ?? event.latitude).toFixed(6));

      return {
        type: "Feature",
        properties: {
          cluster: false,
          eventId: event.id,
          event: event,
          category: getCategoryForEvent(event),
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      };
    });

    cluster.load(points as any);
    superclusterRef.current = cluster;

    console.log(`Supercluster initialized with ${points.length} points`);

    // ENTFERNT: if (mapReady) { updateMarkers(); }
    // Marker werden NUR durch handleMapMove (moveend Event) aktualisiert!
  }, [filteredEvents]);

  // Update markers when hoveredEventId changes
  useEffect(() => {
    if (mapReady && superclusterRef.current) {
      updateMarkers();
    }
  }, [hoveredEventId, mapReady, updateMarkers]);

  // Consolidated Map Move Handler (Zoom + Pan)
  const handleMapMove = useCallback(() => {
    if (!map.current) return;

    // Debounced Event Loading (nur bei signifikanten Bewegungen)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadEventsInView();  // Lädt neue Events nach 800ms
    }, 800);  // ← ERHÖHT von 300ms auf 800ms (länger als Zoom-Animation)

    // SOFORT: Marker aktualisieren (kein Debounce für smooth UX)
    updateMarkers();

    // Bounds an Parent melden (für "Search this area" Button Logic)
    if (onBoundsChange && map.current) {
      const bounds = map.current.getBounds();
      const zoom = map.current.getZoom();

      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom: zoom || 7
      });
    }
  }, [loadEventsInView, updateMarkers, onBoundsChange]);

  useEffect(() => {
    if (!map.current || !mapReady) return;

    // NUR moveend Handler - feuert nach Zoom UND Pan
    map.current.on("moveend", handleMapMove);

    return () => {
      map.current?.off("moveend", handleMapMove);
    };
  }, [mapReady, handleMapMove]);

  // Resize map when visibility changes
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current && isVisible) {
        map.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    if (isVisible && mapReady) {
      map.current.resize();
      setTimeout(() => map.current?.resize(), 100);
      setTimeout(() => map.current?.resize(), 300);
    }

    return () => resizeObserver.disconnect();
  }, [isVisible, mapReady]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div className="relative min-h-[600px] h-[calc(100vh-340px)] rounded-xl overflow-hidden border border-border shadow-lg">
        <div ref={mapContainer} className="w-full h-full" />

        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Events werden geladen...</span>
          </div>
        )}

        {/* "Search this area" Button - Google Maps Style (inside map at top) */}
        {showSearchButton && onSearchThisArea && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={onSearchThisArea}
              className="px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg border border-gray-200 flex items-center gap-2 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-700">Suche in diesem Bereich</span>
            </button>
          </div>
        )}

        {/* Custom Zoom Controls - Google Maps Style */}
        {customControls && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
            {/* Zoom In */}
            <button
              onClick={() => {
                if (map.current) {
                  map.current.zoomIn({ duration: 300 });
                }
              }}
              className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg shadow-md flex items-center justify-center border border-gray-300 transition-colors"
              aria-label="Zoom in"
            >
              <span className="text-gray-700 text-2xl font-light leading-none">+</span>
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => {
                if (map.current) {
                  map.current.zoomOut({ duration: 300 });
                }
              }}
              className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg shadow-md flex items-center justify-center border border-gray-300 transition-colors"
              aria-label="Zoom out"
            >
              <span className="text-gray-700 text-2xl font-light leading-none">−</span>
            </button>
          </div>
        )}

        {/* Event Count - Unten links KLEIN */}
        {eventCount > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-white/70 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-gray-500 font-medium shadow-sm border border-gray-200/50">
              {eventCount} Events
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default EventsMap;
