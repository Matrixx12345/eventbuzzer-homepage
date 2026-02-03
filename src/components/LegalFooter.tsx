import { Link } from "react-router-dom";
import { CATEGORIES } from "@/config/categories";

const LegalFooter = () => {
  return (
    <footer className="w-full py-12 mt-auto border-t border-stone-200 bg-stone-50">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
                Startseite
              </Link>
              <Link
                to="/eventlist1"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Alle Events
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
