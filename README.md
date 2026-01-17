# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5e1d1c73-9076-480b-bf8b-7c410acbf536

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5e1d1c73-9076-480b-bf8b-7c410acbf536) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5e1d1c73-9076-480b-bf8b-7c410acbf536) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 🚨 CRITICAL: macOS iCloud Drive Issue (January 16, 2026)

### Problem
macOS automatically uploads files to iCloud Drive and replaces local files with "dataless" placeholders to save disk space. **This breaks development completely** because:

- ❌ `package.json`, `tsconfig.json` become empty (0 bytes locally)
- ❌ Component files like `EventsMap.tsx`, `Listings.tsx` become placeholders
- ❌ `npm install`, build tools, and IDEs can't read the files
- ❌ Claude Code can't read or edit files
- ❌ Git may show files as modified when they're just placeholders

### Symptoms
```bash
ls -lO src/pages/Listings.tsx
# Shows: -rw-r--r-- 1 jj staff compressed,dataless 38486 Jan 12 15:17
#                              ^^^^^^^^^^^^^^^^^^^
#                              ← This means file is in iCloud, not local!
```

### Solution: Move Project Out of iCloud

**Option 1: Move to ~/Developer (Recommended)**
```bash
# Create Developer folder (if not exists)
mkdir -p ~/Developer

# Move project out of Desktop/Documents (which sync to iCloud)
mv ~/Desktop/eventbuzzer-homepage ~/Developer/

cd ~/Developer/eventbuzzer-homepage
```

**Option 2: Download All Files First, Then Move**
```bash
cd ~/Desktop/eventbuzzer-homepage

# Download all project files from iCloud
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.css" \) -print0 | xargs -0 brctl download

# Then move to Developer
mv ~/Desktop/eventbuzzer-homepage ~/Developer/
```

### Verify Files Are Local
```bash
cd ~/Developer/eventbuzzer-homepage

# Check if files are still in iCloud (should return 0)
find . -type f -exec ls -lO {} \; | grep -c "compressed,dataless"

# Verify key files have content
wc -l package.json src/components/EventsMap.tsx src/pages/Listings.tsx
# Should show actual line counts, not 0
```

### Prevent Future Issues

**Never store development projects in these folders:**
- ❌ `~/Desktop` (syncs to iCloud Drive)
- ❌ `~/Documents` (syncs to iCloud Drive)
- ❌ `~/iCloud Drive/` (obviously in iCloud)

**Safe locations for development:**
- ✅ `~/Developer/`
- ✅ `~/Projects/`
- ✅ `~/Code/`
- ✅ `/Users/jj/dev/`

### Current Status (as of Jan 16, 2026)
- ✅ All project files downloaded from iCloud
- ✅ Key files verified (EventsMap.tsx: 1077 lines, Listings.tsx: 907 lines, package.json: 94 lines)
- ⚠️ Project currently at: `~/Desktop/eventbuzzer-homepage`
- 📝 TODO: Move to `~/Developer/eventbuzzer-homepage` when possible

---

## 🔥 CRITICAL: macOS fileproviderd High CPU/Fan Issue (January 16, 2026)

### Problem: Laptop Fan Running Hot

**Symptom:** MacBook fan running at high speed constantly, especially when working in the project directory.

**Root Cause:** The `fileproviderd` daemon (iCloud sync service) consuming 70%+ CPU trying to sync the `node_modules` folder to iCloud Drive.

### How to Diagnose

```bash
# Check top CPU consumers
ps aux | sort -rk 3 | head -20

# Look for fileproviderd in output
ps aux | grep fileproviderd
```

**Example output showing the problem:**
```
jj  1234  73.3  2.5  12345678  123456  ??  S  10:00AM  76:45.67 /System/Library/Frameworks/FileProvider.framework/Support/fileproviderd
```

If `fileproviderd` shows:
- **CPU > 40%** for extended periods
- **Runtime > 30 minutes** without stopping
- **While working in project folder**

→ You have this issue.

### Why This Happens

1. **Project on Desktop** → Desktop syncs to iCloud Drive automatically
2. **node_modules is huge** → 300MB+ with thousands of small files
3. **iCloud tries to sync** → Scans/uploads every file change
4. **Infinite loop** → npm operations modify files → iCloud re-syncs → npm modifies again
5. **CPU overload** → fileproviderd burns CPU trying to keep up
6. **Fan runs hot** → CPU at 70%+ generates heat

### Solution 1: Exclude node_modules from iCloud (Quick Fix)

```bash
cd ~/Desktop/eventbuzzer-homepage

# Mark node_modules to stay local (don't sync to iCloud)
xattr -w com.apple.fileprovider.ignore#P 1 node_modules

# Verify it worked
xattr -l node_modules
# Should show: com.apple.fileprovider.ignore#P: 1

# Kill fileproviderd to stop current sync
sudo pkill -9 fileproviderd
# (it will restart automatically, but won't sync node_modules anymore)
```

**Result:** Fan should stop within 1-2 minutes. iCloud ignores node_modules.

### Solution 2: Kill fileproviderd Temporarily (Emergency Fix)

```bash
# Kill the process (it will restart automatically)
sudo pkill -9 fileproviderd

# Check if fan stops
sleep 10 && ps aux | grep fileproviderd
```

**Limitations:**
- Process restarts automatically after ~30 seconds
- Only stops current sync, doesn't prevent future issues
- Use this when fan is running hot RIGHT NOW

### Solution 3: Move Project Out of Desktop (Permanent Fix)

```bash
# Create Developer folder (outside iCloud)
mkdir -p ~/Developer

# Move project
mv ~/Desktop/eventbuzzer-homepage ~/Developer/

# Navigate to new location
cd ~/Developer/eventbuzzer-homepage

# Verify iCloud is not syncing
ls -lO . | head -20
# Should NOT show "compressed,dataless" for any files
```

**Benefits:**
- No iCloud sync at all (~/Developer is not in iCloud Drive)
- No performance issues
- Recommended for all development projects

### Solution 4: Pin Project to Stay Local (Alternative if can't move)

```bash
cd ~/Desktop

# Pin entire project folder to stay local
xattr -w com.apple.fileprovider.pinned 1 eventbuzzer-homepage

# Pin node_modules specifically
xattr -w com.apple.fileprovider.ignore#P 1 eventbuzzer-homepage/node_modules

# Verify
xattr -l eventbuzzer-homepage
xattr -l eventbuzzer-homepage/node_modules
```

### Prevention

**Never store development projects in these folders:**
- ❌ `~/Desktop` (syncs to iCloud)
- ❌ `~/Documents` (syncs to iCloud)
- ❌ `~/iCloud Drive/` (obviously syncs)

**Safe locations for development:**
- ✅ `~/Developer/` (recommended)
- ✅ `~/Projects/`
- ✅ `~/Code/`
- ✅ `/Users/jj/dev/`

### Performance Impact

**Before fix:**
- fileproviderd: 73.3% CPU (76+ minutes runtime)
- Fan: Running at high speed
- Battery: Draining fast
- Temperature: Hot to touch

**After fix:**
- fileproviderd: 0-2% CPU (background only)
- Fan: Quiet/off
- Battery: Normal consumption
- Temperature: Cool

### Quick Reference

| Problem | Command |
|---------|---------|
| Fan running hot now | `sudo pkill -9 fileproviderd` |
| Exclude node_modules | `xattr -w com.apple.fileprovider.ignore#P 1 node_modules` |
| Check if syncing | `ls -lO . \| grep dataless` |
| Move to safe location | `mv ~/Desktop/PROJECT ~/Developer/` |
| Verify CPU usage | `ps aux \| grep fileproviderd` |

### Current Project Status (as of Jan 16, 2026)

- ✅ fileproviderd issue identified (73.3% CPU)
- ⚠️ Project still at: `~/Desktop/eventbuzzer-homepage`
- ⚠️ node_modules marked with xattr to prevent sync
- 📝 TODO: Move to `~/Developer/` for permanent fix

---

## EventList1 Location Display - Implementation Notes

### Location Format Requirements:
The location display on EventList1 page MUST follow this exact format from "Alle Events" (Listings.tsx):

**Format:** `[Ortsname], [Distanz] km [Richtung] von [Großstadt]`

**Examples:**
- `Riehen, 5 km NO von Basel`
- `Museum Tinguely, 2 km von Basel`
- `In Zürich` (wenn < 3km zur Großstadt)

### Key Components:

1. **Ortsname (Location Name)**:
   - Use `venue_name` OR `address_city` from the event
   - NOT the event title!
   - Falls back to nearest place if not available

2. **Distanz (Distance)**:
   - Calculated to nearest major city (Zürich, Basel, Bern, etc.)
   - Rounded to whole kilometers

3. **Richtung (Direction)**:
   - Uses abbreviations: N, NO, O, SO, S, SW, W, NW
   - Calculated using `getDirection()` function from swissPlaces.ts

4. **Großstadt (Major City)**:
   - One of 10 major cities: Zürich, Genf, Basel, Bern, Lausanne, Luzern, St. Gallen, Lugano, Winterthur, Chur

### SVG Map Hover Tooltip:

**Location:** `/swiss-outline.svg`

On hover über den Location-Text, erscheint ein Tooltip mit:
- Schweizer Karte (SVG outline) als Hintergrund
- Roter Pin (animated bounce) an der exakten Event-Position
- Position berechnet als % der SVG-Dimensionen

### Implementation Function:

Use `getLocationWithMajorCity(lat, lng, locationName)` from `@/utils/swissPlaces`

**DO NOT** link to Google Maps - use the hover SVG map instead!

### ✅ Status: IMPLEMENTED

EventList1 nutzt jetzt korrekt `getLocationWithMajorCity()` für Location-Display.

---

## EventsMap.tsx - Zoom Bug Fix & Google Maps Style Integration

### Critical Bug Fix (January 2026)

**Problem:** Map-Zoom resettet sich, "wackelt" während Zoom, Race Conditions bei Event-Loading.

