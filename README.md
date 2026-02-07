# EventBuzzer - Schweizer Event-Plattform

**URL**: https://lovable.dev/projects/5e1d1c73-9076-480b-bf8b-7c410acbf536

> **📚 Vollständige Dokumentation:** Die komplette README (3859 Zeilen) mit allen technischen Details, iCloud-Troubleshooting und Git-Historie findest du in [README.ARCHIVE.md](README.ARCHIVE.md)

## 🚀 Quick Start

```bash
cd /Users/jj/Development/eventbuzzer-homepage
npm install --legacy-peer-deps
npm run dev
```

Server läuft auf: http://localhost:8081

---

## 🆘 FALLBACK: Ideal State (2026-02-04)

**Falls die Website komplett kaputt ist und nichts geht**, zurück zu diesem stabilen Stand:

```bash
# Commit 4124f48 (2026-02-04) = IDEAL_STATE
# Alle neuen Features funktionieren, Design perfekt, keine Bugs

git reset --hard 4124f48
git push origin main --force  # Nur notfalls!
```

**Backup Location:**
- `/tmp/IDEAL_STATE_4124f48/` - kompletter src/ + supabase/ + config

**Was in 4124f48 funktioniert:**
- ✅ EventList1 Design (descriptions 2 Zeilen, icons perfekt positioniert)
- ✅ Map Größe korrekt (h-412px expanded, h-200px collapsed)
- ✅ Alle Filter + Kategorien
- ✅ EventDetail Modal
- ✅ Trip Planner Context
- ✅ Favorites

**Was NICHT in 4124f48 (noch nicht hinzugefügt):**
- ❌ Mobile Version (MobileTopDetailCard, ViewModeSwitcher)
- ❌ AdminPendingEvents Page
- ❌ PartnerUpload Form
- ❌ MobileBottomNav

Siehe Phase 3 unten wie man diese SAUBER hinzufügt ohne Design zu zerschießen.

---

## 🆘 FALLBACK: Ideal State 2 (2026-02-06) ⭐ **AKTUELL EMPFOHLEN**

**Desktop Event Cards Design PERFEKT wiederhergestellt + Alle Features!**

```bash
# Commit d301aa3 (2026-02-06) = IDEAL_STATE_2
# Desktop Design wie 4124f48 + Partner Upload + Admin Features

git reset --hard d301aa3
git push origin main --force  # Nur notfalls!
```

**Backup Location:**
- `/tmp/IDEAL_STATE_2_d301aa3/` - kompletter src/ mit IDEAL_STATE_2_INFO.md
- Siehe: `/tmp/IDEAL_STATE_2_d301aa3/IDEAL_STATE_2_INFO.md` für Details

**Was in d301aa3 funktioniert:**
- ✅ **Desktop Event Cards PERFEKT** (vom 4124f48, descriptions 2 Zeilen, icons perfect)
- ✅ Partner Event Upload Seite (`/partner`)
- ✅ Admin Pending Events (Navbar integration)
- ✅ Mobile Components (MobileBottomNav, MobileTopDetailCard, ViewModeSwitcher)
- ✅ Filter zeigt "Stimmung" (singular, nicht "jede Stimmung")
- ✅ Navbar mit "Event hochladen" Button
- ✅ Footer mit "Für Veranstalter" Sektion
- ✅ Trip Planner komplett funktional
- ✅ Build erfolgreich, keine Errors

**Unterschied zu IDEAL_STATE (4124f48):**
- Desktop Event Cards: **IDENTISCH** (exakt gleicher Code!)
- Zusätzlich: Partner/Admin Features + Mobile Components
- Keine Desktop-Design Regression!

**Wann verwenden:**
- ✅ Wenn Desktop Event Cards kaputt sind
- ✅ Wenn du alle Features + perfektes Desktop Design willst
- ✅ Als Basis für weitere Entwicklung

---

## ⚠️ CRITICAL: Supabase Client Usage

**ALWAYS use the correct Supabase client:**

### ✅ For Events Data - Use `externalSupabase`

```typescript
import { externalSupabase } from "@/integrations/supabase/externalClient";

// Query events
const { data } = await externalSupabase
  .from("events")
  .select("*")
  .order("buzz_score", { ascending: false });
```

### ✅ For User Auth/Profiles - Use `supabase`

