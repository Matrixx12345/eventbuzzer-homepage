#!/usr/bin/env node

// Test Spotify image URL to see what's happening
const testUrl = 'https://i.scdn.co/image/ab6761610000e5ebd85a07b92a5662a42d0454dd';

console.log('🔍 Testing Spotify image URL...\n');
console.log('URL:', testUrl);
console.log('\nTrying different approaches:\n');

// Test 1: Basic fetch (no headers)
console.log('1️⃣ Basic fetch (no headers)...');
try {
  const res1 = await fetch(testUrl);
  console.log(`   Status: ${res1.status} ${res1.statusText}`);
  if (res1.ok) {
    const contentType = res1.headers.get('content-type');
    console.log(`   ✅ Success! Content-Type: ${contentType}`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

// Test 2: With User-Agent
console.log('\n2️⃣ With User-Agent header...');
try {
  const res2 = await fetch(testUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  console.log(`   Status: ${res2.status} ${res2.statusText}`);
  if (res2.ok) {
    console.log(`   ✅ Success!`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

// Test 3: With Referer
console.log('\n3️⃣ With Referer header...');
try {
  const res3 = await fetch(testUrl, {
    headers: {
      'Referer': 'https://open.spotify.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  console.log(`   Status: ${res3.status} ${res3.statusText}`);
  if (res3.ok) {
    console.log(`   ✅ Success!`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

console.log('\n💡 Analysis:');
console.log('If all tests fail, Spotify may have:');
console.log('1. Blocked direct access to i.scdn.co from external domains');
console.log('2. Changed their CDN structure');
console.log('3. Implemented stricter CORS policies');
console.log('\nNext steps: Check Spotify API or use image proxy service');