**Root Cause:**
1. **Doppelte `moveend` Event-Handler** - Zeilen 787 + 899 feuerten beide bei Zoom
2. **Supercluster Re-Init triggert Marker-Rebuild** - `updateMarkers()` wurde automatisch bei `filteredEvents` Change aufgerufen
3. **Instabile `updateMarkers` Callback** - Array-Dependency statt Set für `selectedEventIds`
4. **300ms Debounce zu kurz** - Event-Loading während Zoom-Animation (300ms)

**✅ Solution Implemented:**

**UPDATE (January 13, 2026 - CRITICAL FIX):**
The initial fix was incomplete! The old `debouncedLoad` function at line 323-330 was NOT removed, causing conflicts with the new `handleMapMove` system. This `debouncedLoad` still used 300ms debounce and was in the map initialization useEffect dependencies (line 800), creating race conditions.

**Final Fix:**
1. ✅ Removed `debouncedLoad` function completely (lines 323-330)
2. ✅ Removed `debouncedLoad` from useEffect dependencies (line 800)
3. ✅ Now ONLY `handleMapMove` with 800ms debounce handles all map interactions

#### 1. Konsolidierter Event-Handler
```typescript
// EventsMap.tsx - NUR NOCH EIN moveend Handler
const handleMapMove = useCallback(() => {
  // SOFORT: Marker aktualisieren (smooth UX)
  updateMarkers();

  // SOFORT: Bounds an Parent melden (für "Search this area" Logic)
  if (onBoundsChange) { /* ... */ }

  // DEBOUNCED 800ms: Event-Loading (NACH Zoom-Animation)
  setTimeout(() => loadEventsInView(), 800);
}, [loadEventsInView, updateMarkers, onBoundsChange]);
```

#### 2. Supercluster Decoupling
```typescript
// Supercluster useEffect - KEIN automatischer updateMarkers() Call mehr
useEffect(() => {
  const cluster = new Supercluster({ ... });
  cluster.load(points);
  superclusterRef.current = cluster;

  // ENTFERNT: if (mapReady) { updateMarkers(); }
  // Marker werden NUR durch handleMapMove (moveend) aktualisiert!
}, [filteredEvents]);  // ← updateMarkers NICHT in Dependencies
```

#### 3. Performance-Optimierung mit Set
```typescript
// O(1) Lookup statt O(n) für Favoriten-Check
const selectedIdsSet = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);

// In updateMarkers:
const isFavorite = selectedIdsSet.has(event.id);  // ← Schneller & stabiler
```

#### 4. UI Improvements
- **Event Count**: Klein unten links IN Map (9px, Frosted Glass)
- **"Search this area" Button**: Google Maps Style, erscheint bei großen Map-Bewegungen
  - **UPDATE (January 13, 2026)**: Removed huge blue badge with event count - was too prominent and didn't fit design (lines 950-954 removed)
  - Now shows only: Search icon + "Suche in diesem Bereich" text
- **Zoom Controls**: Custom +/− Buttons unten rechts (keine Überlappung)

### Google Maps Style - "Search this area" Logic

**Strategie:** Hybrid aus Booking.com (Auto-Update) + Google Maps (Button bei großen Bewegungen)

**EventList1.tsx - Bounds Analysis:**
```typescript
const handleMapBoundsChange = useCallback((bounds: any) => {
  const zoomChange = Math.abs(bounds.zoom - lastMapBounds.zoom);
  const relativePan = panDistance / viewportHeight;  // Relative Pan-Distanz

  // KLEINE ÄNDERUNG (±1 Zoom UND <30% Pan) → Auto-Update
  if (zoomChange <= 1 && relativePan < 0.3) {
    setShowSearchButton(false);
    console.log('✅ Small change → Auto-update');
  }
  // GROSSE ÄNDERUNG → "Search this area" Button
  else {
    setShowSearchButton(true);
    console.log('🔵 Large change → Show search button');
  }
}, [lastMapBounds]);
```

**Warum 800ms Debounce?**
- Mapbox Zoom-Animation dauert 300ms
- User macht oft mehrere Zooms schnell hintereinander
- 800ms = NACH allen Zoom-Operationen → verhindert API-Spam
- Marker-Update ist instant (kein Debounce) → smooth UX

### Performance Mode

**Collapsed Map (Klein):**
- Lädt nur **Elite Events** (buzz_boost = 100) + **Favoriten**
- ~50 Events statt 2000+ → schneller Initial Load
- Clustering deaktiviert (zu wenig Events)

**Expanded Map (Groß):**
- Lädt **alle Events** im Viewport (+ 100% Padding)
- Clustering aktiv (Supercluster: radius 60, minPoints 5, maxZoom 12)
- Google Maps Style Cluster-Dots (KEINE Zahlen)

### Props Interface

```typescript
interface EventsMapProps {
  onEventsChange?: (events: MapEvent[]) => void;          // Events an Parent liefern
  onBoundsChange?: (bounds: { ... zoom ... }) => void;    // "Search this area" Logic
  onEventClick?: (eventId: string) => void;
  selectedEventIds?: string[];                            // Favoriten-IDs (render as ❤️)
  showOnlyEliteAndFavorites?: boolean;                    // Performance Mode
  customControls?: boolean;                               // Custom +/− Buttons (default: false)
  showSearchButton?: boolean;                             // Controlled by Parent
  onSearchThisArea?: () => void;                          // Button Click Handler
  totalEventsCount?: number;                              // Badge Number
}
```

### Testing Checklist

**✅ Zoom Bug Fix:**
- Click + Button 5x schnell → Zoom smooth von 6.5 → 11.5 (KEIN Reset)
- Console zeigt "Loaded X events" NUR 1x nach allen Zooms (800ms)
- Marker bleiben stabil sichtbar während Zoom

**✅ "Search this area" Logic:**
- Kleine Bewegung (+1 Zoom) → Event-Liste auto-update, KEIN Button
- Große Bewegung (>30% Pan) → Button erscheint IN Map (oben center)
- Button Click → Event-Liste aktualisiert + scroll to top

**✅ Performance:**
- Edge Function Call NUR 1x bei schnellen Zooms (800ms Debounce)
- Zoom-Animation smooth (keine Frame Drops)
- Marker-Rebuild < 100ms

### Backwards Compatibility

✅ **Keine Breaking Changes** für bestehende Pages
- `customControls` optional (default: false = Mapbox Controls)
- `onBoundsChange` optional (nur für Google Maps Style)
- Listings.tsx & TripPlanner.tsx können später migriert werden

### Migration Guide (Future)

**Listings.tsx & TripPlanner.tsx:**
1. Replace eigene Map-Logic durch `<EventsMap />`
2. Nutze `onBoundsChange` für "Search this area" Button
3. Nutze `showOnlyEliteAndFavorites` für Performance Mode
4. Event-Loading über `onEventsChange` statt eigene Supabase Queries

---

## ARCHIVED: Buzz Score Implementation (EventList1.tsx)

**Location:** EventList1.tsx Lines 119-240

### Buzz Score Calculation
```typescript
const buzzScore = event.buzz_score || event.relevance_score || 75;
const isHot = buzzScore >= 80;

// Rating (0-5) basierend auf buzzScore (0-100)
const rating = buzzScore / 20; // 75 / 20 = 3.75
const goldStars = Math.floor(rating); // 3
const grayStars = 5 - goldStars; // 2
```

### Star Rating Display (Top Right)
```tsx
{/* Einzelner edler Gold-Stern mit Rating */}
<div className="flex items-center gap-1.5 flex-shrink-0">
  <span className="text-yellow-400 text-base">⭐</span>
  <span className="text-sm font-semibold text-gray-500">
    ({rating.toFixed(1)})
  </span>
</div>
```

### Buzz Bar (Bottom Row)
```tsx
{/* Bottom Row: Buzz-Balken wie "Alle Events" */}
<div className="flex items-center gap-2.5">
  {/* Buzz-Balken (175px = 140px + 25%) */}
  <span className="relative w-[175px] h-1.5 bg-stone-300/60 rounded-full overflow-visible">
    {/* Active bar */}
    <span
      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
      style={{
        width: `${buzzScore}%`,
        backgroundColor: getBuzzColor(buzzScore)
      }}
    />
    {/* Position indicator dot */}
    <span
      className={cn(
        "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm transition-all duration-500 ease-out",
        isHot ? "border-red-500 animate-pulse" : "border-neutral-400"
      )}
      style={{
        left: `calc(${buzzScore}% - 5px)`, // Center dot on position
      }}
    />
  </span>

  {/* Text Label */}
  <span className={cn(
    "text-[10px] font-medium transition-colors",
    isHot ? "text-red-600" : "text-neutral-600"
  )}>
    {isHot ? "🔥 Trending" : "Buzz"}
  </span>
</div>
```

**Color Function:**
```typescript
const getBuzzColor = (score: number) => {
  if (score >= 80) return '#ef4444'; // red-500
  if (score >= 60) return '#f97316'; // orange-500
  if (score >= 40) return '#eab308'; // yellow-500
  return '#84cc16'; // lime-500
};
```

**Archived on:** January 13, 2026
**Reason:** Redesigning EventCard to move star+rating to bottom row, heart to same row as star

---

## EventList1 - EventCard Redesign (January 2026)

### Changes Made

**OLD Layout:**
- Star ⭐ + rating in top-right corner (next to title)
- Heart ❤️ button on photo (top-right of image)
- Buzz bar at bottom with animated progress bar

**NEW Layout:**
- Title only at top (no star)
- Image clean (no heart button)
- Bottom row: Star ⭐ + rating on left, Heart ❤️ button on right

### Implementation

**Bottom Row (EventList1.tsx Lines ~190-210):**
```tsx
{/* Bottom Row: Star Rating + Heart Button */}
<div className="flex items-center justify-between">
  {/* Star Rating */}
  <div className="flex items-center gap-1.5">
    <span className="text-yellow-400 text-lg">⭐</span>
    <span className="text-sm font-semibold text-gray-700">
      {rating.toFixed(1)}
    </span>
  </div>

  {/* Heart Button */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggleFavorite(event);
    }}
    className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
      isFavorited
        ? "bg-red-500 text-white hover:bg-red-600"
        : "bg-white text-gray-600 hover:bg-gray-50 hover:text-red-500 border border-gray-200"
    )}
  >
    <Heart size={15} className={isFavorited ? "fill-current" : ""} />
  </button>
</div>
```

