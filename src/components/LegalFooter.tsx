import { Link } from "react-router-dom";
import { CATEGORIES } from "@/config/categories";

const LegalFooter = () => {
  return (
    <footer className="w-full py-12 mt-auto border-t border-stone-200 bg-stone-50">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-8 mb-8">
          {/* Kategorien Sektion */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Kategorien
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  to={`/kategorie/${category.slug}`}
                  className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Swiss Cities Section */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Events in der Schweiz
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Link to="/?city=Zürich" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Zürich
              </Link>
              <Link to="/?city=Bern" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Bern
              </Link>
              <Link to="/?city=Basel" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Basel
              </Link>
              <Link to="/?city=Genf" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Genf
              </Link>
              <Link to="/?city=Lausanne" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Lausanne
              </Link>
              <Link to="/?city=Luzern" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Luzern
              </Link>
              <Link to="/?city=St.%20Gallen" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in St. Gallen
              </Link>
              <Link to="/?city=Winterthur" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Winterthur
              </Link>
              <Link to="/?city=Interlaken" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Interlaken
              </Link>
              <Link to="/?city=Zermatt" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Events in Zermatt
              </Link>
            </div>
          </div>

          {/* Für Veranstalter */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">
              Für Veranstalter
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/partner"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Event kostenlos listen
              </Link>
              <Link
                to="/partner"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Partner-Programm
              </Link>
            </div>
          </div>

          {/* EventBuzzer Info */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">
              EventBuzzer
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Events
              </Link>
              <Link
                to="/highlights"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Highlights
              </Link>
              <Link
                to="/favorites"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Favoriten
              </Link>
              <Link
                to="/reiseplaner"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Reiseplaner
              </Link>
              <Link
                to="/impressum"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Impressum
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} EventBuzzer. Entdecke Events in der Schweiz.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
