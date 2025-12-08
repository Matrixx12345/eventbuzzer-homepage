import { supabase } from "@/integrations/supabase/client";

// Import all images from assets
import eventAbbey from "@/assets/event-abbey.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import heroMountains from "@/assets/hero-mountains.jpg";
import partnerChampagne from "@/assets/partner-champagne.jpg";
import partnerChocolate from "@/assets/partner-chocolate.jpg";
import partnerRoses from "@/assets/partner-roses.jpg";
import partnerTeddy from "@/assets/partner-teddy.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";
import rainyCinema from "@/assets/rainy-cinema.jpg";
import rainyFifa from "@/assets/rainy-fifa.jpg";
import rainyKunsthaus from "@/assets/rainy-kunsthaus.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import swissBasel from "@/assets/swiss-basel.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissGeneva from "@/assets/swiss-geneva.jpg";
import swissInterlaken from "@/assets/swiss-interlaken.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissTrain from "@/assets/swiss-train.jpg";
import swissZermatt from "@/assets/swiss-zermatt.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import weekendComedy from "@/assets/weekend-comedy.jpg";
import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";
import weekendOrchestra from "@/assets/weekend-orchestra.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";

interface ImageMapping {
  url: string;
  category: string;
  filename: string;
}

const imageMap: ImageMapping[] = [
  // Concert / Music
  { url: eventConcert, category: "concert", filename: "concert-hall-01.jpg" },
  { url: eventSymphony, category: "concert", filename: "symphony-01.jpg" },
  { url: weekendJazz, category: "concert", filename: "jazz-01.jpg" },
  { url: weekendOrchestra, category: "concert", filename: "orchestra-01.jpg" },
  
  // Theater / Opera
  { url: eventAbbey, category: "theater", filename: "theater-01.jpg" },
  { url: weekendOpera, category: "theater", filename: "opera-01.jpg" },
  
  // Museum / Art
  { url: rainyKunsthaus, category: "museum", filename: "kunsthaus-01.jpg" },
  { url: weekendArt, category: "museum", filename: "art-gallery-01.jpg" },
  { url: rainyChocolate, category: "museum", filename: "chocolate-museum-01.jpg" },
  { url: rainyFifa, category: "museum", filename: "fifa-museum-01.jpg" },
  
  // Wellness / Spa
  { url: rainySpa, category: "wellness", filename: "spa-01.jpg" },
  
  // Cinema
  { url: rainyCinema, category: "cinema", filename: "cinema-01.jpg" },
  
  // Comedy
  { url: weekendComedy, category: "comedy", filename: "comedy-01.jpg" },
  
  // Food & Wine
  { url: weekendWine, category: "food", filename: "wine-tasting-01.jpg" },
  
  // Cities / General
  { url: swissZurich, category: "city", filename: "zurich-01.jpg" },
  { url: swissBasel, category: "city", filename: "basel-01.jpg" },
  { url: swissBern, category: "city", filename: "bern-01.jpg" },
  { url: swissGeneva, category: "city", filename: "geneva-01.jpg" },
  { url: swissLucerne, category: "city", filename: "lucerne-01.jpg" },
  
  // Nature / Adventure
  { url: swissInterlaken, category: "nature", filename: "interlaken-01.jpg" },
  { url: swissZermatt, category: "nature", filename: "zermatt-01.jpg" },
  { url: heroMountains, category: "nature", filename: "mountains-01.jpg" },
  { url: swissTrain, category: "nature", filename: "train-01.jpg" },
  
  // Venue / General
  { url: eventVenue, category: "general", filename: "venue-01.jpg" },
  
  // Partner / Gifts (useful for affiliate section)
  { url: partnerChampagne, category: "partner", filename: "champagne-01.jpg" },
  { url: partnerChocolate, category: "partner", filename: "chocolate-01.jpg" },
  { url: partnerRoses, category: "partner", filename: "roses-01.jpg" },
  { url: partnerTeddy, category: "partner", filename: "teddy-01.jpg" },
];

async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return await response.blob();
}

export async function uploadAllAssetsToStorage(
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];
  const total = imageMap.length;

  for (let i = 0; i < imageMap.length; i++) {
    const { url, category, filename } = imageMap[i];
    const storagePath = `${category}/${filename}`;

    try {
      onProgress?.(i + 1, total, storagePath);
      
      const blob = await urlToBlob(url);
      
      const { error } = await supabase.storage
        .from("event-images")
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload ${storagePath}:`, error);
        failed.push(storagePath);
      } else {
        console.log(`Uploaded: ${storagePath}`);
        success.push(storagePath);
      }
    } catch (err) {
      console.error(`Error uploading ${storagePath}:`, err);
      failed.push(storagePath);
    }
  }

  return { success, failed };
}

export function getStorageImageUrl(category: string, filename: string): string {
  const { data } = supabase.storage
    .from("event-images")
    .getPublicUrl(`${category}/${filename}`);
  return data.publicUrl;
}

export function getRandomImageFromCategory(category: string): string {
  const categoryImages = imageMap.filter((img) => img.category === category);
  if (categoryImages.length === 0) {
    // Fallback to general category
    const generalImages = imageMap.filter((img) => img.category === "general");
    const randomGeneral = generalImages[Math.floor(Math.random() * generalImages.length)];
    return getStorageImageUrl("general", randomGeneral?.filename || "venue-01.jpg");
  }
  const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
  return getStorageImageUrl(category, randomImage.filename);
}

export const categoryMapping: Record<string, string> = {
  // Map event categories/keywords to image categories
  "konzert": "concert",
  "concert": "concert",
  "musik": "concert",
  "music": "concert",
  "jazz": "concert",
  "klassik": "concert",
  "orchestra": "concert",
  "symphony": "concert",
  "theater": "theater",
  "oper": "theater",
  "opera": "theater",
  "musical": "theater",
  "museum": "museum",
  "kunst": "museum",
  "art": "museum",
  "ausstellung": "museum",
  "exhibition": "museum",
  "spa": "wellness",
  "wellness": "wellness",
  "entspannung": "wellness",
  "kino": "cinema",
  "cinema": "cinema",
  "film": "cinema",
  "comedy": "comedy",
  "kabarett": "comedy",
  "standup": "comedy",
  "wein": "food",
  "wine": "food",
  "kulinarik": "food",
  "food": "food",
  "sport": "museum", // FIFA museum etc
  "natur": "nature",
  "nature": "nature",
  "outdoor": "nature",
  "wandern": "nature",
};

export function getCategoryFromEventTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (lowerTitle.includes(keyword)) {
      return category;
    }
  }
  
  return "general";
}