**Design Rationale:**
- Cleaner image (no UI elements overlapping photo)
- Better visual hierarchy (title → location → description → rating/favorite)
- Heart button more accessible at bottom (easier to click without covering photo)
- Star rating calculation still uses buzz_score (rating = buzzScore / 20)

---

## ⚠️ CRITICAL: UI/UX Design Rules - DO NOT FORGET AFTER COMPACT!

**Last Updated:** January 14, 2026 - 01:04 AM (AFTER fixing short descriptions + typography)

### EventCard Design Rules (EventList1.tsx)

**THESE RULES MUST NEVER BE CHANGED OR FORGOTTEN:**

#### 1. Typography & Fonts
- ✅ **ALL FONTS**: `font-sans` (System font, NOT serif!)
  - Event card title
  - Page title "Eventliste 1"
  - Chatbot header "Dein Event-Assistent"
- ✅ **Title**: `text-xl font-semibold leading-none`
- ❌ **NEVER use**: `tracking-tight`, `leading-tight`, or `font-serif`
- ✅ **Letter spacing**: Normal (default) - NO tight tracking!

#### 2. Text Colors
- ✅ **Title ONLY**: `text-stone-900` (black)
- ✅ **ALL other text**: `text-gray-500` or `text-gray-600`
  - Location: `text-gray-500`
  - Description: `text-gray-600`
  - Star rating number: `text-gray-600`
  - Icon colors: `text-gray-600` (unless favorited)

#### 3. Location Formatting
- ❌ **NO PIN ICON** - just plain text
- ❌ **NO underline** on location text
- ✅ Use `text-sm text-gray-500` for location
- ❌ Do NOT use `MapPin` component
- ❌ Do NOT use `border-b border-dotted`

#### 4. Title Display
- ✅ **ALWAYS 1 line only** with `truncate` class
- ❌ NEVER multi-line titles (even when map expanded)
- ✅ Size: `text-xl` (20px)
- ✅ Weight: `font-semibold`
- ✅ Line height: `leading-none`

#### 5. Description Display
- ✅ **ONLY AI-generated descriptions** from database
- ✅ Use `event.short_description` or `event.description`
- ✅ Apply `convertToUmlauts()` function for proper German umlauts
- ❌ **NO generic fallback text** - we pay for ChatGPT AI to write unique descriptions!
- ✅ **Max 2 lines** with `line-clamp-2` class
- ✅ Size: `text-[15px]`
- ✅ Color: `text-gray-600`
- ✅ Line height: `leading-relaxed`

#### 6. Spacing & Padding
- ✅ **Content padding**: `px-4 pt-4 pb-3` (more top padding for breathing room)
- ✅ **Title margin**: `mb-2` (8px below title)
- ✅ **Location margin**: `mb-2` (8px below location)
- ❌ **NO excessive spacing** between elements

#### 7. Icon Layout (Bottom Row)
- ✅ **LEFT-ALIGNED** - icons near the star, NOT right-aligned
- ❌ **NO BORDERS** - remove all `border`, `p-2`, `rounded-lg` from icon buttons
- ❌ **NO BACKGROUNDS** - remove `bg-white`, `hover:bg-neutral-50`
- ✅ **Simple hover** - use only `hover:opacity-70 transition-opacity`
- ✅ **20px spacing** - use `gap-5` between all icons
- ✅ **Icon size 18px** - `size={18}` for Share2, CalendarPlus, Heart
- ✅ **Dark gray color** - `text-gray-600` for all icons (unless favorited)

#### 8. Bottom Row Structure
```tsx
<div className="flex items-center gap-5">  {/* gap-5 = 20px */}
  {/* Star + Rating */}
  <div className="flex items-center gap-1.5">
    <span className="text-yellow-400 text-lg">⭐</span>
    <span className="text-sm font-semibold text-gray-600">{rating.toFixed(1)}</span>
  </div>

  {/* Icons - NO borders, simple hover */}
  <div className="flex items-center gap-5">
    <button className="hover:opacity-70 transition-opacity">
      <Share2 size={18} className="text-gray-600" />
    </button>
    <button className="hover:opacity-70 transition-opacity">
      <CalendarPlus size={18} className="text-gray-600" />
    </button>
    <button className="hover:opacity-70 transition-opacity">
      <Heart size={18} className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"} />
    </button>
  </div>
</div>
```

#### 9. Map Zoom Controls
- ✅ **Bottom-right position** (already implemented at lines 947-976)
- ✅ Custom +/− buttons with white background
- ❌ Do NOT use Mapbox default controls

---

### 🔧 CRITICAL BUG FIX: Short Descriptions Not Displaying

**Problem Solved:** January 14, 2026 - 01:00 AM

#### Root Cause
Event descriptions were not displaying because:
1. `MapEvent` interface in `/src/types/map.ts` was missing `description` and `short_description` fields
2. EventsMap.tsx was filtering out these fields during mapping (lines 284-310)

#### Solution Applied
1. ✅ **Added missing fields to MapEvent interface** (`/src/types/map.ts`):
   ```typescript
   export interface MapEvent {
     description?: string;
     short_description?: string;
     location?: string;
     end_date?: string;
     relevance_score?: number;
     source?: string;
     // ... other fields
   }
   ```

2. ✅ **Updated EventsMap mapping** (`/src/components/EventsMap.tsx` lines 284-310):
   ```typescript
   const mappedEvents: MapEvent[] = uniqueEvents
     .map((e: any) => ({
       id: e.external_id || String(e.id),
       external_id: e.external_id,
       title: e.title,
       description: e.description,              // ← ADDED
       short_description: e.short_description,  // ← ADDED
       location: e.location,                    // ← ADDED
       end_date: e.end_date,                    // ← ADDED
       relevance_score: e.relevance_score,      // ← ADDED
       source: e.source,                        // ← ADDED
       // ... rest of fields
     }))
   ```

3. ✅ **Added convertToUmlauts function** in EventList1.tsx (lines 25-87):
   - Converts "Weltberuehmtes" → "Weltberühmtes"
   - Applied to all short_description rendering

#### Verification
- Database query confirms all Elite events have short_description (100% coverage)
- Events now display correctly with proper German umlauts

### Visual Design Philosophy

**Minimalist Aesthetic:**
- Less is more - no decorative borders or backgrounds
- Simple hover effects (opacity changes only)
- Clean, uncluttered interface
- Dark gray (`text-gray-600`) for all secondary text/icons
- Only title in black (`text-stone-900`)

**User Feedback:**
> "irgenwie hapert es noch mit deinem ästhetischen auge"

**Translation:** Keep it simple. Remove visual clutter. Use subtle hover effects. Left-align related items. Consistent spacing.

---

## 🔧 MySwitzerland Image URLs Fix (January 14, 2026)

### Problem Discovery

**Issue:** MySwitzerland event images were showing as placeholders despite database having `image_url` values.

**Root Cause Investigation:**
1. ✅ Database had `image_url` populated for all MySwitzerland events
2. ✅ EventsMap correctly mapped `image_url: e.image_url` (line 293)
3. ✅ Events had `short_description` (100% coverage verified)
4. ❌ But images returned **406 Not Acceptable** errors

**Console Errors:**
```
GET https://www.myswitzerland.com/-/media/st/gadmin/images/sport/summer/various/monstertrotti_78420.jpg?w=1200 406 (Not Acceptable)
```

### Investigation Steps

**1. Initial Theory:** `?w=1200` parameter causing issues
- Tested URLs with different quality params: `?w=1200`, `?w=800`, `?w=600`, no params
- **Result:** ALL returned 406 - parameter wasn't the issue

**2. Server-Side Testing:**
```javascript
// Tested from Node.js with different headers
const tests = [
  { headers: {} },
  { headers: { 'Referer': 'https://www.myswitzerland.com/' } },
  { headers: { 'User-Agent': 'Mozilla/5.0...', 'Referer': '...' } }
];
// ALL returned 406 Not Acceptable
```

**3. Browser Testing:**
- Direct URL in browser: ❌ Also 406 error
- But image visible on MySwitzerland website: ✅ Works!
- **Conclusion:** MySwitzerland changed their image delivery system

### Solution Discovery

**User found working image on MySwitzerland page:**
```
https://www.myswitzerland.com/de-de/erlebnisse/abfahrt-mit-dem-monstertrottinett/
```

**WebFetch analysis revealed new image service:**

**OLD (broken):**
```
https://www.myswitzerland.com/-/media/st/gadmin/images/sport/summer/various/monstertrottinett_78420.jpg?w=1200
```

**NEW (working):**
```
https://media.myswitzerland.com/image/fetch/c_limit,w_1200,h_800/f_auto,q_80,fl_keep_iptc/https://www.myswitzerland.com/-/media/st/gadmin/images/sport/summer/various/monstertrottinett_78420.jpg
```

**Key Change:** MySwitzerland now uses:
- **Domain:** `media.myswitzerland.com` (not `www.myswitzerland.com`)
- **Proxy Service:** Cloudinary image transformation API
- **Format:** `/image/fetch/[PARAMS]/[ORIGINAL_URL]`
- **Benefits:** Dynamic resizing, format optimization, IPTC metadata preservation

### Implementation

**File:** `/fix-myswitzerland-proxy.mjs`

```javascript
// Transform old URLs to new proxy format
const cleanUrl = oldUrl.split('?')[0]; // Remove ?w= params
const newUrl = `https://media.myswitzerland.com/image/fetch/c_limit,w_1200,h_800/f_auto,q_80,fl_keep_iptc/${cleanUrl}`;

// Update database
await supabase.from('events')
  .update({ image_url: newUrl })
  .eq('id', event.id);
