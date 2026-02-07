# Component Locations & Deaktivierte Features

## ActionPill (Glassmorphism Buttons)

**Was ist die ActionPill?**
- Glassmorphism UI-Element mit Star Rating, Favorit, Share, Trip Planner Buttons
- Component: `/src/components/ActionPill.tsx`

**Aktuell deaktiviert auf:**

### 1. Favoriten-Seite (`/src/pages/Favorites.tsx`)
- **Location:** Zeile 219-233 (auskommentiert)
- **Grund:** Vorerst ausgeblendet
- **Wie reaktivieren:** Kommentare entfernen um `<ActionPill />` wieder zu aktivieren

```tsx
{/* Action Pill at bottom - Vorerst ausgeblendet */}
{/* TODO: ActionPill wieder einblenden wenn gewünscht
<div className="mt-4 flex justify-center">
  <ActionPill
    eventId={event.id}
    slug={event.slug}
    ...
  />
</div>
*/}
```

## Weitere Pill/Badge Komponenten

### Event Detail Seite (`/src/pages/EventDetail.tsx`)
- **Keine Subkategorie Pills vorhanden** - nur Breadcrumb Navigation
- Breadcrumb zeigt: Events > Stadt > Kategorie > Event Titel
- Location: Zeile 970-986

### Verwendung der ActionPill in anderen Komponenten:
- Suche nach `import { ActionPill }` um alle Verwendungen zu finden
- Hauptverwendung war in Favorites.tsx (jetzt deaktiviert)

## Robots.txt Konfiguration

**Location:** `/public/robots.txt`

Konfiguration:
- ✅ Google & Bing: Alles erlaubt
- ❌ KI-Crawler gesperrt: GPTBot, CCBot
- ❌ API & Admin Routen geschützt

## Favoriten-Seite "Events erkunden" Link

**Aktueller Status:** ✅ Korrekt
- **Location:** `/src/pages/Favorites.tsx` Zeile 169-174
- **Link Ziel:** `/eventlist1` (Event-Seite)
- **Wird angezeigt:** Nur wenn `favorites.length === 0`

Wenn der Link auf deployed Version zur Startseite führt statt zur Event-Seite:
- Browser Cache löschen
- Hard Reload (Cmd+Shift+R auf Mac, Ctrl+Shift+R auf Windows)
- Oder warten bis neue Version deployed ist
