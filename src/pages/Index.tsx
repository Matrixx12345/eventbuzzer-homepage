import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import WeekendSection from "@/components/WeekendSection";
import SwitzerlandSection from "@/components/SwitzerlandSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <EventsSection />
        <WeekendSection />
        <SwitzerlandSection />
      </main>
    </div>
  );
};

export default Index;
