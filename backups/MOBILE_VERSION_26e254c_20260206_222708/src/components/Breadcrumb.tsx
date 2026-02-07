import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/config/constants";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  currentPage: string;
}

/**
 * SEO-optimized Breadcrumb component with Schema.org structured data
 *
 * Displays navigation path: Home > Events > City > Category > Event
 * Includes JSON-LD structured data for Google Rich Snippets
 */
export const Breadcrumb = ({ items, currentPage }: BreadcrumbProps) => {
  // Generate Schema.org BreadcrumbList structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `${SITE_URL}${item.href}`
      })),
      {
        "@type": "ListItem",
        "position": items.length + 2,
        "name": currentPage,
      }
    ]
  };

  return (
    <>
      {/* Schema.org structured data for Google Rich Snippets */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Visual breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center flex-wrap gap-2 text-sm text-stone-600">
          {/* Home link */}
          <li className="flex items-center gap-2">
            <Link
              to="/"
              className="hover:text-stone-900 transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={14} className="text-stone-400" />
          </li>

          {/* Intermediate breadcrumb items */}
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <Link
                to={item.href}
                className="hover:text-stone-900 transition-colors"
              >
                {item.label}
              </Link>
              <ChevronRight size={14} className="text-stone-400" />
            </li>
          ))}

          {/* Current page (not clickable) */}
          <li className="text-stone-900 font-medium line-clamp-1 max-w-[300px]" aria-current="page">
            {currentPage}
          </li>
        </ol>
      </nav>
    </>
  );
};
