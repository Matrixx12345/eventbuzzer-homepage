import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { MapEvent, CategoryType, CATEGORY_COLORS, CATEGORY_FILTERS } from '@/types/map';

// Mapbox public token
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0cml4eDEyMyIsImEiOiJjbWp6eXUwOTAwZTk4M2ZzaTkycTg4eGs1In0.fThJ64zR4-7gi-ONMtglfQ';

interface EventsMapProps {
  events?: MapEvent[];
  onEventClick?: (eventId: string) => void;
  onEventsChange?: (events: MapEvent[]) => void;
  isVisible?: boolean;
}

// Define GeoJSON feature type for Supercluster
interface EventFeature {
  type: 'Feature';
  properties: {
    cluster: false;
    eventId: string;
    event: MapEvent;
    category: CategoryType;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// Get category for an event based on buzz_boost, category_main_id, or tags
function getCategoryForEvent(event: MapEvent): CategoryType {
  // Elite check first (buzz_boost === 100)
  if (event.buzz_boost === 100) {
    return 'elite';
  }
  
  const tags = event.tags || [];
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Wellness: category_main_id = 2 or tags contain wellness-related terms
  if (event.category_main_id === 2 || 
      tagsLower.some(t => t.includes('wellness') || t.includes('spa') || t.includes('therme'))) {
    return 'wellness';
  }
  
  // Nature: category_main_id = 3 or tags contain nature-related terms
  if (event.category_main_id === 3 || 
      tagsLower.some(t => t.includes('berg') || t.includes('gletscher') || t.includes('natur') || t.includes('wandern'))) {
    return 'nature';
  }
  
  // Markets: category_main_id = 6
  if (event.category_main_id === 6 || 
      tagsLower.some(t => t.includes('markt') || t.includes('weihnacht'))) {
    return 'markets';
  }
  
  // Culture: tags contain culture-related terms
  if (tagsLower.some(t => t.includes('museum') || t.includes('konzert') || t.includes('ausstellung') || t.includes('theater') || t.includes('oper'))) {
    return 'culture';
  }
  
  // Food: tags contain food-related terms
  if (tagsLower.some(t => t.includes('restaurant') || t.includes('food') || t.includes('kulinarisch') || t.includes('wein'))) {
    return 'food';
  }
  
  // Sports: category_main_id = 4 or tags contain sports terms
  if (event.category_main_id === 4 || 
      tagsLower.some(t => t.includes('sport') || t.includes('ski') || t.includes('bike') || t.includes('action'))) {
    return 'sports';
  }
  
  // Family: category_main_id = 5 or tags contain family terms
  if (event.category_main_id === 5 || 
      tagsLower.some(t => t.includes('familie') || t.includes('kinder') || t.includes('family'))) {
    return 'family';
  }
  
  return 'default';
}

// Get dominant category for a cluster
function getDominantCategory(categories: Record<CategoryType, number>): CategoryType {
  let maxCount = 0;
  let dominant: CategoryType = 'default';
  
  for (const [category, count] of Object.entries(categories)) {
    // Elite always takes priority if present
    if (category === 'elite' && count > 0) {
      return 'elite';
    }
    if (count > maxCount) {
      maxCount = count;
      dominant = category as CategoryType;
    }
  }
  
  return dominant;
}

export function EventsMap({ events = [], onEventClick, onEventsChange, isVisible = true }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const superclusterRef = useRef<Supercluster | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [internalEvents, setInternalEvents] = useState<MapEvent[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  // Toggle filter
  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilters(prev => {
      if (filterKey === 'all') {
        return ['all'];
      }
      
      const newFilters = prev.filter(f => f !== 'all');
      
      if (newFilters.includes(filterKey)) {
        const filtered = newFilters.filter(f => f !== filterKey);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newFilters, filterKey];
      }
    });
  }, []);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    if (activeFilters.includes('all')) {
      return internalEvents;
    }
    
