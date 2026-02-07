#!/usr/bin/env node

/**
 * Pinterest CSV Converter (Offline Version)
 *
 * Nimmt Supabase CSV Export und konvertiert zu Pinterest Format
 * KEINE API calls - läuft komplett lokal!
 *
 * Usage:
 * 1. Exportiere Events aus Supabase Table Editor als CSV
 * 2. Speichere als "supabase-events.csv" im Projekt-Root
 * 3. Führe aus: node scripts/convert-pinterest-offline.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = 'https://eventbuzzer.ch';

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

function determineBoard(event) {
  // Tags parsing (kann String oder Array sein)
  let tags = [];
  if (event.tags) {
    if (typeof event.tags === 'string') {
      try {
        tags = JSON.parse(event.tags);
      } catch (e) {
        // Falls nicht JSON, als einzelner Tag behandeln
        tags = [event.tags];
      }
    } else if (Array.isArray(event.tags)) {
      tags = event.tags;
    }
  }

  const tagsLower = tags.map(t => String(t).toLowerCase());
  const title = (event.title || '').toLowerCase();
  const category = parseInt(event.category_main_id) || 0;

  // Sport & Fitness (category_main_id = 4)
  if (category === 4 || tagsLower.some(t =>
    t.includes('sport') || t.includes('ski') || t.includes('bike') ||
    t.includes('marathon') || t.includes('action') || t.includes('fitness')
  )) {
    return BOARDS.SPORT;
  }

  // Familie & Kinder (category_main_id = 5)
  if (category === 5 || tagsLower.some(t =>
    t.includes('familie') || t.includes('kinder') || t.includes('family') || t.includes('kids')
  ) || title.includes('kinder') || title.includes('familie')) {
    return BOARDS.FAMILY;
  }

  // Wellness & Spa (category_main_id = 2)
  if (category === 2 || tagsLower.some(t =>
    t.includes('wellness') || t.includes('spa') || t.includes('therme') || t.includes('entspannung')
  )) {
    return BOARDS.WELLNESS;
  }

  // Märkte & Messen (category_main_id = 6)
  if (category === 6 || tagsLower.some(t =>
    t.includes('markt') || t.includes('messe') || t.includes('weihnachtsmarkt')
  ) || title.includes('markt') || title.includes('messe')) {
    return BOARDS.MARKETS;
  }

  // Festivals (check vor Konzerte, da spezifischer!)
  if (tagsLower.some(t =>
    t.includes('festival') || t.includes('openair') || t.includes('open-air')
  ) || title.includes('festival') || title.includes('openair')) {
    return BOARDS.FESTIVALS;
  }

  // Konzerte & Musik
  if (tagsLower.some(t =>
    t.includes('konzert') || t.includes('musik') || t.includes('band') ||
    t.includes('live') || t.includes('oper') || t.includes('sänger') ||
    t.includes('concert') || t.includes('music')
  ) || title.includes('konzert') || title.includes('live')) {
    return BOARDS.MUSIC;
  }

  // Kultur & Kunst
  if (tagsLower.some(t =>
    t.includes('museum') || t.includes('theater') || t.includes('ausstellung') ||
    t.includes('kultur') || t.includes('kunst') || t.includes('galerie') ||
    t.includes('oper')
  ) || title.includes('museum') || title.includes('theater')) {
    return BOARDS.CULTURE;
  }

  // Party & Nachtleben
  if (tagsLower.some(t =>
    t.includes('party') || t.includes('club') || t.includes('nightlife') ||
    t.includes('dj') || t.includes('tanzparty')
  ) || title.includes('party') || title.includes('club')) {
    return BOARDS.PARTY;
  }

  return BOARDS.DEFAULT;
}

function generateTitle(event) {
  const title = event.title || 'Event';
  const city = event.address_city || event.location;
  const date = event.start_date ? new Date(event.start_date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

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
  if (city) description += ` in ${city}`;
  if (date) description += `\n\n📅 ${date}`;
  if (time && time !== '00:00') description += `\n🕐 ${time} Uhr`;
  if (venue) description += `\n📍 ${venue}`;

  if (event.short_description) {
    const shortDesc = event.short_description.substring(0, 150);
    description += `\n\n${shortDesc}...`;
  } else if (event.description) {
    const shortDesc = event.description.substring(0, 150);
    description += `\n\n${shortDesc}...`;
  }

  description += `\n\n✨ Alle Infos & Tickets auf EventBuzzer.ch`;

  const hashtags = [
    `#EventsSchweiz`,
    city ? `#${city.replace(/\s+/g, '')}` : null,
    `#Schweiz`,
  ].filter(Boolean).join(' ');

  description += `\n\n${hashtags}`;

  return description.substring(0, 500);
}

function csvEscape(str) {
  if (!str) return '""';
  str = String(str);
  // Escape alle Quotes durch Verdopplung
  str = str.replace(/"/g, '""');
  // IMMER in Quotes wrappen (sicherer für Pinterest)
  return `"${str}"`;
}

// Main
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Pinterest CSV Converter (Offline)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const inputPath = join(__dirname, '..', 'supabase-events.csv');

if (!existsSync(inputPath)) {
  console.error('❌ FEHLER: supabase-events.csv nicht gefunden!\n');
  console.log('📋 ANLEITUNG:\n');
  console.log('1. Gehe zu Supabase Dashboard → Table Editor');
  console.log('2. Öffne Tabelle "events"');
  console.log('3. Klick oben rechts auf "..." → "Export to CSV"');
  console.log('4. Speichere als "supabase-events.csv" im Projekt-Root');
  console.log('5. Führe dieses Script nochmal aus\n');
  process.exit(1);
}

console.log('🔄 Lade Supabase CSV Export...\n');

const supabaseCsv = readFileSync(inputPath, 'utf-8');
const allEvents = parse(supabaseCsv, {
  columns: true,
  skip_empty_lines: true,
  cast: true,
  cast_date: false
});

console.log(`✅ ${allEvents.length} Events aus CSV geladen\n`);

// Filtern: Nur Events mit Bildern + zukünftig + noch nicht auf Pinterest
console.log('🔍 Filtere Events...\n');

const now = new Date();
const filteredEvents = allEvents
  .filter(event => {
    // Muss Bild haben
    if (!event.image_url) return false;

    // Muss zukünftig sein
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (startDate < now) return false;
    }

    // Darf noch nicht auf Pinterest hochgeladen sein
    if (event.pinterest_uploaded_at) return false;

    return true;
  })
  .sort((a, b) => {
    // Sortiere nach buzz_score (DESC), dann start_date (ASC)
    const buzzA = parseFloat(a.buzz_score) || 0;
    const buzzB = parseFloat(b.buzz_score) || 0;

    if (buzzB !== buzzA) {
      return buzzB - buzzA;
    }

    // Bei gleichem buzz_score: frühere Events zuerst
    const dateA = a.start_date ? new Date(a.start_date) : new Date('2099-12-31');
    const dateB = b.start_date ? new Date(b.start_date) : new Date('2099-12-31');
    return dateA - dateB;
  })
  .slice(0, 100); // Top 100

console.log(`✅ ${filteredEvents.length} Events nach Filter (mit Bild + zukünftig)\n`);

if (filteredEvents.length === 0) {
  console.error('❌ Keine passenden Events gefunden!\n');
  console.log('Stelle sicher dass:');
  console.log('- Events image_url haben');
  console.log('- Events in der Zukunft liegen (start_date >= heute)');
  process.exit(1);
}

// Board Stats
const boardStats = {};
filteredEvents.forEach(event => {
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

// Generate Pinterest CSV
console.log('📝 Generiere Pinterest CSV...\n');

// WICHTIG: Pinterest erwartet EXAKT diese Header-Namen!
const headers = ['Media URL', 'Title', 'Description', 'Link', 'Pinterest board'];
let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

for (const event of filteredEvents) {
  const slug = event.external_id || event.id;
  const encodedSlug = encodeURIComponent(slug);
  const eventUrl = `${SITE_URL}/event/${encodedSlug}`;

  const row = [
    csvEscape(event.image_url),
    csvEscape(generateTitle(event)),
    csvEscape(generateDescription(event)),
    csvEscape(eventUrl),
    csvEscape(determineBoard(event)),
  ];

  csvContent += row.join(',') + '\n';
}

const outputPath = join(__dirname, '..', 'pinterest-100-pins.csv');
writeFileSync(outputPath, csvContent, 'utf-8');

// Speichere Event-IDs für späteres Markieren in Supabase
const eventIds = filteredEvents.map(e => e.id);
const idsPath = join(__dirname, '..', 'pinterest-uploaded-ids.json');
writeFileSync(idsPath, JSON.stringify(eventIds, null, 2), 'utf-8');

console.log('✅ PINTEREST CSV ERFOLGREICH GENERIERT!\n');
console.log('📁 Datei: pinterest-100-pins.csv');
console.log('📁 Event-IDs: pinterest-uploaded-ids.json');
console.log(`📊 Anzahl Pins: ${filteredEvents.length}`);
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
console.log('🔄 NACH ERFOLGREICHEM UPLOAD:');
console.log('');
console.log('7. Markiere Events in Supabase als hochgeladen:');
console.log('   node scripts/mark-pinterest-uploaded.mjs');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
