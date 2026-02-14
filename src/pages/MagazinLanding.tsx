import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, Article } from "@/config/articles";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/contexts/AuthContext";

interface MagazinLandingProps {
  lang?: "de" | "en";
}

const MagazinLanding = ({ lang = "de" }: MagazinLandingProps) => {
  useScrollToTop();
  const location = useLocation();
  const { user } = useAuth();
  const [articleImages, setArticleImages] = useState<Record<string, string>>({});

  const isEn = lang === "en" || location.pathname.startsWith("/en/");

  // Filter out hidden articles for non-logged-in users
  const visibleArticles = ARTICLES.filter(a => !a.hidden || user);

  // Fetch first event image per article for card backgrounds
  useEffect(() => {
    const allIds = visibleArticles.flatMap(a => a.eventIds);
    if (allIds.length === 0) return;
    const load = async () => {
      const { data } = await externalSupabase
        .from("events").select("id, image_url").in("id", allIds);
      if (!data) return;
      const map = new Map(data.filter(e => e.image_url).map(e => [String(e.id), e.image_url as string]));
      const result: Record<string, string> = {};
      for (const article of visibleArticles) {
        for (const id of article.eventIds) {
          const url = map.get(id);
          if (url) { result[article.slug] = url; break; }
        }
      }
      setArticleImages(result);
    };
    load();
  }, [user]);

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

  const featured = visibleArticles.find(a => a.featured) || visibleArticles[0];
  const others = visibleArticles.filter(a => a !== featured);

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
            "numberOfItems": visibleArticles.length,
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

      {/* Featured Article – Editorial Style */}
      <section className="bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <Link to={getHref(featured)} className="group block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Image */}
              <div className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden bg-stone-200">
                {getImage(featured) && (
                  <img
                    src={getImage(featured)}
                    alt={getTitle(featured)}
                    loading="eager"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-stone-200"
                  />
                )}
              </div>
              {/* Content */}
              <div className="flex flex-col justify-center">
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-4 font-semibold">
                  {featured.category}
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-tight mb-6 text-black">
                  {getTitle(featured)}
                </h2>
                <p className="text-base md:text-lg text-stone-600 leading-relaxed mb-8">
                  {isEn ? featured.descriptionEn : featured.description}
                </p>
                <div>
                  <span className="inline-block bg-amber-600 text-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wider hover:bg-amber-700 transition-colors">
                    {isEn ? "Read feature story" : "Feature Story lesen"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Two Article Grid – Horizontal Cards */}
      <section className="bg-stone-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {others.slice(0, 2).map(article => (
              <Link key={article.slug} to={getHref(article)} className="group block">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 items-start">
                  {/* Image */}
                  <div className="sm:col-span-2 relative h-[200px] sm:h-[180px] overflow-hidden bg-stone-200">
                    {getImage(article) && (
                      <img
                        src={getImage(article)}
                        alt={getTitle(article)}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-stone-200"
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className="sm:col-span-3">
                    <h3 className="text-xl md:text-2xl font-bold uppercase leading-tight mb-3 text-black">
                      {getTitle(article)}
                    </h3>
                    <p className="text-sm md:text-base text-stone-600 leading-relaxed mb-4 line-clamp-3">
                      {isEn ? article.descriptionEn : article.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid – 3 Columns */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {others.slice(2).map(article => (
              <Link key={article.slug} to={getHref(article)} className="group block">
                {/* Image */}
                <div className="relative h-[240px] md:h-[280px] overflow-hidden bg-stone-200 mb-6">
                  {getImage(article) && (
                    <img
                      src={getImage(article)}
                      alt={getTitle(article)}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-stone-200"
                    />
                  )}
                </div>
                {/* Content */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 font-semibold">
                    {article.category}
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold uppercase leading-tight mb-3 text-black">
                    {getTitle(article)}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                    {isEn ? article.descriptionEn : article.description}
                  </p>
                </div>
              </Link>
            ))}
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
