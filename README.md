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

## 🚢 Deployment Checklist

Vor GetYourGuide-Bewerbung:

- [ ] Sitemap generiert (`public/sitemap.xml`)
- [ ] Google Analytics ID in `.env`
- [ ] Build erfolgreich: `npm run build`
- [ ] Deploy auf eventbuzzer.ch
- [ ] Sitemap bei Google Search Console einreichen
- [ ] 24h warten für Google-Indexierung
- [ ] Bei GetYourGuide bewerben

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

**Letzte Aktualisierung:** Januar 18, 2026
