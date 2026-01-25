#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking Markets Category...\n');

// Check how many events have category_main_id = 6
const { data: markets, error, count } = await supabase
  .from('events')
  .select('id, title, category_main_id, category_sub_id', { count: 'exact' })
  .eq('category_main_id', 6)
  .limit(10);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`📊 Found ${count} events with category_main_id = 6`);
console.log('\nFirst 10 events:');
markets?.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.title} (cat: ${m.category_main_id}, sub: ${m.category_sub_id})`);
});

// Check if events_without_markets view exists
console.log('\n🔍 Checking events_without_markets view...');
const { data: viewData, error: viewError, count: viewCount } = await supabase
  .from('events_without_markets')
  .select('id', { count: 'exact' })
  .limit(1);

if (viewError) {
  console.error('❌ View does not exist or error:', viewError.message);
} else {
  console.log(`✅ View exists with ${viewCount} total events`);
}
