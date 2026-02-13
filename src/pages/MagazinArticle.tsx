import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, getArticleBySlug, getArticleByEnSlug } from "@/config/articles";
import { getCategoryBySlug } from "@/config/categories";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { getNearestPlace } from "@/utils/swissPlaces";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Loader2 } from "lucide-react";
import { useEventModal } from "@/hooks/useEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import ActionPill from "@/components/ActionPill";

interface MagazinArticleProps {
  lang?: "de" | "en";
}

// Location helper (same logic as homepage CleanGridSection)
const getCardLocation = (event: any): string => {
  const countryNames = ["schweiz", "switzerland", "suisse", "svizzera", "germany", "deutschland", "france", "frankreich", "austria", "österreich", "italy", "italien", "liechtenstein"];
  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };
  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) return city;
  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) return event.venue_name.trim();
  if (event.location && !isCountry(event.location)) return event.location.trim();
  if (event.latitude && event.longitude) return getNearestPlace(event.latitude, event.longitude);
  return "Schweiz";
};

// Category helper (same logic as homepage CleanGridSection)
const getCategoryLabel = (event: any): string | undefined => {
  const subCat = (event.category_sub_id || event.sub_category || '').toString().toLowerCase();
  const tags = Array.isArray(event.tags) ? event.tags.join(' ').toLowerCase() : '';
  const title = (event.title || '').toLowerCase();
  const combined = `${subCat} ${tags} ${title}`;
  if (combined.includes('museum') || combined.includes('kunst') || combined.includes('galer') || combined.includes('ausstellung')) return 'Museum';
  if (combined.includes('wanderung') || combined.includes('trail') || combined.includes('hike')) return 'Wanderung';
  if (combined.includes('wellness') || combined.includes('spa') || combined.includes('therm') || combined.includes('bad')) return 'Wellness';
  if (combined.includes('natur') || combined.includes('park') || combined.includes('garten') || combined.includes('wald')) return 'Natur';
  if (combined.includes('sehenswürdig') || combined.includes('attraction')) return 'Ausflug';
  if (combined.includes('schloss') || combined.includes('burg') || combined.includes('castle')) return 'Schloss';
  if (combined.includes('kirche') || combined.includes('kloster') || combined.includes('dom') || combined.includes('münster')) return 'Kultur';
  if (combined.includes('zoo') || combined.includes('tier') || combined.includes('aquar')) return 'Tierpark';
  if (combined.includes('familie') || combined.includes('kinder') || combined.includes('family')) return 'Familie';
  if (combined.includes('wissenschaft') || combined.includes('technik') || combined.includes('science') || combined.includes('planetar')) return 'Science';
  if (combined.includes('konzert') || combined.includes('music') || combined.includes('live')) return 'Konzert';
  if (combined.includes('theater') || combined.includes('oper') || combined.includes('bühne')) return 'Theater';
  if (combined.includes('sport')) return 'Sport';
  if (combined.includes('festival') || combined.includes('fest')) return 'Festival';
  if (combined.includes('food') || combined.includes('kulinar') || combined.includes('gastro') || combined.includes('wein') || combined.includes('käse')) return 'Kulinarik';
  if (combined.includes('nightlife') || combined.includes('party') || combined.includes('club')) return 'Nightlife';
  if (combined.includes('aussicht') || combined.includes('view') || combined.includes('panorama') || combined.includes('berg')) return 'Aussicht';
  if ((combined.includes('see') || combined.includes('lake') || combined.includes('schiff')) && !combined.includes('must-see')) return 'See';
  if (combined.includes('bahn') || combined.includes('zug') || combined.includes('train')) return 'Bahn';
  if (combined.includes('altstadt') || combined.includes('city') || combined.includes('stadt')) return 'Stadt';
  if (combined.includes('erlebnis')) return 'Erlebnis';
  if (event.source === 'myswitzerland') return 'Ausflug';
  return undefined;
};

