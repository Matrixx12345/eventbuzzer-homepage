import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, Article } from "@/config/articles";
import { getCategoryBySlug } from "@/config/categories";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface MagazinLandingProps {
  lang?: "de" | "en";
}

// Mini collage: 2x2 grid of event images
const MiniCollage = ({ images, alt }: { images: string[]; alt: string }) => {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-0.5 aspect-video overflow-hidden">
      {images.slice(0, 4).map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`${alt} ${i + 1}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ))}
    </div>
  );
};

// Featured collage: larger layout with 1 big + 4 small
const FeaturedCollage = ({ images, alt }: { images: string[]; alt: string }) => {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full min-h-[250px] overflow-hidden">
      <div className="col-span-2 row-span-2 overflow-hidden">
        <img src={images[0]} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      {images.slice(1, 5).map((url, i) => (
        <div key={i} className="overflow-hidden">
          <img src={url} alt={`${alt} ${i + 2}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ))}
    </div>
  );
};

const ArticleCard = ({ article, lang, index, images }: { article: Article; lang: "de" | "en"; index: number; images: string[] }) => {
  const title = lang === "en" ? article.titleEn : article.title;
  const description = lang === "en" ? article.descriptionEn : article.description;
  const slug = lang === "en" ? article.slugEn : article.slug;
  const href = lang === "en" ? `/en/magazine/${slug}` : `/magazin/${slug}`;
  const category = getCategoryBySlug(article.category);
  const readLabel = lang === "en" ? "Read article" : "Artikel lesen";
  const minLabel = lang === "en" ? "min read" : "Min. Lesezeit";

  const accents = [
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
  ];

  return (
    <Link to={href} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image collage or gradient accent bar */}
        {images.length >= 4 ? (
          <MiniCollage images={images} alt={title} />
        ) : (
          <div className={`h-2 bg-gradient-to-r ${accents[index % accents.length]}`} />
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {category && (
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold uppercase tracking-wider text-[10px]">
                {category.label}
              </span>
            )}
            <span className="text-xs text-stone-400">
              {new Date(article.publishedDate).toLocaleDateString(lang === "en" ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Clock size={11} />
              {article.readingTime} {minLabel}
            </span>
          </div>

          <h2 className="font-serif text-xl font-bold text-stone-900 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
            {title}
          </h2>

          <p className="text-stone-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {description}
          </p>

          <div className="flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
            {readLabel}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
};

const MagazinLanding = ({ lang = "de" }: MagazinLandingProps) => {
  useScrollToTop();
  const location = useLocation();
  const [articleImages, setArticleImages] = useState<Record<string, string[]>>({});

  // Detect language from URL if not passed as prop
  const isEn = lang === "en" || location.pathname.startsWith("/en/");
  const currentLang = isEn ? "en" : "de";

  // Fetch event images for all articles
  useEffect(() => {
    const allIds = ARTICLES.flatMap((a) => a.eventIds);
    if (allIds.length === 0) return;

    const fetchImages = async () => {
      const { data } = await externalSupabase
        .from("events")
        .select("id, image_url")
        .in("id", allIds);

      if (!data) return;

      const imageMap = new Map(data.filter(e => e.image_url).map(e => [String(e.id), e.image_url as string]));
      const result: Record<string, string[]> = {};

      for (const article of ARTICLES) {
        result[article.slug] = article.eventIds
          .map(id => imageMap.get(id))
          .filter((url): url is string => !!url);
      }

      setArticleImages(result);
    };

    fetchImages();
  }, []);

  const pageTitle = isEn
    ? "Switzerland Travel Guide – Best Events, Museums & Excursions | EventBuzzer"
    : "Schweiz Reiseführer – Beste Events, Museen & Ausflüge | EventBuzzer";
  const pageDescription = isEn
    ? "Your guide to the best events and experiences in Switzerland. Mountain excursions, city guides, museum tips and unique attractions – with hand-picked event recommendations."
    : "Dein Guide für die besten Events und Erlebnisse in der Schweiz. Bergausflüge, Stadtführer, Museums-Tipps und einzigartige Sehenswürdigkeiten – mit handverlesenen Event-Empfehlungen.";
  const pageUrl = isEn ? `${SITE_URL}/en/magazine` : `${SITE_URL}/magazin`;

  const heroTitle = isEn ? "Magazine" : "Magazin";
  const heroSubtitle = isEn
    ? "Mountain excursions, city guides, museum tips & unique Swiss experiences"
    : "Bergausflüge, Stadtführer, Museums-Tipps & einzigartige Schweizer Erlebnisse";

  const featured = ARTICLES.find((a) => a.featured) || ARTICLES[0];
  const otherArticles = ARTICLES.filter((a) => a !== featured);

  const featuredTitle = isEn ? featured.titleEn : featured.title;
  const featuredDesc = isEn ? featured.descriptionEn : featured.description;
  const featuredHref = isEn ? `/en/magazine/${featured.slugEn}` : `/magazin/${featured.slug}`;
  const featuredCat = getCategoryBySlug(featured.category);
  const featuredImages = articleImages[featured.slug] || [];

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
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
            "isPartOf": {
              "@type": "WebSite",
              "name": "EventBuzzer",
              "url": SITE_URL,
            },
            "numberOfItems": ARTICLES.length,
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <Breadcrumb items={[]} currentPage={heroTitle} />
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">
              {heroTitle}
            </h1>
            {/* Language Toggle */}
            <Link
              to={isEn ? "/magazin" : "/en/magazine"}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 text-sm text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <span className={!isEn ? "font-bold" : ""}>DE</span>
              <span className="text-stone-300">|</span>
              <span className={isEn ? "font-bold" : ""}>EN</span>
            </Link>
          </div>
          <p className="text-lg text-gray-500 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to={featuredHref} className="group block mb-12">
            <article className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Collage side */}
                <div className="overflow-hidden">
                  {featuredImages.length >= 5 ? (
                    <FeaturedCollage images={featuredImages} alt={featuredTitle} />
                  ) : (
                    <div className="h-full min-h-[200px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white/30 text-6xl font-serif font-bold">EB</span>
                    </div>
                  )}
                </div>
                {/* Text side */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mb-4">
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded font-semibold uppercase tracking-wider text-[11px]">
                      {isEn ? "Featured" : "Empfohlen"}
                    </span>
                    {featuredCat && (
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium uppercase tracking-wider text-[10px]">
                        {featuredCat.label}
                      </span>
                    )}
                    <time>{new Date(featured.publishedDate).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-4 group-hover:text-indigo-700 transition-colors">
                    {featuredTitle}
                  </h2>
                  <p className="text-stone-500 leading-relaxed mb-6">
                    {featuredDesc}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    {isEn ? "Read article" : "Artikel lesen"}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </article>
          </Link>

          {/* All Other Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article, i) => (
              <ArticleCard
                key={article.slug}
                article={article}
                lang={currentLang}
                index={i + 1}
                images={articleImages[article.slug] || []}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="bg-white py-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="prose max-w-none text-gray-700">
            {isEn ? (
              <>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Your Guide to Swiss Events & Experiences
                </h2>
                <p>
                  The EventBuzzer Magazine is your personal guide to the best events, excursions and experiences in
                  Switzerland. From mountain adventures and city guides to museum recommendations and hidden gems –
                  our curated articles help you plan the perfect day. Each article includes hand-picked event
                  recommendations you can book directly.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Dein Guide für Schweizer Events & Erlebnisse
                </h2>
                <p>
                  Das EventBuzzer Magazin ist dein persönlicher Guide für die besten Events, Ausflüge und Erlebnisse
                  in der Schweiz. Von Bergabenteuern und Stadtführern über Museumsempfehlungen bis zu Geheimtipps –
                  unsere kuratierten Artikel helfen dir, den perfekten Tag zu planen. Jeder Artikel enthält
                  handverlesene Event-Empfehlungen, die du direkt buchen kannst.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MagazinLanding;
