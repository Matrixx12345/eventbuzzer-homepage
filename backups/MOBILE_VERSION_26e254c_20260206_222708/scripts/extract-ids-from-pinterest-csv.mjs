#!/usr/bin/env node

/**
 * Extract Event IDs from Pinterest CSV
 *
 * Erstellt pinterest-uploaded-ids.json aus der pinterest-100-pins.csv
 * Nützlich wenn die IDs-Datei fehlt aber die CSV existiert
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Extrahiere Event-IDs aus Pinterest CSV...\n');

const csvPath = join(__dirname, '..', 'pinterest-100-pins.csv');

if (!existsSync(csvPath)) {
  console.error('❌ pinterest-100-pins.csv nicht gefunden!\n');
  process.exit(1);
}

// Parse CSV
const csvContent = readFileSync(csvPath, 'utf-8');
const rows = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

console.log(`✅ ${rows.length} Pins gefunden\n`);

// Extract event IDs/slugs from Link column
// Link format: https://eventbuzzer.ch/event/SLUG_OR_ID
const eventIds = rows.map(row => {
  const link = row.Link;
  const match = link.match(/\/event\/([^/]+)$/);
  return match ? match[1] : null;
}).filter(Boolean);

console.log(`✅ ${eventIds.length} Event-IDs extrahiert\n`);

// Write IDs file
const idsPath = join(__dirname, '..', 'pinterest-uploaded-ids.json');
writeFileSync(idsPath, JSON.stringify(eventIds, null, 2), 'utf-8');

console.log('✅ pinterest-uploaded-ids.json erstellt!\n');
console.log('📁 Datei:', idsPath);
console.log('\n🎯 Jetzt kannst du markieren:');
console.log('   node scripts/mark-pinterest-uploaded.mjs\n');