// Style 1: CleanGridCard – dark overlay, full-bleed image (same as homepage)
const DarkEventCard = ({ event, onClick }: { event: any; onClick: () => void }) => {
  const loc = getCardLocation(event);
  const cat = getCategoryLabel(event);
  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} className="block h-full cursor-pointer">
      <article className="relative h-full rounded-2xl overflow-visible group">
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <img src={event.image_url || "/og-image.jpg"} alt={event.title} loading="lazy"
            className="w-full h-full object-cover transition-all duration-500 blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08] group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />
        </div>
        {cat && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">{cat}</span>
          </div>
        )}
        <div className="relative h-full flex flex-col justify-end p-5">
          <h3 className="font-serif text-white text-xl lg:text-2xl font-semibold leading-tight mb-1 line-clamp-2">{event.title}</h3>
          <div className="group/map relative inline-flex items-center gap-1 text-white/80 text-sm cursor-help mb-3">
            <span className="border-b border-dotted border-white/40 hover:text-white transition-colors">{loc}</span>
            {event.latitude && event.longitude && (
              <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-40 h-28 overflow-hidden flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                    <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm shadow-black/50"
                      style={{ left: `${(event.longitude - 5.9) / (10.5 - 5.9) * 100}%`, top: `${(1 - (event.latitude - 45.8) / (47.8 - 45.8)) * 100}%` }} />
                  </div>
                </div>
                <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
              </div>
            )}
          </div>
          <ActionPill eventId={String(event.id)} slug={String(event.id)} image={event.image_url || "/og-image.jpg"}
            title={event.title} location={loc} buzzScore={event.buzz_score} ticketUrl={event.ticket_link} variant="dark" event={event} />
        </div>
      </article>
    </div>
  );
};

// Style 2: CompactCard – white card, image left + text right (same as homepage SideBySideSection)
const LightEventCard = ({ event, onClick }: { event: any; onClick: () => void }) => {
  const loc = getCardLocation(event);
  const cat = getCategoryLabel(event);
  const desc = event.description || event.short_description || "";
  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} className="block cursor-pointer">
      <div className="bg-white rounded-2xl overflow-visible group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-stone-300 shadow-md border border-stone-200 flex flex-col md:grid md:grid-cols-[55%_45%] h-auto md:h-[280px]">
        <div className="relative overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none h-[180px] md:h-full">
          <img src={event.image_url || "/og-image.jpg"} alt={event.title} loading="lazy"
            className="w-full h-full object-cover transition-all duration-500 blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08] group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0" />
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />
          {cat && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">{cat}</span>
            </div>
          )}
        </div>
        <div className="p-3 px-4 md:p-4 md:px-6 flex flex-col justify-end h-full">
          <div className="group/map relative inline-flex items-center mb-1">
            <span className="text-[10px] md:text-[11px] font-medium tracking-widest text-stone-400 uppercase">{loc}</span>
            {event.latitude && event.longitude && (
              <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-36 h-24 overflow-hidden flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                    <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm"
                      style={{ left: `${(event.longitude - 5.9) / (10.5 - 5.9) * 100}%`, top: `${(1 - (event.latitude - 45.8) / (47.8 - 45.8)) * 100}%` }} />
                  </div>
                </div>
                <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
              </div>
            )}
          </div>
          <h3 className="font-serif text-lg md:text-xl font-semibold text-[#1a1a1a] mb-1 md:mb-2 line-clamp-1 group-hover:line-clamp-2 leading-tight transition-all duration-200">{event.title}</h3>
          <p className="text-stone-500 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-3 md:mb-8">{desc}</p>
          <ActionPill eventId={String(event.id)} slug={String(event.id)} image={event.image_url || "/og-image.jpg"}
            title={event.title} location={loc} buzzScore={event.buzz_score} ticketUrl={event.ticket_link} variant="light" event={event} />
        </div>
      </div>
    </div>
  );
};

