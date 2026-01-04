import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
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

// Define GeoJSON feature type for Supercluster
interface EventFeature {
  type: 'Feature';
  properties: {
    cluster: false;
    eventId: string;
    event: MapEvent;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export function EventsMap({ events = [], onEventClick, onEventsChange }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const superclusterRef = useRef<Supercluster | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [internalEvents, setInternalEvents] = useState<MapEvent[]>([]);

  // Load events from Edge Function based on map bounds
  const loadEventsInView = useCallback(async () => {
    if (!map.current || !onEventsChange) return;
    
    setLoading(true);
    
    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;
      
      const { data, error } = await supabase.functions.invoke('get-external-events', {
        body: {
          limit: 100,
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

    // Get clusters for current viewport
    const clusters = superclusterRef.current.getClusters(bbox, zoom);

    clusters.forEach((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      const isCluster = feature.properties.cluster;

      const el = document.createElement('div');

      if (isCluster) {
        // CLUSTER marker with count
        const pointCount = feature.properties.point_count;
        const size = Math.min(60, 35 + Math.log2(pointCount) * 8);
        
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 4px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.min(18, 12 + Math.log2(pointCount) * 2)}px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          transition: transform 0.2s ease;
        `;
        el.textContent = pointCount.toString();

        // Hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        // Click: Zoom into cluster
        el.addEventListener('click', (e) => {
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

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      } else {
        // SINGLE event marker
        const event = feature.properties.event as MapEvent;
        
        // Wrapper for stable positioning
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width: 32px;
          height: 32px;
          cursor: pointer;
        `;

        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 100%;
          height: 100%;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        `;
        wrapper.appendChild(inner);

        // Hover effect
        wrapper.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.2)';
        });
        wrapper.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
        });

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '220px'
        }).setHTML(createPopupHTML(event));

        const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        // Click opens event detail
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
      style: 'mapbox://styles/mapbox/outdoors-v12',
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
        // Add Switzerland highlight
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

  // Initialize Supercluster when events change
  useEffect(() => {
    if (internalEvents.length === 0) {
      superclusterRef.current = null;
      // Clear markers if no events
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    // Create Supercluster instance
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0
    });

    // Convert events to GeoJSON features
    const points: EventFeature[] = internalEvents.map(event => ({
      type: 'Feature',
      properties: {
        cluster: false,
        eventId: event.id,
        event: event
      },
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude]
      }
    }));

    cluster.load(points as any);
    superclusterRef.current = cluster;

    console.log(`Supercluster initialized with ${points.length} points`);

    // Update markers
    if (mapReady) {
      updateMarkers();
    }
  }, [internalEvents, mapReady, updateMarkers]);

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

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
      
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Events werden geladen...</span>
        </div>
      )}
      
      {!loading && eventCount > 0 && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border">
          <span className="text-sm font-medium">{eventCount} Events sichtbar</span>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow-sm" />
          <span>Event-Standort</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ef4444] to-[#dc2626] border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">5</span>
          </div>
          <span>Cluster (Zoom zum Aufteilen)</span>
        </div>
      </div>
    </div>
  );
}

export default EventsMap;
