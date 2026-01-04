import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapEvent } from "@/types/map";

interface EventsMapProps {
  onEventsChange?: (events: MapEvent[]) => void;
  onEventClick?: (eventId: string) => void;
  events?: MapEvent[];
}

export function EventsMap({ events = [], onEventsChange, onEventClick }: EventsMapProps) {
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-neutral-200">
      <MapContainer
        center={[46.8182, 8.2275]}
        zoom={8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
      </MapContainer>
    </div>
  );
}

export default EventsMap;