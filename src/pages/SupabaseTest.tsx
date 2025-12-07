import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";

interface Event {
  id: string;
  slug: string;
  title: string;
  venue: string;
  location: string;
  image: string;
  date?: string;
  is_popular?: boolean;
}

const SupabaseTest = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Test connection by querying events table
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events?select=*`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );

        if (response.status === 404 || response.status === 400) {
          setTableExists(false);
          setError("Table 'events' does not exist yet");
        } else if (!response.ok) {
          setError(`HTTP error: ${response.status}`);
        } else {
          const data = await response.json();
          setEvents(data || []);
        }
      } catch (err) {
        setError("Failed to connect to database");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif text-foreground mb-2">
          Supabase Test Page
        </h1>
        <p className="text-muted-foreground mb-8">
          Testing database connection and event cards
        </p>

        {/* Connection Status */}
        <div className="mb-8 p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Connection Status</h2>
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {error && <p className="text-destructive">Error: {error}</p>}
          {!loading && !error && (
            <p className="text-green-600">
              Connected! Found {events.length} events in database.
            </p>
          )}
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                slug={event.slug}
                image={event.image}
                title={event.title}
                venue={event.venue}
                location={event.location}
                date={event.date}
                isPopular={event.is_popular}
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No events found in database.</p>
              <p className="text-sm mt-2">
                Create an "events" table with columns: id, slug, title, venue, location, image, date, is_popular
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default SupabaseTest;