```typescript
import { supabase } from "@/integrations/supabase/client";

// Auth operations
const { data: { user } } = await supabase.auth.getUser();

// Profiles
const { data } = await supabase.from("profiles").select("*");
```

### 🔑 Why Two Clients?

- **External DB (tfkiyvhfhvkejpljsnrk)** - Contains ALL events, favorites, user data
  - URL: `https://tfkiyvhfhvkejpljsnrk.supabase.co`
  - Tables: `events`, `favorites`, `profiles`, `event_vibe_overrides`
  - Used by: Event pages, category pages, EventList, EventDetail

- **Lovable Cloud (phlhbbjeqabjhkkyennz)** - Minimal backup for user profiles only
  - URL: `https://phlhbbjeqabjhkkyennz.supabase.co`
  - Tables: `profiles` only (rest empty)
  - Rarely used - mostly for Lovable Cloud compatibility

### ❌ Common Mistake

```typescript
// WRONG - events table doesn't exist in Lovable Cloud!
import { supabase } from "@/integrations/supabase/client";
const { data } = await supabase.from("events").select("*"); // ❌ Error!

// CORRECT
import { externalSupabase } from "@/integrations/supabase/externalClient";
const { data } = await externalSupabase.from("events").select("*"); // ✅
```

---

## ⚠️ React Performance & Render Loop Detection

**WICHTIG:** Render Loops sind schwer zu debuggen. Wenn der **Lüfter ständig läuft** oder die **CPU hoch ist**, überprüfe IMMER diese Patterns:

### 🔴 Häufige Fehler

#### 1. **Array/Object References in Dependencies**
```tsx
// ❌ FALSCH - Neues Array wird jedem Render erstellt!
const currentDayEvents = plannedEventsByDay[activeDay] || [];

const handler = useCallback(() => {
  // ...
}, [currentDayEvents]); // currentDayEvents ändert sich IMMER!
```

**Problem:** `currentDayEvents` ist ein neuer Array jedes Render → Dependency ändert sich → Handler wird neu erstellt → Re-render → Loop! ♻️

**✅ LÖSUNG: useMemo verwenden**
```tsx
// ✅ RICHTIG - Array wird nur neu erstellt wenn nötig
const currentDayEvents = useMemo(
  () => plannedEventsByDay[activeDay] || [],
  [plannedEventsByDay, activeDay]
);

const handler = useCallback(() => {
  // ...
}, [currentDayEvents]); // Jetzt stabil!
```

#### 2. **State Updates in Effects ohne Dependencies**
```tsx
// ❌ FALSCH - useEffect ohne Dependencies
useEffect(() => {
  setState(something);
}); // Triggert nach JEDEM Render!
```

**✅ RICHTIG:**
```tsx
useEffect(() => {
  setState(something);
}, [dependency]); // Mit expliziten Dependencies!
```

#### 3. **setState in useCallback ohne Memoization**
```tsx
// ❌ FALSCH
const moveEvent = useCallback((index) => {
  const newArray = [...currentDayEvents]; // Neue Reference!
  setPlannedEventsByDay(updated);
}, [currentDayEvents]); // Neue Dependency jedes Render!
```

#### 4. **Inline Objects/Arrays in Props**
```tsx
// ❌ FALSCH
<Component data={{ foo: 'bar' }} /> // Neues Object jedem Render!

// ✅ RICHTIG
const data = useMemo(() => ({ foo: 'bar' }), []);
<Component data={data} />
```

### 🔍 Debugging Checklist

Wenn **Lüfter läuft / CPU hoch**:

1. **Browser DevTools → Performance Tab:**
   - Recording für 5 Sekunden starten
   - Schauen welche Komponenten ständig re-rendern

2. **Console auf Warnings checken:**
   - "Too many re-renders"
   - "Nested button" Warnings (HTML-Nesting Fehler)

3. **Code Review für diese Patterns:**
   ```tsx
   // useCallback mit Array/Object Dependency
   const myHandler = useCallback(() => {
     // ...
   }, [data || []]); // ← Array wird neu erstellt!

   // Array/Object ohne useMemo in Dependencies
   const items = someState.items || [];
   useEffect(() => {
     // ...
   }, [items]); // ← items ändert sich immer!
   ```

4. **Vite Dev Server neustarten:**
   ```bash
   Ctrl+C
   npm run dev
   ```