const MagazinArticle = ({ lang = "de" }: MagazinArticleProps) => {
  useScrollToTop();
  const { slug } = useParams<{ slug: string }>();
  const locationHook = useLocation();

  const isEn = lang === "en" || locationHook.pathname.startsWith("/en/");

  const article = isEn
    ? getArticleByEnSlug(slug || "")
    : getArticleBySlug(slug || "");

  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<any>(null);

  // Event modal
  const { selectedEventId, isOpen: modalOpen, openEvent: openEventModal, closeEvent: closeEventModal } = useEventModal();

  // Load modal event
  useEffect(() => {
    if (!selectedEventId || !modalOpen) {
      setModalEvent(null);
      return;
    }
    const found = events.find((e: any) => String(e.id) === String(selectedEventId));
    if (found) {
      setModalEvent(found);
    } else {
      const loadEvent = async () => {
        const { data } = await externalSupabase.from("events").select("*").eq("id", selectedEventId).single();
        if (data) setModalEvent(data);
      };
      loadEvent();
    }
  }, [selectedEventId, modalOpen, events]);

  // Fetch markdown content
  useEffect(() => {
    if (!article) return;
    const mdSlug = isEn ? article.slugEn : article.slug;
    const mdPath = isEn ? `/articles/en/${mdSlug}.md` : `/articles/${mdSlug}.md`;
    window.fetch(mdPath)
      .then((res) => {
        if (!res.ok) throw new Error("Markdown not found");
        return res.text();
      })
      .then(setMarkdownContent)
      .catch(() => setMarkdownContent(""));
  }, [article, isEn]);

  // Fetch events – select ALL fields for modal and ActionPill
  useEffect(() => {
    if (!article || article.eventIds.length === 0) {
      setLoading(false);
      return;
    }
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await externalSupabase
        .from("events")
        .select("*")
        .in("id", article.eventIds);
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [article]);

  // Determine card style: alternate based on article index
  const articleIndex = article ? ARTICLES.findIndex(a => a.slug === article.slug) : 0;
  const useDarkCards = articleIndex % 2 === 0;

  // 404
  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>{isEn ? "Article not found" : "Artikel nicht gefunden"} | EventBuzzer</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">
            {isEn ? "Article not found" : "Artikel nicht gefunden"}
          </h1>
          <Link to={isEn ? "/en/magazine" : "/magazin"} className="text-indigo-600 hover:underline">
            {isEn ? "Back to Magazine" : "Zurück zum Magazin"}
          </Link>
        </div>
      </div>
    );
  }

  const title = isEn ? article.titleEn : article.title;
  const description = isEn ? article.descriptionEn : article.description;
  const currentSlug = isEn ? article.slugEn : article.slug;
  const pageUrl = isEn
    ? `${SITE_URL}/en/magazine/${currentSlug}`
    : `${SITE_URL}/magazin/${currentSlug}`;
  const pageTitle = `${title} | EventBuzzer`;
  const category = getCategoryBySlug(article.category);

  const magazinLabel = isEn ? "Magazine" : "Magazin";
  const magazinHref = isEn ? "/en/magazine" : "/magazin";
  const eventsTitle = isEn ? "Matching Events" : "Passende Events";
  const eventsSubtitle = isEn
    ? "Hand-picked events related to this article"
    : "Handverlesene Events passend zu diesem Artikel";
  const moreArticlesTitle = isEn ? "More Articles" : "Weitere Artikel";
  const readLabel = isEn ? "Read article" : "Artikel lesen";
  const minLabel = isEn ? "min read" : "Min. Lesezeit";

  const relatedArticles = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);
  const eventsWithImages = events.filter((e: any) => e.image_url);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="EventBuzzer" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={article.heroImage.startsWith("http") ? article.heroImage : `${SITE_URL}${article.heroImage}`} />
        <meta property="article:published_time" content={article.publishedDate} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hreflang="de" href={`${SITE_URL}/magazin/${article.slug}`} />
        <link rel="alternate" hreflang="en" href={`${SITE_URL}/en/magazine/${article.slugEn}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "image": article.heroImage.startsWith("http") ? article.heroImage : `${SITE_URL}${article.heroImage}`,
            "datePublished": article.publishedDate,
            "author": { "@type": "Organization", "name": "EventBuzzer", "url": SITE_URL },
            "publisher": { "@type": "Organization", "name": "EventBuzzer", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/og-image.jpg` } },
            "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
            "inLanguage": isEn ? "en" : "de",
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4">
          <Breadcrumb
            items={[{ label: magazinLabel, href: magazinHref }]}
            currentPage={title}
          />
        </div>
      </div>

      {/* Article Header */}
      <header className="bg-white pt-8 pb-8">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between mb-8">
            <Link to={magazinHref} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors">
              <ArrowLeft size={14} />
              {isEn ? "All articles" : "Alle Artikel"}
            </Link>
            <Link to={isEn ? `/magazin/${article.slug}` : `/en/magazine/${article.slugEn}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 text-sm text-stone-600 hover:bg-stone-100 transition-colors">
              <span className={!isEn ? "font-bold" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold" : ""}>EN</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mb-5">
            {category && (
              <Link to={`/kategorie/${category.slug}`}
                className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded font-semibold uppercase tracking-wider text-[11px] hover:bg-indigo-100 transition-colors">
                {category.label}
              </Link>
            )}
            <time className="font-medium">{new Date(article.publishedDate).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
            <span className="flex items-center gap-1 font-medium">
              <Clock size={12} />
              {article.readingTime} {minLabel}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-900 leading-tight font-bold mb-5">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 leading-relaxed max-w-3xl font-light">
            {description}
          </p>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 sm:px-8 mb-16">
        <div className="
          prose prose-lg prose-stone max-w-none
          prose-headings:font-serif prose-headings:text-black
          prose-h2:text-xl prose-h2:md:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-3 prose-h2:border-b prose-h2:border-stone-200
          prose-h3:text-lg prose-h3:md:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-stone-600 prose-p:leading-relaxed
          prose-strong:text-stone-800 prose-strong:font-bold
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-li:text-stone-600 prose-li:leading-relaxed prose-ul:my-4
          prose-img:rounded-xl
        ">
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </div>
      </article>

      {/* Matching Events – alternating card styles */}
      {(eventsWithImages.length > 0 || loading) && (
        <section className="bg-[#F5F0E8] py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-serif text-stone-900 text-2xl sm:text-3xl font-bold mb-2">
                {eventsTitle}
              </h2>
              <p className="text-stone-500">{eventsSubtitle}</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : useDarkCards ? (
              /* Style 1: 3 dark overlay cards */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {eventsWithImages.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="h-[320px]">
                    <DarkEventCard event={event} onClick={() => openEventModal(String(event.id))} />
                  </div>
                ))}
              </div>
            ) : (
              /* Style 2: 2 side-by-side cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventsWithImages.slice(0, 2).map((event: any) => (
                  <LightEventCard key={event.id} event={event} onClick={() => openEventModal(String(event.id))} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-white py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-8 text-center font-bold">
              {moreArticlesTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => {
                const relatedTitle = isEn ? related.titleEn : related.title;
                const relatedSlug = isEn ? related.slugEn : related.slug;
                const relatedHref = isEn ? `/en/magazine/${relatedSlug}` : `/magazin/${relatedSlug}`;
                const relatedCat = getCategoryBySlug(related.category);

                return (
                  <Link key={related.slug} to={relatedHref} className="group block">
                    <article className="bg-stone-50 rounded-xl overflow-hidden border border-stone-200 hover:shadow-md transition-all duration-300">
                      <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-600" />
                      <div className="p-5">
                        {relatedCat && (
                          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded mb-2 inline-block">
                            {relatedCat.label}
                          </span>
                        )}
                        <h3 className="font-serif text-lg font-semibold text-stone-900 line-clamp-2 group-hover:text-indigo-700 transition-colors mb-2">
                          {relatedTitle}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-indigo-600">
                          {readLabel}
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Event Detail Modal */}
      {modalEvent && (
        <EventDetailModal
          event={modalEvent}
          isOpen={modalOpen}
          onClose={() => {
            closeEventModal();
            setModalEvent(null);
          }}
          variant="solid"
        />
      )}

      <div className="h-8" />
    </div>
  );
};

export default MagazinArticle;
