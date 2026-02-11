import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle, memo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import { supabase } from "@/integrations/supabase/client";
import { externalSupabase } from "@/integrations/supabase/externalClient";
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
  plannedEvents?: Array<{ eventId: string; event: any; duration: number }>;
  activeDay?: number;  // Current day for trip planner
  showOnlyEliteAndFavorites?: boolean;
  customControls?: boolean;
  showSearchButton?: boolean;
  onSearchThisArea?: () => void;
  totalEventsCount?: number;
  categoryId?: number | null;  // NEW: Filter by category (important for Märkte!)
  // Nearby zoom feature
  flyToLocation?: { lng: number; lat: number; zoom: number } | null;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonLabel?: string;
  onMapStateCapture?: (state: { center: [number, number]; zoom: number }) => void;
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

const EventsMapComponent = forwardRef<mapboxgl.Map | null, EventsMapProps>(
  (
    {
      events = [],
      onEventClick,
      onEventsChange,
      onBoundsChange,
      isVisible = true,
      selectedEventIds = [],
      hoveredEventId = null,
      showOnlyEliteAndFavorites = false,
      favoriteEvents = [],
      plannedEvents = [],
      activeDay = 1,
      customControls = false,
      showSearchButton = false,
      onSearchThisArea,
      totalEventsCount = 0,
      categoryId = null,
      // Nearby zoom feature
      flyToLocation = null,
      showBackButton = false,
      onBackClick,
      backButtonLabel = "Zurück zu allen Events",
      onMapStateCapture,
    },
    ref
  ) => {
  // DEBUG: Log what selectedEventIds we're receiving
  console.log('🎯 EventsMap received selectedEventIds:', selectedEventIds);
  console.log('📍 EventsMap received plannedEvents:', plannedEvents?.length || 0, 'items');

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const favoriteMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const eliteMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const plannedEventMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const superclusterRef = useRef<Supercluster | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eliteEventsRef = useRef<MapEvent[]>([]);
  const polylineSourceRef = useRef<boolean>(false);

  // Expose map instance via ref for external components (e.g., EventList1 for Trip Planner)
  useImperativeHandle(ref, () => map.current, []);

  const [loading, setLoading] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [internalEvents, setInternalEvents] = useState<MapEvent[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);

  // 3D Mode State
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);

  // Route visibility state
  const [routeVisible, setRouteVisible] = useState(true);

  // Handle route toggle - just toggle the state, useEffect will handle visibility
  const handleRouteToggle = useCallback(() => {
    console.log('🔄 Route toggle clicked! Current routeVisible:', routeVisible);
    setRouteVisible(prev => {
      console.log('  Setting routeVisible to:', !prev);
      return !prev;
    });
  }, [routeVisible]);


  // Watch routeVisible state and toggle marker/polyline visibility
  useEffect(() => {
    if (!map.current) return;

    console.log('👁️ Route visibility changed to:', routeVisible);
    console.log('  plannedEventMarkersRef.current length:', plannedEventMarkersRef.current.length);

    // Toggle polyline visibility
    try {
      if (map.current.getLayer('route-polyline-layer')) {
        map.current.setLayoutProperty(
          'route-polyline-layer',
          'visibility',
          routeVisible ? 'visible' : 'none'
        );
        console.log('✅ Polyline visibility set to:', routeVisible ? 'visible' : 'none');
      }
    } catch (e) {
      console.warn('⚠️ Polyline error:', e);
    }

    // Toggle marker visibility - remove or add markers
    plannedEventMarkersRef.current.forEach((marker, index) => {
      try {
        if (routeVisible) {
          marker.addTo(map.current!);
          console.log(`✅ Marker ${index} added back`);
        } else {
          marker.remove();
          console.log(`✅ Marker ${index} removed`);
        }
      } catch (e) {
        console.error(`❌ Error toggling marker ${index}:`, e);
      }
    });
  }, [routeVisible]);

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

  // Map for planned events with their order numbers (1, 2, 3, etc.)
  const plannedEventsMap = useMemo(() => {
    const map = new Map<string, number>();
    console.log('📍 Creating plannedEventsMap from:', plannedEvents?.length || 0, 'events');
    plannedEvents?.filter(Boolean).forEach((item, index) => {
      map.set(item.eventId, index + 1);
      console.log(`  - ${item.eventId} => #${index + 1}`);
    });
    console.log('📍 plannedEventsMap created with', map.size, 'entries');
    return map;
  }, [plannedEvents]);

  // Load events from Edge Function based on map bounds
  const loadEventsInView = useCallback(async () => {
    if (!map.current || !onEventsChange) return;

    const loadStartTime = performance.now();
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
        // VOLLE Logik: Viewport events (buzz_boost wird aus event_vibe_overrides geholt)
        const viewportResponse = await supabase.functions.invoke("get-external-events", {
          body: {
            limit: 500, // Reduced from 2000 for faster loading (3-5s instead of 12s)
            offset: 0,
            filters: {
              minLat: paddedBounds.minLat,
              maxLat: paddedBounds.maxLat,
              minLng: paddedBounds.minLng,
              maxLng: paddedBounds.maxLng,
              categoryId, // IMPORTANT: Pass category filter (e.g., Märkte = 6)
            },
          },
        });

        const { data, error } = viewportResponse;

        if (error) {
          console.error("Edge Function Error:", error);
          return;
        }

        uniqueEvents = data?.events || [];
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

        // REMOVED: Batch buzz_boost query - no longer needed
        // Elite Events are loaded separately via loadEliteEvents() function
        // This avoids URL length issues (400 Bad Request with 1000+ event IDs)

        console.log(`Loaded ${mappedEvents.length} viewport events with coordinates`);

        // Debug: Show first 5 events to verify correct region
        if (mappedEvents.length > 0) {
          console.log('📍 First 5 events loaded:', mappedEvents.slice(0, 5).map(e => ({
            title: e.title.substring(0, 40),
            location: e.location || e.address_city,
            lat: e.latitude?.toFixed(4),
            lng: e.longitude?.toFixed(4)
          })));
        }

        // NOTE: Elite Events are loaded once at map initialization (line 974)
        // They are global (all of Switzerland), not viewport-dependent

        setInternalEvents(mappedEvents);
        setEventCount(mappedEvents.length);

        if (onEventsChange) {
          // Filter Elite Events to only include those in current viewport
          const eliteEventsInViewport = eliteEventsRef.current.filter(eliteEvent => {
            if (!eliteEvent.latitude || !eliteEvent.longitude) return false;
            return (
              eliteEvent.latitude >= paddedBounds.minLat &&
              eliteEvent.latitude <= paddedBounds.maxLat &&
              eliteEvent.longitude >= paddedBounds.minLng &&
              eliteEvent.longitude <= paddedBounds.maxLng
            );
          });

          // Send viewport events + elite events that are IN viewport
          const allEvents = [...mappedEvents, ...eliteEventsInViewport];
          console.log(`🔄 Calling onEventsChange with ${allEvents.length} events (${mappedEvents.length} viewport + ${eliteEventsInViewport.length}/${eliteEventsRef.current.length} elite in viewport)`);
          onEventsChange(allEvents);
        } else {
          console.warn('⚠️ onEventsChange is not defined!');
        }

        const loadEndTime = performance.now();
        console.log(`⏱️ loadEventsInView took ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, [onEventsChange, showOnlyEliteAndFavorites, categoryId]);

  // Load Elite Events separately (globally, not filtered by viewport)
  // This avoids URL length issues and ensures stars are visible everywhere
  const loadEliteEvents = useCallback(async () => {
    try {
      console.log('⭐ Loading Elite Events globally...');

      const { data: eliteData, error: eliteError } = await externalSupabase
        .from("events")
        .select("*")
        .eq("buzz_boost", 100);

      if (eliteError) {
        console.error("❌ Error loading Elite Events:", eliteError);
        return;
      }

      if (eliteData && eliteData.length > 0) {
        // Map Elite Events to MapEvent format
        const mappedEliteEvents: MapEvent[] = eliteData
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
            mapbox_lng: e.longitude,
            mapbox_lat: e.latitude,
            buzz_score: e.buzz_score,
            relevance_score: e.relevance_score,
            price_from: e.price_from,
            price_to: e.price_to,
            category_main_id: e.category_main_id,
            tags: Array.isArray(e.tags) ? e.tags : [],
            buzz_boost: 100, // Always 100 for Elite Events
            source: e.source,
          }))
          .filter((e: MapEvent) => e.latitude && e.longitude);

        eliteEventsRef.current = mappedEliteEvents;
        console.log(`✅ Loaded ${mappedEliteEvents.length} Elite Events globally (visible everywhere on map)`);

        // Markers will be rendered by the next updateMarkers() call
        // (triggered by map moveend event or viewport change)
      } else {
        console.log('⚠️ No Elite Events found (buzz_boost = 100)');
        eliteEventsRef.current = [];
      }
    } catch (error) {
      console.error("❌ Failed to load Elite Events:", error);
      eliteEventsRef.current = [];
    }
  }, []);

  // REMOVED: debouncedLoad - replaced by handleMapMove with 800ms debounce
  // REMOVED: createPopupHTML - mini popups completely deleted per user request

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
    eliteMarkersRef.current.forEach(marker => marker.remove());
    eliteMarkersRef.current = [];

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
          // Goldener Stern - 30% kleiner (31px -> 22px)
          inner.style.cssText = `
            font-size: 22px;
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 3px 10px rgba(0,0,0,0.4));
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
          if (onEventClick) {
            onEventClick(event.id);

            // Fly to event in 3D mode
            if (is3DMode && map.current) {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: Math.max(map.current.getZoom(), 14),
                pitch: 60,
                bearing: 0,
                duration: 2000,
                essential: true
              });
            }
          }
        });

        // Marker erstellen (NO POPUP)
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      // Render planned events (numbered pins) in performance mode
      console.log('🔢 Performance Mode - Planned Events:', plannedEvents?.length || 0);
      plannedEvents?.filter(Boolean).forEach((plannedEvent) => {
        const event = plannedEvent.event;
        const orderNumber = plannedEventsMap.get(plannedEvent.eventId);
        console.log(`🔢 Planned Event: ${event.title}, Order: ${orderNumber}, Lat: ${event.latitude}, Lng: ${event.longitude}`);
        if (!orderNumber || !event.latitude || !event.longitude) {
          console.log(`❌ Skipped: orderNumber=${orderNumber}, lat=${event.latitude}, lng=${event.longitude}`);
          return;
        }

        const longitude = event.longitude;
        const latitude = event.latitude;

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.cursor = 'pointer';
        wrapper.style.zIndex = '10002';

        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: white;
          filter: drop-shadow(0 2px 8px rgba(102, 126, 234, 0.4));
          transition: transform 0.2s;
        `;
        inner.textContent = String(orderNumber);

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
          if (onEventClick) {
            onEventClick(event.id);
            if (is3DMode && map.current) {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: Math.max(map.current.getZoom(), 14),
                pitch: 60,
                bearing: 0,
                duration: 2000,
                essential: true
              });
            }
          }
        });

        // Marker erstellen (NO POPUP)
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
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
          if (onEventClick) {
            onEventClick(event.id);

            // Fly to event in 3D mode
            if (is3DMode && map.current) {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: Math.max(map.current.getZoom(), 14),
                pitch: 60,
                bearing: 0,
                duration: 2000,
                essential: true
              });
            }
          }
        });

        // Marker erstellen (NO POPUP)
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
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
          // ⭐ ELITE EVENT - Gold Star (ALWAYS visible at any zoom, 30% smaller)
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'cursor: pointer; z-index: 10000;';

          const inner = document.createElement('div');
          inner.style.cssText = `
            font-size: 22px;
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 3px 10px rgba(0,0,0,0.4));
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
            if (onEventClick) {
              onEventClick(event.id);

              // Fly to event in 3D mode
              if (is3DMode && map.current) {
                map.current.flyTo({
                  center: [longitude, latitude],
                  zoom: Math.max(map.current.getZoom(), 14),
                  pitch: 60,
                  bearing: 0,
                  duration: 2000,
                  essential: true
                });
              }
            }
          });

          // Marker erstellen (NO POPUP)
          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
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
            if (onEventClick) {
              onEventClick(event.id);

              // Fly to event in 3D mode
              if (is3DMode && map.current) {
                map.current.flyTo({
                  center: [longitude, latitude],
                  zoom: Math.max(map.current.getZoom(), 14),
                  pitch: 60,
                  bearing: 0,
                  duration: 2000,
                  essential: true
                });
              }
            }
          });

          // Marker erstellen (NO POPUP)
          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
            .addTo(map.current!);
          markersRef.current.push(marker);
        }
      }
    });

    // ========================================
    // PHASE 3: Render Elite Events (ALWAYS visible, never clustered)
    // ========================================
    eliteEventsRef.current.forEach((event) => {
      const longitude = event.mapbox_lng ?? event.longitude;
      const latitude = event.mapbox_lat ?? event.latitude;

      if (!longitude || !latitude) return;

      // ⭐ ELITE EVENT - Gold Star (30% smaller, always visible)
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'cursor: pointer; z-index: 10000;';

      const inner = document.createElement('div');
      inner.style.cssText = `
        font-size: 22px;
        filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 3px 10px rgba(0,0,0,0.4));
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
        if (onEventClick) {
          onEventClick(event.id);

          // Fly to event in 3D mode
          if (is3DMode && map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: Math.max(map.current.getZoom(), 14),
              pitch: 60,
              bearing: 0,
              duration: 2000,
              essential: true
            });
          }
        }
      });

      // Marker erstellen (NO POPUP)
      const marker = new mapboxgl.Marker({ element: wrapper })
        .setLngLat([longitude, latitude])
        .addTo(map.current!);

      eliteMarkersRef.current.push(marker);
    });

    // ========================================
    // PHASE 4: Render Planned Events (Trip Planner)
    // Numbered pins for events in the trip planner
    // ========================================
    console.log('🔢 PHASE 4 - Planned Events:', plannedEvents?.length || 0);
    plannedEventMarkersRef.current = [];
    plannedEvents?.filter(Boolean).forEach((plannedEvent) => {
      const event = plannedEvent.event;
      const orderNumber = plannedEventsMap.get(plannedEvent.eventId);

      console.log(`🔢 Planned Event Phase 4: ${event.title}, Order: ${orderNumber}, Lat: ${event.latitude}, Lng: ${event.longitude}`);
      if (!orderNumber || !event.latitude || !event.longitude) {
        console.log(`❌ Phase 4 Skipped: orderNumber=${orderNumber}, lat=${event.latitude}, lng=${event.longitude}`);
        return;
      }

      const longitude = event.longitude;
      const latitude = event.latitude;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'cursor: pointer; z-index: 10002;';

      const inner = document.createElement('div');
      inner.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: white;
        filter: drop-shadow(0 1px 3px rgba(139, 92, 246, 0.3));
        transition: transform 0.2s;
      `;
      inner.textContent = String(orderNumber);

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
        if (onEventClick) {
          onEventClick(event.id);

          // Fly to event in 3D mode
          if (is3DMode && map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: Math.max(map.current.getZoom(), 14),
              pitch: 60,
              bearing: 0,
              duration: 2000,
              essential: true
            });
          }
        }
      });

      console.log(`✅ Creating marker #${orderNumber} at [${longitude}, ${latitude}]`);
      // Marker erstellen (NO POPUP)
      const marker = new mapboxgl.Marker({ element: wrapper })
        .setLngLat([longitude, latitude]);

      // Only add to map if route is visible
      if (routeVisible) {
        marker.addTo(map.current!);
      }

      markersRef.current.push(marker);
      plannedEventMarkersRef.current.push(marker);
      console.log(`✅ Marker #${orderNumber} added!`);
    });

    // ========================================
    // PHASE 5: Render Route Polylines (Connect Planned Events)
    // ========================================
    if (plannedEvents && plannedEvents.length >= 2 && map.current && routeVisible) {
      console.log('🛣️ PHASE 5 - Creating route polyline for', plannedEvents.length, 'events');

      // Sort planned events by order number to ensure correct line path
      const sortedPlannedEvents = [...plannedEvents].filter(Boolean).sort((a, b) => {
        const orderA = plannedEventsMap.get(a.eventId) || 0;
        const orderB = plannedEventsMap.get(b.eventId) || 0;
        return orderA - orderB;
      });

      // Create coordinates array for polyline (connect events in order)
      const routeCoordinates: [number, number][] = sortedPlannedEvents
        .map(pe => {
          const event = pe.event;
          if (event.longitude && event.latitude) {
            return [event.longitude, event.latitude] as [number, number];
          }
          return null;
        })
        .filter((coord): coord is [number, number] => coord !== null);

      if (routeCoordinates.length >= 2) {
        console.log('🛣️ Route polyline coordinates:', routeCoordinates);

        // Create GeoJSON LineString feature
        const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          },
          properties: {}
        };

        // Remove existing polyline source and layer if they exist
        try {
          if (map.current.getLayer('route-polyline-layer')) {
            map.current.removeLayer('route-polyline-layer');
          }
          if (map.current.getSource('route-polyline')) {
            map.current.removeSource('route-polyline');
          }
        } catch (e) {
          // Layer/source doesn't exist yet, that's fine
        }

        // Add source
        map.current.addSource('route-polyline', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [routeFeature]
          }
        });

        // Add line layer - styled to look like a street route
        try {
          map.current.addLayer({
            id: 'route-polyline-layer',
            type: 'line',
            source: 'route-polyline',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': 'rgba(102, 126, 234, 0.6)',
              'line-width': 3,
              'line-opacity': 0.8,
              'line-dasharray': [3, 2] // Dashed line effect
            }
          });
        } catch (e) {
          console.warn('⚠️ Could not add polyline layer:', e);
        }

        console.log('✅ Route polyline rendered successfully');
      }
    }

    console.log(`✅ Markers rendered - ${eliteMarkersRef.current.length} Elite (⭐), Favorites (❤️), Normal (📸), Clusters (⭐/❤️/gray) + ${plannedEvents?.length || 0} Planned`);
    console.log(`✅ Total markers in scene: ${markersRef.current.length}`);
  }, [onEventClick, selectedIdsSet, showOnlyEliteAndFavorites, hoveredEventId, plannedEventsMap, plannedEvents]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/matrixx123/cmk9rkcqj009i01sc771e6gxw",
      center: [8.3, 46.85], // Switzerland center
      zoom: 6.5, // Show whole Switzerland
      pitch: 0,
      minZoom: 6.5,
      maxBounds: [
        [5.5, 45.5],
        [11.0, 48.0],
      ],
      // Enable 3D touch gestures
      touchPitch: true,
      touchZoomRotate: true,
      dragRotate: true,
      pitchWithRotate: true
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

        // 3D Terrain & Sky (Desktop only for performance)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const hasGoodPerformance = !isMobile && navigator.hardwareConcurrency >= 4;

        if (hasGoodPerformance) {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14
          });

          map.current.setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1.5  // Dramatic Alps visualization
          });

          // Sky layer for realistic atmosphere
          map.current.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });
        }

      }

      setMapReady(true);
      loadEventsInView();  // Initial viewport events load
      loadEliteEvents();   // Load Elite Events globally (visible everywhere)
    });

    // Error handling for terrain/3D features
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e.error);

      if (e.error.message.includes('terrain') || e.error.message.includes('DEM')) {
        console.warn('Terrain loading failed. Disabling 3D terrain.');
        map.current?.setTerrain(null);
        setIs3DMode(false);
      }
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
  }, [loadEventsInView, loadEliteEvents]);

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

    // NOTE: Elite Events are loaded separately via loadEliteEvents() and stored in eliteEventsRef
    // filteredEvents contains only viewport events (normal events) and should all be clustered
    // DO NOT try to separate Elite Events from filteredEvents here!

    // Convert ALL viewport events to GeoJSON features for clustering
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

    // DO NOT overwrite eliteEventsRef here - it's set by loadEliteEvents()
    const eliteCount = eliteEventsRef.current?.length || 0;
    console.log(`Supercluster initialized with ${points.length} viewport events + ${eliteCount} Elite Events (never clustered)`);

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

  // Track pitch and bearing for UI updates
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const updateCameraState = () => {
      if (map.current) {
        setCurrentPitch(map.current.getPitch());
        setCurrentBearing(map.current.getBearing());
      }
    };

    map.current.on('pitch', updateCameraState);
    map.current.on('rotate', updateCameraState);

    return () => {
      map.current?.off('pitch', updateCameraState);
      map.current?.off('rotate', updateCameraState);
    };
  }, [mapReady]);

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

  // Fly to location when flyToLocation prop changes (for nearby zoom)
  useEffect(() => {
    if (!flyToLocation || !map.current || !mapReady) return;

    console.log('🗺️ FlyTo triggered:', { lng: flyToLocation.lng, lat: flyToLocation.lat, zoom: flyToLocation.zoom });

    // Capture current state before flying (for "back" functionality)
    if (onMapStateCapture) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      console.log('📍 Capturing previous state:', { center: [center.lng, center.lat], zoom });
      onMapStateCapture({ center: [center.lng, center.lat], zoom });
    }

    // Fly to the new location
    map.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: flyToLocation.zoom,
      duration: 1500,
      essential: true
    });
  }, [flyToLocation, mapReady]);

  return (
    <div className="relative w-full h-full" style={{ isolation: 'isolate' }}>
      {/* Map Container */}
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />

        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Events werden geladen...</span>
          </div>
        )}

        {/* Top Center Controls - Search Button */}
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

        {/* Route Toggle - Top Left */}
        {plannedEvents && plannedEvents.length >= 2 && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={handleRouteToggle}
              className={`px-4 py-2 rounded-full shadow-lg border transition-colors font-medium text-sm ${
                routeVisible
                  ? 'bg-white/90 backdrop-blur-sm hover:bg-white border-gray-200 text-gray-700'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white/70 border-gray-300 text-gray-600'
              }`}
            >
              <span>{routeVisible ? 'Route ausblenden' : 'Route einblenden'}</span>
            </button>
          </div>
        )}

        {/* Custom Zoom Controls - Google Maps Style */}
        {customControls && (
          <>
            <div className="absolute top-20 md:top-24 right-4 md:right-6 flex flex-col gap-2 z-50">
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

          </>
        )}

        {/* Back Button - Centered bottom (for nearby zoom feature) */}
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30
                       bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full
                       shadow-lg border border-stone-200
                       hover:bg-white hover:shadow-xl transition-all duration-200
                       flex items-center gap-2 text-sm font-medium text-stone-700
                       hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {backButtonLabel}
          </button>
        )}


      </div>
    </div>
  );
}
);

EventsMapComponent.displayName = "EventsMap";

export default memo(EventsMapComponent);
