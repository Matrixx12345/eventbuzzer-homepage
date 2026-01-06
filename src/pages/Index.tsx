import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CleanGridSection from "@/components/CleanGridSection";
import SideBySideSection from "@/components/SideBySideSection";
import EliteExperiencesSection from "@/components/EliteExperiencesSection";
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
        <div className="bg-[#F5F0E8] pt-16 pb-4">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="font-serif text-4xl text-[#1f1f1f] italic font-normal text-center">
              Oder entdecke unsere Auswahl ↓
            </h2>
          </div>
        </div>
        
        {/* Sandiger Hintergrund für alle Event-Sektionen */}
        <div className="bg-[#F5F0E8]">
          {/* Sektion 1: Verpasse nicht an diesem Wochenende - 3-Spalten-Grid (Clean Look) */}
          <ErrorBoundary>
            <CleanGridSection 
              title="Verpasse nicht an diesem Wochenende:"
              sourceFilter="myswitzerland"
              filterParam="source=myswitzerland"
              onEventClick={openEvent}
              maxEvents={3}
            />
          </ErrorBoundary>

          {/* Sektion 2: Familien-Abenteuer - Schwarzes Side-by-Side Layout */}
          <ErrorBoundary>
            <SideBySideSection 
              title="Familien-Abenteuer:" 
              tagFilter="familie-freundlich"
              filterParam="tags=familie-freundlich"
              onEventClick={openEvent}
              maxEvents={4}
            />
          </ErrorBoundary>

          {/* Sektion 3: Wärmende Indoor-Erlebnisse - 3-Spalten-Grid (Clean Look) */}
          <ErrorBoundary>
            <CleanGridSection 
              title="Wärmende Indoor-Erlebnisse:" 
              tagFilter="mistwetter"
              filterParam="tags=mistwetter"
              onEventClick={openEvent}
              maxEvents={3}
            />
          </ErrorBoundary>

          {/* Sektion 4: Die Schweizer Top Erlebnisse (elite Tag) - vorletzte Sektion */}
          <ErrorBoundary>
            <EliteExperiencesSection onEventClick={openEvent} />
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Global Event Detail Modal with URL sync */}
      <EventDetailModal 
        key={selectedEventId || "closed"}
        eventId={selectedEventId}
        open={modalOpen}
        onOpenChange={(open) => !open && closeEvent()}
        onEventSwap={swapEvent}
      />
    </div>
  );
};

export default Index;