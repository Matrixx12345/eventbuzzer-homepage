#!/usr/bin/env node

/**
 * Check Event Categories from Supabase
 *
 * Zeigt alle Haupt-Kategorien aus der taxonomy Tabelle
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qhvunoyipzjhnlwldutq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnVub3lpcHpqaG5sd2xkdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzY4NTksImV4cCI6MjA1MTc1Mjg1OX0.SdqCDtRo2qMnLIvDSXiBbT8wR1r8t1YMKLhkDo6dGAw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCategories() {
  console.log('🔍 Checking categories from Supabase taxonomy table...\n');

  try {
    // Haupt-Kategorien laden
    const { data: mainCategories, error: mainError } = await supabase
      .from('taxonomy')
      .select('id, name, slug, type, display_order')
      .eq('type', 'main')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (mainError) {
      console.error('❌ Error loading main categories:', mainError);
      process.exit(1);
    }

    console.log('📋 HAUPT-KATEGORIEN:\n');
    console.log('ID  | Name                     | Slug');
    console.log('----+--------------------------+---------------------');

    mainCategories.forEach(cat => {
      console.log(`${String(cat.id).padEnd(3)} | ${cat.name.padEnd(24)} | ${cat.slug}`);
    });

    console.log('\n');

    // Event-Verteilung pro Kategorie
    console.log('📊 EVENT-VERTEILUNG PRO KATEGORIE:\n');

    for (const cat of mainCategories) {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('category_main_id', cat.id);

      if (!error) {
        console.log(`${cat.name.padEnd(25)} → ${count || 0} Events`);
      }
    }

    // Events ohne Kategorie
    const { count: uncategorized } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .is('category_main_id', null);

    console.log(`${'(Ohne Kategorie)'.padEnd(25)} → ${uncategorized || 0} Events`);

    console.log('\n');
    console.log('🎯 EMPFOHLENE PINTEREST BOARDS:\n');

    mainCategories.forEach(cat => {
      // Pinterest Board-Name generieren
      let boardName = cat.name;

      // "Schweiz" hinzufügen wenn nicht vorhanden
      if (!boardName.toLowerCase().includes('schweiz')) {
        boardName += ' Schweiz';
      }

      console.log(`✅ ${boardName}`);
    });

    console.log(`✅ Events Schweiz (Fallback für unkategorisierte Events)`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCategories();
