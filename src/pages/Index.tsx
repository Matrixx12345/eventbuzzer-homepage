import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UnifiedEventsGrid from "@/components/UnifiedEventsGrid";
import TripPlannerSidebar from "@/components/TripPlannerSidebar";
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
        
        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex gap-8">
            {/* Left: Event Grids */}
            <div className="flex-1 min-w-0">
              <ErrorBoundary>
                <UnifiedEventsGrid 
                  title="Verpasse nicht an diesem Wochenende:"
                  sourceFilter="myswitzerland"
                  onEventClick={openEvent}
                  maxEvents={9}
                />
              </ErrorBoundary>

              <ErrorBoundary>
                <UnifiedEventsGrid 
                  title="Familien-Abenteuer:" 
                  tagFilter="familie-freundlich"
                  onEventClick={openEvent}
                  maxEvents={6}
                />
              </ErrorBoundary>

              <ErrorBoundary>
                <UnifiedEventsGrid 
                  title="Wärmende Indoor-Erlebnisse:" 
                  tagFilter="mistwetter"
                  onEventClick={openEvent}
                  maxEvents={6}
                />
              </ErrorBoundary>

              <ErrorBoundary>
                <UnifiedEventsGrid 
                  title="Die Schweizer Top Erlebnisse:" 
                  tagFilter="elite"
                  onEventClick={openEvent}
                  maxEvents={6}
                />
              </ErrorBoundary>
            </div>

            {/* Right: Trip Planner Sidebar */}
            <TripPlannerSidebar onEventClick={openEvent} />
          </div>
        </div>
      </main>
      
      {/* Global Event Detail Modal */}
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