```

**Cloudinary Parameters Used:**
- `c_limit,w_1200,h_800` - Limit dimensions to 1200x800 max
- `f_auto` - Auto format selection (WebP for modern browsers)
- `q_80` - Quality 80%
- `fl_keep_iptc` - Preserve IPTC metadata (copyright, author info)

**Results:**
- ✅ **868 events updated** (all MySwitzerland images)
- ✅ Images now load correctly in EventList1
- ✅ High quality maintained (1200px width)
- ✅ Auto format optimization (WebP where supported)

### Debugging Notes

**Initial Confusion:**
- User thought images were missing from database
- Actually: Database HAD images, but URLs were broken
- Browser showed placeholder images due to 406 errors

**Key Insight:**
> "weil ich hab 3 bei switzerland sachen gerade gegooglet und die haben alle ein wunderschönes bild!!!!!!!"

User correctly identified that MySwitzerland events SHOULD have images, leading to discovery that URLs were broken, not missing.

**Dev Server Issues During Session:**
- Multiple server crashes during debugging (infinite loop from console.logs)
- Port 8080 conflicts (server sometimes started on 8081)
- HMR (Hot Module Replacement) failures causing connection refused errors
- **Solution:** Kill all processes, clean restart: `pkill -9 -f "vite" && npm run dev`

### Future Considerations

**If MySwitzerland images break again:**

1. **Check if media proxy changed:**
   - Current: `media.myswitzerland.com`
   - Might change to CDN or different service

2. **Verify Cloudinary params still work:**
   - Test URL: `https://media.myswitzerland.com/image/fetch/c_limit,w_1200,h_800/f_auto,q_80,fl_keep_iptc/[IMAGE_URL]`
   - Try alternative params if broken

3. **Alternative: Self-host images:**
   - Download all MySwitzerland images
   - Upload to Supabase Storage
   - Update `image_url` to Supabase URLs
   - **Pro:** No external dependency
   - **Con:** Storage costs, manual updates

4. **Alternative: Google Places API:**
   - Many venues have Google Places photos
   - High quality user-uploaded images
   - Requires API key (costs after free tier)

### Testing Checklist

After any MySwitzerland URL changes:

- [ ] Check Network tab for 406 errors
- [ ] Verify images load in EventList1 (not placeholders)
- [ ] Test on actual MySwitzerland website
- [ ] Run: `node check-image-urls.mjs` to count broken URLs
- [ ] If broken: Check if media proxy domain changed
- [ ] Update all URLs with new format
- [ ] Verify in browser (Ctrl+Shift+R to clear cache)

### Files Modified

1. **Database:** 868 events updated with new image URLs
2. **Scripts created:**
   - `/check-image-urls.mjs` - Audit image URLs
   - `/fix-myswitzerland-proxy.mjs` - Bulk update URLs
   - `/test-single-image.mjs` - Test URL with different headers

**No code changes needed** - only database URLs updated.

---

## 🗺️ Map Event Loading Improvements (January 14, 2026)

### Issues Fixed

**1. Elite Events appearing outside viewport**
- **Problem:** Elite Events (Sternevents) showed up everywhere, even when zoomed into a specific region
- **Root Cause:** Elite Events were loaded from entire Switzerland without viewport filtering
  ```typescript
  // OLD (WRONG):
  supabase.from("events").select("*").eq("buzz_boost", 100).limit(20)
  // No latitude/longitude filters = whole Switzerland
  ```
- **Fix:** Added viewport bounds filtering to Elite Events query
  ```typescript
  // NEW (CORRECT):
  supabase.from("events")
    .select("*")
    .eq("buzz_boost", 100)
    .gte("latitude", paddedBounds.minLat)
    .lte("latitude", paddedBounds.maxLat)
    .gte("longitude", paddedBounds.minLng)
    .lte("longitude", paddedBounds.maxLng)
    .limit(20)
  ```
- **File:** `/src/components/EventsMap.tsx` (lines 259-268)
- **Result:** Elite Events now only show when actually in the visible map area

**2. Event marker images appearing too late**
- **Problem:** Circular event images only appeared at highest zoom level (zoom 13+)
- **User Request:** "kannst du das früher machen, damit man das schon so 4 schritte vorher sieht?"
- **Fix:** Reduced zoom threshold from **13 to 9** (4 steps earlier)
  ```typescript
  // OLD: if (currentZoom < 13)
  // NEW: if (currentZoom < 9)
  ```
- **File:** `/src/components/EventsMap.tsx` (line 541)
- **Result:** Users see event images much earlier when zooming in

### Current Issue - Event List Not Synced with Map

**Problem:** EventList1 shows different events than what's on the map
- Map shows viewport-based events
- But list still uses old "Performance Mode" (only Elite events)
- **Next fix needed:** Remove performance mode, sync list with map viewport

**How it should work:**
1. User zooms/pans map
2. Map loads events in viewport
3. List updates to show THE SAME events
4. User clicks event in list → map centers on that event
5. User clicks marker on map → list highlights that event

**Current flow (BROKEN):**
```
Map: Loads viewport events → EventsMap.tsx line 245-268
  ↓
  onEventsChange(mappedEvents) → passes to EventList1
  ↓
EventList1: Receives events BUT...
  ↓
  Performance mode overrides and only shows Elite events (line 228-242)
```

**Where the disconnect happens:**
- File: `/src/components/EventsMap.tsx`
- Line 228-242: Performance mode check
- Problem: `showOnlyEliteAndFavorites` flag causes EventList1 to ignore map events

**✅ FIXED - January 14, 2026:**
- ✅ Removed performance mode in EventList1 (always shows map events)
- ✅ List now displays events from `onEventsChange` callback
- ✅ Events match what's visible on map
- ✅ Removed viewport padding (was loading wrong regions)

### Image URL Discovery Process

**How we found the new MySwitzerland image format:**

1. **Initial observation:** 406 errors in browser console for all MySwitzerland images
2. **First hypothesis (WRONG):** `?w=1200` parameter causing issues
   - Tested: Removed parameter → still 406
3. **Second hypothesis (WRONG):** Missing HTTP headers
   - Tested: Added Referer, User-Agent → still 406
4. **User insight (KEY):** "hier auf der seite sehe ich das bild https://www.myswitzerland.com/de-de/erlebnisse/abfahrt-mit-dem-monstertrottinett/"
   - Image works on MySwitzerland website
   - But direct URL returns 406
   - **Conclusion:** MySwitzerland changed delivery method

5. **Discovery method:** Used `WebFetch` tool to analyze MySwitzerland webpage HTML
   ```
   WebFetch("https://www.myswitzerland.com/de-de/erlebnisse/abfahrt-mit-dem-monstertrottinett/")
   ```
   - Found: `https://media.myswitzerland.com/image/fetch/...`
   - New domain: `media.myswitzerland.com` (not `www.myswitzerland.com`)
   - Using Cloudinary proxy service

6. **Implementation:**
   - Created `/fix-myswitzerland-proxy.mjs` script
   - Bulk updated 868 event image URLs
   - Format: `https://media.myswitzerland.com/image/fetch/c_limit,w_1200,h_800/f_auto,q_80,fl_keep_iptc/[ORIGINAL_URL]`

**Key Lesson:** When external API URLs break, check if the service provider changed their CDN/proxy infrastructure. Don't just test parameters - analyze how they serve images on their own website.

---

## Viewport Event Filtering Fix (January 14, 2026)

### Problem
When zooming to Luzern on the map, the event list showed Zürich and other distant cities instead of Luzern events. Console showed 1011 events loaded (nearly entire Switzerland).

### Root Cause
Viewport padding was too large:
- **Original:** 100% padding (loading 3x viewport area)
- **First attempt:** 25% padding (still loading 1011 events)
- **Issue:** Even 25% padding on Switzerland's small geography loads entire country

### Solution - Remove Viewport Padding

**File:** `/src/components/EventsMap.tsx`

**Lines 216-236:** Removed all viewport padding
```typescript
// Before (WRONG - loaded 1011 events):
const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0.25;
const lngPadding = (bounds.getEast() - bounds.getWest()) * 0.25;

// After (CORRECT - loads only viewport):
const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0;
const lngPadding = (bounds.getEast() - bounds.getWest()) * 0;
```

### Debug Logging Added

**1. Viewport Bounds Logging (Lines 228-236):**
```typescript
console.log('🗺️ Viewport bounds:', {
  center: map.current.getCenter(),
  minLat: paddedBounds.minLat.toFixed(4),
  maxLat: paddedBounds.maxLat.toFixed(4),
  minLng: paddedBounds.minLng.toFixed(4),
  maxLng: paddedBounds.maxLng.toFixed(4),
  zoom: map.current.getZoom().toFixed(1)
});
```
Shows exact geographic bounds being queried.

**2. Event Location Verification (Lines 332-339):**
```typescript
console.log('📍 First 5 events loaded:', mappedEvents.slice(0, 5).map(e => ({
  title: e.title.substring(0, 40),
  location: e.location || e.address_city,
  lat: e.latitude?.toFixed(4),
  lng: e.longitude?.toFixed(4)
})));
```
Verifies events are from correct region.

### Result
- Zooming to Luzern now shows ONLY Luzern events
- Event count reduced from 1011 to region-appropriate number
- List and map are now synchronized
- Console logs allow verification of correct behavior

### Trade-offs
- **Pro:** Accurate region filtering, faster queries
- **Con:** No pre-loading of nearby events (may need to reload when panning)
- **Future:** Could add small padding (5-10%) back if panning UX needs improvement

---

## Event Card Hover → Map Marker Highlighting (January 14, 2026)

### Feature
When hovering over an event card in the list, the corresponding marker on the map highlights with orange color and scales up. This helps users understand which map location corresponds to each event.

### Implementation

**File:** `/src/pages/EventList1.tsx`

**Lines 393-397:** Added hover state
```typescript
const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

// In event list render:
<div
  key={event.id}
  onMouseEnter={() => setHoveredEventId(event.id)}
  onMouseLeave={() => setHoveredEventId(null)}
>
  <EventCard ... />
</div>
```

**Lines 571:** Passed to EventsMap
```typescript
<EventsMap
  hoveredEventId={hoveredEventId}
  onEventsChange={handleMapEventsChange}
  // ... other props
/>
```

**File:** `/src/components/EventsMap.tsx`

