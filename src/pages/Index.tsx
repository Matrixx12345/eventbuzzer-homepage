import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import HighlightsHero from "@/components/HighlightsHero";
import CleanGridSection from "@/components/CleanGridSection";
import SideBySideSection from "@/components/SideBySideSection";
import EliteExperiencesSection from "@/components/EliteExperiencesSection";
import { useEventModal } from "@/hooks/useEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import MobileBottomNav from "@/components/MobileBottomNav";

const Index = () => {
  useScrollToTop();
  const { selectedEventId, isOpen: modalOpen, openEvent: openEventModal, closeEvent: closeEventModal, swapEvent } = useEventModal();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch event data when selectedEventId changes
  useEffect(() => {
    const fetchEvent = async () => {
      if (selectedEventId && modalOpen) {
        const { data: event } = await supabase
          .from("events")
          .select("*")
          .eq("id", selectedEventId)
          .single();

        if (event) {
          setSelectedEvent(event);
        }
      } else {
        setSelectedEvent(null);
      }
    };

    fetchEvent();
  }, [selectedEventId, modalOpen]);

  // Wrapper to open modal and fetch event
  const openEvent = (eventId: string) => {
    openEventModal(eventId);
  };

  // Wrapper to close modal and clear event
  const closeEvent = () => {
    closeEventModal();
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>EventBuzzer - Entdecke Events in der Schweiz</title>
        <meta name="description" content="Finde die besten Events, Konzerte, Festivals und Aktivitäten in der Schweiz. Von Zürich bis Genf - entdecke unvergessliche Erlebnisse auf EventBuzzer." />
        <meta name="google-site-verification" content="Gy-ddUrDm4Bp3Hqs6ayDcsh-1U_PXP7ZPTBewWdSSBE" />
        <meta name="p:domain_verify" content="408e9123d6ecb536115fd720ac898a2d"/>
        <meta property="og:title" content="EventBuzzer Highlights - Kuratierte Events in der Schweiz" />
        <meta property="og:description" content="Entdecke unsere kuratierten Event-Highlights: MySwitzerland Favoriten, Familien-Abenteuer und Top-Erlebnisse." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/highlights`} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={`${SITE_URL}/highlights`} />
      </Helmet>

      <Navbar bgColor="bg-[#F5F0E8]/80" />

      <main>
        <HighlightsHero />

        {/* Sandiger Hintergrund für alle Event-Sektionen */}
        <div className="bg-[#F5F0E8] pt-8">
          {/* Sektion 1: Verpasse nicht an diesem Wochenende - Karussell */}
          <ErrorBoundary>
            <CleanGridSection 
              title="Verpasse nicht an diesem Wochenende:"
              sourceFilter="myswitzerland"
              filterParam="source=myswitzerland"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 2: Familien-Abenteuer - Karussell */}
          <ErrorBoundary>
            <SideBySideSection 
              title="Familien-Abenteuer:" 
              tagFilter="familie-freundlich"
              filterParam="tags=familie-freundlich"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 3: Wärmende Indoor-Erlebnisse - Karussell */}
          <ErrorBoundary>
            <CleanGridSection 
              title="Wärmende Indoor-Erlebnisse:" 
              tagFilter="mistwetter"
              filterParam="tags=mistwetter"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 4: Die Schweizer Top Erlebnisse - Karussell */}
          <ErrorBoundary>
            <EliteExperiencesSection onEventClick={openEvent} />
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Global Event Detail Modal with URL sync */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={closeEvent}
          variant="solid"
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Index;
