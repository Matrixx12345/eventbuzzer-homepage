import { createClient } from '@supabase/supabase-js';

// Test DB 1: tfkiyvhfhvkejpljsnrk
const db1 = createClient(
  'https://tfkiyvhfhvkejpljsnrk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs'
);

// Test DB 2: phlhbbjeqabjhkkyennz
const db2 = createClient(
  'https://phlhbbjeqabjhkkyennz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGhiYmplcWFiamhra3llbm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTgwNjgsImV4cCI6MjA4MDY3NDA2OH0.7ZxUwEzC_DNX9ZpYhrf8IMIIYIsE7CkNp-XLuVUHId0'
);

console.log('\n=== DB1: tfkiyvhfhvkejpljsnrk ===');

// Test für events Tabelle
const { data: events1, error: eventsError1 } = await db1
  .from('events')
  .select('count')
  .limit(1);
console.log('events table:', eventsError1 ? '❌ ' + eventsError1.message : '✅ vorhanden');

// Test für profiles Tabelle
const { data: profiles1, error: profilesError1 } = await db1
  .from('profiles')
  .select('count')
  .limit(1);
console.log('profiles table:', profilesError1 ? '❌ ' + profilesError1.message : '✅ vorhanden');

// Test für favorites Tabelle
const { data: favorites1, error: favoritesError1 } = await db1
  .from('favorites')
  .select('count')
  .limit(1);
console.log('favorites table:', favoritesError1 ? '❌ ' + favoritesError1.message : '✅ vorhanden');

console.log('\n=== DB2: phlhbbjeqabjhkkyennz ===');

// Test für events Tabelle
const { data: events2, error: eventsError2 } = await db2
  .from('events')
  .select('count')
  .limit(1);
console.log('events table:', eventsError2 ? '❌ ' + eventsError2.message : '✅ vorhanden');

// Test für profiles Tabelle
const { data: profiles2, error: profilesError2 } = await db2
  .from('profiles')
  .select('count')
  .limit(1);
console.log('profiles table:', profilesError2 ? '❌ ' + profilesError2.message : '✅ vorhanden');

// Test für favorites Tabelle
const { data: favorites2, error: favoritesError2 } = await db2
  .from('favorites')
  .select('count')
  .limit(1);
console.log('favorites table:', favoritesError2 ? '❌ ' + favoritesError2.message : '✅ vorhanden');

console.log('\n');
