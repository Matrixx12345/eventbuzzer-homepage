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
        <meta property="og:title" content="EventBuzzer - Entdecke Events in der Schweiz" />
        <meta property="og:description" content="Finde die besten Events, Konzerte, Festivals und Aktivitäten in der Schweiz." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={SITE_URL} />

        {/* Schema.org Organization & Website Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "EventBuzzer",
                "url": SITE_URL,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${SITE_URL}/og-image.jpg`,
                  "width": 1200,
                  "height": 630
                },
                "description": "Entdecke über 1400 Events, Konzerte, Festivals und Aktivitäten in der Schweiz",
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "CH"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Schweiz"
                }
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "url": SITE_URL,
                "name": "EventBuzzer",
                "description": "Entdecke über 1400 Events, Konzerte, Festivals und Aktivitäten in der Schweiz",
                "publisher": {
                  "@id": `${SITE_URL}/#organization`
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${SITE_URL}/eventlist1?search={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}
        </script>
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
    </div>
  );
};

export default Index;
