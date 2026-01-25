#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking if Multi-Image Gallery feature worked...\n');

// Check MySwitzerland events with gallery_urls
const { data, error } = await supabase
  .from('events')
  .select('id, title, external_id, image_url, gallery_urls, source')
  .eq('source', 'myswitzerland')
  .not('gallery_urls', 'is', null)
  .order('id', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`✅ Found ${data.length} MySwitzerland events with gallery_urls!\n`);

if (data.length > 0) {
  console.log('📸 Sample events with galleries:\n');
  data.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   External ID: ${event.external_id}`);
    console.log(`   Primary Image: ${event.image_url ? 'YES' : 'NO'}`);
    console.log(`   Gallery Images: ${event.gallery_urls ? event.gallery_urls.length : 0}`);
    if (event.gallery_urls && event.gallery_urls.length > 0) {
      console.log(`   Gallery URLs:`);
      event.gallery_urls.slice(0, 3).forEach((url, idx) => {
        console.log(`     ${idx + 1}. ${url.substring(0, 80)}...`);
      });
    }
    console.log('');
  });

  console.log('🎉 Multi-Image Gallery feature is WORKING!');
  console.log('✨ Events now have multiple images for the gallery component!');
} else {
  console.log('⚠️  No MySwitzerland events with gallery_urls found.');
  console.log('This might mean:');
  console.log('  1. The gallery_urls column doesn\'t exist in the database');
  console.log('  2. The import hasn\'t run with the new multi-image code yet');
  console.log('  3. MySwitzerland API doesn\'t provide multiple images for these events');
}
