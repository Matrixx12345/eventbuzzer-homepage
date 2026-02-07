#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrvzugvmbycpljxjvlwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydnp1Z3ZtYnljcGxqeGp2bHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjI5MDQsImV4cCI6MjA1MDYzODkwNH0.YdgBnwdH6U2MYlz9LkUmW1CxKLH95rI4kPV6V-SBQws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking for Elite Events (buzz_boost = 100)...\n');

const { data, error } = await supabase
  .from('events')
  .select('id, external_id, title, buzz_boost, latitude, longitude')
  .eq('buzz_boost', 100)
  .limit(50);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log('⚠️  NO ELITE EVENTS FOUND in database!');
  console.log('This means there are no events with buzz_boost = 100');
  console.log('\nPossible solutions:');
  console.log('1. Check if events have buzz_boost = 100 in Supabase dashboard');
  console.log('2. Use AdminBuzzBoost page to set some events to Elite (buzz_boost = 100)');
} else {
  console.log(`✅ Found ${data.length} Elite Events:\n`);

  data.forEach((event, idx) => {
    console.log(`${idx + 1}. ${event.title}`);
    console.log(`   buzz_boost: ${event.buzz_boost} (type: ${typeof event.buzz_boost})`);
    console.log(`   location: ${event.latitude}, ${event.longitude}`);
    console.log(`   external_id: ${event.external_id}`);
    console.log('');
  });

  console.log(`\n🗺️  To see these on the map:`);
  console.log(`1. Open EventList1 page`);
  console.log(`2. Zoom/pan to one of the locations above`);
  console.log(`3. Look for golden star ⭐ markers`);
  console.log(`4. Check browser console for "🌟 Elite/Favorite found:" logs`);
}
