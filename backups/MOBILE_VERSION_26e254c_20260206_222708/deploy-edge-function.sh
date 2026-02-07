#!/bin/bash

# Deploy Edge Function with buzz_score sorting

echo "🚀 Deploying get-external-events Edge Function..."
echo ""
echo "This will update the sorting to:"
echo "  1. buzz_score DESC (best events first)"
echo "  2. start_date ASC (then by date)"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed!"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Deploy the function
supabase functions deploy get-external-events

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Now the Edge Function will return the BEST 500 events (sorted by buzz_score)"
echo "instead of the OLDEST 500 events (sorted by date)."
