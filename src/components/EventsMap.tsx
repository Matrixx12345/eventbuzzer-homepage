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
  isVisible?: boolean;
  selectedEventIds?: string[];
  favoriteEvents?: FavoriteEventWithCoords[];
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
  isVisible = true,
  selectedEventIds = [],
  favoriteEvents = [],
}: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const favoriteMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const superclusterRef = useRef<Supercluster | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load events from Edge Function based on map bounds
  const loadEventsInView = useCallback(async () => {
    if (!map.current || !onEventsChange) return;

    setLoading(true);

    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;

      // ADD PADDING: Expand bounds by 20% in each direction
      // This pre-loads events slightly outside viewport for smooth experience
      const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0.2;
      const lngPadding = (bounds.getEast() - bounds.getWest()) * 0.2;

      const paddedBounds = {
        minLat: bounds.getSouth() - latPadding,
        maxLat: bounds.getNorth() + latPadding,
        minLng: bounds.getWest() - lngPadding,
        maxLng: bounds.getEast() + lngPadding,
      };

      const { data, error } = await supabase.functions.invoke("get-external-events", {
        body: {
          limit: 100,
          offset: 0,
          filters: {
            minLat: paddedBounds.minLat,
            maxLat: paddedBounds.maxLat,
            minLng: paddedBounds.minLng,
            maxLng: paddedBounds.maxLng,
          },
        },
      });

      if (error) {
        console.error("Edge Function Error:", error);
        return;
      }

      if (data?.events && Array.isArray(data.events)) {
        const mappedEvents: MapEvent[] = data.events
          .map((e: any) => ({
            id: e.external_id || String(e.id),
            external_id: e.external_id,
            title: e.title,
            venue_name: e.venue_name,
            address_city: e.address_city,
            image_url: e.image_url,
            start_date: e.start_date,
            latitude: e.latitude,
            longitude: e.longitude,
            // Use mapbox coords if available, otherwise fallback to regular coords
            mapbox_lng: e.mapbox_lng ?? e.longitude,
            mapbox_lat: e.mapbox_lat ?? e.latitude,
            buzz_score: e.buzz_score,
            price_from: e.price_from,
            price_to: e.price_to,
            category_main_id: e.category_main_id,
            tags: Array.isArray(e.tags) ? e.tags : [],
            buzz_boost: e.buzz_boost,
          }))
          .filter((e: MapEvent) => e.latitude && e.longitude);

        console.log(`Loaded ${mappedEvents.length} events with coordinates`);

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
  }, [onEventsChange]);

  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadEventsInView();
    }, 300);
  }, [loadEventsInView]);

  // Create popup HTML
  const createPopupHTML = (event: MapEvent) => {
    const imageUrl = event.image_url || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400";
    const city = event.address_city || event.venue_name || "";
    const category = getCategoryForEvent(event);
    const categoryColor = CATEGORY_COLORS[category];

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
          ${city ? `<div style="font-size: 12px; color: #666;">${city}</div>` : ""}
          ${event.buzz_score ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">🔥 Buzz: ${event.buzz_score.toFixed(1)}</div>` : ""}
        </div>
      </div>
    `;
  };

  /  // Update markers using Supercluster
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !superclusterRef.current) return;

    const bounds = mapRef.current.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];

    const zoom = Math.floor(mapRef.current.getZoom());
    const clusters = superclusterRef.current.getClusters(bbox, zoom);

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

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
        const hasElite = clusterLeaves.some(leaf => leaf.properties.event.buzz_boost === 100);
        const hasFavorite = clusterLeaves.some(leaf => 
          selectedEventIds.includes(leaf.properties.event.id)
        );

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'cursor: pointer; z-index: 100;';

        const inner = document.createElement('div');

        if (hasElite) {
          // Gold Star Cluster (contains Elite events)
          inner.style.cssText = `
            width: 50px; height: 50px;
            background: #FFF4E6;
            border: 3px solid #FFD700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(255,215,0,0.4);
          `;
          inner.innerHTML = `⭐<span style="position: absolute; bottom: 2px; right: 2px; font-size: 12px; background: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">${pointCount}</span>`;
        } else if (hasFavorite) {
          // Red Heart Cluster (contains Favorites)
          inner.style.cssText = `
            width: 50px; height: 50px;
            background: #fecaca;
            border: 2px solid #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(239,68,68,0.3);
          `;
          inner.innerHTML = `❤️<span style="position: absolute; bottom: 2px; right: 2px; font-size: 12px; background: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">${pointCount}</span>`;
        } else {
          // Normal Cluster (no Elite/Favorites)
          inner.style.cssText = `
            width: 44px; height: 44px;
            background: #E5E7EB;
            border: 2px solid #9CA3AF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4B5563;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          `;
          inner.textContent = pointCount.toString();
        }

        wrapper.appendChild(inner);

        wrapper.addEventListener('click', () => {
          const expansionZoom = Math.min(
            superclusterRef.current!.getClusterExpansionZoom(clusterId),
            20
          );
          mapRef.current?.easeTo({
            center: [longitude, latitude],
            zoom: expansionZoom
          });
        });

        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current!);

        markersRef.current[`cluster-${clusterId}`] = marker;

      } else {
        // ==================
        // NORMAL EVENT PIN (Photo Circle)
        // Skip Elite & Favorites - they render in Phase 2
        // ==================
        const event = feature.properties.event;
        const isElite = event.buzz_boost === 100;
        const isFavorite = selectedEventIds.includes(event.id);

        if (isElite || isFavorite) {
          return; // Skip - render in Phase 2
        }

        // Normal Event: Round photo pin
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'cursor: pointer; z-index: 500;';

        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #D8CDB8;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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

        wrapper.appendChild(inner);

        wrapper.addEventListener('click', () => onEventClick(event));

        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current!);

        markersRef.current[`event-${event.id}`] = marker;
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
        const isElite = event.buzz_boost === 100;
        const isFavorite = selectedEventIds.includes(event.id);

        if (isElite) {
          // ⭐ ELITE EVENT - Gold Star
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'cursor: pointer; z-index: 10000;';

          const inner = document.createElement('div');
          inner.style.cssText = `
            font-size: 40px;
            filter: drop-shadow(0 0 8px rgba(255,215,0,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.3));
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
          wrapper.addEventListener('click', () => onEventClick(event));

          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          markersRef.current[`elite-${event.id}`] = marker;

        } else if (isFavorite) {
          // ❤️ FAVORITE EVENT - Red Heart
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'cursor: pointer; z-index: 10001;';

          const inner = document.createElement('div');
          inner.style.cssText = `
            font-size: 36px;
            filter: drop-shadow(0 0 6px rgba(239,68,68,0.6)) drop-shadow(0 3px 10px rgba(0,0,0,0.3));
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
          wrapper.addEventListener('click', () => onEventClick(event));

          const marker = new mapboxgl.Marker({ element: wrapper })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          markersRef.current[`favorite-${event.id}`] = marker;
        }
      }
    });

    console.log('✅ Markers rendered - Elite (⭐), Favorites (❤️), Normal (📸), Clusters (⭐/❤️/gray)');
  }, [onEventClick, selectedEventIds]);


  // SEPARATE LAYER: Render favorite events as big red pins - ALWAYS VISIBLE
  const renderFavoriteMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear existing favorite markers
    favoriteMarkersRef.current.forEach((m) => m.remove());
    favoriteMarkersRef.current = [];

    // Render each favorite with coordinates as a big red pin
    favoriteEvents.forEach((fav) => {
      if (!fav.latitude || !fav.longitude) return;

      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        width: 40px;
        height: 48px;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 9999;
      `;
      wrapper.innerHTML = `
        <svg width="40" height="48" viewBox="0 0 24 30" fill="none" style="filter: drop-shadow(0 4px 8px rgba(239,68,68,0.5));">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18c0-6.6-5.4-12-12-12z" fill="#ef4444"/>
          <circle cx="12" cy="11" r="4" fill="white"/>
        </svg>
      `;

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onEventClick) {
          onEventClick(fav.id);
        }
      });

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "bottom" })
        .setLngLat([fav.longitude, fav.latitude])
        .addTo(map.current!);

      favoriteMarkersRef.current.push(marker);
    });

    console.log(`Rendered ${favoriteMarkersRef.current.length} favorite pins`);
  }, [favoriteEvents, onEventClick]);

  // Re-render favorite markers when favorites change
  useEffect(() => {
    if (mapReady && favoriteEvents.length > 0) {
      renderFavoriteMarkers();
    }
  }, [mapReady, favoriteEvents, renderFavoriteMarkers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/matrixx123/cmk5ib9ay002q01qt0s6v1i3c",
      center: [8.3, 46.85],
      zoom: 7,
      pitch: 0,
      minZoom: 6.5,
      maxBounds: [
        [5.5, 45.5],
        [11.0, 48.0],
      ],
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right",
    );

    map.current.on("load", () => {
      if (map.current) {
        map.current.addSource("countries", {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });

        map.current.addLayer(
          {
            id: "country-dim",
            type: "fill",
            source: "countries",
            "source-layer": "country_boundaries",
            filter: ["!=", ["get", "iso_3166_1"], "CH"],
            paint: {
              "fill-color": "#6b7280",
              "fill-opacity": 0.35,
            },
          },
          "country-label",
        );

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
      loadEventsInView();
    });

    map.current.on("moveend", debouncedLoad);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [loadEventsInView, debouncedLoad]);

  // Initialize Supercluster when filtered events change
  useEffect(() => {
    if (filteredEvents.length === 0) {
      superclusterRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }

    // Create Supercluster instance with category counting
    // radius: 40 = events must be closer to cluster (less aggressive clustering)
    // maxZoom: 14 = clusters break apart earlier (at regional view)
    // minPoints: 3 = only cluster if 3+ events nearby
    const cluster = new Supercluster({
      radius: 40,
      maxZoom: 14,
      minZoom: 0,
      minPoints: 3,
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

    if (mapReady) {
      updateMarkers();
    }
  }, [filteredEvents, mapReady, updateMarkers]);

  // Update markers on zoom/pan
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const handleMove = () => {
      updateMarkers();
    };

    map.current.on("zoomend", handleMove);
    map.current.on("moveend", handleMove);

    return () => {
      map.current?.off("zoomend", handleMove);
      map.current?.off("moveend", handleMove);
    };
  }, [mapReady, updateMarkers]);

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

        {!loading && eventCount > 0 && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border">
            <span className="text-sm font-medium">
              {filteredEvents.length} von {eventCount} Events
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
          <div className="text-xs font-medium mb-2 text-foreground">Kategorien</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { key: "wellness", label: "Wellness" },
              { key: "nature", label: "Natur" },
              { key: "culture", label: "Kultur" },
              { key: "markets", label: "Märkte" },
              { key: "elite", label: "Elite ⭐" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: CATEGORY_COLORS[item.key as CategoryType], backgroundColor: "white" }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventsMap;