**Lines 542-569:** Marker styling based on hover state
```typescript
const isHovered = event.id === hoveredEventId;

// Small markers (zoom < 9):
inner.style.cssText = `
  width: ${isHovered ? '28px' : '20px'};
  height: ${isHovered ? '28px' : '20px'};
  background: ${isHovered ? '#e67e22' : '#5f6368'};
  border: 3px solid ${isHovered ? '#f39c12' : 'white'};
  box-shadow: ${isHovered ? '0 4px 12px rgba(230,126,34,0.6)' : '0 2px 6px rgba(0,0,0,0.3)'};
  transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
`;

// Large markers with images (zoom >= 9):
inner.style.cssText = `
  width: ${isHovered ? '56px' : '40px'};
  height: ${isHovered ? '56px' : '40px'};
  border: 3px solid ${isHovered ? '#f39c12' : '#D8CDB8'};
  box-shadow: ${isHovered ? '0 6px 20px rgba(230,126,34,0.5)' : '0 2px 8px rgba(0,0,0,0.2)'};
  transform: ${isHovered ? 'scale(1.3)' : 'scale(1)'};
`;
```

**Lines 506:** Added to `updateMarkers` dependencies
```typescript
useEffect(() => {
  updateMarkers();
}, [internalEvents, updateMarkers, hoveredEventId]); // hoveredEventId triggers re-render
```