5. **Browser Cache löschen:**
   - DevTools → Application → Clear site data
   - Hard Refresh (Cmd+Shift+R)

### ✅ Best Practices für dieses Projekt

**TripPlannerModal.tsx Pattern:**
```tsx
// 1. Import useMemo
import React, { useState, useCallback, useRef, useMemo } from 'react';

// 2. Memoize any derived state
const currentDayEvents = useMemo(
  () => plannedEventsByDay[activeDay] || [],
  [plannedEventsByDay, activeDay]
);

// 3. useCallback mit stabilen Dependencies
const handleMove = useCallback((index) => {
  const updated = { ...plannedEventsByDay, [activeDay]: newEvents };
  setPlannedEventsByDay(updated);
}, [plannedEventsByDay, activeDay, setPlannedEventsByDay]);
```

---

## 📁 Projekt-Struktur

```
src/
├── pages/
│   ├── Index.tsx              # Startseite mit Event-Sektionen
│   ├── EventList1.tsx         # Events-Liste mit Karte
│   ├── EventDetail.tsx        # Event-Detailseite
│   └── TripPlanner.tsx        # Trip-Planner
├── components/
│   ├── CleanGridSection.tsx   # Karussell (3 Events)
│   ├── SideBySideSection.tsx  # 2x2 Grid
│   ├── EliteExperiencesSection.tsx  # Elite Events
│   ├── EventsMap.tsx          # Leaflet-Karte
│   ├── GoogleAnalytics.tsx    # GA4 Tracking
│   └── backups/               # Design-Backups
│       └── SimilarEventCard-v1.tsx  # Nearby Events Card (Jan 2026)
└── integrations/supabase/
    ├── externalClient.ts      # External DB (Events)
    └── client.ts              # Lovable Cloud (User data)
```

## 🗄️ Datenbanken

⚠️ **WICHTIG: Zwei separate Supabase-Projekte!**

**1. Haupt-Supabase (ALLE Daten):**
- **Projekt-ID**: `tfkiyvhfhvkejpljsnrk` ← DEIN Haupt-Projekt
- **URL**: `https://tfkiyvhfhvkejpljsnrk.supabase.co`
- **Verwendung**: Events, User Auth, Profiles, Favorites, Edge Functions
- **Tabellen**: `events`, `profiles`, `favorites`, `event_vibe_overrides`
- **Clients**:
  - `src/integrations/supabase/client.ts` (Auth/User-Daten, nutzt `.env`)
  - `src/integrations/supabase/externalClient.ts` (Events, hardcoded)

**2. Lovable Cloud (nur Backup/Profiles):**
- **Projekt-ID**: `phlhbbjeqabjhkkyennz`
- **URL**: `https://phlhbbjeqabjhkkyennz.supabase.co`
- **Verwendung**: Lovable Cloud Projekt (minimal verwendet)
- **Tabellen**: nur `profiles` (rest leer)

## 🔑 Admin Pages

```
/admin-upload          # Event-Bilder hochladen, Ratings
/admin/ratings         # Event-Bewertungen
/admin/speed-tagging   # Bulk-Tagging
/admin/buzz-boost      # Buzz-Scores anpassen
/admin/chatbot         # Chatbot testen
```

Noch keine Authentifizierung - öffentlich zugänglich.

## 🎨 SEO Optimierungen (für GetYourGuide Affiliate)

✅ **Implementiert** (alle 6 Punkte):

1. **Schema.org JSON-LD** - Event-Schema auf jeder Event-Detailseite
2. **Dynamic Meta Tags** - `react-helmet-async` für Title/Description
3. **Sitemap.xml** - Generator-Script mit 1000+ Events
4. **Image Optimization** - `vite-plugin-image-optimizer` (WebP)
5. **Google Analytics** - GA4 Tracking + Custom Events
6. **Lazy Loading** - `loading="lazy"` auf allen Bildern

### Sitemap & SEO-Friendly Event URLs generieren

```bash
node scripts/generate-sitemap-chunked.mjs
```

Erstellt:
- `public/sitemap-index.xml` - Index aller Sitemaps
- `public/sitemap-events-*.xml` - Event-Sitemaps (bis 500 URLs pro Datei)
- `public/sitemap-categories.xml` - Kategorieseiten
- `public/sitemap-city-categories*.xml` - Stadt × Kategorie Kombinationen
- `public/event-slug-mapping.json` - Mapping SEO-Slugs → external_ids

