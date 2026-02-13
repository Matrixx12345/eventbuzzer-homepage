import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Clock, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, getArticleBySlug, getArticleByEnSlug } from "@/config/articles";
import { getCategoryBySlug } from "@/config/categories";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Loader2 } from "lucide-react";
import { useEventModal } from "@/hooks/useEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";

interface MagazinArticleProps {
  lang?: "de" | "en";
}

interface ParsedSection {
  type: 'intro' | 'numbered' | 'heading';
  number?: number;
  title?: string;
  body: string;
}

// Parse markdown into sections (auto-number all h2 sections for consistent editorial layout)
const parseSections = (md: string): ParsedSection[] => {
  if (!md) return [];
  const chunks = md.split(/\n(?=## )/);
  let sectionNumber = 1;

  return chunks.map((chunk, i) => {
    if (i === 0 && !chunk.startsWith('## ')) {
      return { type: 'intro', body: chunk.trim() };
    }
    const numMatch = chunk.match(/^## (\d+)\.\s*(.+?)\n([\s\S]*)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      sectionNumber = num + 1;
      return { type: 'numbered', number: num, title: numMatch[2].trim(), body: numMatch[3].trim() };
    }
    const headMatch = chunk.match(/^## (.+?)\n([\s\S]*)/);
    if (headMatch) {
      // Auto-number non-numbered h2 sections for consistent editorial layout
      const num = sectionNumber++;
      return { type: 'numbered', number: num, title: headMatch[1].trim(), body: headMatch[2].trim() };
    }
    return { type: 'intro', body: chunk.trim() };
  }).filter(s => s.body.length > 0);
};

// Extract a quote from section body (first sentence)
const extractQuote = (body: string): string => {
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 40);
  if (sentences.length > 0) {
    return sentences[0].trim().replace(/\*\*/g, '').toUpperCase();
  }
  return '';
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
  const [exhibitionEvents, setExhibitionEvents] = useState<any[]>([]);
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
    const found = [...events, ...exhibitionEvents].find((e: any) => String(e.id) === String(selectedEventId));
    if (found) {
      setModalEvent(found);
    } else {
      const loadEvent = async () => {
        const { data } = await externalSupabase.from("events").select("*").eq("id", selectedEventId).single();
        if (data) setModalEvent(data);
      };
      loadEvent();
    }
  }, [selectedEventId, modalOpen, events, exhibitionEvents]);

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

  // Fetch main events
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

  // Fetch exhibition events (for Editor's Pick)
  useEffect(() => {
    if (!article || !article.exhibitionIds || article.exhibitionIds.length === 0) {
      setExhibitionEvents([]);
      return;
    }
    const fetchExhibitions = async () => {
      const { data, error } = await externalSupabase
        .from("events")
        .select("*")
        .in("id", article.exhibitionIds);
      if (!error && data) setExhibitionEvents(data);
    };
    fetchExhibitions();
  }, [article]);

  // Order events to match eventIds order
  const orderedEvents = useMemo(() => {
    if (!article) return [];
    return article.eventIds
      .map(id => events.find(e => String(e.id) === id))
      .filter(Boolean) as any[];
  }, [article, events]);

  // Parse markdown sections (all h2 sections are now auto-numbered for editorial layout)
  const sections = useMemo(() => parseSections(markdownContent), [markdownContent]);
  const numberedSections = sections.filter(s => s.type === 'numbered');
  const introSection = sections.find(s => s.type === 'intro');

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
  const minLabel = isEn ? "min read" : "Min. Lesezeit";
  const moreLabel = isEn ? "Discover more" : "Mehr erfahren";
  const editorsPickTitle = isEn ? "Matching Exhibitions & Events" : "Passende Ausstellungen & Events";
  const ticketLabel = isEn ? "Book ticket" : "Ticket buchen";

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

      {/* Hero – Full-width dark image with title overlay */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        <img
          src={orderedEvents[0]?.image_url || article.heroImage || "/og-image.jpg"}
          alt={title}
          loading="eager"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-20">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-white font-black text-3xl md:text-5xl lg:text-6xl xl:text-7xl uppercase leading-none tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </section>

      {/* Meta bar – Breadcrumb + Language */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={magazinHref} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors">
                <ArrowLeft size={14} />
                {isEn ? "All articles" : "Alle Artikel"}
              </Link>
              <span className="text-stone-300">·</span>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                {category && (
                  <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">
                    {category.label}
                  </span>
                )}
                <time>{new Date(article.publishedDate).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {article.readingTime} {minLabel}
                </span>
              </div>
            </div>
            <Link to={isEn ? `/magazin/${article.slug}` : `/en/magazine/${article.slugEn}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
              <span className={!isEn ? "font-bold" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold" : ""}>EN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Intro text */}
      {introSection && (
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <p className="text-stone-600 text-lg md:text-xl leading-relaxed">
            {introSection.body}
          </p>
        </section>
      )}

      {/* Editorial Layout – all articles use this consistent style */}
      {numberedSections.map((section, i) => {
        const event = orderedEvents[section.number! - 1];
        const isImageLeft = i % 2 === 0;
        const showQuote = i % 3 === 1 && i < numberedSections.length - 1;

        return (
          <div key={section.number}>
            {/* Editorial Section – alternating image/text layout */}
            <section className={`${i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Image Block */}
                  <div className={`h-[280px] md:h-[500px] overflow-hidden ${isImageLeft ? '' : 'md:order-2'}`}>
                    <img
                      src={event?.image_url || "/og-image.jpg"}
                      alt={section.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Block */}
                  <div className={`p-8 md:p-12 lg:p-16 flex flex-col justify-center ${isImageLeft ? '' : 'md:order-1'}`}>
                    <span className="text-amber-700 font-bold text-lg md:text-xl mb-2">
                      {String(section.number).padStart(2, '0')}.
                    </span>
                    <h2 className="font-black text-2xl md:text-3xl lg:text-4xl uppercase leading-tight mb-5 tracking-tight text-black">
                      {section.title}
                    </h2>
                    <div className="prose prose-stone max-w-none mb-6 text-stone-600 leading-relaxed prose-p:mb-3 prose-strong:text-black prose-strong:font-bold">
                      <ReactMarkdown>{section.body}</ReactMarkdown>
                    </div>
                    {event && (
                      <button
                        onClick={() => openEventModal(String(event.id))}
                        className="self-start bg-black text-white px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
                      >
                        {moreLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Pull Quote – between some sections */}
            {showQuote && (
              <section className="bg-stone-100 py-12 md:py-16">
                <div className="max-w-4xl mx-auto px-8 md:px-16">
                  <blockquote className="relative">
                    <span className="absolute -top-4 -left-2 text-6xl md:text-7xl text-stone-300 font-serif leading-none">&ldquo;</span>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black uppercase leading-tight text-stone-700 tracking-tight pl-8">
                      {extractQuote(section.body)}
                    </p>
                    <span className="absolute -bottom-8 right-0 text-6xl md:text-7xl text-stone-300 font-serif leading-none">&rdquo;</span>
                  </blockquote>
                </div>
              </section>
            )}
          </div>
        );
      })}


      {/* Editor's Pick – Exhibitions carousel (conditional) */}
      {exhibitionEvents.length > 0 && (
        <section className="bg-white py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-black text-xl md:text-2xl uppercase text-center tracking-wider mb-3">
              Editor's Pick:
            </h2>
            <p className="text-center text-stone-500 mb-10 uppercase text-sm tracking-wider">
              {editorsPickTitle}
            </p>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
                {exhibitionEvents.map((e: any) => (
                  <div key={e.id} className="min-w-[260px] md:min-w-[300px] snap-start flex-shrink-0">
                    <div
                      onClick={() => openEventModal(String(e.id))}
                      className="cursor-pointer group"
                    >
                      <div className="relative h-[320px] md:h-[360px] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow">
                        <img
                          src={e.image_url || "/og-image.jpg"}
                          alt={e.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{e.title}</h3>
                      {e.start_date && (
                        <p className="text-xs text-stone-500 mb-3">
                          {new Date(e.start_date).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                      <button className="text-xs font-semibold uppercase tracking-wider border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                        {ticketLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-stone-50 py-16 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="font-black text-2xl md:text-3xl uppercase text-center mb-10 tracking-tight">
              {isEn ? "More Articles" : "Weitere Artikel"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => {
                const relatedTitle = isEn ? related.titleEn : related.title;
                const relatedSlug = isEn ? related.slugEn : related.slug;
                const relatedHref = isEn ? `/en/magazine/${relatedSlug}` : `/magazin/${relatedSlug}`;
                const relatedCat = getCategoryBySlug(related.category);

                return (
                  <Link key={related.slug} to={relatedHref} className="group block">
                    <article className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all duration-300">
                      <div className="h-3 bg-gradient-to-r from-amber-600 to-amber-800" />
                      <div className="p-5">
                        {relatedCat && (
                          <span className="bg-stone-100 text-stone-600 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded mb-2 inline-block">
                            {relatedCat.label}
                          </span>
                        )}
                        <h3 className="font-bold text-lg uppercase text-stone-900 line-clamp-2 group-hover:text-amber-700 transition-colors mb-2 leading-tight tracking-tight">
                          {relatedTitle}
                        </h3>
                        <div className="text-sm text-amber-700 font-semibold uppercase tracking-wider">
                          {isEn ? "Read article" : "Artikel lesen"} →
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
