import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Checking events table structure...\n');

const { data, error } = await supabase
  .from('events')
  .select('id, external_id, title, buzz_boost')
  .or('id.like.elite_%,id.like.manual_%')
  .limit(5);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Found events:', data);
}
