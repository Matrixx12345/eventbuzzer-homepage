import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Mapbox public token
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0cml4eDEyMyIsImEiOiJjbWp6eXUwOTAwZTk4M2ZzaTkycTg4eGs1In0.fThJ64zR4-7gi-ONMtglfQ';

export interface MapEvent {
  id: string;
  external_id?: string;
  title: string;
  venue_name?: string;
  address_city?: string;
  image_url?: string;
  start_date?: string;
  latitude: number;
  longitude: number;
  buzz_score?: number;
  price_from?: number;
  price_to?: number;
}

interface EventsMapProps {
  events?: MapEvent[];
  onEventClick?: (eventId: string) => void;
  onEventsChange?: (events: MapEvent[]) => void;
}

// Group markers by location (rounded to 4 decimals)
const groupMarkersByLocation = (events: MapEvent[]): Map<string, MapEvent[]> => {
  const groups = new Map<string, MapEvent[]>();
  
  events.forEach(event => {
    if (event.latitude && event.longitude) {
      const key = `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`;
      const existing = groups.get(key) || [];
      existing.push(event);
      groups.set(key, existing);
    }
  });
  
  return groups;
};

// Calculate spider positions for overlapping markers
const getSpiderPositions = (count: number, centerLng: number, centerLat: number, radiusMeters: number = 50) => {
  const positions: { lng: number; lat: number }[] = [];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos(centerLat * Math.PI / 180);
  
  for (let i = 0; i < count; i++) {
    const angle = (i * 360 / count) * (Math.PI / 180);
    const offsetLng = (radiusMeters * Math.cos(angle)) / metersPerDegreeLng;
    const offsetLat = (radiusMeters * Math.sin(angle)) / metersPerDegreeLat;
    positions.push({
      lng: centerLng + offsetLng,
      lat: centerLat + offsetLat
    });
  }
  
  return positions;
};

