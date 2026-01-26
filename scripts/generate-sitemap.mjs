#!/usr/bin/env node

/**
 * Sitemap Generator for EventBuzzer
 *
 * This script fetches all events from the external Supabase database
 * and generates a sitemap.xml file for Google Search Console.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// External Supabase configuration
const EXTERNAL_SUPABASE_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

const SITE_URL = 'https://eventbuzzer.ch';

// Static pages
const staticPages = [
  { url: '', changefreq: 'daily', priority: '1.0' },
  { url: '/eventlist1', changefreq: 'daily', priority: '0.9' },
  { url: '/listings', changefreq: 'daily', priority: '0.8' },
  { url: '/favorites', changefreq: 'weekly', priority: '0.6' },
  { url: '/trip-planner', changefreq: 'weekly', priority: '0.7' },
  { url: '/impressum', changefreq: 'monthly', priority: '0.3' },
];

async function fetchAllEvents() {
  console.log('📡 Fetching all events from Supabase...');

  // Fetch all events with pagination (Supabase has a 1000 row limit per query)
  let allEvents = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('events')
      .select('id, created_at, start_date')
      .range(from, from + batchSize - 1)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }

    if (data && data.length > 0) {
      allEvents = allEvents.concat(data);
      console.log(`   Fetched batch: ${data.length} events (total: ${allEvents.length})`);
      from += batchSize;

      // If we got less than batchSize, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Found ${allEvents.length} events total`);
  return allEvents;
}

function generateSitemapXML(events) {
  const urls = [];

  // Add static pages
  staticPages.forEach(page => {
    urls.push(`  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`);
  });

  // Add event pages
  // Use current date for lastmod (not event date) for better SEO
  const currentDate = new Date().toISOString();
  events.forEach(event => {
    urls.push(`  <url>
    <loc>${SITE_URL}/event/${event.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return sitemap;
}

async function main() {
  try {
    console.log('🗺️  EventBuzzer Sitemap Generator\n');

    // Fetch events
    const events = await fetchAllEvents();

    // Generate XML
    const sitemap = generateSitemapXML(events);

    // Write to public folder
    const publicPath = join(__dirname, '../public/sitemap.xml');
    writeFileSync(publicPath, sitemap, 'utf8');

    console.log(`\n✨ Sitemap generated successfully!`);
    console.log(`📄 Location: ${publicPath}`);
    console.log(`📊 Total URLs: ${staticPages.length + events.length}`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Event pages: ${events.length}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Deploy your site with the new sitemap.xml`);
    console.log(`   2. Submit to Google Search Console: https://search.google.com/search-console`);
    console.log(`   3. Add sitemap URL: ${SITE_URL}/sitemap.xml`);

  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
