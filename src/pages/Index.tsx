import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";
import RainyDaySection from "@/components/RainyDaySection";
const Index = () => {
  return <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        
        {/* Discovery CTA */}
        <div className="bg-background pt-16 pb-4 text-center">
          <h2 className="font-serif text-4xl text-[#1f1f1f] italic font-normal text-center">
            Oder entdecke unsere Auswahl ↓
          </h2>
        </div>
        
        <EventsSection />
        <WeekendSection />
        <SwitzerlandSection />
        <RainyDaySection />
      </main>
    </div>;
};
export default Index;