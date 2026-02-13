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
import { getEventLocation, generateEventSlug } from "@/utils/eventUtilities";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Loader2 } from "lucide-react";

interface MagazinArticleProps {
  lang?: "de" | "en";
}

interface EventData {
  id: string;
  external_id?: string;
  title: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  address_city?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  buzz_score?: number;
}

const EventCard = ({ event }: { event: EventData }) => {
  const location = getEventLocation(event);
  const slug = generateEventSlug(event.title, event.address_city || event.location || "");

  return (
    <Link to={`/event/${slug}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all duration-300 h-full">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={event.image_url || "/og-image.jpg"}
            alt={`${event.title} in ${location}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4">
          <p className="text-[11px] font-medium tracking-widest text-stone-400 uppercase mb-1">{location}</p>
          <h3 className="font-sans text-stone-900 text-sm font-semibold leading-tight line-clamp-2">
            {event.title}
          </h3>
        </div>
      </article>
    </Link>
  );
};

const MagazinArticle = ({ lang = "de" }: MagazinArticleProps) => {
  useScrollToTop();
  const { slug } = useParams<{ slug: string }>();
  const locationHook = useLocation();

  const isEn = lang === "en" || locationHook.pathname.startsWith("/en/");

  // Find article
  const article = isEn
    ? getArticleByEnSlug(slug || "")
    : getArticleBySlug(slug || "");

  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch markdown content
  useEffect(() => {
    if (!article) return;

    const mdSlug = isEn ? article.slugEn : article.slug;
    const mdPath = isEn ? `/articles/en/${mdSlug}.md` : `/articles/${mdSlug}.md`;

    fetch(mdPath)
      .then((res) => {
        if (!res.ok) throw new Error("Markdown not found");
        return res.text();
      })
      .then(setMarkdownContent)
      .catch(() => setMarkdownContent(""));
  }, [article, isEn]);

  // Fetch events by IDs
  useEffect(() => {
    if (!article || article.eventIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await externalSupabase
        .from("events")
        .select("id, external_id, title, short_description, description, image_url, address_city, location, latitude, longitude, start_date, buzz_score")
        .in("id", article.eventIds);

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, [article]);

  // 404 - Article not found
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
  const altUrl = isEn
    ? `${SITE_URL}/magazin/${article.slug}`
    : `${SITE_URL}/en/magazine/${article.slugEn}`;
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

  // Get related articles (other articles, max 3)
  const relatedArticles = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

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

        {/* BlogPosting Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "image": article.heroImage.startsWith("http") ? article.heroImage : `${SITE_URL}${article.heroImage}`,
            "datePublished": article.publishedDate,
            "author": {
              "@type": "Organization",
              "name": "EventBuzzer",
              "url": SITE_URL,
            },
            "publisher": {
              "@type": "Organization",
              "name": "EventBuzzer",
              "url": SITE_URL,
              "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/og-image.jpg`,
              },
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl,
            },
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
      <header className="bg-white pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* Language Toggle */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to={magazinHref}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft size={14} />
              {isEn ? "All articles" : "Alle Artikel"}
            </Link>
            <Link
              to={isEn ? `/magazin/${article.slug}` : `/en/magazine/${article.slugEn}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 text-sm text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <span className={!isEn ? "font-bold" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold" : ""}>EN</span>
            </Link>
          </div>

          {/* Category + Meta */}
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-4">
            {category && (
              <Link
                to={`/kategorie/${category.slug}`}
                className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium uppercase tracking-wider hover:bg-indigo-100 transition-colors"
              >
                {category.label}
              </Link>
            )}
            <time>{new Date(article.publishedDate).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.readingTime} {minLabel}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-900 leading-tight mb-6">
            {title}
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>
      </header>

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 mb-12">
        <div className="rounded-2xl overflow-hidden aspect-video">
          <img
            src={article.heroImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 sm:px-8 mb-16">
        <div className="prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-indigo-600 prose-img:rounded-xl">
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </div>
      </article>

      {/* Matching Events Section */}
      {(events.length > 0 || loading) && (
        <section className="bg-[#F5F0E8] py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* No events placeholder */}
      {!loading && events.length === 0 && article.eventIds.length === 0 && (
        <section className="bg-[#F5F0E8] py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <h2 className="font-serif text-stone-900 text-2xl sm:text-3xl font-bold mb-2">
              {eventsTitle}
            </h2>
            <p className="text-stone-500 mb-4">
              {isEn ? "Events are being curated for this article." : "Events werden für diesen Artikel kuratiert."}
            </p>
            <Link to="/" className="text-indigo-600 hover:underline">
              {isEn ? "Browse all events" : "Alle Events durchsuchen"}
            </Link>
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-white py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-8 text-center">
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
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={related.heroImage}
                          alt={relatedTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {relatedCat && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-white/80 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
                              {relatedCat.label}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
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

      {/* Footer spacer for mobile nav */}
      <div className="h-8" />
    </div>
  );
};

export default MagazinArticle;
