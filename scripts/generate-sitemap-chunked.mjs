#!/usr/bin/env node

/**
 * Chunked Sitemap Generator for EventBuzzer
 *
 * Generates:
 * - sitemap-index.xml (main index file)
 * - sitemap-events-1.xml, sitemap-events-2.xml, ... (500 URLs each)
 * - sitemap-categories.xml (category pages)
 * - sitemap-city-categories.xml (city×category combinations)
 *
 * Usage: node scripts/generate-sitemap-chunked.mjs
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
const CHUNK_SIZE = 500; // Max URLs per sitemap file

// Categories from config
const CATEGORIES = [
  'museum', 'konzert', 'festival', 'wanderung', 'wellness',
  'natur', 'theater', 'schloss', 'familie', 'kulinarik',
  'sport', 'ausflug', 'stadt', 'see', 'must-see'
];

// Helper: Generate slug from text
function generateSlug(text) {
  if (!text) return "";
  let slug = text.toLowerCase().trim();

  const umlautMap = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
    'à': 'a', 'á': 'a', 'â': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c', 'ß': 'ss'
  };

  for (const [char, replacement] of Object.entries(umlautMap)) {
    slug = slug.replaceAll(char, replacement);
  }

  slug = slug.replace(/[\s_&/\\]+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

// Category matching logic (inline from src/utils/eventUtilities.ts)
function getCategoryLabel(event) {
  // PRIORITY 1: "must-see" tag gets "Must-See" label
  if (event.tags && (event.tags.includes('must-see') || event.tags.includes('elite'))) {
    return 'Must-See';
  }

  const subCat = (event.category_sub_id || '').toString().toLowerCase();
  const tags = Array.isArray(event.tags) ? event.tags.join(' ').toLowerCase() : '';
  const title = (event.title || '').toLowerCase();
  const combined = `${subCat} ${tags} ${title}`;

  // Match categories based on keywords
  if (combined.includes('museum') || combined.includes('kunst') || combined.includes('galer') || combined.includes('ausstellung')) return 'Museen';
  if (combined.includes('wanderung') || combined.includes('trail') || combined.includes('hike')) return 'Wanderungen';
  if (combined.includes('wellness') || combined.includes('spa') || combined.includes('therm') || combined.includes('bad')) return 'Wellness';
  if (combined.includes('natur') || combined.includes('park') || combined.includes('garten') || combined.includes('wald')) return 'Natur';
  if (combined.includes('schloss') || combined.includes('burg') || combined.includes('castle')) return 'Schlösser';
  if (combined.includes('familie') || combined.includes('kinder') || combined.includes('family')) return 'Familie';
  if (combined.includes('konzert') || combined.includes('music') || combined.includes('live')) return 'Konzerte';
  if (combined.includes('theater') || combined.includes('oper') || combined.includes('bühne')) return 'Theater';
  if (combined.includes('sport')) return 'Sport';
  if (combined.includes('festival') || combined.includes('fest')) return 'Festivals';
  if (combined.includes('food') || combined.includes('kulinar') || combined.includes('gastro') || combined.includes('wein') || combined.includes('käse')) return 'Kulinarik';
  if ((combined.includes('see') || combined.includes('lake') || combined.includes('schiff')) && !combined.includes('must-see')) return 'Seen';
  if (combined.includes('altstadt') || combined.includes('city') || combined.includes('stadt')) return 'Stadterlebnis';
  if (combined.includes('sehenswürdig') || combined.includes('attraction') || combined.includes('ausflug') || combined.includes('erlebnis')) return 'Ausflüge';

  // Fallback for myswitzerland events
  if (event.source === 'myswitzerland') return 'Ausflüge';

  return undefined;
}

// Map category labels to slugs
const CATEGORY_LABEL_TO_SLUG = {
  'Museen': 'museum',
  'Konzerte': 'konzert',
  'Festivals': 'festival',
  'Wanderungen': 'wanderung',
  'Wellness': 'wellness',
  'Natur': 'natur',
  'Theater': 'theater',
  'Schlösser': 'schloss',
  'Familie': 'familie',
  'Kulinarik': 'kulinarik',
  'Sport': 'sport',
  'Ausflüge': 'ausflug',
  'Stadterlebnis': 'stadt',
  'Seen': 'see',
  'Must-See': 'must-see'
};

// Fetch all events with location data
async function fetchAllEvents() {
  console.log('📡 Fetching all events from Supabase...');

  let allEvents = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('events')
      .select('id, external_id, title, created_at, address_city, location')
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

// Generate SEO-friendly slug from title + location
function generateEventSlug(title, city) {
  let parts = [];

  if (title) {
    parts.push(generateSlug(title));
  }

  if (city) {
    parts.push(generateSlug(city));
  }

  return parts.join('-') || generateSlug(title);
}

// Extract unique cities from events
function extractCities(events) {
  const cities = new Set();
  events.forEach(event => {
    const city = event.address_city || event.location;
    if (city) {
      cities.add(generateSlug(city));
    }
  });
  return Array.from(cities).filter(Boolean);
}

// Escape XML special characters
function escapeXML(text) {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate XML for URL entry
function generateURLEntry(loc, changefreq = 'weekly', priority = '0.8') {
  const currentDate = new Date().toISOString();
  return `  <url>
    <loc>${escapeXML(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`;
}

// Generate sitemap XML
function generateSitemapXML(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const footer = `</urlset>`;

  return header + '\n' + urls.join('\n') + '\n' + footer;
}

// Generate sitemap index XML
function generateSitemapIndex(sitemaps) {
  const currentDate = new Date().toISOString();

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const entries = sitemaps.map(sitemap => `  <sitemap>
    <loc>${SITE_URL}/${sitemap}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`);

  const footer = `</sitemapindex>`;

  return header + '\n' + entries.join('\n') + '\n' + footer;
}

async function main() {
  console.log('🚀 Generating chunked sitemaps for EventBuzzer...\n');

  const sitemapFiles = [];
  const publicDir = join(__dirname, '..', 'public');

  // 1. Fetch all events
  const events = await fetchAllEvents();

  // 1b. Build set of verified city×category combinations (only combos with events)
  console.log('\n🔍 Analyzing actual city×category combinations with events...');
  const cityCategoryCombos = new Set();

  events.forEach(event => {
    const categoryLabel = getCategoryLabel(event);
    if (!categoryLabel) return; // Skip events without category

    const categorySlug = CATEGORY_LABEL_TO_SLUG[categoryLabel];
    if (!categorySlug) return; // Skip if label doesn't map to slug

    const city = event.address_city || event.location;
    if (!city) return; // Skip events without location

    const citySlug = generateSlug(city);
    if (!citySlug) return; // Skip if city slug is empty

    // Add verified combination
    cityCategoryCombos.add(`${citySlug}/${categorySlug}`);
  });

  console.log(`   ✅ Found ${cityCategoryCombos.size} actual city×category combinations with events`);
  console.log(`   📊 This eliminates ${Math.max(0, 3795 - cityCategoryCombos.size)} empty URLs from sitemap`);

  // 2. Generate event sitemaps (chunked)
  console.log('\n📄 Generating event sitemaps (500 URLs per file)...');
  const chunks = [];
  for (let i = 0; i < events.length; i += CHUNK_SIZE) {
    chunks.push(events.slice(i, i + CHUNK_SIZE));
  }

  // Create slug mapping for EventDetail.tsx lookup
  const slugMapping = {};

  chunks.forEach((chunk, index) => {
    const urls = chunk.map(event => {
      // Generate SEO-friendly slug from title + location
      const city = event.address_city || event.location;
      const seoSlug = generateEventSlug(event.title, city);

      // Store mapping: slug → external_id (for EventDetail lookup)
      slugMapping[seoSlug] = event.external_id || event.id;

      return generateURLEntry(
        `${SITE_URL}/event/${seoSlug}`,
        'daily',  // Events change frequently - crawl daily
        '1.0'      // Highest priority - most valuable URLs
      );
    });

    const filename = `sitemap-events-${index + 1}.xml`;
    const xml = generateSitemapXML(urls);
    writeFileSync(join(publicDir, filename), xml);
    sitemapFiles.push(filename);
    console.log(`   ✅ ${filename} - ${chunk.length} URLs`);
  });

  // Write slug mapping to JSON file for EventDetail.tsx
  const mappingFile = join(publicDir, 'event-slug-mapping.json');
  writeFileSync(mappingFile, JSON.stringify(slugMapping, null, 2));
  console.log(`\n📝 Created event-slug-mapping.json (${Object.keys(slugMapping).length} entries)`);

  // 3. Generate category sitemap
  console.log('\n📄 Generating category sitemap...');
  const categoryURLs = CATEGORIES.map(cat =>
    generateURLEntry(
      `${SITE_URL}/kategorie/${cat}`,
      'daily',
      '0.9'
    )
  );

  // Add static pages to category sitemap
  const staticURLs = [
    generateURLEntry(`${SITE_URL}`, 'daily', '1.0'),
    generateURLEntry(`${SITE_URL}/eventlist1`, 'daily', '0.9'),
    generateURLEntry(`${SITE_URL}/listings`, 'daily', '0.8'),
    generateURLEntry(`${SITE_URL}/favorites`, 'weekly', '0.6'),
    generateURLEntry(`${SITE_URL}/impressum`, 'monthly', '0.3'),
    // Magazine pages (DE + EN)
    generateURLEntry(`${SITE_URL}/magazin`, 'weekly', '0.9'),
    generateURLEntry(`${SITE_URL}/magazin/ausflug-in-die-berge`, 'monthly', '0.8'),
    generateURLEntry(`${SITE_URL}/magazin/tag-in-zuerich`, 'monthly', '0.8'),
    generateURLEntry(`${SITE_URL}/magazin/10-beste-museen-schweiz`, 'monthly', '0.8'),
    generateURLEntry(`${SITE_URL}/magazin/sehenswuerdigkeiten-schweiz`, 'monthly', '0.8'),
    generateURLEntry(`${SITE_URL}/en/magazine`, 'weekly', '0.8'),
    generateURLEntry(`${SITE_URL}/en/magazine/mountain-excursion-switzerland`, 'monthly', '0.7'),
    generateURLEntry(`${SITE_URL}/en/magazine/day-in-zurich`, 'monthly', '0.7'),
    generateURLEntry(`${SITE_URL}/en/magazine/10-best-museums-switzerland`, 'monthly', '0.7'),
    generateURLEntry(`${SITE_URL}/en/magazine/unique-attractions-switzerland`, 'monthly', '0.7'),
  ];

  const categorySitemap = generateSitemapXML([...staticURLs, ...categoryURLs]);
  writeFileSync(join(publicDir, 'sitemap-categories.xml'), categorySitemap);
  sitemapFiles.push('sitemap-categories.xml');
  console.log(`   ✅ sitemap-categories.xml - ${categoryURLs.length + staticURLs.length} URLs`);

  // 4. Generate city×category sitemap (ONLY for verified combos with events)
  console.log('\n📄 Generating city×category sitemap (verified combos only)...');

  const cityCategoryURLs = [];
  Array.from(cityCategoryCombos).forEach(combo => {
    cityCategoryURLs.push(
      generateURLEntry(
        `${SITE_URL}/events/${combo}`,  // combo is already "city/category"
        'weekly',
        '0.7'
      )
    );
  });

  console.log(`   ✅ Generated ${cityCategoryURLs.length} verified city×category URLs (eliminated ${Math.max(0, 3795 - cityCategoryURLs.length)} empty URLs)`);

  // Split city×category into chunks if needed (might be 3000+ URLs)
  const cityCategoryChunks = [];
  for (let i = 0; i < cityCategoryURLs.length; i += CHUNK_SIZE) {
    cityCategoryChunks.push(cityCategoryURLs.slice(i, i + CHUNK_SIZE));
  }

  cityCategoryChunks.forEach((chunk, index) => {
    const filename = cityCategoryChunks.length > 1
      ? `sitemap-city-categories-${index + 1}.xml`
      : 'sitemap-city-categories.xml';

    const xml = generateSitemapXML(chunk);
    writeFileSync(join(publicDir, filename), xml);
    sitemapFiles.push(filename);
    console.log(`   ✅ ${filename} - ${chunk.length} URLs`);
  });

  // 5. Generate sitemap index
  console.log('\n📄 Generating sitemap index...');
  const sitemapIndex = generateSitemapIndex(sitemapFiles);
  writeFileSync(join(publicDir, 'sitemap-index.xml'), sitemapIndex);
  console.log(`   ✅ sitemap-index.xml - ${sitemapFiles.length} sitemaps`);

  // Summary
  const totalURLs = events.length + categoryURLs.length + staticURLs.length + cityCategoryURLs.length;
  console.log('\n✅ Sitemap generation complete!');
  console.log(`   📊 Total URLs: ${totalURLs}`);
  console.log(`   📁 Total files: ${sitemapFiles.length + 1} (+ index)`);
  console.log(`   📍 Location: ${publicDir}/`);
  console.log('\n💡 Next steps:');
  console.log('   1. Upload all sitemap files to your server');
  console.log('   2. Submit sitemap-index.xml to Google Search Console');
  console.log(`   3. URL: ${SITE_URL}/sitemap-index.xml`);
}

main().catch(console.error);
