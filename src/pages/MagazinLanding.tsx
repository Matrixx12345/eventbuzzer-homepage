import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SITE_URL } from "@/config/constants";
import { ARTICLES, Article } from "@/config/articles";
import { getCategoryBySlug } from "@/config/categories";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface MagazinLandingProps {
  lang?: "de" | "en";
}

const ArticleCard = ({ article, lang }: { article: Article; lang: "de" | "en" }) => {
  const title = lang === "en" ? article.titleEn : article.title;
  const description = lang === "en" ? article.descriptionEn : article.description;
  const slug = lang === "en" ? article.slugEn : article.slug;
  const href = lang === "en" ? `/en/magazine/${slug}` : `/magazin/${slug}`;
  const category = getCategoryBySlug(article.category);
  const readLabel = lang === "en" ? "Read article" : "Artikel lesen";
  const minLabel = lang === "en" ? "min read" : "Min. Lesezeit";

  return (
    <Link to={href} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={article.heroImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {category && (
            <div className="absolute top-4 left-4">
              <span className="bg-white/80 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                {category.label}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
            <time>{new Date(article.publishedDate).toLocaleDateString(lang === "en" ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.readingTime} {minLabel}
            </span>
          </div>

          <h2 className="font-serif text-xl font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
            {title}
          </h2>

          <p className="text-stone-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {description}
          </p>

          <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-800 transition-colors">
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

  // Detect language from URL if not passed as prop
  const isEn = lang === "en" || location.pathname.startsWith("/en/");
  const currentLang = isEn ? "en" : "de";

  const pageTitle = isEn
    ? "EventBuzzer Magazine – Swiss Events, Tips & Guides"
    : "EventBuzzer Magazin – Events, Tipps & Guides Schweiz";
  const pageDescription = isEn
    ? "Discover the best events, excursions and experiences in Switzerland. Our magazine offers tips, guides and curated event recommendations."
    : "Entdecke die besten Events, Ausflüge und Erlebnisse in der Schweiz. Unser Magazin bietet Tipps, Guides und kuratierte Event-Empfehlungen.";
  const pageUrl = isEn ? `${SITE_URL}/en/magazine` : `${SITE_URL}/magazin`;
  const altUrl = isEn ? `${SITE_URL}/magazin` : `${SITE_URL}/en/magazine`;

  const heroTitle = isEn ? "Magazine" : "Magazin";
  const heroSubtitle = isEn
    ? "Tips, guides & curated events for your perfect day in Switzerland"
    : "Tipps, Guides & kuratierte Events für deinen perfekten Tag in der Schweiz";

  const featured = ARTICLES.find((a) => a.featured) || ARTICLES[0];
  const otherArticles = ARTICLES.filter((a) => a !== featured);

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

      {/* Hero */}
      <section className="bg-white py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-4xl md:text-5xl text-gray-900">
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
          <p className="text-lg text-gray-600 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Featured - large card */}
          <Link
            to={isEn ? `/en/magazine/${featured.slugEn}` : `/magazin/${featured.slug}`}
            className="group block mb-12"
          >
            <article className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-video lg:aspect-auto overflow-hidden">
                <img
                  src={featured.heroImage}
                  alt={isEn ? featured.titleEn : featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs text-stone-400 mb-4">
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                    {isEn ? "Featured" : "Empfohlen"}
                  </span>
                  <time>{new Date(featured.publishedDate).toLocaleDateString(isEn ? "en-US" : "de-CH", { day: "numeric", month: "long", year: "numeric" })}</time>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 mb-4 group-hover:text-indigo-700 transition-colors">
                  {isEn ? featured.titleEn : featured.title}
                </h2>
                <p className="text-stone-500 leading-relaxed mb-6">
                  {isEn ? featured.descriptionEn : featured.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                  {isEn ? "Read article" : "Artikel lesen"}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          </Link>

          {/* Other Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} lang={currentLang} />
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
                <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-3">
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
                <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-3">
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
