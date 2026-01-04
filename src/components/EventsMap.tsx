import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin } from "lucide-react";
import { MapEvent } from "@/types/map";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue - use CDN URLs
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icon
const createCustomIcon = (isHighlighted = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="w-8 h-8 ${isHighlighted ? 'bg-red-500' : 'bg-neutral-900'} rounded-full flex items-center justify-center shadow-lg border-2 border-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface EventsMapProps {
  onEventsChange: (events: MapEvent[]) => void;
  onEventClick: (eventId: string) => void;
  events: MapEvent[];
}

export const EventsMap = ({ onEventsChange, onEventClick, events }: EventsMapProps) => {
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Switzerland center
  const center: [number, number] = [46.8182, 8.2275];
  const defaultZoom = 8;

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "d. MMM yyyy", { locale: de });
    } catch {
      return "";
    }
  };

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    if (map && !mapRef.current) {
      mapRef.current = map;
      setMapReady(true);
    }
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-neutral-200">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-neutral-600" />
          <span className="text-sm text-neutral-700">Lädt Events...</span>
        </div>
      )}

      {/* Event count badge */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
        <span className="text-sm font-medium text-neutral-700">{events.length} Events</span>
      </div>

      <MapContainer
        center={center}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: "#f5f5f5" }}
        ref={handleMapReady}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createCustomIcon(event.buzz_score != null && event.buzz_score > 50)}
            eventHandlers={{
              click: () => onEventClick(event.external_id || event.id),
            }}
          >
            <Popup className="custom-popup">
              <div className="w-64 p-0">
                {event.image_url && (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2 mb-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
                    <MapPin size={12} />
                    <span>{event.address_city || event.venue_name || "Schweiz"}</span>
                  </div>
                  {event.start_date && (
                    <p className="text-neutral-400 text-xs">{formatEventDate(event.start_date)}</p>
                  )}
                  <button
                    onClick={() => onEventClick(event.external_id || event.id)}
                    className="mt-2 w-full bg-neutral-900 text-white text-xs font-medium py-1.5 px-3 rounded-md hover:bg-neutral-800 transition-colors"
                  >
                    Details ansehen
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default EventsMap;