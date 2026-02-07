#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tfkiyvhfhvkejpljsnrk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs'
);

console.log('🔍 Analysiere Datenbank-Struktur...\n');

try {
  // First, fetch a single event to see available columns
  const { data: sample, error: sampleError } = await supabase
    .from('events')
    .select('*')
    .limit(1)
    .single();

  if (sampleError) throw sampleError;

  console.log('=== VERFÜGBARE SPALTEN ===');
  console.log(Object.keys(sample).sort().join(', '));
  console.log('\n');

  // Now fetch more events with relevant fields
  const { data: events, error } = await supabase
    .from('events')
    .select('category_sub_id, location, address_city, tags')
    .range(0, 1000);

  if (error) throw error;

  // Analyze categories
  const categorySubSet = new Set();
  const locationSet = new Set();
  const citySet = new Set();
  const tagsSet = new Set();

  events.forEach(event => {
    if (event.category_sub_id) categorySubSet.add(event.category_sub_id);
    if (event.location) locationSet.add(event.location);
    if (event.address_city) citySet.add(event.address_city);
    if (event.tags && Array.isArray(event.tags)) {
      event.tags.forEach(tag => tagsSet.add(tag));
    }
  });

  console.log('=== KATEGORIEN (Sub) ===');
  console.log([...categorySubSet].sort().slice(0, 40).join(', '));

  console.log('\n=== STÄDTE (address_city) ===');
  console.log([...citySet].filter(Boolean).sort().slice(0, 40).join(', '));

  console.log('\n=== LOCATIONS ===');
  console.log([...locationSet].filter(Boolean).sort().slice(0, 40).join(', '));

  console.log('\n=== TAGS (Top 40) ===');
  console.log([...tagsSet].sort().slice(0, 40).join(', '));

  console.log('\n=== STATISTIKEN ===');
  console.log(`Total Events: ${events.length}`);
  console.log(`Unique Sub Categories: ${categorySubSet.size}`);
  console.log(`Unique Cities: ${citySet.size}`);
  console.log(`Unique Locations: ${locationSet.size}`);
  console.log(`Unique Tags: ${tagsSet.size}`);

} catch (error) {
  console.error('Fehler:', error);
  process.exit(1);
}
