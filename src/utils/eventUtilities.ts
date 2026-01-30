import { getNearestPlace } from "./swissPlaces";

// ============================================================================
// TEXT PROCESSING
// ============================================================================

export const convertToUmlauts = (text: string | null | undefined): string => {
  if (!text) return "";
  const replacements: [string, string][] = [
    ["fuer", "für"], ["Fuer", "Für"],
    ["ueber", "über"], ["Ueber", "Über"],
    ["Aelteste", "Älteste"], ["aelteste", "älteste"],
    ["Aeltestes", "Ältestes"], ["aeltestes", "ältestes"],
    ["Aeltere", "Ältere"], ["aeltere", "ältere"],
    ["aelter", "älter"], ["Aelter", "Älter"],
    ["oeffentliche", "öffentliche"], ["Oeffentliche", "Öffentliche"],
    ["oeffentlichen", "öffentlichen"], ["Oeffentlichen", "Öffentlichen"],
    ["oeffentlicher", "öffentlicher"], ["Oeffentlicher", "Öffentlicher"],
    ["beruehmte", "berühmte"], ["Beruehmte", "Berühmte"],
    ["beruehmten", "berühmten"], ["Beruehmten", "Berühmten"],
    ["Weltberuehmte", "Weltberühmte"], ["weltberuehmte", "weltberühmte"],
    ["Weltberuehmten", "Weltberühmten"], ["weltberuehmten", "weltberühmten"],
    ["schoene", "schöne"], ["Schoene", "Schöne"],
    ["schoenen", "schönen"], ["Schoenen", "Schönen"],
    ["schoenste", "schönste"], ["Schoenste", "Schönste"],
    ["grossartige", "großartige"], ["Grossartige", "Großartige"],
    ["groesste", "größte"], ["Groesste", "Größte"],
    ["groessere", "größere"], ["Groessere", "Größere"],
    ["hoechste", "höchste"], ["Hoechste", "Höchste"],
    ["fruehere", "frühere"], ["Fruehere", "Frühere"],
    ["taeglich", "täglich"], ["Taeglich", "Täglich"],
    ["jaehrlich", "jährlich"], ["Jaehrlich", "Jährlich"],
    ["natuerlich", "natürlich"], ["Natuerlich", "Natürlich"],
    ["kuenstlerische", "künstlerische"], ["Kuenstlerische", "Künstlerische"],
    ["Kuenstler", "Künstler"], ["kuenstler", "künstler"],
    ["Kuenstlern", "Künstlern"], ["kuenstlern", "künstlern"],
    ["Gemaelde", "Gemälde"], ["gemaelde", "gemälde"],
    ["Stueck", "Stück"], ["stueck", "stück"],
    ["Stuecke", "Stücke"], ["stuecke", "stücke"],
    ["Fuehrung", "Führung"], ["fuehrung", "führung"],
    ["Fuehrungen", "Führungen"], ["fuehrungen", "führungen"],
    ["Eroeffnung", "Eröffnung"], ["eroeffnung", "eröffnung"],
    ["Ausfluege", "Ausflüge"], ["ausfluege", "ausflüge"],
    ["Laerm", "Lärm"], ["laerm", "lärm"],
    ["Geraeusch", "Geräusch"], ["geraeusch", "geräusch"],
    ["Geraeusche", "Geräusche"], ["geraeusche", "geräusche"],
    ["Gebaeude", "Gebäude"], ["gebaeude", "gebäude"],
    ["Naehe", "Nähe"], ["naehe", "nähe"],
    ["Gaeste", "Gäste"], ["gaeste", "gäste"],
    ["Staedte", "Städte"], ["staedte", "städte"],
    ["Plaetze", "Plätze"], ["plaetze", "plätze"],
    ["Spaziergaenge", "Spaziergänge"], ["spaziergaenge", "spaziergänge"],
    ["Anfaenger", "Anfänger"], ["anfaenger", "anfänger"],
    ["Sehenswuerdigkeiten", "Sehenswürdigkeiten"], ["sehenswuerdigkeiten", "sehenswürdigkeiten"],
    ["Zuerich", "Zürich"], ["zuerich", "zürich"],
    ["Muenchen", "München"], ["muenchen", "münchen"],
    ["koennen", "können"], ["Koennen", "Können"],
    ["moechten", "möchten"], ["Moechten", "Möchten"],
    ["wuerden", "würden"], ["Wuerden", "Würden"],
    ["muessen", "müssen"], ["Muessen", "Müssen"],
    ["hoeren", "hören"], ["Hoeren", "Hören"],
    ["gehoert", "gehört"], ["Gehoert", "Gehört"],
    ["fuehrt", "führt"], ["Fuehrt", "Führt"],
    ["praesentiert", "präsentiert"], ["Praesentiert", "Präsentiert"],
    ["beruehrt", "berührt"], ["Beruehrt", "Berührt"],
    ["eroeffnet", "eröffnet"], ["Eroeffnet", "Eröffnet"],
    ["waehrend", "während"], ["Waehrend", "Während"],
  ];
  let result = text;
  for (const [from, to] of replacements) {
    result = result.split(from).join(to);
  }
  return result;
};

// ============================================================================
// LOCATION FORMATTING
// ============================================================================

export const getEventLocation = (event: any): string => {
  const countryNames = [
    "schweiz", "switzerland", "suisse", "svizzera",
    "germany", "deutschland", "france", "frankreich",
    "austria", "österreich", "italy", "italien", "liechtenstein",
  ];

  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };

  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) {
    return city;
  }

  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) {
    return event.venue_name.trim();
  }

  if (event.location && !isCountry(event.location)) {
    return event.location.trim();
  }

  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }

  return "";
};

