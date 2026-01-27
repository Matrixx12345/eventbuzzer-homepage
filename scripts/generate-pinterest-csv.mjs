#!/usr/bin/env node

/**
 * Pinterest Bulk Upload CSV Generator
 *
 * Generiert eine CSV-Datei mit allen Events aus Supabase für Pinterest Bulk Upload.
 *
 * Usage: node scripts/generate-pinterest-csv.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase Credentials
const SUPABASE_URL = 'https://qhvunoyipzjhnlwldutq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnVub3lpcHpqaG5sd2xkdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzY4NTksImV4cCI6MjA1MTc1Mjg1OX0.SdqCDtRo2qMnLIvDSXiBbT8wR1r8t1YMKLhkDo6dGAw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SITE_URL = 'https://eventbuzzer.ch';

// Board-Mapping basierend auf Event-Kategorie
const BOARD_MAP = {
  // Musik-Events
  'concerts': 'Konzerte Schweiz 2026',
  'music': 'Konzerte Schweiz 2026',
  'live-music': 'Konzerte Schweiz 2026',

  // Festivals
  'festivals': 'Festivals Schweiz',
  'festival': 'Festivals Schweiz',
  'open-air': 'Festivals Schweiz',

  // Stadt-spezifisch
  'zurich': 'Events Zürich',
  'zürich': 'Events Zürich',
  'basel': 'Events Basel',
  'bern': 'Events Bern',
  'geneva': 'Events Genf',
  'genf': 'Events Genf',
  'genève': 'Events Genf',
  'lucerne': 'Events Luzern',
  'luzern': 'Events Luzern',

  // Familien
  'family': 'Familien-Events Schweiz',
  'kids': 'Familien-Events Schweiz',
  'children': 'Familien-Events Schweiz',

  // Party
  'nightlife': 'Party & Nachtleben',
  'club': 'Party & Nachtleben',
  'party': 'Party & Nachtleben',

  // Kultur
  'art': 'Kultur & Kunst Events',
  'culture': 'Kultur & Kunst Events',
  'museum': 'Kultur & Kunst Events',
  'theater': 'Kultur & Kunst Events',

  // Sport
  'sports': 'Sport Events Schweiz',
  'sport': 'Sport Events Schweiz',
};

// Fallback Board
const DEFAULT_BOARD = 'Events Schweiz';

/**
 * Bestimmt das passende Pinterest Board basierend auf Event-Daten
 */
function determineBoard(event) {
  const eventTitle = (event.title || '').toLowerCase();
  const eventCategory = (event.category || '').toLowerCase();
  const eventLocation = (event.address_city || event.location || '').toLowerCase();
  const eventTags = (event.tags || []).map(t => t.toLowerCase()).join(' ');

  const searchString = `${eventTitle} ${eventCategory} ${eventLocation} ${eventTags}`;

  // Prüfe Board-Map
  for (const [keyword, board] of Object.entries(BOARD_MAP)) {
    if (searchString.includes(keyword)) {
      return board;
    }
  }

  return DEFAULT_BOARD;
}

/**
 * Generiert Pinterest-optimierten Titel
 */
function generateTitle(event) {
  const title = event.title || 'Event';
  const city = event.address_city || event.location;
  const date = event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

  if (city && date) {
    return `${title} in ${city} | ${date}`;
  } else if (city) {
    return `${title} in ${city}`;
  } else if (date) {
    return `${title} | ${date}`;
  }

  return title;
}

/**
 * Generiert Pinterest-optimierte Beschreibung
 */