export function EventsMap({ events = [], onEventClick, onEventsChange }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const spideredMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // Load events from Edge Function based on map bounds
  const loadEventsInView = useCallback(async () => {
    if (!map.current || !onEventsChange) return;
    
    setLoading(true);
    
    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;
      
      // Use edge function with geo bounding box filter
      const { data, error } = await supabase.functions.invoke('get-external-events', {
        body: {
          limit: 50,
          offset: 0,
          filters: {
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
            minLng: bounds.getWest(),
            maxLng: bounds.getEast()
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
          buzz_score: e.buzz_score,
          price_from: e.price_from,
          price_to: e.price_to
        }));
        
        onEventsChange(mappedEvents);
        setEventCount(mappedEvents.length);
        console.log(`Loaded ${mappedEvents.length} events in view`);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [onEventsChange]);

  // Debounced load on map move
  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadEventsInView();
    }, 300);
  }, [loadEventsInView]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [8.2275, 46.8182], // Switzerland center
      zoom: 7.5,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Load events on map ready
    map.current.on('load', () => {
      setMapReady(true);
      loadEventsInView();
    });

    // Reload events on map move
    map.current.on('moveend', debouncedLoad);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      markersRef.current.forEach(marker => marker.remove());
      spideredMarkersRef.current.forEach(marker => marker.remove());
      if (popupRef.current) popupRef.current.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [loadEventsInView, debouncedLoad]);

  // Clear spidered markers
  const clearSpideredMarkers = useCallback(() => {
    spideredMarkersRef.current.forEach(marker => marker.remove());
    spideredMarkersRef.current = [];
  }, []);

  // Create popup HTML
  const createPopupHTML = (event: MapEvent) => {
    const imageUrl = event.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400';
    const city = event.address_city || event.venue_name || '';
    
    return `
      <div style="width: 200px; cursor: pointer;" class="event-popup">
        <img 
          src="${imageUrl}" 
          alt="${event.title}"
          style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px 6px 0 0;"
          onerror="this.src='https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400'"
        />
        <div style="padding: 8px;">
          <div style="font-weight: 600; font-size: 14px; line-height: 1.3; color: #1a1a1a; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.title}
          </div>
          ${city ? `<div style="font-size: 12px; color: #666;">${city}</div>` : ''}
          ${event.buzz_score ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">🔥 Buzz: ${event.buzz_score.toFixed(1)}</div>` : ''}
        </div>
      </div>
    `;
  };

  // Create marker element
  const createMarkerElement = (event: MapEvent, isStacked: boolean = false, stackCount: number = 0) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;
    
    // Add stack indicator if multiple events at same location
    if (isStacked && stackCount > 1) {
      el.innerHTML = `<span style="color: white; font-weight: bold; font-size: 12px;">${stackCount}</span>`;
    }
    
    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });
    
    return el;
  };

  // Handle spider animation for overlapping markers
  const spiderMarkers = useCallback((groupedEvents: MapEvent[], centerLng: number, centerLat: number) => {
    if (!map.current) return;
    
    // Clear existing spidered markers
    clearSpideredMarkers();
    
    // Calculate spider positions
    const zoom = map.current.getZoom();
    const radiusMeters = Math.max(30, 100 - zoom * 5); // Smaller radius at higher zoom
    const positions = getSpiderPositions(groupedEvents.length, centerLng, centerLat, radiusMeters);
    
    // Create spidered markers
    groupedEvents.forEach((event, index) => {
      const el = createMarkerElement(event);
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([positions[index].lng, positions[index].lat])
        .addTo(map.current!);
      
      // Create popup for this marker
      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '220px'
      }).setHTML(createPopupHTML(event));
      
      // Hover shows popup
      el.addEventListener('mouseenter', () => {
        marker.setPopup(popup);
        popup.addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!popup.isOpen() || !popup.getElement()?.matches(':hover')) {
            popup.remove();
          }
        }, 100);
      });
      
      // Click opens event detail
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onEventClick) {
          onEventClick(event.id);
        }
      });
      
      spideredMarkersRef.current.push(marker);
    });
    
    // Add line from center to each spidered marker
    // (visual connection effect - optional, skip for performance)
  }, [clearSpideredMarkers, onEventClick]);

  // Update markers when events change
  useEffect(() => {
    if (!map.current || !mapReady) {
      console.log('Map not ready:', { mapExists: !!map.current, mapReady });
      return;
    }
    
    console.log('Updating markers for', events.length, 'events');
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    clearSpideredMarkers();
    
    // Debug: Check events data
    const eventsWithCoords = events.filter(e => e.latitude && e.longitude);
    console.log('Events with coordinates:', eventsWithCoords.length);
    if (eventsWithCoords.length > 0) {
      console.log('Sample event:', eventsWithCoords[0]);
    }
    
    // Group events by location
    const groups = groupMarkersByLocation(events);
    console.log('Marker groups:', groups.size);
    
    groups.forEach((groupedEvents, key) => {
      const [lat, lng] = key.split(',').map(Number);
      const isStacked = groupedEvents.length > 1;
      const primaryEvent = groupedEvents[0];
      
      console.log(`Creating marker at [${lng}, ${lat}] for:`, primaryEvent.title);
      
      const el = createMarkerElement(primaryEvent, isStacked, groupedEvents.length);
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      
      console.log('Marker added to map');
      
      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '220px'
      }).setHTML(
        isStacked 
          ? `<div style="padding: 8px; text-align: center;"><strong>${groupedEvents.length} Events</strong><br><small>Klicken zum Auffächern</small></div>`
          : createPopupHTML(primaryEvent)
      );
      
      // Hover shows popup
      el.addEventListener('mouseenter', () => {
        marker.setPopup(popup);
        popup.addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        setTimeout(() => {
          popup.remove();
        }, 100);
      });
      
      // Click behavior
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isStacked) {
          // Spider animation for stacked markers
          spiderMarkers(groupedEvents, lng, lat);
        } else {
          // Open event detail for single marker
          if (onEventClick) {
            onEventClick(primaryEvent.id);
          }
        }
      });
      
      markersRef.current.push(marker);
    });
    
    console.log('Total markers created:', markersRef.current.length);
    setEventCount(events.length);
  }, [events, mapReady, onEventClick, spiderMarkers, clearSpideredMarkers]);

  // Click on map to close spidered markers
  useEffect(() => {
    if (!map.current) return;
    
    const handleMapClick = () => {
      clearSpideredMarkers();
    };
    
    map.current.on('click', handleMapClick);
    
    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [clearSpideredMarkers]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border shadow-lg">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Events werden geladen...</span>
        </div>
      )}
      
      {/* Event Count Badge */}
      {!loading && eventCount > 0 && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border">
          <span className="text-sm font-medium">{eventCount} Events sichtbar</span>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow-sm" />
          <span>Event-Standort</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">3</span>
          </div>
          <span>Mehrere Events (klicken)</span>
        </div>
      </div>
    </div>
  );
}

export default EventsMap;
