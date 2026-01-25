#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tfkiyvhfhvkejpljsnrk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs');

// Check how many events have ticket URLs
const { data, count } = await supabase
  .from('events')
  .select('id, title, ticket_url, url', { count: 'exact' })
  .or('ticket_url.not.is.null,url.not.is.null')
  .limit(5);

console.log(`Total events with ticket_url or url: ${count}`);
console.log('\nFirst 5 examples:');
data?.forEach((e, i) => {
  console.log(`${i + 1}. ${e.title}`);
  console.log(`   ticket_url: ${e.ticket_url || '(none)'}`);
  console.log(`   url: ${e.url || '(none)'}`);
});

// Check total events
const { count: total } = await supabase.from('events').select('*', { count: 'exact', head: true });
console.log(`\nTotal events: ${total}`);
console.log(`Events with URLs: ${count} (${((count/total)*100).toFixed(1)}%)`);