    return internalEvents.filter(event => {
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
        maxLng: bounds.getEast() + lngPadding
      };
      
      const { data, error } = await supabase.functions.invoke('get-external-events', {
        body: {
          limit: 100,
          offset: 0,
          filters: {
            minLat: paddedBounds.minLat,
            maxLat: paddedBounds.maxLat,
            minLng: paddedBounds.minLng,
            maxLng: paddedBounds.maxLng
          }
        }
      });
      
      if (error) {
        console.error('Edge Function Error:', error);
        return;
      }
      
      if (data?.events && Array.isArray(data.events)) {
        const mappedEvents: MapEvent[] = data.events.map((e: any) => ({
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
          buzz_boost: e.buzz_boost
        })).filter((e: MapEvent) => e.latitude && e.longitude);
        
        console.log(`Loaded ${mappedEvents.length} events with coordinates`);
        
        setInternalEvents(mappedEvents);
        setEventCount(mappedEvents.length);
        
        if (onEventsChange) {
          onEventsChange(mappedEvents);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
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
    const imageUrl = event.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400';
    const city = event.address_city || event.venue_name || '';
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
              ${category === 'elite' ? '⭐ Elite' : category}
            </span>
          </div>
          <div style="font-weight: 600; font-size: 14px; line-height: 1.3; color: #1a1a1a; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.title}
          </div>
          ${city ? `<div style="font-size: 12px; color: #666;">${city}</div>` : ''}
          ${event.buzz_score ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">🔥 Buzz: ${event.buzz_score.toFixed(1)}</div>` : ''}
        </div>
      </div>
    `;
  };

  // Update markers using Supercluster
  const updateMarkers = useCallback(() => {
    if (!map.current || !superclusterRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = map.current.getBounds();
    if (!bounds) return;

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    const zoom = Math.floor(map.current.getZoom());
    const showImages = zoom >= 11;

    // Get clusters for current viewport
    const clusters = superclusterRef.current.getClusters(bbox, zoom);

    clusters.forEach((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      const isCluster = feature.properties.cluster;

      if (isCluster) {
        // CLUSTER marker - einheitliche Farbe ohne Ring
        const pointCount = feature.properties.point_count;
        const size = Math.min(50, 34 + Math.log2(pointCount) * 5);
        
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          cursor: pointer;
        `;
        
        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 100%;
          height: 100%;
          background: #78716c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: ${Math.min(14, 11 + Math.log2(pointCount) * 1.5)}px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s ease-out;
        `;
        inner.textContent = pointCount.toString();
        wrapper.appendChild(inner);

        wrapper.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.1)';
        });
        wrapper.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
        });

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!superclusterRef.current || !map.current) return;
          
          const expansionZoom = Math.min(
            superclusterRef.current.getClusterExpansionZoom(feature.properties.cluster_id),
            18
          );
          map.current.flyTo({ 
            center: [lng, lat], 
            zoom: expansionZoom,
            duration: 500
          });
        });

        const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      } else {
        // SINGLE event marker - einheitliche Farbe
        const event = feature.properties.event as MapEvent;
        const isElite = event.buzz_boost === 100;
        
        const wrapper = document.createElement('div');
        const fallbackImage = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200';
        const imageUrl = event.image_url && event.image_url.trim() !== '' ? event.image_url : fallbackImage;
        
        if (showImages) {
          // Large marker with image - einheitliche Farbe
          const size = 56;
          wrapper.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            cursor: pointer;
            position: relative;
          `;

          const inner = document.createElement('div');
          inner.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid #78716c;
            background-color: #78716c;
            background-size: cover;
            background-position: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            transition: transform 0.2s ease;
          `;
          
          const img = new Image();
          img.onload = () => {
            inner.style.backgroundImage = `url('${imageUrl}')`;
            inner.style.backgroundColor = 'transparent';
          };
          img.onerror = () => {
            inner.style.backgroundImage = `url('${fallbackImage}')`;
          };
          img.src = imageUrl;
          inner.style.backgroundImage = `url('${imageUrl}')`;
          
          wrapper.appendChild(inner);

          if (isElite) {
            const badge = document.createElement('div');
            badge.className = 'elite-badge';
            badge.textContent = '⭐';
            wrapper.appendChild(badge);
          }

          wrapper.addEventListener('mouseenter', () => {
            inner.style.transform = 'scale(1.1)';
          });
          wrapper.addEventListener('mouseleave', () => {
            inner.style.transform = 'scale(1)';
          });
        } else {
          // Small marker - einheitliche Farbe, kein Ring
          wrapper.style.cssText = `
            width: 28px;
            height: 28px;
            cursor: pointer;
            position: relative;
          `;

          const inner = document.createElement('div');
          inner.style.cssText = `
            width: 100%;
            height: 100%;
            background: #78716c;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            transition: transform 0.2s ease;
          `;
          wrapper.appendChild(inner);

          if (isElite) {
            const badge = document.createElement('div');
            badge.style.cssText = `
              position: absolute;
              top: -4px;
              right: -4px;
              background: #FFD700;
              border-radius: 50%;
              width: 14px;
              height: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            `;
            badge.textContent = '⭐';
            wrapper.appendChild(badge);
          }

          wrapper.addEventListener('mouseenter', () => {
            inner.style.transform = 'scale(1.2)';
          });
          wrapper.addEventListener('mouseleave', () => {
            inner.style.transform = 'scale(1)';
          });
        }

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: showImages ? 35 : 20,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '220px'
        }).setHTML(createPopupHTML(event));

        const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onEventClick) {
            onEventClick(event.id);
          }
        });

        markersRef.current.push(marker);
      }
    });

    console.log(`Rendered ${clusters.length} markers/clusters`);
  }, [onEventClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [8.2275, 46.8182],
      zoom: 7.5,
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      if (map.current) {
        map.current.addSource('countries', {
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1'
        });
        
        map.current.addLayer({
          id: 'country-dim',
          type: 'fill',
          source: 'countries',
          'source-layer': 'country_boundaries',
          filter: ['!=', ['get', 'iso_3166_1'], 'CH'],
          paint: {
            'fill-color': '#6b7280',
            'fill-opacity': 0.35
          }
        }, 'country-label');
        
        map.current.addLayer({
          id: 'switzerland-border',
          type: 'line',
          source: 'countries',
          'source-layer': 'country_boundaries',
          filter: ['==', ['get', 'iso_3166_1'], 'CH'],
          paint: {
            'line-color': '#ef4444',
            'line-width': 2.5,
            'line-opacity': 0.8
          }
        });
      }
      
      setMapReady(true);
      loadEventsInView();
    });

    map.current.on('moveend', debouncedLoad);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [loadEventsInView, debouncedLoad]);

  // Initialize Supercluster when filtered events change
  useEffect(() => {
    if (filteredEvents.length === 0) {
      superclusterRef.current = null;
      markersRef.current.forEach(m => m.remove());
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
        categoryCounts: { [props.category]: 1 }
      }),
      reduce: (accumulated: any, props: any) => {
        accumulated.categoryCounts = accumulated.categoryCounts || {};
        for (const [cat, count] of Object.entries(props.categoryCounts || {})) {
          accumulated.categoryCounts[cat] = (accumulated.categoryCounts[cat] || 0) + (count as number);
        }
      }
    });

    // Convert events to GeoJSON features with category
    // Use mapbox_lng/lat for accurate positioning (already normalized in mapping above)
    // Round to 6 decimal places for consistent precision (~0.1m accuracy)
    const points: EventFeature[] = filteredEvents.map(event => {
      const lng = Number((event.mapbox_lng ?? event.longitude).toFixed(6));
      const lat = Number((event.mapbox_lat ?? event.latitude).toFixed(6));
      return {
        type: 'Feature',
        properties: {
          cluster: false,
          eventId: event.id,
          event: event,
          category: getCategoryForEvent(event)
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
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

    map.current.on('zoomend', handleMove);
    map.current.on('moveend', handleMove);

    return () => {
      map.current?.off('zoomend', handleMove);
      map.current?.off('moveend', handleMove);
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
              { key: 'wellness', label: 'Wellness' },
              { key: 'nature', label: 'Natur' },
              { key: 'culture', label: 'Kultur' },
              { key: 'markets', label: 'Märkte' },
              { key: 'elite', label: 'Elite ⭐' }
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div 
                  className="w-3 h-3 rounded-full border-2" 
                  style={{ borderColor: CATEGORY_COLORS[item.key as CategoryType], backgroundColor: 'white' }}
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