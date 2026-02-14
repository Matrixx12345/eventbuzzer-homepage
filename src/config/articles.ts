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
  eventIds: string[]; // event IDs from Supabase
  exhibitionIds?: string[]; // optional exhibition event IDs for Editor's Pick section
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
    eventIds: [
      "111911", // Jungfraujoch - Top of Europe
      "111947", // Zermatt - Autofreies Alpen-Dorf
      "59420",  // Gletschergarten Dossen, Zermatt
      "59425",  // Gletscherschlucht, Grindelwald
      "59426",  // Matterhorn Gotthard Bahn
      "59422",  // Gletschergarten von Cavaglia
      "59423",  // Brunnenberg-Bahn (Oberblegisee)
      "77736",  // Walliser Alpentherme & Spa Leukerbad
      "59558",  // Expedition Gletscherwelt Aletsch
      "59421",  // Treib-Seelisberg-Bahn
    ],
    publishedDate: "2026-02-13",
    readingTime: 6,
  },
  {
    slug: "tag-in-zuerich",
    slugEn: "day-in-zurich",
    title: "Ein Tag in Zürich – Die besten Tipps und Events",
    titleEn: "A Day in Zurich – Best Tips and Events",
    description: "Plane deinen perfekten Tag in Zürich. Museen, Restaurants, Events und Sehenswürdigkeiten – alles was du für einen unvergesslichen Tag brauchst.",
    descriptionEn: "Plan your perfect day in Zurich. Museums, restaurants, events and sights – everything you need for an unforgettable day.",
    heroImage: "/og-image.jpg",
    category: "stadt",
    eventIds: [
      "94660",  // Kunsthaus Zürich
      "59243",  // Heureka von Jean Tinguely
      "94666",  // Uhrenmuseum Beyer
      "59536",  // Zürcher Museums-Bahn
      "64760",  // Caliente! Latin Music Festival
      "111998", // Flohmarkt Bullingerhof
      "64863",  // Das Lumpenpack
      "64834",  // Ivo Martin
      "64373",  // $ono$ Cliq
      "59763",  // Wengernalpbahn
    ],
    publishedDate: "2026-02-13",
    readingTime: 7,
  },
  {
    slug: "10-beste-museen-schweiz",
    slugEn: "10-best-museums-switzerland",
    title: "10 beste Museen der Schweiz – Kunst, Geschichte und Kultur",
    titleEn: "10 Best Museums in Switzerland – Art, History and Culture",
    description: "Die 10 besten Museen der Schweiz: Von Kunsthäusern in Zürich über historische Museen in Bern bis zu Technikmuseen in Luzern. Jetzt entdecken!",
    descriptionEn: "The 10 best museums in Switzerland: From art galleries in Zurich to history museums in Bern and technology museums in Lucerne. Discover now!",
    heroImage: "/og-image.jpg",
    category: "museum",
    eventIds: [
      "94660",  // Kunsthaus Zürich
      "94654",  // Fondation Beyeler, Riehen
      "94667",  // Zentrum Paul Klee, Bern
      "103572", // Kunstmuseum Luzern
      "111907", // Swiss Science Center Technorama
      "103383", // Patek Philippe Museum, Genf
      "94669",  // Bernisches Historisches Museum
      "59243",  // Heureka von Jean Tinguely
      "59605",  // Tinguely-Brunnen, Basel
      "103838", // Museum für Kunst und Geschichte
    ],
    publishedDate: "2026-02-13",
    readingTime: 8,
    featured: true,
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
    eventIds: [
      "59424",  // Aussichtsplattform Rheinfall
      "111922", // Aletsch Gletscher UNESCO
      "94684",  // Château de Chillon
      "138116", // Kapellbrücke und Wasserturm
      "111910", // Altstadt Bern UNESCO
      "59466",  // Staubbachfall, Lauterbrunnen
      "59663",  // Rheinfall
      "111938", // Aareschlucht
      "59525",  // Dalaschlucht
      "137833", // Themenwege UNESCO Lauterbrunnen
    ],
    publishedDate: "2026-02-13",
    readingTime: 5,
  },
  {
    slug: "ein-tag-in-basel",
    slugEn: "day-in-basel",
    title: "Ein Tag in Basel – Kultur, Kulinarik und Rheinufer",
    titleEn: "A Day in Basel – Culture, Cuisine and Rhine Riverbank",
    description: "Entdecke Basel an einem Tag: Von der Fondation Beyeler über das Basler Münster bis zum Sundowner am Rhein. Die perfekte Route für Kunst, Geschichte und Genuss.",
    descriptionEn: "Discover Basel in one day: From Fondation Beyeler via Basel Minster to sundowners by the Rhine. The perfect route for art, history and enjoyment.",
    heroImage: "https://www.myswitzerland.com/-/media/st/gadmin/images/cities/winter/cities/andreaszimmermann_mg_6211_249493.jpg",
    category: "stadt",
    eventIds: [
      "200583", // Fondation Beyeler
      "200585", // Restaurant Beyeler im Park
      "200584", // Villa Wenkenhof
      "200586", // Basler Rathaus
      "200587", // Sutter Begg Bäckerei
      "200588", // Basler Münster
      "200589", // Pfalz Basel
      "200590", // Münsterfähre Basel
      "200591", // Les Trois Rois
    ],
    publishedDate: "2026-02-13",
    readingTime: 8,
  },
];

export const getArticleBySlug = (slug: string): Article | undefined => {
  return ARTICLES.find((a) => a.slug === slug);
};

export const getArticleByEnSlug = (slug: string): Article | undefined => {
  return ARTICLES.find((a) => a.slugEn === slug);
};
