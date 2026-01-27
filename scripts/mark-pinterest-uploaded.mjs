#!/usr/bin/env node

/**
 * Mark Pinterest Uploaded Events
 *
 * Markiert Events in Supabase als auf Pinterest hochgeladen.
 * Liest Event-IDs aus pinterest-uploaded-ids.json und setzt pinterest_uploaded_at.
 *
 * Usage:
 * 1. Führe convert-pinterest-offline.mjs aus → generiert pinterest-uploaded-ids.json
 * 2. Lade die CSV auf Pinterest hoch
 * 3. Führe DIESES Script aus um Events in Supabase zu markieren
 */

import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try .env.local first, then .env
const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 Mark Pinterest Uploaded Events');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check for IDs file
const idsPath = join(__dirname, '..', 'pinterest-uploaded-ids.json');

if (!existsSync(idsPath)) {
  console.error('❌ FEHLER: pinterest-uploaded-ids.json nicht gefunden!\n');
  console.log('📋 ANLEITUNG:\n');
  console.log('1. Führe zuerst aus: node scripts/convert-pinterest-offline.mjs');
  console.log('2. Das Script generiert pinterest-uploaded-ids.json');
  console.log('3. Lade die CSV auf Pinterest hoch');
  console.log('4. Führe DANN dieses Script aus\n');
  process.exit(1);
}

// Check for Supabase credentials
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ FEHLER: Supabase Service Role Key fehlt!\n');
  console.log('📋 SO HOLST DU DEN KEY:\n');
  console.log('1. Gehe zu: https://supabase.com/dashboard/project/_/settings/api');
  console.log('2. Kopiere den "service_role" Key (NICHT der anon key!)');
  console.log('3. Füge ihn in .env oder .env.local ein:\n');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key_hier\n');
  console.log('⚠️  WICHTIG: Service Role Key hat volle Admin-Rechte!');
  console.log('   NIEMALS im Frontend verwenden oder in Git committen!\n');
  process.exit(1);
}

// Load Event IDs
console.log('📖 Lade Event-IDs...\n');
const eventIds = JSON.parse(readFileSync(idsPath, 'utf-8'));

if (!Array.isArray(eventIds) || eventIds.length === 0) {
  console.error('❌ Keine Event-IDs gefunden in pinterest-uploaded-ids.json\n');
  process.exit(1);
}

console.log(`✅ ${eventIds.length} Event-IDs geladen\n`);

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔄 Markiere Events in Supabase...\n');

try {
  // Update events in batches of 100 (Supabase limit)
  const batchSize = 100;
  let totalUpdated = 0;

  for (let i = 0; i < eventIds.length; i += batchSize) {
    const batch = eventIds.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('events')
      .update({ pinterest_uploaded_at: new Date().toISOString() })
      .in('external_id', batch)
      .select('id');

    if (error) {
      console.error(`❌ Fehler beim Update von Batch ${Math.floor(i / batchSize) + 1}:`, error);
      continue;
    }

    totalUpdated += data?.length || 0;
    console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} Events markiert`);
  }

  console.log('');
  console.log('✅ ERFOLGREICH ABGESCHLOSSEN!\n');
  console.log(`📊 ${totalUpdated} von ${eventIds.length} Events als hochgeladen markiert`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🎯 NÄCHSTE SCHRITTE:');
  console.log('');
  console.log('1. Beim nächsten Lauf von convert-pinterest-offline.mjs');
  console.log('   werden diese Events automatisch übersprungen!');
  console.log('');
  console.log('2. Du kannst das Script erneut ausführen für die nächsten 100 Events:');
  console.log('   node scripts/convert-pinterest-offline.mjs');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('❌ Unerwarteter Fehler:', error);
  process.exit(1);
}