// ============================================================================
// BUZZ SCORE COLOR
// ============================================================================

export const getBuzzColor = (score: number) => {
  if (score <= 20) return "#9ca3af"; // gray
  if (score <= 35) return "#a8a29e"; // stone
  if (score <= 45) return "#facc15"; // yellow
  if (score <= 55) return "#fbbf24"; // amber
  if (score <= 65) return "#f59e0b"; // amber-500
  if (score <= 75) return "#f97316"; // orange
  if (score <= 85) return "#fb923c"; // orange-400 (heller, wärmer)
  if (score <= 92) return "#f97316"; // orange (statt rot)
  return "#ea580c"; // deep orange (statt rot)
};

// ============================================================================
// CATEGORY LABELS
// ============================================================================

export const getCategoryLabel = (event: any): string | undefined => {
  // PRIORITY 1: "must-see" tag gets "Must-See" label (highest priority!)
  if (event.tags && (event.tags.includes('must-see') || event.tags.includes('elite'))) return 'Must-See';

  const subCat = (event.category_sub_id || '').toString().toLowerCase();
  const tags = Array.isArray(event.tags) ? event.tags.join(' ').toLowerCase() : '';
  const title = (event.title || '').toLowerCase();
  const combined = `${subCat} ${tags} ${title}`;

  // Exakte und Teil-Matches für Kategorien
  if (combined.includes('museum') || combined.includes('kunst') || combined.includes('galer') || combined.includes('ausstellung')) return 'Museum';
  if (combined.includes('wanderung') || combined.includes('trail') || combined.includes('hike')) return 'Wanderung';
  if (combined.includes('wellness') || combined.includes('spa') || combined.includes('therm') || combined.includes('bad')) return 'Wellness';
  if (combined.includes('natur') || combined.includes('park') || combined.includes('garten') || combined.includes('wald')) return 'Natur';
  if (combined.includes('sehenswürdig') || combined.includes('attraction')) return 'Ausflug';
  if (combined.includes('schloss') || combined.includes('burg') || combined.includes('castle')) return 'Schloss';
  if (combined.includes('kirche') || combined.includes('kloster') || combined.includes('dom') || combined.includes('münster')) return 'Kultur';
  if (combined.includes('zoo') || combined.includes('tier') || combined.includes('aquar')) return 'Tierpark';
  if (combined.includes('familie') || combined.includes('kinder') || combined.includes('family')) return 'Familie';
  if (combined.includes('wissenschaft') || combined.includes('technik') || combined.includes('science') || combined.includes('planetar')) return 'Science';
  if (combined.includes('konzert') || combined.includes('music') || combined.includes('live')) return 'Konzert';
  if (combined.includes('theater') || combined.includes('oper') || combined.includes('bühne')) return 'Theater';
  if (combined.includes('sport')) return 'Sport';
  if (combined.includes('festival') || combined.includes('fest')) return 'Festival';
  if (combined.includes('food') || combined.includes('kulinar') || combined.includes('gastro') || combined.includes('wein') || combined.includes('käse')) return 'Kulinarik';
  if (combined.includes('nightlife') || combined.includes('party') || combined.includes('club')) return 'Nightlife';
  if (combined.includes('aussicht') || combined.includes('view') || combined.includes('panorama') || combined.includes('berg')) return 'Aussicht';
  // Check for 'see' (lake) but exclude 'must-see' tag
  if ((combined.includes('see') || combined.includes('lake') || combined.includes('schiff')) && !combined.includes('must-see')) return 'See';
  if (combined.includes('bahn') || combined.includes('zug') || combined.includes('train')) return 'Bahn';
  if (combined.includes('altstadt') || combined.includes('city') || combined.includes('stadt')) return 'Stadt';
  if (combined.includes('erlebnis')) return 'Erlebnis';

  // Fallback für myswitzerland: "Ausflug" als Default
  if (event.source === 'myswitzerland') return 'Ausflug';

  return undefined;
};

// ============================================================================
// CALENDAR EXPORT
// ============================================================================

export const exportToCalendar = (event: any) => {
  const formatDateForICS = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = event.start_date ? formatDateForICS(event.start_date) : '';
  const endDate = event.end_date ? formatDateForICS(event.end_date) : '';

  const location = event.venue_name || event.address_city || event.location || "Schweiz";
  const description = (event.short_description || event.description || "")
    .replace(/\n/g, '\\n');

  const eventUrl = `${window.location.origin}/event/${event.external_id || event.id}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventBuzzer//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventbuzzer.ch`,
    `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}\\n\\nMehr Infos: ${eventUrl}`,
    `LOCATION:${location}`,
    `URL:${eventUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// DISTANCE CALCULATION
// ============================================================================

// WICHTIG: Deutsche Namen mit Umlauten, weil swissPlaces.ts auch deutsche Namen nutzt
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "zürich": { lat: 47.3769, lng: 8.5417 },
  "genf": { lat: 46.2044, lng: 6.1432 },
  "basel": { lat: 47.5596, lng: 7.5886 },
  "bern": { lat: 46.948, lng: 7.4474 },
  "lausanne": { lat: 46.5197, lng: 6.6323 },
  "luzern": { lat: 47.0502, lng: 8.3093 },
  "winterthur": { lat: 47.4984, lng: 8.7246 },
  "st. gallen": { lat: 47.4245, lng: 9.3767 },
  "lugano": { lat: 46.0037, lng: 8.9511 },
  "thun": { lat: 46.758, lng: 7.6280 },
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
