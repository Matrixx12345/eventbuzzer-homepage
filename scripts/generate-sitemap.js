#!/usr/bin/env node

/**
 * Sitemap Generator for EventBuzzer
 *
 * Generates a dynamic sitemap.xml with all city/category combinations
 * Run after build: npm run build && node scripts/generate-sitemap.js
 *
 * Requires environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://eventbuzzer.ch';

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗ NOT SET');
  console.error('   - VITE_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '✓' : '✗ NOT SET');
  console.error('\nMake sure .env file is present and contains these variables.');
  process.exit(1);
}

// Top cities for prioritization (Tier 1 - highest priority)
const TOP_CITIES = [
  'zurich', 'geneva', 'basel', 'lausanne', 'bern',
  'lucerne', 'winterthur', 'st-gallen', 'lugano', 'biel'
];

// Top categories for prioritization (Tier 1 - highest priority)
const TOP_CATEGORIES = [
  'must-see', 'natur', 'kulinarik', 'sport', 'festival', 'familie'
];

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to generate slug from string
function generateSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

// Helper to determine priority based on city/category
function getPriority(city, category) {
  const isCityTier1 = TOP_CITIES.includes(city);
  const isCategoryTier1 = TOP_CATEGORIES.includes(category);

  if (isCityTier1 && isCategoryTier1) return '0.9';  // Top tier
  if (isCityTier1 || isCategoryTier1) return '0.8';  // Medium-high
  return '0.6';  // Lower priority
}

// Main function
async function generateSitemap() {
  try {
    console.log('🔄 Fetching events from Supabase...');

    const { data: events, error } = await supabase
      .from('events')
      .select('address_city, category_main_id')
      .range(0, 9999);

    if (error) {
      console.error('❌ Error fetching events:', error);
      process.exit(1);
    }

    if (!events || events.length === 0) {
      console.error('❌ No events found in database');
      process.exit(1);
    }

    console.log(`✅ Fetched ${events.length} events`);

    // Extract unique city/category combinations
    const combinations = new Set();

    events.forEach((event) => {
      if (event.address_city) {
        const citySlug = generateSlug(event.address_city);

        // Map category_main_id to category slug
        const categorySlug = getCategorySlug(event.category_main_id);

        if (citySlug && categorySlug) {
          combinations.add(`${citySlug}/${categorySlug}`);
        }
      }
    });

    console.log(`✅ Found ${combinations.size} unique city/category combinations`);

    // Build sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages (highest priority)
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/highlights', priority: '0.9', changefreq: 'weekly' },
      { url: '/favorites', priority: '0.7', changefreq: 'weekly' },
      { url: '/trip-planner', priority: '0.8', changefreq: 'weekly' },
    ];

    staticPages.forEach((page) => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `  </url>\n`;
    });

    // Add dynamic city/category pages
    const sortedCombinations = Array.from(combinations).sort();

    sortedCombinations.forEach((combo) => {
      const [city, category] = combo.split('/');
      const priority = getPriority(city, category);

      sitemap += `  <url>\n`;
      sitemap += `    <loc>${SITE_URL}/events/${city}/${category}</loc>\n`;
      sitemap += `    <priority>${priority}</priority>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemap += `  </url>\n`;
    });

    sitemap += '</urlset>';

    // Write to public folder
    const publicDir = join(__dirname, '../public');
    mkdirSync(publicDir, { recursive: true });

    const sitemapPath = join(publicDir, 'sitemap.xml');
    writeFileSync(sitemapPath, sitemap);

    console.log(`✅ Sitemap generated: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${staticPages.length + sortedCombinations.length}`);
    console.log(`📈 Tier 1 (priority 0.9): ${sortedCombinations.filter(c => {
      const [city, category] = c.split('/');
      return TOP_CITIES.includes(city) && TOP_CATEGORIES.includes(category);
    }).length} URLs`);

  } catch (err) {
    console.error('❌ Error generating sitemap:', err);
    process.exit(1);
  }
}

// Helper to map category_main_id to category slug
function getCategorySlug(categoryId) {
  const categoryMap = {
    2: 'museum',
    3: 'natur',
    5: 'kulinarik',
    6: 'sport',
    8: 'theater',
    10: 'family',  // Familie
    11: 'wellness',
    12: 'konzert',
    15: 'festival',
    16: 'ausflug',
    17: 'schloss',
    18: 'see',
    19: 'wanderung',
    20: 'must-see',
    21: 'shopping',
    22: 'nightlife',
  };

  return categoryMap[categoryId] || null;
}

generateSitemap();