#### SEO-Friendly Slug System

**Problem gelöst:** Google konnte Event-URLs nicht indexieren, weil die Sitemaps UUID-basierte oder `manual_` Präfix-URLs mit Slugs generiert haben, die nicht auflösbar waren.

**Lösung:** SEO-friendly Slugs aus Event-Titel + Stadt kombinieren:
- `museum-tinguely` statt `mys_attr_ee786c45-3bd6-490f-8951-bcf4a3a61213`
- `olympisches-museum-lausanne` statt `manual_olympic_museum`
- Diese URLs sind Google-freundlich und einprägsam

**Wie es funktioniert:**

1. **Sitemap-Generator** (`scripts/generate-sitemap-chunked.mjs`):
   - Fetcht alle Events aus Supabase
   - Generiert SEO-Slug: `generateEventSlug(title, city)` → "museum-tinguely"
   - Erstellt Mapping: `"museum-tinguely" → "manual_tinguely"` (external_id)
   - Schreibt `public/event-slug-mapping.json`
   - Generiert Sitemaps mit SEO-Slugs

2. **EventDetail.tsx** (`src/pages/EventDetail.tsx`):
   - Lädt `event-slug-mapping.json`
   - Resolves SEO-Slug → external_id
   - Queries Supabase mit korrektem external_id
   - Fallback-Kette:
     1. SEO-Slug aus Mapping
     2. Direct external_id query
     3. ID-Basis query

3. **Beispiel-Mapping** (`public/event-slug-mapping.json`):
```json
{
  "museum-tinguely": "manual_tinguely",
  "olympisches-museum-lausanne": "manual_olympic_museum",
  "kunstmuseum-basel": "manual_kunstmuseum_basel"
}
```

**Nach Änderungen:**
```bash
# 1. Neuen SEO-Slug-Mapping generieren
node scripts/generate-sitemap-chunked.mjs

# 2. Commiten
git add public/sitemap-*.xml public/event-slug-mapping.json
git commit -m "Update sitemaps with SEO-friendly slugs"

# 3. In Google Search Console einreichen
# URL: https://eventbuzzer.ch/sitemap-index.xml
```

**Wichtig für Google Search Console:**
- Submission URL: `https://eventbuzzer.ch/sitemap-index.xml` (NOT individual sitemaps)
- Alle Events sind jetzt mit SEO-Slugs indexierbar
- Google wird URLs wie `/event/museum-tinguely` crawlen

### Google Analytics Setup

1. GA4 Measurement ID holen: https://analytics.google.com/
2. In `.env` eintragen:
   ```
   VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```
3. Rebuild: `npm run build`

## 🚀 Deployment (Vercel)

**Live-URL:** https://eventbuzzer.ch
**Vercel-Projekt:** eventbuzzer-homepage
**Branch:** `main` (auto-deploy bei Git Push)

### Deployment-Workflow

1. Änderungen committen und pushen:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. Vercel baut automatisch und deployed (1-2 Minuten)
3. Änderungen sind live auf eventbuzzer.ch

### Vercel Environment Variables

In Vercel Dashboard konfiguriert:
- `VITE_GA_MEASUREMENT_ID` - Google Analytics ID
- `VITE_SUPABASE_URL` - Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase Public Key

## 🎯 Vor Ticket-Affiliate-Bewerbung TODO

**Status:** Fast fertig - nur noch Google-Setup fehlt

### ✅ Bereits erledigt:
- ✅ SEO-Optimierungen (Schema.org, Meta Tags, Lazy Loading)
- ✅ Google Analytics implementiert
- ✅ Sitemap-Generator vorhanden
- ✅ Production-Build funktioniert
- ✅ Vercel-Deployment aktiv

### ⚠️ Noch zu erledigen:

1. **Google Search Console einrichten** (15 Minuten)
   - Website bei https://search.google.com/search-console hinzufügen
   - Ownership verifizieren (DNS oder HTML-Tag)
   - Sitemap einreichen: `https://eventbuzzer.ch/sitemap.xml`
   - 24-48h warten für Indexierung

2. **Google Analytics verifizieren** (5 Minuten)
   - GA4 Measurement ID in Vercel Environment Variables prüfen
   - Live-Daten checken in GA4 Dashboard
   - Custom Events testen (Event-Klicks, Favoriten)

