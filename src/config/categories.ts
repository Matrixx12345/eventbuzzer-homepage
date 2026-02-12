/**
 * Category Configuration for EventBuzzer
 *
 * Defines all event categories with:
 * - Slug (URL-safe identifier)
 * - Label (Display name)
 * - Description (SEO meta description)
 * - Keywords (for filtering events)
 */

export interface Category {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "museum",
    label: "Museen",
    description: "Entdecke die besten Museen, Kunstgalerien und Ausstellungen in der Schweiz. Von klassischer Kunst bis zu modernen Installationen. Erlebe Kultur und Geschichte hautnah.",
    keywords: ["museum", "kunst", "galer", "ausstellung"]
  },
  {
    slug: "konzert",
    label: "Konzerte",
    description: "Live-Musik Events und Konzerte in der Schweiz. Von Rock und Pop bis Jazz und Klassik - erlebe unvergessliche Musikmomente. Tickets für die besten Shows.",
    keywords: ["konzert", "music", "live", "band", "orchester"]
  },
  {
    slug: "festival",
    label: "Festivals",
    description: "Die besten Festivals der Schweiz. Musik-Festivals, Street Food Märkte, Kulturfeste und mehr. Von Open Air bis Indoor - finde dein perfektes Festival-Erlebnis.",
    keywords: ["festival", "fest"]
  },
  {
    slug: "wanderung",
    label: "Wanderungen",
    description: "Geführte Wanderungen, Trails und Outdoor-Erlebnisse in den Schweizer Alpen und der Natur. Von leichten Spaziergängen bis anspruchsvollen Bergtouren.",
    keywords: ["wanderung", "trail", "hike", "berg"]
  },
  {
    slug: "wellness",
    label: "Wellness",
    description: "Wellness, Spa und Thermalbäder in der Schweiz. Entspannung und Erholung für Körper und Geist. Von Massage bis Sauna - gönne dir eine Auszeit vom Alltag.",
    keywords: ["wellness", "spa", "therm", "bad"]
  },
  {
    slug: "natur",
    label: "Natur",
    description: "Naturerlebnisse, Parks, Gärten und Outdoor-Aktivitäten in der Schweiz. Entdecke die Schönheit der Schweizer Natur - von Nationalparks bis botanische Gärten.",
    keywords: ["natur", "park", "garten", "wald"]
  },
  {
    slug: "theater",
    label: "Theater",
    description: "Theater, Oper, Musical und Bühnenshows in den besten Theaterhäusern der Schweiz. Von klassischen Dramen bis moderne Inszenierungen - Kultur live auf der Bühne.",
    keywords: ["theater", "oper", "bühne", "musical"]
  },
  {
    slug: "schloss",
    label: "Schlösser",
    description: "Historische Schlösser, Burgen und Festungen - entdecke die Geschichte der Schweiz. Von mittelalterlichen Burgen bis barocke Schlossanlagen mit Führungen.",
    keywords: ["schloss", "burg", "castle"]
  },
  {
    slug: "familie",
    label: "Familie",
    description: "Familienfreundliche Events und Aktivitäten für Kinder und Eltern in der Schweiz. Von Spielplätzen bis Erlebnisparks - Spass für die ganze Familie garantiert.",
    keywords: ["familie", "kinder", "family"]
  },
  {
    slug: "kulinarik",
    label: "Kulinarik",
    description: "Kulinarische Events, Food-Festivals, Weinproben und Gourmet-Erlebnisse in der Schweiz. Von Käse-Degustationen bis Sterneküche - Schweizer Genusskultur erleben.",
    keywords: ["food", "kulinar", "gastro", "wein", "käse"]
  },
  {
    slug: "sport",
    label: "Sport",
    description: "Sportevents, Wettkämpfe und sportliche Aktivitäten in der Schweiz. Von Fussball und Eishockey bis Marathons und Skirennen - erlebe Sport hautnah live vor Ort.",
    keywords: ["sport", "match", "rennen"]
  },
  {
    slug: "ausflug",
    label: "Ausflüge",
    description: "Tagesausflüge, Sehenswürdigkeiten und besondere Erlebnisse in der Schweiz. Von Stadtführungen bis Bergausflüge - die schönsten Orte und Highlights entdecken.",
    keywords: ["sehenswürdig", "attraction", "ausflug", "erlebnis"]
  },
  {
    slug: "stadt",
    label: "Stadterlebnis",
    description: "Stadtführungen, Altstadtbummel und urbane Erlebnisse in Schweizer Städten. Von Zürich bis Genf - Geschichte, Architektur und Kultur in den schönsten Städten.",
    keywords: ["altstadt", "city", "stadt", "führung"]
  },
  {
    slug: "see",
    label: "Seen",
    description: "Events an und auf Schweizer Seen. Schifffahrten, Seepromenaden und Wassersport. Vom Genfersee bis Vierwaldstättersee - die Schweizer Seenlandschaft erleben.",
    keywords: ["see", "lake", "schiff", "wasser"]
  },
  {
    slug: "must-see",
    label: "Must-See",
    description: "Die absoluten Highlights - Events und Erlebnisse, die man nicht verpassen sollte. Die Top-Attraktionen der Schweiz für unvergessliche Momente und Erlebnisse.",
    keywords: ["must-see", "elite", "highlight"]
  }
];

/**
 * Get category by slug
 */
export const getCategoryBySlug = (slug: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.slug === slug);
};

/**
 * Get all category slugs for routing
 */
export const getAllCategorySlugs = (): string[] => {
  return CATEGORIES.map(cat => cat.slug);
};
