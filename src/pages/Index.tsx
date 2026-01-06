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
        
        {/* Sandiger Hintergrund für alle Event-Sektionen */}
        <div className="bg-[#F5F0E8]">
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
