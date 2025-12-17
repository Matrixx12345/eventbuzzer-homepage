import { Zap } from "lucide-react";
import EventCard from "./EventCard";

import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";

const events = [
  {
    id: "einsiedeln-abbey",
    slug: "einsiedeln-abbey",
    image: eventAbbey,
    title: "Photo Spot Einsiedeln Abbey",
    venue: "Leonard House",
    location: "Einsiedeln (SZ)",
    isPopular: true,
    latitude: 47.1267,
    longitude: 8.7511,
    a,
  },
  {
    id: "nordportal",
    slug: "nordportal",
    image: eventVenue,
    title: "Nordportal",
    venue: "Leonard House",
    location: "Baden (AG)",
    isPopular: true,
    latitude: 47.4733,
    longitude: 8.3081,
  },
  {
    id: "kulturbetrieb-royal",
    slug: "kulturbetrieb-royal",
    image: eventConcert,
    title: "Kulturbetrieb Royal",
    venue: "Leonard House",
    location: "Baden (AG)",
    isPopular: true,
    latitude: 47.4733,
    longitude: 8.3081,
  },
  {
    id: "zurich-tonhalle",
    slug: "zurich-tonhalle",
    image: eventSymphony,
    title: "Zurich Tonhalle",
    venue: "Tonhalle Orchestra",
    location: "Zürich (ZH)",
    isPopular: true,
    latitude: 47.3769,
    longitude: 8.5417,
  },
];

const EventsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-muted-foreground">
            Discover what's buzzing:
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Zap size={20} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Right now in your area</span>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <div key={event.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              {/* {...event} schickt jetzt automatisch latitude/longitude an die Card */}
              <EventCard {...event} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
