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
  const getImage = (article: Article) => articleImages[article.slug];

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
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none mb-4 md:mb-6">
            {heroTitle}
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-2xl">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Language Switch */}
      <div className="bg-white py-4 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-end">
            <Link to={isEn ? "/magazin" : "/en/magazine"}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
              <span className={!isEn ? "font-bold text-black" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold text-black" : ""}>EN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Article Grid – 1 large, 3 small, 1 large, 3 small pattern */}
      <section className="bg-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {[featured, ...others].map((article, i) => {
              const isLarge = i % 4 === 0;
              const isFeatured = i === 0;

              return (
                <Link
                  key={article.slug}
                  to={getHref(article)}
                  className={`group block ${isLarge ? 'lg:col-span-3' : ''}`}
                >
                  <div className={`relative ${isLarge ? 'h-[400px] md:h-[500px]' : 'h-[320px] md:h-[380px]'} rounded-3xl overflow-hidden bg-stone-200 shadow-lg`}>
                    {getImage(article) && (
                      <img
                        src={getImage(article)}
                        alt={getTitle(article)}
                        loading={isFeatured ? "eager" : "lazy"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-stone-200"
                      />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${isLarge ? 'from-black/85 via-black/35 to-black/5' : 'from-black/80 via-black/30 to-black/5'}`} />
                    <div className={`absolute bottom-0 left-0 ${isLarge ? 'p-8 md:p-12 lg:p-16' : 'p-6 md:p-7'}`}>
                      <h2 className={`text-white uppercase leading-tight mb-4 ${isLarge ? 'font-black text-3xl md:text-4xl lg:text-5xl tracking-tight' : 'font-bold text-xl md:text-2xl'}`}>
                        {getTitle(article)}
                      </h2>
                      <span className={`inline-block ${isLarge ? 'bg-white text-black' : 'bg-white text-black'} px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider group-hover:bg-stone-100 transition-colors`}>
                        {ctaLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
