// Quick script to check external Supabase database schema and Flohmärkte data
import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 Checking external Supabase database...\n');

  // 1. Check if events table exists and get schema
  console.log('1️⃣ Fetching sample event to see schema...');
  const { data: sampleEvent, error: eventError } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (eventError) {
    console.error('❌ Error fetching events:', eventError.message);
  } else if (sampleEvent && sampleEvent.length > 0) {
    console.log('✅ Events table exists!');
    console.log('📋 Sample event columns:', Object.keys(sampleEvent[0]));
    console.log('\n');
  }

  // 2. Check for category_sub_id field
  console.log('2️⃣ Checking for category fields...');
  const { data: eventWithCategories } = await supabase
    .from('events')
    .select('id, category_main_id, category_sub_id')
    .not('category_main_id', 'is', null)
    .limit(5);

  if (eventWithCategories) {
    console.log(`✅ Found ${eventWithCategories.length} events with categories:`);
    console.log(eventWithCategories);
    console.log('\n');
  }

  // 3. Search for Flohmärkte (flea markets)
  console.log('3️⃣ Searching for Flohmärkte...');
  const { data: flohmaerkte, error: flohError } = await supabase
    .from('events')
    .select('id, name, category_main_id, category_sub_id')
    .or('name.ilike.%floh%,description_short.ilike.%floh%')
    .limit(10);

  if (flohError) {
    console.error('❌ Error searching Flohmärkte:', flohError.message);
  } else {
    console.log(`✅ Found ${flohmaerkte?.length || 0} Flohmärkte:`);
    console.log(flohmaerkte);
    console.log('\n');
  }

  // 4. Check if there are separate category tables
  console.log('4️⃣ Checking for category tables...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(10);

  if (catError) {
    console.log('ℹ️ No "categories" table found (expected if using inline categories)');
  } else {
    console.log('✅ Categories table exists:');
    console.log(categories);
  }

  console.log('\n5️⃣ Checking total event count...');
  const { count, error: countError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`✅ Total events in database: ${count}`);
  }
}

checkDatabase().catch(console.error);
