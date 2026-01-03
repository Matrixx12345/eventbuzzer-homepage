import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";
import RainyDaySection from "@/components/RainyDaySection";
import ChatbotPopup from "@/components/ChatbotPopup";
import { useChatbot } from "@/hooks/useChatbot";
import { useEventModal } from "@/hooks/useEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  const { isOpen, closeChatbot, openChatbot } = useChatbot();
  const { selectedEventId, isOpen: modalOpen, openEvent, closeEvent, swapEvent } = useEventModal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Chatbot Popup */}
      <ChatbotPopup isOpen={isOpen} onClose={closeChatbot} onOpen={openChatbot} />
      
      <main>
        <HeroSection />
        
        {/* Discovery CTA */}
        <div className="bg-background pt-16 pb-4 text-center">
          <h2 className="font-serif text-4xl text-[#1f1f1f] italic font-normal text-center">
            Oder entdecke unsere Auswahl ↓
          </h2>
        </div>
        
        {/* TEMPORARILY HIDDEN - EventsSection (heute in deiner Nähe) - sag mir wenn du es reaktivieren möchtest */}
        {/* <EventsSection /> */}
        <ErrorBoundary>
          <WeekendSection onEventClick={openEvent} />
        </ErrorBoundary>
        <ErrorBoundary>
          <SwitzerlandSection onEventClick={openEvent} />
        </ErrorBoundary>
        <ErrorBoundary>
          <RainyDaySection onEventClick={openEvent} />
        </ErrorBoundary>
      </main>
      
      {/* Global Event Detail Modal with URL sync */}
      <EventDetailModal 
        eventId={selectedEventId}
        open={modalOpen}
        onOpenChange={(open) => !open && closeEvent()}
        onEventSwap={swapEvent}
      />
    </div>
  );
};

export default Index;