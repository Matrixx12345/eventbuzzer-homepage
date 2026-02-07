#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking if gallery_urls column exists in events table...\n');

// Try to select gallery_urls from one event
const { data, error } = await supabase
  .from('events')
  .select('id, title, image_url, gallery_urls')
  .limit(1);

if (error) {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️  gallery_urls column likely does NOT exist in the external database.');
  console.log('📝 You need to add it with this SQL command:');
  console.log('\nALTER TABLE events ADD COLUMN gallery_urls TEXT[];');
} else {
  console.log('✅ gallery_urls column EXISTS!');
  if (data && data.length > 0) {
    console.log('\nSample event:');
    console.log(`  ID: ${data[0].id}`);
    console.log(`  Title: ${data[0].title}`);
    console.log(`  Primary Image: ${data[0].image_url ? 'YES' : 'NO'}`);
    console.log(`  Gallery Images: ${data[0].gallery_urls ? data[0].gallery_urls.length : 0}`);
  }
}
