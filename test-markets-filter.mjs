#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Edge Function with Märkte category...\n');

// Test the Edge Function exactly as the frontend would call it
const { data, error } = await supabase.functions.invoke('get-external-events', {
  body: {
    offset: 0,
    limit: 30,
    filters: {
      categoryId: 6  // Märkte category
    }
  }
});

if (error) {
  console.error('❌ Edge Function Error:', error);
  process.exit(1);
}

console.log('✅ Edge Function Response:');
console.log(`  Total events: ${data.pagination.total}`);
console.log(`  Returned: ${data.events.length} events`);

if (data.events.length > 0) {
  console.log('\nFirst 5 events:');
  data.events.slice(0, 5).forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.title} (cat: ${e.category_main_id})`);
  });
} else {
  console.log('\n⚠️  NO EVENTS RETURNED!');
  console.log('This is the problem - category filter is not working correctly.');
}
