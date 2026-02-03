import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ActionPill from "@/components/ActionPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { getCategoryBySlug } from "@/config/categories";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { getCategoryLabel, getEventLocation, generateSlug } from "@/utils/eventUtilities";
import { Loader2 } from "lucide-react";

/**
 * CompactEventCard for City Category Pages
 * Same design as CategoryPage
 */
interface CompactEventCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  latitude?: number;
  longitude?: number;
  categoryLabel?: string;
  ticketUrl?: string;
  buzzScore?: number | null;
  startDate?: string;
}

const CompactEventCard = ({
  id,
  title,
  description,
  image,
  location,
  latitude,
  longitude,
  categoryLabel,
  ticketUrl,
  buzzScore,
  startDate
}: CompactEventCardProps) => {
  return (
    <Link to={`/event/${id}`} className="block cursor-pointer">
      <div className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-stone-300 shadow-md border border-stone-200 flex flex-col h-[420px]">
        {/* Image with premium treatment */}
        <div className="relative overflow-hidden h-[220px] flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-all duration-500
                       blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08]
                       group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0"
          />
          {/* Subtle Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />

          {/* Milky Category Pill - top left */}
          {categoryLabel && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                {categoryLabel}
              </span>
            </div>
          )}
        </div>

        {/* Content - unten */}
        <div className="p-5 px-6 flex flex-col justify-between flex-1">
          <div>
            {/* Location - subtle */}
            <div className="group/map relative inline-flex items-center mb-2">
              <span className="text-[11px] font-medium tracking-widest text-stone-400 uppercase">{location}</span>

              {latitude && longitude && (
                <div
                  className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-36 h-24 overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                      <div
                        className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm"
                        style={{
                          left: `${(longitude - 5.9) / (10.5 - 5.9) * 100}%`,
                          top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
                </div>
              )}
            </div>

            {/* Title - 2 lines */}
            <h3 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2 line-clamp-2 leading-tight">{title}</h3>

            {/* Description - 2 lines */}
            <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">{description}</p>
          </div>

          {/* Glassmorphism ActionPill - am Ende */}
          <div onClick={(e) => e.stopPropagation()}>
            <ActionPill
              eventId={id}
              slug={id}
              image={image}
              title={title}
              location={location}
              buzzScore={buzzScore}
              ticketUrl={ticketUrl}
              startDate={startDate}
              variant="light"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * CityCategoryPage - Location-specific category page
 * Route: /events/{city}/{category}
 * Example: /events/zuerich/museen, /events/bern/konzerte
 *
 * Shows events of a specific category in a specific city
 * Perfect for local SEO (e.g., "Museen in Zürich")
 */
const CityCategoryPage = () => {
  const { city, categorySlug } = useParams<{ city: string; categorySlug: string }>();
  const category = getCategoryBySlug(categorySlug || "");

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>("");

  useEffect(() => {
    const fetchEvents = async () => {
      if (!category || !city) {
        setError("Stadt oder Kategorie nicht gefunden");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all events
        const { data, error: fetchError } = await externalSupabase
          .from("events")
          .select("*")
          .range(0, 999)
          .order("buzz_score", { ascending: false, nullsFirst: false });

        if (fetchError) throw fetchError;

        // Filter events by category AND city
        const filtered = (data || []).filter((event) => {
          const eventCategory = getCategoryLabel(event);
          const eventLocation = getEventLocation(event);
          const eventCitySlug = generateSlug(eventLocation);

          const categoryMatch = eventCategory?.toLowerCase() === category.label.toLowerCase();
          const cityMatch = eventCitySlug === city;

          return categoryMatch && cityMatch;
        });

        // Extract the actual city name from first event (for display)
        if (filtered.length > 0) {
          setCityName(getEventLocation(filtered[0]));
        } else {
          // Fallback: capitalize city slug for display
          setCityName(city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, " "));
        }

        setEvents(filtered);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [city, categorySlug, category]);

  // 404 - Category not found
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Seite nicht gefunden | EventBuzzer</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Seite nicht gefunden</h1>
          <Link to="/eventlist1" className="text-indigo-600 hover:underline">
            Zurück zur Event-Liste
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_URL}/events/${city}/${category.slug}`;
  const pageTitle = `${category.label} in ${cityName || city} | EventBuzzer`;
  const pageDescription = `Entdecke die besten ${category.label.toLowerCase()} in ${cityName || city}. ${category.description}`;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <link rel="canonical" href={pageUrl} />

        {/* Schema.org CollectionPage structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": pageDescription,
            "url": pageUrl,
            "isPartOf": {
              "@type": "WebSite",
              "name": "EventBuzzer",
              "url": SITE_URL
            },
            "numberOfItems": events.length,
            "about": {
              "@type": "Place",
              "name": cityName || city
            }
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <Breadcrumb
            items={[
              { label: "Events", href: "/eventlist1" },
              { label: cityName || city, href: `/events/${city}` }
            ]}
            currentPage={category.label}
          />
        </div>
      </div>

      {/* Header Section */}
      <section className="bg-white py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
            {category.label} in {cityName || city}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            {pageDescription}
          </p>
          {!loading && (
            <p className="text-sm text-gray-500 mt-4">
              {events.length} {events.length === 1 ? "Event" : "Events"} gefunden
            </p>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 mb-4">
                Momentan keine {category.label.toLowerCase()} in {cityName || city} verfügbar.
              </p>
              <Link
                to={`/kategorie/${category.slug}`}
                className="text-indigo-600 hover:underline mr-4"
              >
                Alle {category.label} anzeigen
              </Link>
              <Link
                to="/eventlist1"
                className="text-indigo-600 hover:underline"
              >
                Alle Events anzeigen
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <CompactEventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description || event.short_description || ""}
                  image={event.image_url || "/placeholder.jpg"}
                  location={getEventLocation(event)}
                  latitude={event.latitude}
                  longitude={event.longitude}
                  categoryLabel={getCategoryLabel(event)}
                  ticketUrl={event.ticket_link}
                  buzzScore={event.buzz_score}
                  startDate={event.start_date}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CityCategoryPage;
