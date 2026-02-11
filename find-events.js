import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve('/Users/jj/Development/eventbuzzer-homepage/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    const value = valueParts.join('=').replace(/^"(.*)"$/, '$1').trim();
    if (value) env[key.trim()] = value;
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findEvents() {
  const searchTerms = [
    'cannst du malen',
    'malen wie paul klee',
    'paul klee',
    'von tisch zu tisch',
    'meringue',
    'meringues',
    'schafen',
    'geschieden'
  ];
  
  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, source')
      .ilike('title', `%${term}%`);
    
    if (error) {
      console.error(`Error searching for "${term}":`, error);
    } else if (data && data.length > 0) {
      console.log(`\nFound ${data.length} event(s) containing "${term}":`);
      data.forEach(event => {
        console.log(`  ID: ${event.id}`);
        console.log(`  Title: "${event.title}"`);
        console.log(`  Source: ${event.source}`);
        console.log('---');
      });
    }
  }
}

findEvents().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
