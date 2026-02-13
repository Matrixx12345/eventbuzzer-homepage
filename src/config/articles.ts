/**
 * Magazine Article Configuration
 *
 * Each article has metadata + event IDs.
 * Content is stored as markdown files in /public/articles/
 */

export interface Article {
  slug: string;
  slugEn: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  heroImage: string;
  category: string; // matches category slug from categories.ts
  eventIds: string[]; // 10 event UUIDs from Supabase
  publishedDate: string;
  readingTime: number;
  featured?: boolean;
}

export const ARTICLES: Article[] = [
  {
    slug: "ausflug-in-die-berge",
    slugEn: "mountain-excursion-switzerland",
    title: "Ausflug in die Berge – Die besten Bergerlebnisse der Schweiz",
    titleEn: "Mountain Excursion – Best Mountain Experiences in Switzerland",
    description: "Entdecke die schönsten Bergausflüge der Schweiz. Von Wanderungen über Gipfeltouren bis zu Bergbahnen – die besten Erlebnisse in den Schweizer Alpen.",
    descriptionEn: "Discover the most beautiful mountain excursions in Switzerland. From hiking trails to summit tours and mountain railways – the best Alpine experiences.",
    heroImage: "/og-image.jpg",
    category: "wanderung",
    eventIds: [], // User fills with 10 event IDs
    publishedDate: "2026-02-13",
    readingTime: 6,
    featured: true,
  },
  {
    slug: "tag-in-zuerich",
    slugEn: "day-in-zurich",
    title: "Ein Tag in Zürich – Die besten Tipps & Events",
    titleEn: "A Day in Zurich – Best Tips & Events",
    description: "Plane deinen perfekten Tag in Zürich. Museen, Restaurants, Events und Sehenswürdigkeiten – alles was du für einen unvergesslichen Tag brauchst.",
    descriptionEn: "Plan your perfect day in Zurich. Museums, restaurants, events and sights – everything you need for an unforgettable day.",
    heroImage: "/og-image.jpg",
    category: "stadt",
    eventIds: [],
    publishedDate: "2026-02-13",
    readingTime: 7,
  },
  {
    slug: "10-beste-museen-schweiz",
    slugEn: "10-best-museums-switzerland",
    title: "10 beste Museen der Schweiz – Kunst, Geschichte & Kultur",
    titleEn: "10 Best Museums in Switzerland – Art, History & Culture",
    description: "Die 10 besten Museen der Schweiz: Von Kunsthäusern in Zürich über historische Museen in Bern bis zu Technikmuseen in Luzern. Jetzt entdecken!",
    descriptionEn: "The 10 best museums in Switzerland: From art galleries in Zurich to history museums in Bern and technology museums in Lucerne. Discover now!",
    heroImage: "/og-image.jpg",
    category: "museum",
    eventIds: [],
    publishedDate: "2026-02-13",
    readingTime: 8,
  },
  {
    slug: "sehenswuerdigkeiten-schweiz",
    slugEn: "unique-attractions-switzerland",
    title: "Einzigartige Sehenswürdigkeiten in der Schweiz",
    titleEn: "Unique Attractions in Switzerland",
    description: "Die einzigartigsten Sehenswürdigkeiten der Schweiz entdecken. Von versteckten Juwelen bis zu weltberühmten Attraktionen – Schweizer Highlights die man gesehen haben muss.",
    descriptionEn: "Discover Switzerland's most unique attractions. From hidden gems to world-famous sights – Swiss highlights you must see.",
    heroImage: "/og-image.jpg",
    category: "ausflug",
    eventIds: [],
    publishedDate: "2026-02-13",
    readingTime: 5,
  },
];

export const getArticleBySlug = (slug: string): Article | undefined => {
  return ARTICLES.find((a) => a.slug === slug);
};

export const getArticleByEnSlug = (slug: string): Article | undefined => {
  return ARTICLES.find((a) => a.slugEn === slug);
};
