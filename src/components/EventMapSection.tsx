import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import EventsMap from "@/components/EventsMap";
import { cn } from "@/lib/utils";

interface EventMapSectionProps {
  onEventsChange: (events: any[]) => void;
  onEventClick: (eventId: string) => void;
  selectedEventIds: string[];
  hoveredEventId: string | null;
  categoryId: number | null | string;
  showOnlyEliteAndFavorites?: boolean;
}

const EventMapSection = ({
  onEventsChange,
  onEventClick,
  selectedEventIds,
  hoveredEventId,
  categoryId,
  showOnlyEliteAndFavorites = false,
}: EventMapSectionProps) => {
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <div
      className={cn(
        "flex-shrink-0 transition-all duration-300 sticky top-36",
        mapExpanded ? "w-[45%]" : "w-[35%] mr-4"
      )}
    >
      <div
        className={cn(
          "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 transition-all duration-300",
          mapExpanded ? "h-[calc(100vh-200px)] w-full" : "h-[340px] w-full"
        )}
      >
        <EventsMap
          onEventsChange={onEventsChange}
          onEventClick={onEventClick}
          isVisible={true}
          selectedEventIds={selectedEventIds}
          hoveredEventId={hoveredEventId}
          showOnlyEliteAndFavorites={showOnlyEliteAndFavorites}
          customControls={true}
          categoryId={categoryId}
        />

        <button
          onClick={() => setMapExpanded(!mapExpanded)}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label={mapExpanded ? "Karte verkleinern" : "Karte vergrößern"}
        >
          {mapExpanded ? (
            <Minimize2 size={18} className="text-gray-700" />
          ) : (
            <Maximize2 size={18} className="text-gray-700" />
          )}
        </button>
      </div>
    </div>
  );
};

export default EventMapSection;
