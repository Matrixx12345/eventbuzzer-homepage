#!/usr/bin/env node

/**
 * Pinterest Bulk Upload CSV Generator v2
 *
 * Generiert CSV mit 100 Top-Events für Pinterest
 * Basierend auf category_main_id und tags
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://qhvunoyipzjhnlwldutq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnVub3lpcHpqaG5sd2xkdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzY4NTksImV4cCI6MjA1MTc1Mjg1OX0.SdqCDtRo2qMnLIvDSXiBbT8wR1r8t1YMKLhkDo6dGAw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SITE_URL = 'https://eventbuzzer.ch';

// Pinterest Board Names (EXACT wie in deinem Pinterest Account!)
const BOARDS = {
  MUSIC: 'Konzerte & Musik Schweiz',
  FESTIVALS: 'Festivals Schweiz',
  SPORT: 'Sport & Fitness Events',
  FAMILY: 'Familien-Events Schweiz',
  CULTURE: 'Kultur & Kunst Events',
  MARKETS: 'Märkte & Messen Schweiz',
  WELLNESS: 'Wellness & Spa Events',
  PARTY: 'Party & Nachtleben',
  DEFAULT: 'Events Schweiz',
};

/**
 * Bestimmt Board basierend auf category_main_id und tags
 */
function determineBoard(event) {
  const tags = (event.tags || []).map(t => t.toLowerCase());
  const title = (event.title || '').toLowerCase();
  const category = event.category_main_id;

  // Sport & Fitness (category_main_id = 4)
  if (category === 4 || tags.some(t =>
    t.includes('sport') || t.includes('ski') || t.includes('bike') ||
    t.includes('marathon') || t.includes('action') || t.includes('fitness')
  )) {
    return BOARDS.SPORT;
  }

  // Familie & Kinder (category_main_id = 5)
  if (category === 5 || tags.some(t =>
    t.includes('familie') || t.includes('kinder') || t.includes('family') || t.includes('kids')
  ) || title.includes('kinder') || title.includes('familie')) {
    return BOARDS.FAMILY;
  }

  // Wellness & Spa (category_main_id = 2)
  if (category === 2 || tags.some(t =>
    t.includes('wellness') || t.includes('spa') || t.includes('therme') || t.includes('entspannung')
  )) {
    return BOARDS.WELLNESS;
  }

  // Märkte & Messen (category_main_id = 6)
  if (category === 6 || tags.some(t =>
    t.includes('markt') || t.includes('messe') || t.includes('weihnachtsmarkt')
  ) || title.includes('markt') || title.includes('messe')) {
    return BOARDS.MARKETS;
  }

  // Festivals (check vor Konzerte, da spezifischer!)
  if (tags.some(t =>
    t.includes('festival') || t.includes('openair') || t.includes('open-air')
  ) || title.includes('festival') || title.includes('openair')) {
    return BOARDS.FESTIVALS;
  }

  // Konzerte & Musik
  if (tags.some(t =>
    t.includes('konzert') || t.includes('musik') || t.includes('band') ||
    t.includes('live') || t.includes('oper') || t.includes('sänger') ||
    t.includes('concert') || t.includes('music')
  ) || title.includes('konzert') || title.includes('live')) {
    return BOARDS.MUSIC;
  }

  // Kultur & Kunst
  if (tags.some(t =>
    t.includes('museum') || t.includes('theater') || t.includes('ausstellung') ||
    t.includes('kultur') || t.includes('kunst') || t.includes('galerie') ||
    t.includes('oper')
  ) || title.includes('museum') || title.includes('theater')) {
    return BOARDS.CULTURE;
  }

  // Party & Nachtleben
  if (tags.some(t =>
    t.includes('party') || t.includes('club') || t.includes('nightlife') ||
    t.includes('dj') || t.includes('tanzparty')
  ) || title.includes('party') || title.includes('club')) {
    return BOARDS.PARTY;
  }

  // Fallback
  return BOARDS.DEFAULT;
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

  // Kürzen auf max 100 Zeichen (Pinterest Limit)
  let fullTitle = '';

  if (city && date) {
    fullTitle = `${title} in ${city} | ${date}`;
  } else if (city) {
    fullTitle = `${title} in ${city}`;
  } else if (date) {
    fullTitle = `${title} | ${date}`;
  } else {
    fullTitle = title;
  }

  return fullTitle.substring(0, 100);
}

