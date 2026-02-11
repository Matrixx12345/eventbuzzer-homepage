import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Events to delete
const eventsToDelete = [
  { title: 'Malen wie Paul Klee', ids: [59606] },
  { title: 'Meringues selber machen', ids: [77404] },
  { title: 'Wenn Schafe geschieden werden', ids: [137542, 137545, 77734, 137543, 137544] }
];

async function deleteEvents() {
  console.log('Starting deletion of events...\n');
  
  const results = [];
  
  for (const event of eventsToDelete) {
    console.log(`Processing: "${event.title}"`);
    console.log(`  IDs to delete: ${event.ids.join(', ')}`);
    
    // Verify events exist before deletion
    const { data: beforeData, error: fetchError } = await supabase
      .from('events')
      .select('id, title')
      .in('id', event.ids);
    
    if (fetchError) {
      console.error(`  Error fetching events: ${fetchError.message}`);
      results.push({ title: event.title, deleted: 0, error: fetchError.message });
      continue;
    }
    
    console.log(`  Found ${beforeData?.length || 0} record(s) to delete`);
    
    // Delete the events
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', event.ids);
    
    if (deleteError) {
      console.error(`  Error deleting events: ${deleteError.message}`);
      results.push({ title: event.title, deleted: 0, error: deleteError.message });
      continue;
    }
    
    // Verify deletion
    const { data: afterData, error: verifyError } = await supabase
      .from('events')
      .select('id')
      .in('id', event.ids);
    
    if (verifyError) {
      console.error(`  Error verifying deletion: ${verifyError.message}`);
    }
    
    const remainingCount = afterData?.length || 0;
    const deletedCount = (beforeData?.length || 0) - remainingCount;
    
    console.log(`  Successfully deleted ${deletedCount} record(s)`);
    if (remainingCount > 0) {
      console.warn(`  WARNING: ${remainingCount} record(s) still exist`);
    }
    
    results.push({ 
      title: event.title, 
      deleted: deletedCount,
      remaining: remainingCount,
      error: null 
    });
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('DELETION SUMMARY');
  console.log('='.repeat(60));
  
  let totalDeleted = 0;
  for (const result of results) {
    const status = result.error ? 'ERROR' : 'SUCCESS';
    console.log(`${result.title}`);
    console.log(`  Status: ${status}`);
    if (!result.error) {
      console.log(`  Deleted: ${result.deleted} record(s)`);
      if (result.remaining > 0) {
        console.log(`  Remaining: ${result.remaining} record(s)`);
      }
      totalDeleted += result.deleted;
    } else {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }
  
  console.log(`Total records deleted: ${totalDeleted}`);
}

deleteEvents().catch(console.error);