3. **Finale Sitemap-Generation** (2 Minuten)
   ```bash
   node scripts/generate-sitemap.mjs
   git add public/sitemap.xml
   git commit -m "Update sitemap"
   git push
   ```

4. **Bei Ticket-Service bewerben** (GetYourGuide, Ticketcorner, etc.)
   - URL: eventbuzzer.ch
   - Traffic: ~X Besucher/Monat (nach 1 Monat)
   - Google Analytics Screenshot als Beweis

**Geschätzte Zeit:** ~30 Minuten + 24h Wartezeit für Google

**Erwartete Approval-Chance:** 95%+ (alle SEO-Anforderungen erfüllt)

## 🛠️ Wichtige Commands

```bash
# Development
npm run dev                    # Dev-Server (Port 8081)
npm run build                  # Production Build

# Sitemap
node scripts/generate-sitemap.mjs

# Dependencies (mit legacy-peer-deps wegen react-leaflet)
npm install --legacy-peer-deps
```

## 📝 Wichtige Notizen

- **Projekt-Pfad**: `/Users/jj/Development/eventbuzzer-homepage`
- **Port**: 8081 (8080 bereits belegt)
- **React Version**: 18 (react-leaflet braucht 19, daher `--legacy-peer-deps`)
- **External DB**: Read-only, keine direkten Writes
- **Chatbot**: Verschoben von Startseite zu `/admin/chatbot`
- **Code-Sharing**: Längerer Code IMMER direkt im Chat/Zwischenspeicher teilen, NICHT als Code-Block-Link (pb code o.ä.) - die funktionieren oft nicht!

## 📚 Alte README

Vollständige Dokumentation (3859 Zeilen) archiviert in:
```
README.ARCHIVE.md
```

Enthält: iCloud-Issues, CPU-Probleme, komplette Git-Historie, alte Troubleshooting-Guides.

---

## 🔍 SEO Session Notes (Januar 26, 2026)

### ✅ Komplett gelöst (CRITICAL):
1. **Sitemap-Diskrepanz**: 454 fehlende Events behoben
   - Problem: Supabase default 1000 row limit
   - Lösung: Pagination in `scripts/generate-sitemap.mjs` implementiert
   - Resultat: Alle 1454 Events jetzt in sitemap.xml

2. **Meta Tags fehlen**: 7 Seiten komplett ohne SEO Tags
   - Helmet zu Favorites, Listings, Profile, TripPlanner, TripPlanerNew hinzugefügt
   - H1 Tags zu Listings & EventList1 hinzugefügt
   - Event counts aktualisiert (900 → 1400)

3. **Admin-Seiten sichtbar**: Google hätte interne Tools indexiert
   - `noindex, nofollow` zu allen Admin-Seiten hinzugefügt:
     - SupabaseTest, AdminUpload, AdminRatings, AdminSpeedTagging
     - AdminBuzzBoost, AdminChatbot, Auth.tsx
   - robots.txt: `/admin-upload` blockiert

4. **Duplicate Content**: EventList1 vs EventsNew identisch
   - EventsNew auf `noindex` gesetzt (ist Prototyp-Seite)
   - EventList1 ist Haupt-Events-Seite

5. **Share Buttons**: Modal hatte keine "Link kopieren" Funktion
   - EventDetailModal updated mit Copy/WhatsApp/Email
   - Identisch zu EventDetail.tsx styling

### ⚠️ Noch offen (HIGH Priority):
- Canonical URLs zu allen Event Detail Pages fehlen
- SITE_URL Konstante erstellen (9 hardcoded URLs)
- Schema.org Organization/Website structured data
- OG Images für 7 Seiten fehlen

### 📋 Dokumentation:
- Alle 50+ SEO-Probleme dokumentiert in [SEO-ISSUES.md](SEO-ISSUES.md)
- Organisiert nach Priorität (CRITICAL → LOW)
- Mit Datei-Referenzen und Fix-Beispielen

### 🎯 Nächste Schritte:
1. Restliche HIGH Priority Fixes (siehe SEO-ISSUES.md)
2. Google Search Console Verifizierung
3. Sitemap zu Google einreichen
4. 24-48h warten für Indexierung

