import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WeekendSection from "@/components/WeekendSection";
import DynamicEventSection from "@/components/DynamicEventSection";
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
        <div className="bg-background pt-16 pb-4 text-center">
          <h2 className="font-serif text-4xl text-[#1f1f1f] italic font-normal text-center">
            Oder entdecke unsere Auswahl ↓
          </h2>
        </div>
        
        {/* Sektion 1: Wochenende in deiner Nähe (bestehend) */}
        <ErrorBoundary>
          <WeekendSection onEventClick={openEvent} />
        </ErrorBoundary>

        {/* Sektion 2: Familien-Abenteuer (familie-freundlich Tag) */}
        <ErrorBoundary>
          <DynamicEventSection 
            title="Familien-Abenteuer:" 
            tagFilter="familie-freundlich"
            filterParam="tags=familie-freundlich"
            onEventClick={openEvent}
            maxEvents={12}
          />
        </ErrorBoundary>

        {/* Sektion 3: Wärmende Indoor-Erlebnisse (mistwetter Tag) */}
        <ErrorBoundary>
          <DynamicEventSection 
            title="Wärmende Indoor-Erlebnisse:" 
            tagFilter="mistwetter"
            filterParam="tags=mistwetter"
            onEventClick={openEvent}
            maxEvents={12}
          />
        </ErrorBoundary>

        {/* Sektion 4: Die Schweizer Top Erlebnisse (elite Tag) - vorletzte Sektion */}
        <ErrorBoundary>
          <EliteExperiencesSection onEventClick={openEvent} />
        </ErrorBoundary>
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