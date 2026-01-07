import { useEffect, useState } from "react";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";
import { getNearestPlace } from "@/utils/swissPlaces";
import UnifiedEventCard from "./UnifiedEventCard";

interface UnifiedEventsGridProps {
  title: string;
  tagFilter?: string;
  sourceFilter?: string;
  onEventClick?: (eventId: string) => void;
  maxEvents?: number;
}

// Helper to get location
const getEventLocation = (event: any): string => {
  const countryNames = ["schweiz", "switzerland", "suisse", "svizzera", "germany", "deutschland"];
  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };

  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) {
    return city;
  }

  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) {
    return event.venue_name.trim();
  }

  if (event.location && !isCountry(event.location)) {
    return event.location.trim();
  }

  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }
  return "Schweiz";
};

const UnifiedEventsGrid = ({ 
  title, 
  tagFilter,
  sourceFilter,
  onEventClick,
  maxEvents = 9
}: UnifiedEventsGridProps) => {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const events = allEvents.filter(e => !hiddenIds.has(e.external_id)).slice(0, maxEvents);

  useEffect(() => {
    async function loadEvents() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let query = supabase
          .from("events")
          .select("*")
          .eq("hide_from_homepage", false)
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${nextWeek}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(maxEvents * 3);

        if (tagFilter) {
          query = query.contains("tags", [tagFilter]);
        }
        
        if (sourceFilter) {
          query = query.eq("source", sourceFilter);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error loading events:`, error);
          return;
        }

        // Load Buzz-Overrides
        const externalIds = (data || []).map(e => e.external_id).filter(Boolean);
        let overridesMap: Record<string, number> = {};
        
        if (externalIds.length > 0) {
          const { data: overrides } = await cloudSupabase
            .from("event_vibe_overrides")
            .select("external_id, buzz_boost")
            .in("external_id", externalIds);
          
          if (overrides) {
            overridesMap = Object.fromEntries(
              overrides
                .filter(o => o.buzz_boost !== null && o.buzz_boost > 10)
                .map(o => [o.external_id, o.buzz_boost])
            );
          }
        }

        // Filter blacklisted
        const BLACKLIST = ["hop-on-hop-off", "schafe", "sheep", "disc golf"];
        let filtered = (data || []).filter(event => {
          const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
          return !BLACKLIST.some(keyword => searchText.includes(keyword));
        });

        // Apply overrides
        filtered = filtered.map(event => ({
          ...event,
          buzz_score: overridesMap[event.external_id] ?? event.buzz_score
        }));

        setAllEvents(filtered.slice(0, maxEvents * 2));
      } catch (error) {
        console.error(`Error loading events:`, error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [tagFilter, sourceFilter, maxEvents]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="mb-6">
          <h2 className="text-xl font-serif text-foreground/80 tracking-wide">{title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const gridEvents = events.map(event => ({
    id: event.id,
    image: event.image_url,
    title: event.title,
    location: getEventLocation(event),
    slug: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    buzzScore: event.buzz_score,
    externalId: event.external_id
  }));

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-foreground/80 tracking-wide">{title}</h2>
      </div>
      
      {/* 3-column grid of square cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gridEvents.map(event => (
          <UnifiedEventCard 
            key={event.id}
            {...event}
            onBuzzChange={(newScore) => {
              setAllEvents(prev => prev.map(e => 
                e.id === event.id ? { ...e, buzz_score: newScore } : e
              ));
            }}
            onClick={() => onEventClick?.(event.id)}
            onHide={() => setHiddenIds(prev => new Set([...prev, event.externalId]))}
          />
        ))}
      </div>
    </section>
  );
};

export default UnifiedEventsGrid;
