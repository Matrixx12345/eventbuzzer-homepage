import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";
import RainyDaySection from "@/components/RainyDaySection";
import ChatbotPopup from "@/components/ChatbotPopup";
import { useChatbot } from "@/hooks/useChatbot";
import { Sparkles } from "lucide-react";

const Index = () => {
  const { isOpen, closeChatbot, openChatbot, hasBeenDismissed } = useChatbot();

  return <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Chatbot Popup */}
      <ChatbotPopup isOpen={isOpen} onClose={closeChatbot} />
      
      {/* Wizard Tab (when chatbot is closed) */}
      {!isOpen && hasBeenDismissed && (
        <button
          onClick={openChatbot}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md px-2 py-4 rounded-l-lg shadow-lg border border-r-0 border-gray-200/50 z-50 hover:bg-white transition-colors"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3 rotate-90" />
            Wizard
          </span>
        </button>
      )}
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
        <WeekendSection />
        <SwitzerlandSection />
        <RainyDaySection />
      </main>
    </div>;
};
export default Index;