#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Fixing Markets...\n');

// Step 1: Delete specific unwanted market events
console.log('Step 1: Deleting unwanted market events...');

const eventsToDelete = [
  { title: 'Marktgasse' },
  { title: 'Markt', description_contains: 'Neuenburg' }
];

for (const eventFilter of eventsToDelete) {
  let query = supabase
    .from('events')
    .select('id, title, short_description')
    .ilike('title', eventFilter.title);

  if (eventFilter.description_contains) {
    query = query.or(`short_description.ilike.%${eventFilter.description_contains}%,description.ilike.%${eventFilter.description_contains}%`);
  }

  const { data: events, error: searchError } = await query;

  if (searchError) {
    console.error('❌ Error searching for events:', searchError);
    continue;
  }

  if (events && events.length > 0) {
    for (const event of events) {
      console.log(`  🗑️  Deleting: ${event.title} (ID: ${event.id})`);
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) {
        console.error(`  ❌ Failed to delete ${event.title}:`, deleteError);
      } else {
        console.log(`  ✅ Deleted: ${event.title}`);
      }
    }
  } else {
    console.log(`  ℹ️  No events found matching: ${eventFilter.title}`);
  }
}

console.log('\nStep 2: Finding all market events...');

// Find all market events (events with "markt" in title or tags)
const { data: markets, error: marketError } = await supabase
  .from('events')
  .select('id, title, tags, category_main_id, category_sub_id')
  .or('title.ilike.%markt%,tags.cs.{markt}')
  .limit(1000);

if (marketError) {
  console.error('❌ Error finding markets:', marketError);
  process.exit(1);
}

if (!markets || markets.length === 0) {
  console.log('✅ No markets found to update!');
  process.exit(0);
}

console.log(`Found ${markets.length} market events\n`);

console.log('Step 3: Assigning markets to category 6 (Märkte)...');

let updatedCount = 0;
let skippedCount = 0;

for (const market of markets) {
  // Check if already assigned to category 6
  if (market.category_main_id === 6) {
    skippedCount++;
    continue;
  }

  try {
    const { error: updateError } = await supabase
      .from('events')
      .update({
        category_main_id: 6,
        // category_sub_id can remain null or be set based on market type
      })
      .eq('id', market.id);

    if (updateError) {
      console.log(`❌ Failed to update ${market.title}: ${updateError.message}`);
    } else {
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount}/${markets.length - skippedCount}...`);
      }
    }
  } catch (err) {
    console.log(`❌ Error updating ${market.title}:`, err);
  }
}

console.log('\n📊 Summary:');
console.log(`✅ Successfully updated: ${updatedCount}`);
console.log(`⏭️  Already in category 6: ${skippedCount}`);
console.log(`📁 All markets now assigned to Category 6 (Märkte)`);
