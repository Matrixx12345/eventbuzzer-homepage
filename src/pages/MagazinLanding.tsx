import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, Article } from "@/config/articles";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface MagazinLandingProps {
  lang?: "de" | "en";
}

const MagazinLanding = ({ lang = "de" }: MagazinLandingProps) => {
  useScrollToTop();
  const location = useLocation();
  const [articleImages, setArticleImages] = useState<Record<string, string>>({});

  const isEn = lang === "en" || location.pathname.startsWith("/en/");

  // Fetch first event image per article for card backgrounds
  useEffect(() => {
    const allIds = ARTICLES.flatMap(a => a.eventIds);
    if (allIds.length === 0) return;
    const load = async () => {
      const { data } = await externalSupabase
        .from("events").select("id, image_url").in("id", allIds);
      if (!data) return;
      const map = new Map(data.filter(e => e.image_url).map(e => [String(e.id), e.image_url as string]));
      const result: Record<string, string> = {};
      for (const article of ARTICLES) {
        for (const id of article.eventIds) {
          const url = map.get(id);
          if (url) { result[article.slug] = url; break; }
        }
      }
      setArticleImages(result);
    };
    load();
  }, []);

  const pageTitle = isEn
    ? "The EventBuzzer Magazine – Best Events, Museums and Excursions in Switzerland"
    : "Das EventBuzzer Magazin – Beste Events, Museen und Ausflüge der Schweiz";
  const pageDescription = isEn
    ? "Your guide to the best events and experiences in Switzerland. Mountain excursions, city guides, museum tips and unique attractions."
    : "Dein Guide für die besten Events und Erlebnisse in der Schweiz. Bergausflüge, Stadtführer, Museums-Tipps und einzigartige Sehenswürdigkeiten.";
  const pageUrl = isEn ? `${SITE_URL}/en/magazine` : `${SITE_URL}/magazin`;
  const heroTitle = isEn ? "The EventBuzzer Magazine" : "Das EventBuzzer Magazin";
  const heroSubtitle = isEn
    ? "Inspiration, guides and the best events in Switzerland"
    : "Inspiration, Guides und die besten Events der Schweiz";
  const ctaLabel = isEn ? "Discover now" : "Jetzt entdecken";

  const featured = ARTICLES.find(a => a.featured) || ARTICLES[0];
  const others = ARTICLES.filter(a => a !== featured);

  const getHref = (article: Article) => {
    const slug = isEn ? article.slugEn : article.slug;
    return isEn ? `/en/magazine/${slug}` : `/magazin/${slug}`;
  };
  const getTitle = (article: Article) => isEn ? article.titleEn : article.title;
  const getImage = (article: Article) => articleImages[article.slug] || "/og-image.jpg";

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="EventBuzzer" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hreflang="de" href={`${SITE_URL}/magazin`} />
        <link rel="alternate" hreflang="en" href={`${SITE_URL}/en/magazine`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": pageDescription,
            "url": pageUrl,
            "inLanguage": isEn ? "en" : "de",
            "isPartOf": { "@type": "WebSite", "name": "EventBuzzer", "url": SITE_URL },
            "numberOfItems": ARTICLES.length,
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Dark Hero */}
      <section className="bg-black py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none">
              {heroTitle}
            </h1>
            <Link to={isEn ? "/magazin" : "/en/magazine"}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-sm text-white/60 hover:bg-white/10 transition-colors flex-shrink-0 ml-6">
              <span className={!isEn ? "font-bold text-white" : ""}>DE</span>
              <span className="text-white/30">|</span>
              <span className={isEn ? "font-bold text-white" : ""}>EN</span>
            </Link>
          </div>
          <p className="text-base md:text-lg text-white/50 max-w-2xl">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="bg-white py-6 md:py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

            {/* Featured – large card (2 cols, 2 rows) */}
            <Link to={getHref(featured)} className="md:col-span-2 md:row-span-2 group block">
              <div className="relative h-[320px] md:h-full md:min-h-[480px] rounded-2xl overflow-hidden">
                <img src={getImage(featured)} alt={getTitle(featured)} loading="eager"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10">
                  <h2 className="text-white font-black text-2xl md:text-3xl lg:text-4xl uppercase leading-tight mb-4">
                    {getTitle(featured)}
                  </h2>
                  <span className="inline-block bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider group-hover:bg-stone-100 transition-colors">
                    {ctaLabel}
                  </span>
                </div>
              </div>
            </Link>

            {/* Right side – 2 stacked cards */}
            {others.slice(0, 2).map(article => (
              <Link key={article.slug} to={getHref(article)} className="group block">
                <div className="relative h-[200px] md:h-full md:min-h-[230px] rounded-2xl overflow-hidden">
                  <img src={getImage(article)} alt={getTitle(article)} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-6">
                    <h2 className="text-white font-bold text-lg md:text-xl uppercase leading-tight mb-3">
                      {getTitle(article)}
                    </h2>
                    <span className="inline-block bg-white text-black px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider group-hover:bg-stone-100 transition-colors">
                      {ctaLabel}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Bottom – full width banner card */}
            {others.length > 2 && (
              <Link to={getHref(others[2])} className="md:col-span-3 group block">
                <div className="relative h-[200px] md:h-[220px] rounded-2xl overflow-hidden">
                  <img src={getImage(others[2])} alt={getTitle(others[2])} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-8">
                    <h2 className="text-white font-bold text-lg md:text-2xl uppercase leading-tight mb-3">
                      {getTitle(others[2])}
                    </h2>
                    <span className="inline-block bg-white text-black px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider group-hover:bg-stone-100 transition-colors">
                      {ctaLabel}
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="bg-stone-50 py-12 border-t border-stone-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="prose max-w-none text-gray-700">
            {isEn ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Guide to Swiss Events and Experiences</h2>
                <p>The EventBuzzer Magazine is your personal guide to the best events, excursions and experiences in Switzerland. From mountain adventures and city guides to museum recommendations and hidden gems – our curated articles help you plan the perfect day.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Dein Guide für Schweizer Events und Erlebnisse</h2>
                <p>Das EventBuzzer Magazin ist dein persönlicher Guide für die besten Events, Ausflüge und Erlebnisse in der Schweiz. Von Bergabenteuern und Stadtführern über Museumsempfehlungen bis zu Geheimtipps – unsere kuratierten Artikel helfen dir, den perfekten Tag zu planen.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
};

export default MagazinLanding;
