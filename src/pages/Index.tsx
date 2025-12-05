import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";
import RainyDaySection from "@/components/RainyDaySection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <EventsSection />
        <WeekendSection />
        <SwitzerlandSection />
        <RainyDaySection />
      </main>
    </div>
  );
};

export default Index;
