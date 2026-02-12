import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ActionPill from "@/components/ActionPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { getCategoryBySlug, CATEGORIES } from "@/config/categories";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { getCategoryLabel, getEventLocation, generateSlug } from "@/utils/eventUtilities";
import { Loader2 } from "lucide-react";
import { EventDetailModal } from "@/components/EventDetailModal";

/**
 * CompactEventCard for Category Pages
 * Same design as SideBySideSection CompactCard
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
  fullEvent?: any; // Full event object for trip planner
  onClick?: (e: React.MouseEvent) => void;
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
  startDate,
  fullEvent,
  onClick
}: CompactEventCardProps) => {
  return (
    <div onClick={onClick} className="block cursor-pointer relative hover:z-[100]">
      <div className="bg-white rounded-2xl overflow-visible group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-stone-300 shadow-md border border-stone-200 flex flex-col h-[420px]">
        {/* Image with premium treatment */}
        <div className="relative overflow-hidden h-[220px] flex-shrink-0 rounded-t-2xl">
          <img
            src={image}
            alt={`${title} in ${location} - Event Tickets Schweiz`}
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

            {/* Title - 1 line */}
            <h3 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2 line-clamp-1 leading-tight">{title}</h3>

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
              event={fullEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CategoryPage - General category landing page
 * Route: /kategorie/{slug}
 * Example: /kategorie/museen, /kategorie/konzerte
 *
 * Shows all events of a category across Switzerland
 */
const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug || "");

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!category) {
        setError("Kategorie nicht gefunden");
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

        // Filter events by category keywords
        const filtered = (data || []).filter((event) => {
          const label = getCategoryLabel(event);
          if (!label) return false;

          // Compare slugs: Museum → museum, Museen → museen
          const eventCategorySlug = generateSlug(label);
          return eventCategorySlug === category.slug;
        });

        setEvents(filtered);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [slug]);  // Only slug - category is derived from slug and causes loop if included

  // 404 - Category not found
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Kategorie nicht gefunden | EventBuzzer</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Kategorie nicht gefunden</h1>
          <Link to="/eventlist1" className="text-indigo-600 hover:underline">
            Zurück zur Event-Liste
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_URL}/kategorie/${category.slug}`;
  const pageTitle = `${category.label} Schweiz - Events, Tickets & Tipps | EventBuzzer`;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={category.description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={category.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={category.description} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={pageUrl} />

        {/* Schema.org CollectionPage structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": category.description,
            "url": pageUrl,
            "isPartOf": {
              "@type": "WebSite",
              "name": "EventBuzzer",
              "url": SITE_URL
            },
            "numberOfItems": events.length
          })}
        </script>

        {/* Breadcrumb Schema for rich snippets in Google Search */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "EventBuzzer",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Events",
                "item": `${SITE_URL}/eventlist1`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": category.label,
                "item": pageUrl
              }
            ]
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <Breadcrumb
            items={[
              { label: "Events", href: "/eventlist1" }
            ]}
            currentPage={category.label}
          />
        </div>
      </div>

      {/* Header Section */}
      <section className="bg-white py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
            {category.label} in der Schweiz
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            {category.description}
          </p>
          {!loading && (
            <p className="text-sm text-gray-500 mt-4">
              {events.length} {events.length === 1 ? "Event" : "Events"} gefunden
            </p>
          )}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="bg-white py-8 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="prose max-w-none text-gray-700 space-y-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-3">
                Die besten {category.label} in der Schweiz
              </h2>
              <p>
                Die Schweiz ist bekannt für ihre erstklassigen {category.label.toLowerCase()} – von weltberühmten Veranstaltungen
                in Zürich, Genf und Basel bis zu charmanten Events in kleineren Städten und Regionen. Entdecke die ganze Vielfalt
                der Schweizer Eventlandschaft und finde genau das Erlebnis, das zu dir passt. Ob spontaner Ausflug oder geplante
                Wochenendaktivität – hier findest du alle aktuellen {category.label.toLowerCase()} mit Tickets und Bewertungen.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-3">
                Warum {category.label} in der Schweiz besuchen?
              </h2>
              <p>
                EventBuzzer zeigt dir die besten {category.label.toLowerCase()} in allen Schweizer Kantonen und Regionen. Mit
                detaillierten Beschreibungen, Bewertungen anderer Besucher und direkten Ticket-Links planst du deinen perfekten
                Tag. Filtere nach Stadt, Datum oder Beliebtheit und entdecke sowohl bekannte Highlights als auch versteckte Geheimtipps
                in deiner Nähe oder schweizweit.
              </p>
            </div>
          </div>
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
                Momentan keine {category.label.toLowerCase()} verfügbar.
              </p>
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
                  fullEvent={event}
                  onClick={(e: React.MouseEvent) => {
                    // Check if click is on ActionPill
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-action-pill]')) {
                      return; // Don't open modal if clicking on ActionPill
                    }
                    setSelectedEvent(event);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Related Categories - Internal Linking for SEO */}
      <section className="bg-white py-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-6 text-center">
            Entdecke auch andere Kategorien
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.filter(cat => cat.slug !== category?.slug).slice(0, 10).map((cat) => (
              <Link
                key={cat.slug}
                to={`/kategorie/${cat.slug}`}
                className="group bg-stone-50 hover:bg-indigo-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md border border-stone-200 hover:border-indigo-200"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-1">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {cat.description.split('.')[0]}.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
