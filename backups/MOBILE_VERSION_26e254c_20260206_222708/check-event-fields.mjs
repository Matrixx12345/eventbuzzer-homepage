#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tfkiyvhfhvkejpljsnrk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs');

const { data } = await supabase.from('events').select('*').limit(1).single();
const urlFields = Object.keys(data).filter(k => k.includes('url') || k.includes('link') || k.includes('ticket') || k.includes('booking'));
console.log('URL/Ticket fields:', urlFields.join(', '));

// Show one event with ticket URL
const { data: withTicket } = await supabase.from('events').select('title, event_url, ticket_url, booking_url, website_url').not('event_url', 'is', null).limit(1).single();
console.log('\nExample event:', withTicket);