### Visual Changes on Hover
- **Color:** Gray → Orange (#e67e22)
- **Border:** White → Golden (#f39c12)
- **Size:** Scales up 20-30%
- **Shadow:** Larger, more prominent with orange glow
- **Smooth transition:** CSS transitions for all properties

---

## Event Card Action Buttons (January 14, 2026)

### Feature Overview
Event cards in EventList1 have three action buttons: **Favorit (Heart)**, **Kalender (Calendar)**, and **Teilen (Share)**. All buttons work without requiring user login.

### Implementation

**File:** `/src/pages/EventList1.tsx`

#### 1. Favorit (Heart) Button
- **Functionality:** Toggle favorite status using localStorage
- **No login required:** Works for all users via `FavoritesContext`
- **Visual feedback:** Gray outline when not favorited, red filled when favorited
- **Location:** Lines 296-305

```tsx
<button onClick={(e) => {
  e.stopPropagation();
  onToggleFavorite(event);
}}>
  <Heart size={18} className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"} />
</button>
```

#### 2. Kalender (Calendar) Button
- **Functionality:** Export event to .ics calendar file
- **Hover tooltip:** "Im privaten Kalender speichern"
- **Format:** ICS (iCalendar) format compatible with all calendar apps
- **Location:** Lines 307-323, 386-429

```tsx
<button onClick={(e) => {
  e.stopPropagation();
  exportToCalendar(event);
}} className="group relative">
  <CalendarPlus size={18} className="text-gray-600" />
  {/* Tooltip */}
  <div className="hidden group-hover:block">
    Im privaten Kalender speichern
  </div>
</button>
```

**Calendar Export Function:**
- Creates .ics file with event details
- Includes: Title, description, location, start/end dates, URL
- Downloads automatically when clicked
- Shows success toast: "Event zu Kalender hinzugefügt!"

#### 3. Teilen (Share) Button with Popover ⚡ (Updated: January 14, 2026)
- **Functionality:** Professional Shadcn Popover component (copied from EventDetail.tsx)
- **Options:** **Link kopieren**, WhatsApp, E-Mail (3 options total)
- **Design:** Clean white Popover with `align="end"`, smooth animations
- **Close behavior:** Auto-closes on click outside (Popover component handles this)
- **Location:** Lines 347-416
- **No useRef needed:** Popover component manages its own state

**Share Popover Pattern (from EventDetail.tsx):**
```tsx
<Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
  <PopoverTrigger asChild>
    <button onClick={(e) => e.stopPropagation()}>
      <Share2 size={18} className="text-gray-600" />
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-56 p-2 bg-white shadow-lg border border-neutral-200" align="end">
    {/* Link kopieren */}
    <button onClick={async () => {
      await navigator.clipboard.writeText(eventUrl);
      toast("Link kopiert!", { duration: 2000 });
      setShowSharePopup(false);
    }}>
      <Copy size={18} className="text-neutral-500" />
      <span>Link kopieren</span>
    </button>

    {/* WhatsApp */}
    <a href={`https://wa.me/?text=...`} target="_blank">
      <svg>...</svg>
      <span>WhatsApp</span>
    </a>

    {/* E-Mail */}
    <a href={`mailto:?subject=...&body=...`}>
      <Mail size={18} className="text-neutral-500" />
      <span>E-Mail</span>
    </a>
  </PopoverContent>
</Popover>
```

**Key Features:**
1. **Link kopieren:** Uses Clipboard API, shows toast on success
2. **WhatsApp:** Opens wa.me with German text "Schau dir dieses Event an: [Title]"
3. **E-Mail:** Opens mailto with German subject/body
4. **Auto-close:** Popover closes when clicking anywhere outside
5. **Click propagation:** All buttons stop propagation to prevent card click

### Button Design Rules (Updated)
- ✅ **No borders** - simple icon buttons
- ✅ **No backgrounds** - clean minimal design
- ✅ **Favorit hover:** `hover:scale-110` with smooth transition (duration-200)
- ✅ **Other buttons hover:** `opacity-70`
- ✅ **Icon sizes:**
  - Heart: 19px (slightly larger for better visibility)
  - Calendar, Share: 18px
- ✅ **Icon colors:**
  - Favorited: `fill-red-600 text-red-600` (darker red: #DC2626)
  - Not favorited: `text-gray-600`
- ✅ **Spacing:** 20px gap between buttons (`gap-5`)
- ✅ **Left-aligned** - near star rating, not right-aligned

### Popover Design
- **Component:** Shadcn UI Popover (from `@/components/ui/popover`)
- **Width:** 224px (w-56)
- **Padding:** 8px (p-2)
- **Alignment:** `align="end"` (right-aligned with trigger)
- **Border:** `border-neutral-200`
- **Shadow:** `shadow-lg`
- **Item padding:** `px-3 py-2.5` with `rounded-lg` hover states
- **Hover background:** `hover:bg-neutral-100`

### User Requirements Met
1. ✅ Share button opens professional Popover (from EventDetail.tsx)
2. ✅ Popover contains 3 options: Link kopieren, WhatsApp, E-Mail
3. ✅ Favorites work without login (uses localStorage)
4. ✅ Calendar has hover tooltip
5. ✅ All buttons use simple minimal design (no borders/backgrounds)
6. ✅ Favorit heart is darker red (#DC2626) and scales up on hover

### Also Used In
The same share functionality is also implemented in:
- **EventDetailModal.tsx** - Full event detail popup (lines 114-169)
- Uses same WhatsApp and E-Mail sharing logic
- Includes Favorit and Calendar buttons as well

---

## EventList1 - Favorites Implementation Reference

### ⚠️ Original Source
The favorites functionality in EventList1 is copied from `/src/pages/ListingsOriginal.tsx` (lines 780-819).

**Reference File:** `/src/pages/ListingsOriginal.tsx`
- ⚠️ **READ-ONLY** - Do not modify or import in production code
- Contains working favorites implementation from original "Alle Events" page
- Last saved: January 14, 2026
- Purpose: Reference for copying patterns to other pages

### Implementation Pattern (3-Step Process)

**Location:** `/src/pages/EventList1.tsx` lines 492-528

The favorites implementation follows a strict 3-step pattern:

1. **localStorage Update:** Via `useFavorites().toggleFavorite()`
   - Updates immediately in browser localStorage
   - Works for ALL users (no login required)
   - Syncs across all pages

2. **Toast Notification:** Only when ADDING favorite (not removing)
   - Shows: "Event geplant ✨"
   - Duration: 2000ms (2 seconds)
   - Does NOT show when removing from favorites

3. **Database Sync:** Via `toggleFavoriteApi()` to update `favorite_count`
   - Updates database `events.favorite_count` column
   - Updates local state with new count
   - Error handling: Catches API errors without breaking UX

### Code Implementation

```typescript
const handleToggleFavorite = useCallback(async (event: Event) => {
  const wasFavorite = isFavorited(event.id);
  const locationName = getEventLocation(event);

  // STEP 1: Update localStorage via FavoritesContext
  const favoriteData = {
    id: event.id,
    slug: event.external_id || event.id,
    title: event.title,
    venue: event.venue_name || "",
    image: event.image_url || getPlaceholderImage(0),
    location: locationName,
    date: event.start_date || "",
  };

  toggleFavorite(favoriteData);

  // STEP 2: Show toast ONLY when adding to favorites
  if (!wasFavorite) {
    toast("Event geplant ✨", { duration: 2000 });
  }

  // STEP 3: Update database favorite_count via API
  try {
    const numericId = parseInt(event.id, 10);
    if (!isNaN(numericId)) {
      const result = await toggleFavoriteApi(numericId);
      setEvents(prev => prev.map(e =>
        e.id === event.id
          ? { ...e, favorite_count: result.favoriteCount }
          : e
      ));
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}, [toggleFavorite, isFavorited]);
```

### Required Dependencies

**Imports:**
```typescript
import { useFavorites } from "@/contexts/FavoritesContext";
import { toggleFavoriteApi } from "@/services/favorites";
import { toast } from "sonner";
```

**Context Hooks:**
- `toggleFavorite()` - Updates localStorage
- `isFavorite()` - Checks if event is favorited
- `favorites` - Array of all favorited events

**Event Interface:**
```typescript
interface Event {
  id: string;
  external_id?: string;
  title: string;
  venue_name?: string;
  image_url?: string;
  start_date?: string;
  favorite_count?: number;  // ← Required for database sync
  // ... other fields
}
```

### NO Login Required

✅ Favorites work for ALL users via localStorage (FavoritesContext)
❌ No authentication checks
❌ No login prompts or warnings
✅ Data persists in browser localStorage
✅ Syncs with database for analytics (favorite_count)

### Testing Checklist

After implementation or changes:

1. **Click heart on EventList1 event card**
   - [x] Heart turns red immediately
   - [x] Toast appears: "Event geplant ✨"
   - [x] No error in console
   - [x] No login prompt/warning

2. **Click heart again (remove favorite)**
   - [x] Heart turns gray
   - [x] NO toast appears
   - [x] No error in console

3. **Refresh page**
   - [x] Favorited events still show red heart
   - [x] Non-favorited events show gray heart

4. **Check "Alle Events" page**
   - [x] Same events favorited there
   - [x] Favorites sync between pages

5. **Database Check (optional)**
   - [ ] `favorite_count` increments in events table
   - [ ] Check Supabase dashboard

### Files Using This Pattern

- `/src/pages/EventList1.tsx` - Event list page (lines 492-528)
- `/src/pages/ListingsOriginal.tsx` - Original reference (lines 780-819) **READ-ONLY**
- `/src/pages/Listings.tsx` - "Alle Events" page (production version)
- `/src/components/EventDetailModal.tsx` - Event detail modal (lines 78-94)

### Critical Notes

1. **DO NOT modify ListingsOriginal.tsx** - It's read-only reference
2. **Copy EXACT pattern** - Don't "improve" or change the 3-step logic
3. **Toast only on ADD** - Never show toast when removing favorites
4. **Error handling** - API errors should not break UX
5. **No login prompts** - Favorites work for everyone via localStorage

---

## 🔧 NPM / Vite Cache Problem Fix (January 15, 2026)

### Problem: "localhost refused to connect" + "Outdated Optimize Dep" Errors

**Symptome:**
- Localhost Seite lädt nicht: `ERR_CONNECTION_REFUSED`
- Console Fehler: `504 (Outdated Optimize Dep)`
- Files wie `react_jsx-dev-runtime.js` werden nicht geladen
- Vite Cache ist korrupt

**Ursache:**
- npm Dependencies werden während laufendem Dev Server aktualisiert
- `npm install` wird unterbrochen
- Vite Cache (`node_modules/.vite/`) wird korrupt
- React Version Konflikt: react-leaflet@5.0.0 braucht React 19, Projekt nutzt React 18

### Lösung (Step-by-Step)

**1. Server stoppen & Prozesse killen:**
```bash
lsof -ti:8080 | xargs kill -9 2>/dev/null
```

**2. Vite Cache löschen:**
```bash
rm -rf node_modules/.vite
```

**3. Dev Server neu starten:**
```bash
npm run dev
```

**Falls das nicht reicht (kompletter Reset):**
```bash
# Alle Ports freigeben
lsof -ti:5173,8080,8081 | xargs kill -9 2>/dev/null

# node_modules komplett löschen
rm -rf node_modules package-lock.json

# Dependencies neu installieren (mit --legacy-peer-deps wegen React Konflikt)
npm install --legacy-peer-deps

# Dev Server starten
npm run dev
```

### Wichtig

**IMMER `--legacy-peer-deps` verwenden:**
- Projekt nutzt React 18
- react-leaflet@5.0.0 braucht React 19
- Ohne `--legacy-peer-deps` schlägt `npm install` fehl

**Bei neuen Packages installieren:**
```bash
npm install <package-name> --legacy-peer-deps
```

### Quick Reference

| Problem | Command |
|---------|---------|
| "Outdated Optimize Dep" | `rm -rf node_modules/.vite && npm run dev` |
| "Connection refused" | `lsof -ti:8080 \| xargs kill -9 && npm run dev` |
| npm install fails | `npm install --legacy-peer-deps` |
| Komplett broken | Kompletter Reset (siehe oben) |

### Lüfter läuft permanent?

**Problem:** Zu viele Events (988+) werden auf einmal gerendert
**Lösung:** Siehe nächster Abschnitt "Performance Optimization"

---

## 🚀 EventList1 Performance Optimization (January 15, 2026)

### Problem: Lüfter läuft permanent bei 988 Events

**Ursache:**
- EventList1 rendert alle 988 Events gleichzeitig im DOM
- Jedes Event = 1 EventCard Component (Bild, Buttons, Text, Hover-Handler)
- 988 EventCards × ~200 DOM-Elemente = ~196.000 DOM-Elemente
- Browser muss alle im Memory halten → CPU-Last 40-60% → Lüfter läuft

**Skalierungsproblem:**
- Plan: Mehr Events sammeln (5000+)
- Mit aktueller Implementierung: Browser wird unbenutzbar

### Diskutierte Lösungen

#### Option 1: Infinite Scroll (wie Airbnb)
**Funktionsweise:**
- Initial: 30 Events
- Beim Scrollen: Automatisch +30, +30, +30...
- Map: Zeigt alle 988 Pins

**Vorteile:**
- ✅ Smooth UX, kein Button-Click nötig
- ✅ Skaliert gut

**Nachteile:**
- ❌ Performance-Problem kommt zurück nach 200+ Events geladen
- ❌ User der bis Event 500 scrollt hat dann 500 Events im DOM
- ⚠️ Liste zeigt nicht alle Map-Events

#### Option 2: "Mehr laden" Button mit 150er Limit (wie Google Maps früher)
**Funktionsweise:**
- Initial: 30 Events
- Button: "30 weitere laden"
- Maximum: 150 Events total
- Danach: "Nutze Filter um Events einzugrenzen"

**Vorteile:**
- ✅ Einfach zu implementieren
- ✅ Performance kontrollierbar

**Nachteile:**
- ❌ Hard-Limit bei 150 Events (User kann nicht alle Events sehen)
- ❌ Performance-Problem kommt zurück bei 150 Events
- ❌ User muss ständig klicken

#### Option 3: Virtual Scrolling (wie YouTube, Twitter)
**Funktionsweise:**
- Liste "weiß" von allen 988 Events
- Aber rendert nur die 20-30 sichtbaren im DOM
- Beim Scrollen: Alte Cards werden aus DOM entfernt, neue hinzugefügt
- Nutzt Library: `react-window`

**Vorteile:**
- ✅ Performance konstant, egal wie viele Events (100 oder 10.000)
- ✅ Keine Limits nötig
- ✅ Industry Standard

**Nachteile:**
- ❌ Alle EventCards müssen EXAKT gleiche Höhe haben (aktuell variabel)
- ❌ Hover-zu-Map Feature komplizierter
- ❌ 2-3h Implementation + Library lernen
- ❌ Testing-Aufwand

#### Option 4: Pure Pagination (wie Booking.com)
**Funktionsweise:**
- Seite 1: Events 1-30
- Button: "Nächste Seite"
- Seite 2: Events 31-60 (alte werden aus DOM entfernt)

**Vorteile:**
- ✅ Performance immer konstant (nur 30 Events im DOM)
- ✅ Keine Limits
- ✅ Einfach zu implementieren

**Nachteile:**
- ❌ User muss für jede 30 Events klicken (nicht smooth)
- ⚠️ Weniger smooth als Infinite Scroll

### ✅ Gewählte Lösung: Hybrid Pagination

**Best of both worlds: Option 1 + Option 4**

**Funktionsweise:**
```
User sieht: Event 1-30
↓ User scrollt runter
Auto-load: Event 31-60 (jetzt 60 im DOM)
↓ User scrollt weiter
Auto-load: Event 61-90 (jetzt 90 im DOM)
↓ User scrollt weiter
Auto-load: Event 91-120 (jetzt 120 im DOM)
↓ User scrollt zum Ende
Button erscheint: "Seite 2 laden (Event 121-240)"
↓ User klickt
DOM wird geleert, neue 120 Events laden
Smooth Scrolling für Events 121-240
```

**Vorteile:**
- ✅ Smooth Scrolling für erste 120 Events (kein Button-Spam)
- ✅ Performance gut (max 120 Events im DOM)
- ✅ Keine Limits (alle 988 Events erreichbar über ~8 Seiten)
- ✅ DOM wird bei Seiten-Wechsel geleert → Performance Reset
- ✅ Skaliert auf 10.000+ Events

**Map-Integration (Option A: Auto-Jump):**
- Map zeigt alle Pins (wie Google Maps)
- User klickt Map-Pin #345
- System findet: Event #345 ist auf Seite 3
- Liste springt automatisch zu Seite 3
- Event wird gehighlightet + smooth scroll

### Backup vor Implementation

**Commit:** `6748933` - "Backup before implementing pagination"

**Zurücksetzen falls etwas schief geht:**

```bash
# Option 1: Alles zurücksetzen
git reset --hard 6748933

# Option 2: Nur EventList1.tsx zurücksetzen
git checkout 6748933 -- src/pages/EventList1.tsx

# Option 3: Änderungen anschauen
git diff 6748933
```

### Implementation Plan

**Files zu ändern:**
1. `/src/pages/EventList1.tsx` - Pagination Logic hinzufügen

**Änderungen im Detail:**

1. **State Management:**
   ```tsx
   const [currentPage, setCurrentPage] = useState(1);
   const [displayedEventsCount, setDisplayedEventsCount] = useState(30);
   const EVENTS_PER_PAGE = 120; // Pro Seite max 120
   const SCROLL_LOAD_INCREMENT = 30; // Auto-load in 30er Schritten
   ```

2. **Scroll Detection (IntersectionObserver):**
   - Detect wenn User ans Ende der Liste scrollt
   - Auto-load +30 Events (bis max 120)
   - Danach: "Nächste Seite" Button zeigen

3. **Pagination Logic:**
   ```tsx
   const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
   const endIndex = startIndex + displayedEventsCount;
   const displayedEvents = filteredEvents.slice(startIndex, endIndex);
   ```

4. **Page Navigation:**
   - "Nächste Seite" Button
   - "Vorherige Seite" Button
   - Seiten-Nummer Anzeige: "Seite 2 von 9"

5. **Map Pin Click Handler:**
   ```tsx
   const handleMapPinClick = (eventId: string) => {
     const eventIndex = filteredEvents.findIndex(e => e.id === eventId);
     const targetPage = Math.ceil((eventIndex + 1) / EVENTS_PER_PAGE);
     if (targetPage !== currentPage) {
       setCurrentPage(targetPage);
       setDisplayedEventsCount(30); // Reset to initial
     }
     // Scroll to event in list
     scrollToEvent(eventId);
   };
   ```

6. **Pagination Controls UI:**
   ```tsx
   {displayedEventsCount >= EVENTS_PER_PAGE && hasNextPage && (
     <div className="pagination-controls">
       <button onClick={() => goToPage(currentPage + 1)}>
         Nächste Seite (Events {startIndex + 121}-{startIndex + 240})
       </button>
       <span>Seite {currentPage} von {totalPages}</span>
     </div>
   )}
   ```

**Erwartete Performance:**
- Initial Load: 30 Events (~6.000 DOM-Elemente) → Kein Lüfter
- Nach Scrolling: 120 Events (~24.000 DOM-Elemente) → Leichter Lüfter beim Scrollen
- Nach Seiten-Wechsel: Zurück auf 30 Events → Lüfter stoppt

**Testing Checklist:**
- [ ] Initial Load: 30 Events sichtbar
- [ ] Scroll Down: Auto-load 30 mehr (4x total = 120)
- [ ] "Nächste Seite" Button erscheint
- [ ] Click Button → DOM cleared, neue 120 Events
- [ ] Map Pin Click → Auto-jump zur richtigen Seite
- [ ] Hover Event Card → Map Marker highlighted
- [ ] "Vorherige Seite" funktioniert
- [ ] Filter ändern → Pagination reset
- [ ] Performance: Max 120 Events im DOM

---

## 📚 READ-ONLY Reference Files (NEVER MODIFY!)

### ⚠️ Purpose

These files contain **working code patterns** saved as permanent references. They should NEVER be modified, deleted, or imported into production code.

**Use Case:** When a feature breaks (like favorites not working), you can copy the exact working pattern from these reference files instead of trying to recreate it from memory.

### Reference Files List

#### 1. `/src/pages/ListingsOriginal.tsx`
- **Original Source:** "Alle Events" page (Listings.tsx)
- **Date Saved:** January 14, 2026
- **Purpose:** Working favorites implementation for event cards
- **Key Pattern:** Heart button with 3-step favorites logic (lines 780-819)
- **Used In:** EventList1.tsx (copied to lines 492-528)

**Pattern Includes:**
- localStorage update via `toggleFavorite()`
- Toast notification "Event geplant ✨" (only on add)
- Database sync via `toggleFavoriteApi()`
- Error handling

#### 2. `/src/pages/FavoritesOriginal.tsx`
- **Original Source:** Favorites page (Favorites.tsx)
- **Date Saved:** January 14, 2026
- **Purpose:** Working favorites page implementation
- **Key Pattern:** Simple localStorage-based heart button (lines 112-137)
- **Features:** Filter bar, masonry grid, empty state

**Pattern Includes:**
- Filter options (all, upcoming, recently-added, this-weekend)
- Masonry columns layout
- Heart button for removing favorites
- Empty state with "Explore Events" CTA

### When to Use Reference Files

**✅ Use when:**
- Heart button doesn't turn red when clicked
- Favorites not being saved to localStorage
- Toast notification not appearing
- Database sync failing
- Any other favorites-related bug

**How to Use:**
1. **Read** the reference file to understand the working pattern
2. **Identify** the specific pattern you need (e.g., heart button logic)
3. **Copy** the exact code from reference file
4. **Paste** into your broken file
5. **Verify** it works (test clicking heart button)

**❌ DO NOT:**
- Modify reference files
- Import reference files in production code
- Delete reference files
- Rename reference files
- Use reference files in `import` statements

### Verification Checklist

After copying a pattern from reference files:

**Favorites Pattern:**
- [ ] Heart button turns red when clicked
- [ ] Toast "Event geplant ✨" appears on add
- [ ] NO toast on remove
- [ ] Favorites persist after page refresh
- [ ] No console errors
- [ ] No login warnings

**Files Pattern:**
- [ ] Component renders without errors
- [ ] All features work as expected
- [ ] Code matches reference exactly (no "improvements")
- [ ] Documentation updated to reference source file

### Critical Warning

**🚨 NEVER DELETE THESE FILES 🚨**

These reference files are the ONLY permanent record of working code patterns. If deleted, you will have to recreate features from scratch when they break.

**If Accidentally Modified:**
1. Check git history: `git log --oneline -- src/pages/ListingsOriginal.tsx`
2. Find commit from January 14, 2026
3. Restore: `git checkout <commit-hash> -- src/pages/ListingsOriginal.tsx`
4. Verify header comment is intact

**Header Comment Format:**
```typescript
// ⚠️ READ-ONLY REFERENCE FILE ⚠️
// This is the ORIGINAL [Page Name] saved as reference
// DO NOT MODIFY OR USE IN PRODUCTION - Only for copying patterns to other pages
// Last saved: January 14, 2026
```

### Documentation Policy

When copying a pattern from reference files to production code:

1. **Document in README** (this file)
   - Add section describing what was copied
   - Reference source file and line numbers
   - Explain 3-step pattern or key features
   - Add testing checklist

2. **Add Code Comments** in production file
   - Mark where pattern starts/ends
   - Reference original source
   - Explain each step clearly

3. **Update Plan File** (if applicable)
   - Mark task as complete
   - Reference documentation location
   - Note any deviations from original

---

## 🔧 CRITICAL: Tooltip Opacity Fix (January 15, 2026)

### Problem: Tooltips Appearing Transparent

**Symptom:** Custom tooltips with `bg-white` or `bg-[#ffffff]` appear transparent, making text unreadable. Only some tooltips work while others with identical code don't.

### Root Cause: CSS Opacity Inheritance

**THE PROBLEM:** Parent button with `hover:opacity-70` causes ALL child elements (including tooltips) to become 70% transparent, regardless of their own `background-color` settings.

```tsx
// BROKEN - Tooltip appears transparent:
<button className="hover:opacity-70 transition-opacity">
  <CalendarPlus size={18} />
  <div className="bg-[#ffffff]">Tooltip text</div>  {/* ← 70% transparent! */}
</button>

// WORKS - Tooltip stays opaque:
<button className="hover:scale-110 transition-all duration-200">
  <Heart size={19} />
  <div className="bg-[#ffffff]">Tooltip text</div>  {/* ← 100% opaque */}
</button>
```

**Why This Happens:**
- CSS `opacity` property applies to the **entire element tree**
- When `opacity: 0.7` is set on parent, ALL children inherit 70% transparency
- Child's `background-color` is rendered AFTER parent's opacity is applied
- Result: `bg-[#ffffff]` becomes rgba(255,255,255,0.7) automatically

### Solution: Use Non-Opacity Hover Effects

**✅ Working Hover Effects:**
```tsx
// Scale animation (preferred)
className="hover:scale-110 transition-all duration-200"

// Color change
className="hover:bg-gray-50 transition-colors"

// Border animation
className="hover:border-blue-500 transition-colors"

// Shadow
className="hover:shadow-lg transition-shadow"
```

**❌ Avoid When Using Tooltips:**
```tsx
// These break child tooltips:
className="hover:opacity-70"
className="hover:opacity-80"
className="hover:opacity-90"
```

### Implementation Pattern (EventList1.tsx)

**Location:** `/src/pages/EventList1.tsx` lines 302-466

**All 5 buttons now use `hover:scale-110`:**
```tsx
// Heart button (line 302)
<button className="group/heart relative p-1.5 hover:scale-110 transition-all duration-200">
  <Heart size={19} />
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 ... group-hover/heart:block">
    <div className="bg-[#ffffff] ...">Tooltip</div>
  </div>
</button>

// Calendar button (line 323)
<button className="group/calendar relative p-1.5 hover:scale-110 transition-all duration-200">
  {/* Same pattern */}
</button>

// Share button (line 342)
<button className="group/share relative p-1.5 hover:scale-110 transition-all duration-200">
  {/* Same pattern */}
</button>

// Sparkles button (line 426)
<button className="group/similar relative p-1.5 hover:scale-110 transition-all duration-200">
  {/* Same pattern */}
</button>

// MapPin button (line 454)
<button className="group/nearby relative p-1.5 hover:scale-110 transition-all duration-200">
  {/* Same pattern */}
</button>
```

### Key Principles

1. **Never mix `hover:opacity-X` with child tooltips**
   - Parent opacity ALWAYS affects children
   - No way to override with child CSS
   - Background-color, z-index, position don't matter

2. **Use `hover:scale-110` for icon buttons**
   - Provides visual feedback
   - Doesn't affect child opacity
   - Smooth with `transition-all duration-200`

3. **Test all tooltips after hard refresh**
   - Ctrl+Shift+R to clear browser cache
   - Hover each button to verify solid white background
   - Check that text is fully readable

### Common Mistakes to Avoid

**❌ "Just increase opacity to 99%"**
- Problem: Still applies opacity to children
- `hover:opacity-99` = all children at 99% too

**❌ "Use z-index to fix"**
- Problem: z-index doesn't affect opacity inheritance
- Tooltips will still be transparent

**❌ "Use !important in CSS"**
- Problem: Parent opacity is applied at render level
- CSS specificity can't override it

**❌ "Use rgba() instead of bg-white"**
- Problem: Parent opacity still applies afterward
- `rgba(255,255,255,1)` becomes `rgba(255,255,255,0.7)` with parent `opacity:0.7`

### Why This Took So Long to Find

1. **All tooltips had identical code** - made it seem like a Tailwind bug
2. **Heart button worked fine** - suggested background-color was the issue
3. **Hard refreshes didn't help** - CSS was actually working correctly
4. **Root cause was parent hover state** - not visible when inspecting tooltip element
5. **Only discovered by comparing working vs broken buttons** - Heart used `hover:scale-110`, others used `hover:opacity-70`

### Testing Checklist

After implementing hover effect changes:

- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Hover each button and verify tooltip is solid white
- [ ] Text should be fully readable (no transparency)
- [ ] No background content visible through tooltip
- [ ] All buttons have same hover behavior
- [ ] No console errors

### Files Affected

- `/src/pages/EventList1.tsx` - All 5 action buttons (lines 302-466)
- `/Users/jj/.claude/plans/cryptic-puzzling-kitten.md` - Implementation plan

### Future Reference

**If tooltips appear transparent again:**
1. Check parent button className for `hover:opacity-*`
2. Replace with `hover:scale-110 transition-all duration-200`
3. Hard refresh browser to test
4. Verify all tooltips work, not just one

**This is a CSS fundamentals issue, not a React/Tailwind bug.**

---

## 🔧 Git Repository Recovery & EventList1 Modal Implementation (January 17, 2026)

### Problem: Corrupted Git Repository + iCloud Sync Issues

**Situation discovered:**
- User reported project "missing" from Desktop after attempting to move it
- Project was found in `/Users/jj/Development/eventbuzzer-homepage/` (not `/Developer/`)
- Git repository was corrupted - `git status` failed with "fatal: mmap failed: Operation timed out"
- Last GitHub commit: January 13, 2026
- Local changes from January 14-16 were not pushed to GitHub

**Root Cause:**
- iCloud was attempting to sync files during git operations
- Corrupted git index and object files
- macOS moved project to `/Development/` instead of `/Developer/` during user's manual move attempt

### Solution Applied

**1. Backup Created:**
```bash
# Backup 1: Changed files from Jan 14-16
/Users/jj/Desktop/eventbuzzer-backup-20260116-2121/
- README.md (67KB - extensive documentation)
- EventList1.tsx (55KB - major improvements)
- check-supabase.js (new utility)

# Backup 2: Full corrupted repository
/Users/jj/Development/eventbuzzer-homepage-KORRUPT-backup/ (213MB)
- Complete project with all 222 files
- Includes newer EventsMap.tsx (37KB, Jan 14) with Supercluster implementation
```

**2. Git Repository Rebuilt:**
```bash
# Fresh clone from GitHub
git clone https://github.com/Matrixx12345/eventbuzzer-homepage.git

# Restored missing files from KORRUPT backup:
- EventsMap.tsx (1077 lines) - Supercluster, zoom-based markers, Google Maps style
- ChatbotPopupRight.tsx - Missing from GitHub
- map.ts - Updated type definitions
- FavoritesContext.tsx - Newer version
- EventDetailModal.tsx - Newer version
- Navbar.tsx - Newer version
- Listings.tsx - Newer Map integration
- index.css - Fixed @import order (must precede @tailwind)

# Committed and pushed to GitHub
git commit -m "Restore work from Jan 16 - EventList1 improvements + README updates"
git push origin main
```

**3. Dependencies Fixed:**
```bash
# Activated nvm (node/npm were installed but not in PATH)
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

# Installed dependencies
npm install --legacy-peer-deps
# (Required due to React 18/19 peer dependency conflict with react-leaflet)
```

### EventList1 - Modal Implementation (January 17, 2026)

**Problem:** Events opened in new page with `navigate()`, losing filter state and poor UX.

**Solution:** Implemented EventDetailModal popup instead.

**Changes Made:**

**File:** `/src/pages/EventList1.tsx`

**1. Import EventDetailModal:**
```typescript
import EventDetailModal from "@/components/EventDetailModal";
```

**2. Add Modal State (lines 620-622):**
```typescript
// Event Detail Modal State
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

**3. Change onClick Handler (lines 1092-1095):**
```typescript
// OLD - navigated to new page:
onClick={(event) => navigate(`/event/${event.external_id || event.id}`)}

// NEW - opens modal:
onClick={(event) => {
  setSelectedEvent(event);
  setIsModalOpen(true);
}}
```

**4. Render Modal (lines 1327-1337):**
```typescript
{/* Event Detail Modal */}
{selectedEvent && (
  <EventDetailModal
    event={selectedEvent}
    isOpen={isModalOpen}
    onClose={() => {
      setIsModalOpen(false);
      setSelectedEvent(null);
    }}
  />
)}
```

**Benefits:**
- ✅ Filter state preserved (no page navigation)
- ✅ Better UX - overlay modal, can close and return to exact scroll position
- ✅ SEO intact - event pages still exist at `/event/:id` for direct access
- ✅ Faster interaction - no page reload

### Features Already Implemented (Just Needed Browser Refresh)

**All features were already in code but not visible due to browser caching:**

**1. Star Ratings (EventList1.tsx lines 299-302):**
```typescript
<div className="flex items-center gap-1.5">
  <span className="text-yellow-400 text-lg">⭐</span>
  <span className="text-sm font-semibold text-gray-600">
    {rating.toFixed(1)}
  </span>
</div>
```

**2. Zoom Controls (EventsMap.tsx lines 1033-1061):**
- Position: `bottom-4 right-4` (bottom-right, not left!)
- Custom +/− buttons with Google Maps styling
- Only shown when `customControls={true}` prop is set

**3. Cluster Hover Highlighting (EventsMap.tsx lines 514-533):**
```typescript
// Check if hovered event is inside cluster
const hasHovered = clusterLeaves.some(leaf =>
  leaf.properties.event.id === hoveredEventId
);

// RED border when hovered
border: 3px solid ${hasHovered ? '#ef4444' : 'white'};
box-shadow: ${hasHovered ? '0 0 0 2px #ef4444' : '0 2px 6px rgba(0,0,0,0.3)'};
```

**4. Event Marker Hover Highlighting (EventsMap.tsx lines 567-603):**
- Small dots (zoom < 9): Scale to 28px with red border
- Event images (zoom >= 9): Scale to 56px with red border
- Smooth 0.3s transitions

**5. Filter Settings:**
All filters intact and functional:
- Category/Subcategory filter
- City + Radius filter (25km default)
- Date picker
- Time filter (heute, diese-woche, dieses-wochenende, naechste-woche, dieser-monat)
- Search (minimum 3 characters)
- Similar Events filter (Amazon-style)
- Nearby Events filter

### Testing Checklist

After recovery and implementation:

- [x] Git repository functions correctly
- [x] All files restored from backup
- [x] Dependencies installed
- [x] Dev server runs without errors
- [x] EventDetailModal opens on event click
- [x] Filter state preserved when closing modal
- [ ] Hard refresh browser (Cmd+Shift+R) to see all features
- [ ] Verify star ratings visible
- [ ] Verify zoom controls bottom-right
- [ ] Verify cluster red border on hover
- [ ] Verify event marker scaling on hover

### Important Notes

**Browser Caching:**
- Many features appear "missing" but are actually cached
- **SOLUTION:** Hard refresh with Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)
- Clear site data if issues persist: DevTools → Application → Clear Storage

**Backup Locations (Can delete after verification):**
```
/Users/jj/Desktop/eventbuzzer-backup-20260116-2121/
/Users/jj/Development/eventbuzzer-homepage-KORRUPT-backup/
```

**npm Peer Dependencies:**
- Always use `--legacy-peer-deps` flag when installing packages
- React 18 vs React 19 conflict with react-leaflet@5.0.0

---

## 🎨 UI Improvements & Bug Fixes (January 17, 2026 - Session 2)

### EventDetailModal - Share Button Consolidation

**Problem:** WhatsApp and Email buttons took too much space in modal.

**Solution:** Combined into single "Teilen" (Share) button with popover.

**Changes Made:**

**File:** `/src/components/EventDetailModal.tsx`

```typescript
// Added Share2 icon and Popover imports
import { Heart, CalendarPlus, Share2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Replaced two separate buttons with one Share button + popover
<Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
  <PopoverTrigger asChild>
    <button className="flex items-center gap-2 px-4 py-2...">
      <Share2 size={20} />
      <span>Teilen</span>
    </button>
  </PopoverTrigger>
  <PopoverContent>
    {/* WhatsApp & Email options */}
  </PopoverContent>
</Popover>
```

**Benefits:**
- ✅ Cleaner UI - one button instead of two
- ✅ Better mobile experience
- ✅ Consistent with EventList1 card share pattern

### EventsMap - Zoom Controls Visibility Fix

**Problem:** Zoom controls (+/−) not visible on map, especially on smaller/collapsed view.

**Root Cause:**
- z-index too low (z-10)
- Position too close to rounded borders (bottom-4 right-4)

**Solution:**

**File:** `/src/components/EventsMap.tsx` (line 1034)

```typescript
// BEFORE:
<div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">

// AFTER:
<div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
```

**Changes:**
- Increased z-index: `z-10` → `z-50` (ensures visibility above map elements)
- Increased spacing: `bottom-4 right-4` → `bottom-6 right-6` (prevents clipping by border-radius)

**Benefits:**
- ✅ Visible on both collapsed and expanded map
- ✅ No longer hidden behind other UI elements
- ✅ Better spacing from map edges

### EventList1 - Star Rating Visibility Fix

**Problem:** Star ratings not visible on event cards.

**Root Cause:** z-index overlap issue with other elements.

**Solution:**

**File:** `/src/pages/EventList1.tsx` (line 297)

```typescript
// Added relative z-10 to bottom row
<div className="flex items-center gap-5 relative z-10">
  {/* Star Rating */}
  <div className="flex items-center gap-1.5">
    <span className="text-yellow-400 text-lg">⭐</span>
    <span className="text-sm font-semibold text-gray-600">
      {rating.toFixed(1)}
    </span>
  </div>
```

**Benefits:**
- ✅ Stars visible on all event cards
- ✅ Proper layering with other card elements

### EventList1 - Chatbot Mini Interface Text Size

**Problem:** Text in chatbot pills under map too small to read (text-[10px], text-[11px]).

**Solution:**

**File:** `/src/pages/EventList1.tsx` (lines 1242-1310)

**Increased all text sizes:**
- Chatbot message: `text-xs` → `text-sm`
- Mission pills (Solo, Familie, Freunde, Zu zweit): `text-[10px]` → `text-xs`
- Input placeholder: `text-[11px]` → `text-xs`
- Submit button (✨): `text-[11px]` → `text-xs`

**Benefits:**
- ✅ Much better readability
- ✅ Consistent with rest of UI
- ✅ Better accessibility

### Summary of Changes

**Files Modified:**
1. `EventDetailModal.tsx` - Share button consolidation + default export fix
2. `EventsMap.tsx` - Zoom controls z-index & position fix
3. `EventList1.tsx` - Star ratings z-index fix + chatbot text size increase

**Key Improvements:**
- Better UI organization (share button)
- Fixed visibility issues (zoom controls, stars)
- Improved readability (chatbot text)
- Better mobile/responsive experience

**Testing:**
- [x] Share button opens popover with WhatsApp/Email
- [x] Zoom controls visible on both small and large map
- [ ] Star ratings visible on all event cards (requires browser refresh)
- [x] Chatbot text readable under collapsed map

---
