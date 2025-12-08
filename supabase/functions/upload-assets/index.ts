import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image URLs from the project assets (using placeholder URLs that represent the categories)
const imageAssets = [
  // Concert images
  { category: "concert", filename: "symphony.jpg", sourceUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80" },
  { category: "concert", filename: "jazz.jpg", sourceUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80" },
  { category: "concert", filename: "orchestra.jpg", sourceUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80" },
  { category: "concert", filename: "abbey.jpg", sourceUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80" },
  
  // Theater images
  { category: "theater", filename: "opera.jpg", sourceUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80" },
  { category: "theater", filename: "comedy.jpg", sourceUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80" },
  
  // Museum images
  { category: "museum", filename: "kunsthaus.jpg", sourceUrl: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80" },
  { category: "museum", filename: "art.jpg", sourceUrl: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&q=80" },
  { category: "museum", filename: "fifa.jpg", sourceUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
  { category: "museum", filename: "chocolate.jpg", sourceUrl: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80" },
  
  // Wellness images
  { category: "wellness", filename: "spa.jpg", sourceUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80" },
  
  // Cinema images
  { category: "cinema", filename: "cinema.jpg", sourceUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80" },
  
  // Food images
  { category: "food", filename: "wine.jpg", sourceUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80" },
  
  // City images
  { category: "city", filename: "zurich.jpg", sourceUrl: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&q=80" },
  { category: "city", filename: "bern.jpg", sourceUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80" },
  { category: "city", filename: "geneva.jpg", sourceUrl: "https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=800&q=80" },
  { category: "city", filename: "lucerne.jpg", sourceUrl: "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=800&q=80" },
  { category: "city", filename: "basel.jpg", sourceUrl: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&q=80" },
  
  // Nature images
  { category: "nature", filename: "zermatt.jpg", sourceUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80" },
  { category: "nature", filename: "interlaken.jpg", sourceUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
  { category: "nature", filename: "train.jpg", sourceUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80" },
  { category: "nature", filename: "mountains.jpg", sourceUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80" },
  
  // Partner images
  { category: "partner", filename: "roses.jpg", sourceUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80" },
  { category: "partner", filename: "chocolate.jpg", sourceUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80" },
  { category: "partner", filename: "champagne.jpg", sourceUrl: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80" },
  { category: "partner", filename: "teddy.jpg", sourceUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  
  // General/venue images
  { category: "general", filename: "venue.jpg", sourceUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    console.log(`Starting upload of ${imageAssets.length} images...`);

    for (const asset of imageAssets) {
      const filePath = `${asset.category}/${asset.filename}`;
      
      try {
        // Fetch the image from URL
        console.log(`Fetching: ${asset.sourceUrl}`);
        const response = await fetch(asset.sourceUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Upload to Supabase Storage
        console.log(`Uploading: ${filePath}`);
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, uint8Array, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        results.success.push(filePath);
        console.log(`✓ Uploaded: ${filePath}`);
        
      } catch (error) {
        console.error(`✗ Failed: ${filePath}`, error);
        results.failed.push(filePath);
      }
    }

    console.log(`Upload complete. Success: ${results.success.length}, Failed: ${results.failed.length}`);

    return new Response(
      JSON.stringify({
        message: `Upload complete. ${results.success.length} succeeded, ${results.failed.length} failed.`,
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