### 💡 Prototyping Best Practices:
- Admin-Routen immer mit `noindex, nofollow` versehen
- Oder Query Parameter nutzen (`?prototype=true`)
- Nie in öffentlicher Navbar verlinken
- EventsNew bleibt als geschützter Prototyp verfügbar

### ⚠️ WICHTIG: Admin-Tools (NICHT SEO-optimieren!):
**Trip Planner Pages sind ADMIN-TOOLS, KEINE öffentlichen User-Features:**
- `/trip-planner` → Admin: Trip Planer (`noindex, nofollow`)
- `/trip-planer-new` → Admin: Trip Planer Neu (`noindex, nofollow`)
- **NICHT in Sitemap aufnehmen!**
- **KEINE SEO-Optimierung (H1, Meta Tags, Schema.org)!**
- Sind nur über Admin-Menü im Navbar erreichbar
- Für interne Planung und Tests gedacht

---

## 🎨 Modal Design Backups

Location: `backups/modal-designs/`

Backup-Versionen des EventDetailModal werden hier gespeichert, falls ein Design-Rollback nötig ist:

- **EventDetailModal-glassmorphism-v3-final-2026-01-28.tsx** - ⭐ FINALES DESIGN: Transparente Kreise, Tags max 3 mit "+X", Stern größer mit Zahl daneben, Ticket dunkelblau (indigo-900), Shadow auf Icons. User-Rating-System integriert.

- **EventDetailModal-glassmorphism-v2-2026-01-28.tsx** - Glassmorphism-Design v2: Transparente Kreise (nur Border), Icons links gruppiert, Ticket-Button rechts (dunkelblau), inline-styles für backdrop-filter.

- **EventDetailModal-glassmorphism-icons-2026-01-28.tsx** - Erstes Glassmorphism-Design mit weißen Kreis-Buttons.

- **EventDetailModal-rectangular-2026-01-28.tsx** - Vorheriges Design mit rechteckigen Buttons + Text-Labels ("Speichern", "Kalender", "Teilen"). Heller Hover mit `bg-gray-50`, `border-gray-200`.

## ⭐ User Rating System

**Konzept:** User können Events mit 1-5 Sternen bewerten. Die Bewertung beeinflusst den angezeigten Score.

**Funktionsweise:**
- Beim Hover auf Stern-Icon: "Event bewerten" Tooltip
- Beim Klick: 5 graue Sterne erscheinen
- User klickt auf 1-5 Sterne → werden gold
- Bewertung wird in localStorage gespeichert (pro Event-ID)
- Score-Anzeige wird um 0.1-0.5 Punkte erhöht (je nach Bewertung)
- Session-basiert: Jeder User kann jedes Event nur 1x bewerten

**Score-Berechnung:**
```
userRating = 1-5 Sterne
scoreBoost = (userRating - 3) * 0.1  // -0.2 bis +0.2
displayedScore = baseScore + scoreBoost
```

**Wo verfügbar:**
- EventDetailModal (Popup)
- EventList Cards
- EventDetail Seite

---

## 🔧 Performance Fix: EventDetail.tsx (Januar 30, 2026)

### Problem: Hohe CPU-Last / Lüfter laut

Die EventDetail-Seite hatte zwei Performance-Probleme im "In der Nähe" Carousel:

### 1. Doppelter Fetch bei Event-Swap

**Vorher (schlecht):**
```tsx
useEffect(() => {
  // fetchNearbyEvents...
}, [dynamicEvent, slug]);  // ← Beide ändern sich bei swapToEvent = 2x Fetch!
```

**Nachher (gut):**
```tsx
useEffect(() => {
  // fetchNearbyEvents...
}, [dynamicEvent?.id, dynamicEvent?.latitude, dynamicEvent?.longitude]);  // ← Nur 1x Fetch
```

### 2. Distance-Berechnung bei jedem Render

**Vorher (schlecht):**
```tsx
{nearbyEvents.map((evt) => {
  // Diese Berechnung passiert bei JEDEM Render
  const dist = calculateDistance(...);
  return <SimilarEventCard distance={dist} />;
})}
```

