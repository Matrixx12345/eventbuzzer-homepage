import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";
import RainyDaySection from "@/components/RainyDaySection";
import ChatbotPopup from "@/components/ChatbotPopup";
import { useChatbot } from "@/hooks/useChatbot";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  const { isOpen, closeChatbot, openChatbot } = useChatbot();

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
          <WeekendSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <SwitzerlandSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <RainyDaySection />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default Index;