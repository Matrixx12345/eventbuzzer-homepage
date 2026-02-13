import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, Article } from "@/config/articles";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useEventModal } from "@/hooks/useEventModal";
import EventDetailModal from "@/components/EventDetailModal";
import { MapPin } from "lucide-react";

interface MagazinArticleProps {
  lang?: "de" | "en";
}

// Decode HTML entities
const decodeHtml = (text: string) => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const MagazinArticle = ({ lang = "de" }: MagazinArticleProps) => {
  useScrollToTop();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const isEn = lang === "en" || location.pathname.startsWith("/en/");

  const [markdownContent, setMarkdownContent] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [exhibitionEvents, setExhibitionEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { selectedEventId, openEventModal, closeEventModal } = useEventModal();

  // Find article
  const article = useMemo(() => {
    return ARTICLES.find(a =>
      isEn ? a.slugEn === slug : a.slug === slug
    );
  }, [slug, isEn]);

  const title = article ? (isEn ? article.titleEn : article.title) : "";
  const description = article ? (isEn ? article.descriptionEn : article.description) : "";

  // Load markdown content
  useEffect(() => {
    if (!article) return;
    const mdSlug = isEn ? article.slugEn : article.slug;
    const mdPath = isEn ? `/articles/en/${mdSlug}.md` : `/articles/${mdSlug}.md`;

    fetch(mdPath)
      .then(res => res.ok ? res.text() : "")
      .then(text => setMarkdownContent(text))
      .catch(() => setMarkdownContent(""));
  }, [article, isEn]);

  // Load events
  useEffect(() => {
    if (!article) return;
    const loadEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await externalSupabase
          .from("events")
          .select("*")
          .in("id", article.eventIds);

        if (!error && data) {
          setEvents(data);
        }

        if (article.exhibitionIds && article.exhibitionIds.length > 0) {
          const { data: exData } = await externalSupabase
            .from("events")
            .select("*")
            .in("id", article.exhibitionIds);
          if (exData) setExhibitionEvents(exData);
        }
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [article]);

  // Order events
  const orderedEvents = useMemo(() => {
    if (!article) return [];
    return article.eventIds
      .map(id => events.find(e => String(e.id) === id))
      .filter(Boolean) as any[];
  }, [article, events]);

  // Parse markdown into simple sections
  const sections = useMemo(() => {
    if (!markdownContent) return [];
    const lines = markdownContent.split('\n');
    const result: Array<{ title: string; body: string }> = [];
    let currentTitle = '';
    let currentBody: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentTitle) {
          result.push({ title: currentTitle, body: currentBody.join('\n').trim() });
        }
        currentTitle = line.replace(/^##\s*\d+\.\s*/, '').replace(/^##\s*/, '').trim();
        currentBody = [];
      } else if (currentTitle) {
        currentBody.push(line);
      }
    }

    if (currentTitle) {
      result.push({ title: currentTitle, body: currentBody.join('\n').trim() });
    }

    return result;
  }, [markdownContent]);

  const introText = useMemo(() => {
    if (!markdownContent) return '';
    const firstParagraph = markdownContent.split('\n\n')[0];
    return firstParagraph.startsWith('##') ? '' : firstParagraph.trim();
  }, [markdownContent]);

  // Extract quote from body
  const extractQuote = (body: string): string => {
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 40);
    return sentences[0] ? sentences[0].trim() + '.' : '';
  };

  // Switzerland Map Component
  const SwissMap = ({ event }: { event: any }) => {
    if (!event?.latitude || !event?.longitude) return null;

    const anchorLat = 46.2;
    const stretch = event.latitude <= anchorLat
      ? 1.1
      : 1.1 - ((event.latitude - anchorLat) / (47.8 - anchorLat)) * 0.23;

    const x = ((event.longitude - 5.9) / (10.5 - 5.9)) * 1348.8688;
    const y = ((1 - ((event.latitude - 45.8) / (47.8 - 45.8)) * stretch)) * 865.04437 - (0.015 * 865.04437);

    return (
      <div className="relative w-full bg-transparent">
        <svg viewBox="0 0 1348.8688 865.04437" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <image href="/swiss-outline.svg" width="1348.8688" height="865.04437" opacity="0.08" />

          {/* City markers with labels */}
          <circle cx="765" cy="213" r="7.5" fill="#6b7280" />
          <text x="775" y="223" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zürich</text>

          <circle cx="71.3" cy="672.8" r="7.5" fill="#6b7280" />
          <text x="82" y="682" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Genf</text>

          <circle cx="495.2" cy="147" r="7.5" fill="#6b7280" />
          <text x="506" y="157" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Basel</text>

          <circle cx="214.7" cy="545" r="7.5" fill="#6b7280" />
          <text x="225" y="555" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lausanne</text>

          <circle cx="453.8" cy="362" r="7.5" fill="#6b7280" />
          <text x="464" y="372" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Bern</text>

          <circle cx="576" cy="490" r="6" fill="#6b7280" />
          <text x="586" y="500" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Interlaken</text>

          <circle cx="828.0" cy="168" r="7" fill="#6b7280" />
          <text x="838" y="178" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Winterthur</text>

          <circle cx="706.5" cy="351" r="7.5" fill="#6b7280" />
          <text x="717" y="361" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Luzern</text>

          <circle cx="989" cy="167" r="7" fill="#6b7280" />
          <text x="999" y="177" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Gallen</text>

          <circle cx="865" cy="768.2" r="7" fill="#6b7280" />
          <text x="875" y="778" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Lugano</text>

          <circle cx="1154" cy="546" r="6" fill="#6b7280" />
          <text x="1164" y="556" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">St. Moritz</text>

          <circle cx="542" cy="750" r="6" fill="#6b7280" />
          <text x="552" y="760" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Zermatt</text>

          <circle cx="395.0" cy="301" r="6" fill="#6b7280" />
          <text x="405" y="311" fontFamily="Arial, sans-serif" fontSize="39" fill="#6b7280">Biel</text>

          {/* Event location marker (red pulsing dot) */}
          <g>
            <circle cx={x} cy={y} r="28" fill="#ef4444" opacity="0.2" />
            <circle cx={x} cy={y} r="32" fill="#ef4444" opacity="0.5" />
            <circle cx={x} cy={y} r="22" fill="#dc2626" className="animate-pulse" />
          </g>
        </svg>
      </div>
    );
  };

  // 404
  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>{isEn ? "Article not found" : "Artikel nicht gefunden"} | EventBuzzer</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">
            {isEn ? "Article not found" : "Artikel nicht gefunden"}
          </h1>
          <Link to={isEn ? "/en/magazine" : "/magazin"} className="text-amber-600 hover:underline">
            {isEn ? "Back to Magazine" : "Zurück zum Magazin"}
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = isEn ? `${SITE_URL}/en/magazine/${article.slugEn}` : `${SITE_URL}/magazin/${article.slug}`;
  const otherLangUrl = isEn ? `${SITE_URL}/magazin/${article.slug}` : `${SITE_URL}/en/magazine/${article.slugEn}`;
  const moreLabel = isEn ? "Learn more" : "Mehr erfahren";
  const editorsPickTitle = isEn ? "Exhibitions and Events" : "Ausstellungen und Events";

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{title} | EventBuzzer</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        {orderedEvents[0]?.image_url && <meta property="og:image" content={orderedEvents[0].image_url} />}
        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hrefLang={isEn ? "de" : "en"} href={otherLangUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "url": pageUrl,
            "datePublished": article.publishedDate,
            "author": { "@type": "Organization", "name": "EventBuzzer" },
            "publisher": { "@type": "Organization", "name": "EventBuzzer", "url": SITE_URL },
            "inLanguage": isEn ? "en" : "de",
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Hero – Full-width image with title overlay */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-stone-200">
        {orderedEvents[0]?.image_url && (
          <img
            src={orderedEvents[0].image_url}
            alt={title}
            loading="eager"
            className="w-full h-full object-cover bg-stone-200"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-16 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-white font-black text-3xl md:text-4xl lg:text-5xl uppercase leading-tight tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </section>

      {/* Breadcrumb + Language Toggle */}
      <div className="bg-white border-b border-stone-200 py-4">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-stone-500">
              <Link to="/" className="hover:text-stone-700">Home</Link>
              <span>/</span>
              <Link to={isEn ? "/en/magazine" : "/magazin"} className="hover:text-stone-700">
                {isEn ? "Magazine" : "Magazin"}
              </Link>
              <span>/</span>
              <span className="text-stone-900 font-medium">{title}</span>
            </div>
            <Link
              to={otherLangUrl}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-xs hover:bg-stone-50 transition-colors"
            >
              <span className={!isEn ? "font-bold" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold" : ""}>EN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Intro text */}
      {introText && (
        <section className="max-w-5xl mx-auto px-8 md:px-12 lg:px-20 py-0">
          <p className="text-stone-600 text-lg md:text-xl leading-relaxed">
            {introText}
          </p>
        </section>
      )}

      {/* Article List – Vertical Layout */}
      <section className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-8 md:px-12 lg:px-20">
          {sections.map((section, i) => {
            const event = orderedEvents[i];
            const showQuote = i % 3 === 1;

            return (
              <div key={i}>
                {/* Horizontal divider line */}
                {i > 0 && <hr className="border-t border-stone-200 my-12 md:my-16" />}

                <article className="mb-12 md:mb-16">
                  {/* Title + Location + SVG in grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-tight text-black mb-4">
                        {String(i + 1).padStart(2, '0')}. {section.title}
                      </h2>
                      {event?.address_city && (
                        <div className="flex items-center gap-2 text-stone-500 text-base md:text-lg">
                          <MapPin size={20} />
                          <span>{decodeHtml(event.address_city)}, {isEn ? "Switzerland" : "Schweiz"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-end max-h-[80px] lg:max-h-[100px]">
                      <SwissMap event={event} />
                    </div>
                  </div>

                  {/* Image */}
                  {event?.image_url && (
                    <div className="relative h-[320px] md:h-[450px] lg:h-[500px] overflow-hidden bg-stone-200 mb-8">
                      <img
                        src={event.image_url}
                        alt={section.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-8">
                    <p className="text-base md:text-lg lg:text-xl text-stone-700 leading-relaxed">
                      {section.body}
                    </p>
                  </div>

                  {/* Bold Highlights */}
                  {section.body.includes('**') && (
                    <div className="mb-8 pl-6 border-l-4 border-amber-600">
                      <p className="text-lg md:text-xl font-bold text-stone-900 italic leading-relaxed">
                        {section.body.match(/\*\*(.+?)\*\*/)?.[1] || ''}
                      </p>
                    </div>
                  )}

                  {/* Button */}
                  <div className="mb-8">
                    {event && (
                      <button
                        onClick={() => openEventModal(String(event.id))}
                        className="inline-block bg-black text-white px-10 py-4 text-base font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors w-fit"
                      >
                        {moreLabel}
                      </button>
                    )}
                  </div>

                  {/* Pull Quote - Simple style without background */}
                  {showQuote && extractQuote(section.body) && (
                    <blockquote className="my-10 text-center">
                      <p className="text-xl md:text-2xl lg:text-3xl italic text-stone-600 leading-relaxed">
                        "{extractQuote(section.body)}"
                      </p>
                    </blockquote>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editor's Pick Section */}
      {exhibitionEvents.length > 0 && (
        <section className="bg-stone-50 py-16 border-t border-stone-200">
          <div className="max-w-6xl mx-auto px-8 md:px-12 lg:px-20">
            <h2 className="font-black text-xl md:text-2xl uppercase tracking-wider mb-3">
              {isEn ? "Related Events" : "Passende Events & Ausstellungen"}
            </h2>
            <p className="text-stone-500 mb-10 text-sm uppercase tracking-wider">
              {editorsPickTitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {exhibitionEvents.map((e: any) => (
                <div key={e.id} onClick={() => openEventModal(String(e.id))} className="cursor-pointer group">
                  <div className="relative h-[260px] overflow-hidden bg-stone-200 mb-3">
                    {e.image_url && (
                      <img
                        src={e.image_url}
                        alt={e.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{decodeHtml(e.title)}</h3>
                  {e.address_city && (
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {decodeHtml(e.address_city)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <EventDetailModal
        isOpen={!!selectedEventId}
        onClose={closeEventModal}
        eventId={selectedEventId}
      />
    </div>
  );
};

export default MagazinArticle;