**Nachher (gut):**
```tsx
// Berechnung einmal gecached mit useMemo
const nearbyEventsWithDistance = useMemo(() => {
  return nearbyEvents.map((evt) => ({
    ...evt,
    distanceText: evt.calculatedDistance < 1 ? '< 1 km' : `${Math.round(evt.calculatedDistance)} km`
  }));
}, [nearbyEvents]);

// Im JSX nur noch gecachte Werte verwenden
{nearbyEventsWithDistance.map((evt) => (
  <SimilarEventCard distance={evt.distanceText} />
))}
```

### Betroffene Datei
- `src/pages/EventDetail.tsx` (Zeilen ~565-621 und ~817-829)

---

## 🔄 Event Deduplication Logic (TODO - Affiliate Integration)

**Status:** ✅ MVP implementiert (Title-basiert)

### Aktuelle Implementierung
- **Datei:** `src/components/EliteExperiencesSection.tsx` (Zeilen ~245-255)
- **Methode:** Simple Title-basierte Deduplizierung
- **Logik:** Behält Event mit höherem `buzz_score` bei Duplikaten
- **Anwendung:** Nur in EliteExperiencesSection (Must-See Events)

**Beispiel:** Foundation Beyeler 1.3 + Foundation Beyeler 6.2 → nur 6.2 bleibt

### Nächster Schritt: Affiliate Integration
Wenn Affiliate-Partner Events hinzufügen:
1. **Hybrid-Deduplizierung** implementieren (state-of-the-art):
   - Geo-Filter: Events within 1-2km Radius
   - Fuzzy Name Matching: Jaro-Winkler Distance >85%
   - Scoring: `(geo_score * 0.4 + name_similarity * 0.6)`

2. **Libraries:**
   - `rapid-fuzzy` oder `fuse.js` für Fuzzy Matching
   - Haversine Distance für Geo-Berechnung (bereits vorhanden)

3. **Integration in Backend:**
   - Reusable Utility Function: `src/utils/deduplicateEvents.ts`
   - Datentafel für Duplikat-Tracking: `is_duplicate_of` Flag
   - In allen Event-Sections anwenden (nicht nur Elite)

4. **Test-Cases:**
   - Museum Tinguely Varianten testen
   - "Kunstmuseum" vs "Art Museum" fuzzy matching
   - Geo-Clustering für Events am selben Ort

---

## 🔒 Supabase Security: Pro Plan Features (TODO)

Wenn du auf den **Supabase Pro Plan** upgradest, aktiviere diese Security-Features:

**Dashboard → Authentication → Attack Protection:**
- ✅ **Prevent use of leaked passwords** - Prüft neue Passwörter gegen HaveIBeenPwned-Datenbank
  - Verhindert dass User Passwörter nutzen, die in Datenlecks aufgetaucht sind
  - Minimale Friction (95% der User merken nichts)
  - Schützt vor Account-Übernahme durch Credential Stuffing

**Bereits aktiv (Free Plan):**
- ✅ Secure email change (beide Email-Adressen müssen bestätigen)
- ✅ Minimum password length: 6 Zeichen

---

---

## 🎯 SEO-Friendly Event URLs - Implementation Complete (Feb 4, 2026)

### ✅ Was wurde gelöst:

1. **1466 Events mit SEO-Slugs**
   - URLs wie `/event/heureka-von-jean-tinguely-zuerich` statt UUIDs
   - Title + Location kombiniert für bessere Lesbarkeit
   - Google-freundliche, indexierbare URLs

2. **Event Slug Mapping System**
   - `public/event-slug-mapping.json` mit 1448 Mappings
   - Schnelle O(1) Lookup von SEO-Slug → external_id
   - Caching on component mount für sofortige Auflösung

3. **Improved Sitemaps**
   - 16 Sitemap-Dateien (1466 Events chunked zu 500 URLs)
   - Prioritäten: Events 1.0 (daily), Categories 0.9 (daily), City×Category 0.7 (weekly)
   - Index: `https://eventbuzzer.ch/sitemap-index.xml`

4. **Schema.org JSON-LD für Google**
   - Event Schema mit Adresse, Koordinaten, Rating, Price
   - Geo-Coordinates für Local SEO
   - Aggregate Rating basierend auf Buzz Score

5. **No More 404 Errors**
   - Event-Slug-Auflösung funktioniert sofort (Mapping gecacht)
   - Fallback-Kette: Slug-Mapping → external_id → id
   - Alle 1466 Events vollständig indexierbar

### 🚀 Nächste Schritte (für Google Search Console):

