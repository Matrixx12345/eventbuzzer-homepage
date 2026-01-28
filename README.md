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
│   └── GoogleAnalytics.tsx    # GA4 Tracking
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

### Sitemap generieren

```bash
node scripts/generate-sitemap.mjs
```

Erstellt `public/sitemap.xml` mit allen Event-URLs.

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

**Letzte Aktualisierung:** Januar 28, 2026
