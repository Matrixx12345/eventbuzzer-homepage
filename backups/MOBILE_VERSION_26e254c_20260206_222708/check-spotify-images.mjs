#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking for Spotify image URLs...\n');

const { data, error } = await supabase
  .from('events')
  .select('id, external_id, title, image_url, source')
  .like('image_url', '%i.scdn.co%')
  .limit(1000);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log('✅ No Spotify images found!');
} else {
  console.log(`⚠️  Found ${data.length} events with Spotify CDN images\n`);

  // Group by source
  const bySource = {};
  data.forEach(event => {
    const source = event.source || 'unknown';
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(event);
  });

  console.log('📊 Breakdown by source:');
  Object.entries(bySource).forEach(([source, events]) => {
    console.log(`   ${source}: ${events.length} events`);
  });

  console.log('\n📝 First 10 examples:');
  data.slice(0, 10).forEach((event, idx) => {
    console.log(`${idx + 1}. ${event.title.substring(0, 50)}`);
    console.log(`   Source: ${event.source}`);
    console.log(`   URL: ${event.image_url}`);
    console.log('');
  });

  console.log('\n💡 Solution options:');
  console.log('1. Use placeholder images for Spotify events');
  console.log('2. Try to find alternative images (Google Places API)');
  console.log('3. Set image_url to null (will show default placeholder)');
}