function generateDescription(event) {
  const title = event.title || '';
  const city = event.address_city || event.location || 'Schweiz';
  const venue = event.venue_name || '';
  const date = event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';
  const time = event.start_date ? new Date(event.start_date).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  let description = `${title}`;

  if (city) {
    description += ` in ${city}`;
  }

  if (date) {
    description += ` am ${date}`;
  }

  if (venue) {
    description += `\n\n📍 ${venue}`;
  }

  if (time && time !== '00:00') {
    description += `\n🕐 ${time} Uhr`;
  }

  // Kurze Event-Beschreibung (max 200 Zeichen)
  if (event.short_description) {
    const shortDesc = event.short_description.substring(0, 200);
    description += `\n\n${shortDesc}`;
  } else if (event.description) {
    const shortDesc = event.description.substring(0, 200);
    description += `\n\n${shortDesc}`;
  }

  description += `\n\nAlle Infos auf EventBuzzer.ch`;

  // Hashtags
  const hashtags = [
    `#EventsSchweiz`,
    city ? `#${city.replace(/\s+/g, '')}Events` : null,
    event.category ? `#${event.category.replace(/\s+/g, '')}` : null,
  ].filter(Boolean).join(' ');

  description += `\n\n${hashtags}`;

  return description;
}

/**
 * Generiert Event-URL
 */
function generateEventUrl(event) {
  const slug = event.external_id || event.id;
  return `${SITE_URL}/event/${slug}`;
}

/**
 * CSV-Escape (für Kommas und Anführungszeichen)
 */
function csvEscape(str) {
  if (!str) return '';

  // Konvertiere zu String
  str = String(str);

  // Ersetze Anführungszeichen mit doppelten Anführungszeichen
  str = str.replace(/"/g, '""');

  // Wenn Komma, Anführungszeichen oder Newline enthalten → in Quotes wrappen
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str}"`;
  }

  return str;
}

/**
 * Hauptfunktion
 */
async function generatePinterestCSV() {
  console.log('🔄 Lade Events aus Supabase...');

  try {
    // Lade ALLE Events (mit Pagination, da Supabase max 1000 Rows zurückgibt)
    let allEvents = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('events')
        .select('id, external_id, title, description, short_description, category, tags, image_url, venue_name, location, address_city, start_date')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Fehler beim Laden der Events:', error);
        process.exit(1);
      }

      if (!data || data.length === 0) break;

      allEvents = allEvents.concat(data);
      console.log(`   Geladen: ${allEvents.length} Events`);

      if (data.length < pageSize) break; // Letzte Page
      page++;
    }

    console.log(`✅ ${allEvents.length} Events geladen`);

    // Filtere Events ohne Bilder (Pinterest braucht Bilder!)
    const eventsWithImages = allEvents.filter(event => event.image_url);
    console.log(`📸 ${eventsWithImages.length} Events haben Bilder`);

    if (eventsWithImages.length === 0) {
      console.error('❌ Keine Events mit Bildern gefunden!');
      process.exit(1);
    }

    // Generiere CSV
    console.log('📝 Generiere CSV...');

    // CSV Header (Pinterest Format)
    const headers = ['image_url', 'title', 'description', 'link', 'board'];
    let csvContent = headers.join(',') + '\n';

    // CSV Rows
    for (const event of eventsWithImages) {
      const row = [
        csvEscape(event.image_url),
        csvEscape(generateTitle(event)),
        csvEscape(generateDescription(event)),
        csvEscape(generateEventUrl(event)),
        csvEscape(determineBoard(event)),
      ];

      csvContent += row.join(',') + '\n';
    }

    // Speichern
    const outputPath = join(__dirname, '..', 'pinterest-pins.csv');
    writeFileSync(outputPath, csvContent, 'utf-8');

    console.log('✅ CSV generiert!');
    console.log(`📁 Datei: ${outputPath}`);
    console.log(`📊 Anzahl Pins: ${eventsWithImages.length}`);
    console.log('');
    console.log('🎯 NÄCHSTE SCHRITTE:');
    console.log('1. Gehe zu Pinterest.com');
    console.log('2. Klick auf "Create" → "Create Pins" → "Upload .csv or .txt file"');
    console.log('3. Lade pinterest-pins.csv hoch');
    console.log('4. Pinterest erstellt automatisch alle Pins! 🚀');

  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

// Run
generatePinterestCSV();