/**
 * Generiert Pinterest-optimierte Beschreibung (max 500 chars)
 */
function generateDescription(event) {
  const title = event.title || '';
  const city = event.address_city || event.location || 'Schweiz';
  const venue = event.venue_name || '';
  const date = event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH', {
    weekday: 'long',
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
    description += `\n\n📅 ${date}`;
  }

  if (time && time !== '00:00') {
    description += `\n🕐 ${time} Uhr`;
  }

  if (venue) {
    description += `\n📍 ${venue}`;
  }

  // Kurze Event-Beschreibung
  if (event.short_description) {
    const shortDesc = event.short_description.substring(0, 150);
    description += `\n\n${shortDesc}...`;
  } else if (event.description) {
    const shortDesc = event.description.substring(0, 150);
    description += `\n\n${shortDesc}...`;
  }

  description += `\n\n✨ Alle Infos & Tickets auf EventBuzzer.ch`;

  // Hashtags
  const hashtags = [
    `#EventsSchweiz`,
    city ? `#${city.replace(/\s+/g, '')}` : null,
    `#Schweiz`,
  ].filter(Boolean).join(' ');

  description += `\n\n${hashtags}`;

  // Max 500 chars für Pinterest
  return description.substring(0, 500);
}

/**
 * CSV-Escape
 */
function csvEscape(str) {
  if (!str) return '';
  str = String(str);
  str = str.replace(/"/g, '""');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str}"`;
  }
  return str;
}

/**
 * Hauptfunktion
 */
async function generateCSV() {
  console.log('🔄 Lade TOP 100 Events aus Supabase...\n');

  try {
    // Lade TOP 100 Events (sortiert nach Relevanz/Datum)
    const { data, error } = await supabase
      .from('events')
      .select('id, external_id, title, description, short_description, category_main_id, tags, image_url, venue_name, location, address_city, start_date, buzz_score')
      .not('image_url', 'is', null) // Nur Events mit Bildern!
      .gte('start_date', new Date().toISOString()) // Nur zukünftige Events
      .order('buzz_score', { ascending: false, nullsLast: true })
      .order('start_date', { ascending: true })
      .limit(100);

    if (error) {
      console.error('❌ Fehler beim Laden:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ Keine Events gefunden!');
      process.exit(1);
    }

    console.log(`✅ ${data.length} Events geladen\n`);

    // Board-Statistik
    const boardStats = {};
    data.forEach(event => {
      const board = determineBoard(event);
      boardStats[board] = (boardStats[board] || 0) + 1;
    });

    console.log('📊 BOARD-VERTEILUNG:\n');
    Object.entries(boardStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([board, count]) => {
        console.log(`   ${board.padEnd(30)} ${count} Pins`);
      });
    console.log('');

    // CSV generieren
    console.log('📝 Generiere CSV...\n');

    const headers = ['image_url', 'title', 'description', 'link', 'board'];
    let csvContent = headers.join(',') + '\n';

    for (const event of data) {
      const slug = event.external_id || event.id;
      const eventUrl = `${SITE_URL}/event/${slug}`;

      const row = [
        csvEscape(event.image_url),
        csvEscape(generateTitle(event)),
        csvEscape(generateDescription(event)),
        csvEscape(eventUrl),
        csvEscape(determineBoard(event)),
      ];

      csvContent += row.join(',') + '\n';
    }

    // Speichern
    const outputPath = join(__dirname, '..', 'pinterest-100-pins.csv');
    writeFileSync(outputPath, csvContent, 'utf-8');

    console.log('✅ CSV ERFOLGREICH GENERIERT!\n');
    console.log(`📁 Datei: pinterest-100-pins.csv`);
    console.log(`📊 Anzahl Pins: ${data.length}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 NÄCHSTE SCHRITTE:');
    console.log('');
    console.log('1. Gehe zu Pinterest.com');
    console.log('2. Klick auf "Create" → "Create Pins"');
    console.log('3. Klick auf "Upload .csv or .txt file"');
    console.log('4. Wähle die Datei: pinterest-100-pins.csv');
    console.log('5. Pinterest prüft die CSV (dauert 10-30 Sek)');
    console.log('6. Klick auf "Publish" → 100 Pins gehen live! 🚀');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

generateCSV();
