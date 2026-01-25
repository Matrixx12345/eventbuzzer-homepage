import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Checking for events with external_id elite_fondation_beyeler...\n');

const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('external_id', 'elite_fondation_beyeler')
  .single();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Event found:', data);
  console.log('\nColumns:', Object.keys(data));
  console.log('\nbuzz_boost value:', data.buzz_boost);
}
