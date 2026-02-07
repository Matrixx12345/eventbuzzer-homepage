import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import EventsMap from "@/components/EventsMap";
import { MobileTopDetailCard } from "@/components/MobileTopDetailCard";
import { useEventData } from "@/hooks/useEventData";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SITE_URL } from "@/config/constants";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useTravelpayoutsVerification } from "@/hooks/useTravelpayoutsVerification";

interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
  buzz_boost?: number | string;
  favorite_count?: number;
  category_main_id?: number;
  category_sub_id?: number;
  gallery_urls?: string[];
  url?: string;
  ticket_url?: string;
}

const EventMapPage = () => {
  useScrollToTop();
  useTravelpayoutsVerification();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mapRef = useRef<any>(null);

  // Get data from hooks (MUST be called before any early return)
  const { rawEvents, hoveredEventId, setHoveredEventId, handleMapEventsChange } = useEventData();
  const { favorites } = useFavorites();
  const { plannedEventsByDay, activeDay } = useTripPlanner();

  // Modal state for map clicks
  const [mapSelectedEvent, setMapSelectedEvent] = useState<Event | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const favoriteIds = favorites.map(f => f.id);

  // Memoize planned events for current day (MUST be before early return)
  const currentDayPlannedEvents = useMemo(
    () => plannedEventsByDay[activeDay] || [],
    [plannedEventsByDay, activeDay]
  );

  // Handle map pin clicks (works for both regular and planned events)
  const handleMapPinClick = useCallback((eventId: string) => {
    // First try to find in rawEvents
    let event = rawEvents.find(e => e.id === eventId);

    // If not found, try to find in planned events
    if (!event && currentDayPlannedEvents) {
      const plannedEvent = currentDayPlannedEvents.find(pe => pe.eventId === eventId);
      if (plannedEvent) {
        event = plannedEvent.event;
      }
    }

    if (event) {
      setMapSelectedEvent(event);
      setMapModalOpen(true);
    }
  }, [rawEvents, currentDayPlannedEvents]);

  // Close modal
  const closeMapModal = useCallback(() => {
    setMapModalOpen(false);
    setMapSelectedEvent(null);
  }, []);

  // No desktop redirect - page works on all devices
  // ViewModeSwitcher only shows on mobile in EventList1 anyway

  return (
    <div className="h-screen bg-[#F4F7FA] flex flex-col overflow-hidden">
      <Helmet>
        <title>Event-Karte | EventBuzzer</title>
        <meta name="description" content="Entdecke Events in der Schweiz auf der interaktiven Karte" />
        <meta property="og:title" content="Event-Karte | EventBuzzer" />
        <meta property="og:url" content={`${SITE_URL}/events/map`} />
        <link rel="canonical" href={`${SITE_URL}/events/map`} />
      </Helmet>

      <Navbar />

      {/* Back Button - Fixed at top */}
      <div className="flex-shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/eventlist1')}
          className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Zurück zur Liste</span>
        </button>
      </div>

      {/* Fullscreen Map - Click outside popup to close */}
      <div
        className="flex-1 relative min-h-0"
        onClick={() => {
          if (mapModalOpen) {
            closeMapModal();
          }
        }}
      >
        <EventsMap
          ref={mapRef}
          onEventsChange={handleMapEventsChange}
          onEventClick={handleMapPinClick}
          isVisible={true}
          selectedEventIds={favoriteIds}
          plannedEvents={currentDayPlannedEvents}
          activeDay={activeDay}
          hoveredEventId={hoveredEventId}
          showOnlyEliteAndFavorites={false}
          customControls={true}
          showPopups={false}
        />
      </div>

      {/* Event Detail Card - Slide from top */}
      {mapSelectedEvent && (
        <MobileTopDetailCard
          event={mapSelectedEvent}
          isOpen={mapModalOpen}
          onClose={closeMapModal}
        />
      )}
    </div>
  );
};

export default EventMapPage;