**KRITISCH:** Neue Sitemap MUSS registriert werden!

Siehe Checkliste unten im Chat → "GOOGLE SEARCH CONSOLE CHECKLISTE"

**Letzte Aktualisierung:** Februar 4, 2026

---

## 🔍 PHASE 2: Design-Breaking Commits Forensik (4124f48 → HEAD)

### ❌ BREAKS DESIGN - NICHT HINZUFÜGEN:
Diese Commits zerschießen das Layout/Design von EventList1 + ListingsFilterBar:

1. **be27038** (2026-02-06) - "Fix build error - remove unused useTravelpayoutsVerification imports"
   - ❌ Entfernte Trip Planner Logic aus EventList1.tsx
   - ❌ Entfernte Rating System
   - ❌ Design wurde NICHT dabei kaputt, aber zu viele Funktionen weg

2. **b511de9** (2026-02-05) - "Add Travelpayouts verification to all pages via hook"
   - ❌ Brach EventList1 Layout massiv
   - ❌ FilterBar beschädigt
   - ❌ NICHT NEHMEN

3. **cd741d1** bis **55f861c** (2026-02-05) - Mobile Version "Implement mobile-first event detail popup"
   - ⚠️ Mobile-Änderungen waren okay
   - ❌ ABER führten zu Desktop-Layout Breaks
   - ❌ Kombiniert mit anderen Commits = Design-Katastrophe

### ✅ SAFE - KÖNNEN HINZUGEFÜGT WERDEN:
Diese Commits sind für NEUE FEATURES und brechen nichts:

1. **90c124b** - "Add Partner Event Upload form - Phase 1 implementation"
   - ✅ Neue Seite `/partner`
   - ✅ Kein Touch an EventList1 oder Filterbar
   - ✅ SAFE

2. **89af8d6** - "Add admin approval system for partner events - Phase 2"
   - ✅ Neue Seite `/admin/pending-events`
   - ✅ AdminPendingEvents Component
   - ✅ Kein Desktop Layout Touch
   - ✅ SAFE

3. **465271a** - "Add 'Hosten' to mobile bottom navigation"
   - ✅ Neue MobileBottomNav Component
   - ✅ Rein mobile-spezifisch
   - ✅ SAFE (wenn sauber implementiert)

4. **f0c107a** - "Add image file upload to partner event form"
   - ✅ Partnership mit Partner Upload
   - ✅ Nur Form-Feature
   - ✅ SAFE

---

## 🚀 PHASE 3: Surgical Re-Add der Features

### Schritt-für-Schritt Roadmap (TESTET NACH JEDEM):

```
1. ✅ 4124f48 = Baseline (IDEAL STATE)
   └─ TEST: EventList Design perfekt

2. ➕ 90c124b = PartnerUpload Page
   └─ TEST: Seite funktioniert, Design noch ok?

3. ➕ 89af8d6 = AdminPendingEvents Page
   └─ TEST: Admin Panel funktioniert, Design?

4. ➕ f0c107a = Image File Upload
   └─ TEST: Partner Form mit Upload ok?

5. ➕ Mobile Version (SAUBER aus Backup)
   └─ TEST: Mobile funktioniert, Desktop NICHT kaputt?

6. ➕ 1cd8b0f = Navbar "Event hochladen" Button
   └─ TEST: Navbar gut, kein Layout-Break?
```

### Warnsignale beim Testen:
- ❌ Description zeigt > 2 Zeilen? = DESIGN KAPUTT
- ❌ Icons/Pills misaligned? = LAYOUT KAPUTT
- ❌ Map zu groß/klein? = SIZE KAPUTT
- Wenn JA: ZURÜCK zu 4124f48 + neue Analyse

**Regel:** Jede neue Feature = 1 sauberer Commit, kein Touch an EventList1/FilterBar außer wenn NOTWENDIG

---

## 📋 Commit-by-Commit Analyse für Phase 3

Siehe `/tmp/` für alle einzelnen Backups:
- `EventList1_b511de9.tsx` - kaputte Version
- `EventList1_cd741d1_good.tsx` - mobile version (risky)
- `ListingsFilterBar_*.tsx` - verschiedene Versionen

Für SAUBERES Mergen: Nur die FILES die sich geändert haben aus spezifischen Commits nehmen, NICHT ganze Commits cherry-picken ohne Review!
