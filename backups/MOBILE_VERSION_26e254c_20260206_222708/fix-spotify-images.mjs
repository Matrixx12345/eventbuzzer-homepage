#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Fixing Spotify CDN image URLs...\n');
console.log('Problem: Spotify blocked CORS access to i.scdn.co from browsers');
console.log('Solution: Use imgproxy service (like MySwitzerland fix)\n');

// Get all events with Spotify images
const { data: events, error } = await supabase
  .from('events')
  .select('id, external_id, title, image_url, source')
  .like('image_url', '%i.scdn.co%')
  .limit(1000);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!events || events.length === 0) {
  console.log('✅ No Spotify images to fix!');
  process.exit(0);
}

console.log(`Found ${events.length} events with Spotify CDN images\n`);

let updatedCount = 0;
let failedCount = 0;

for (const event of events) {
  const oldUrl = event.image_url;

  // Use imgproxy.net - free tier, no signup needed
  // Alternative: images.weserv.nl (also free)
  const newUrl = `https://images.weserv.nl/?url=${encodeURIComponent(oldUrl)}&w=800&h=600&fit=cover&output=webp`;

  try {
    const { error: updateError } = await supabase
      .from('events')
      .update({ image_url: newUrl })
      .eq('id', event.id);

    if (updateError) {
      console.log(`❌ Failed to update ${event.title}: ${updateError.message}`);
      failedCount++;
    } else {
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount}/${events.length}...`);
      }
    }
  } catch (err) {
    console.log(`❌ Error updating ${event.title}:`, err);
    failedCount++;
  }
}

console.log('\n📊 Summary:');
console.log(`✅ Successfully updated: ${updatedCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`\n💡 Using images.weserv.nl proxy service:`);
console.log(`   - Free unlimited image proxy`);
console.log(`   - Auto-converts to WebP (faster)`);
console.log(`   - Resizes to 800x600 (smaller file size)`);
console.log(`   - Works in all browsers (no CORS issues)`);
