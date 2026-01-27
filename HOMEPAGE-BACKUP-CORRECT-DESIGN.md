# ✅ Korrektes Homepage-Design - Backup & Referenz

**Erstellt:** 27. Januar 2026
**Letztes Update:** 27. Januar 2026

---

## 🎯 Wichtig: Dieses Design ist KORREKT!

**NIEMALS zurück zu den alten schwarzen Event-Karten (DynamicEventSection/WeekendSection)!**

Das aktuelle Design verwendet:
- ✅ **CleanGridSection** (sandiger Hintergrund, Karussell mit 3 Karten)
- ✅ **SideBySideSection** (Side-by-Side Karten, 55%/45% Split)
- ✅ **EliteExperiencesSection** (2x2 Grid, weiße Karten)

---

## 📋 Aktuelle Homepage-Struktur (Index.tsx)

```tsx
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import HeroSection from "@/components/HeroSection";
import CleanGridSection from "@/components/CleanGridSection";
import SideBySideSection from "@/components/SideBySideSection";
import EliteExperiencesSection from "@/components/EliteExperiencesSection";
import { useEventModal } from "@/hooks/useEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

const Index = () => {
  const { selectedEventId, isOpen: modalOpen, openEvent: openEventModal, closeEvent: closeEventModal, swapEvent } = useEventModal();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch event data when selectedEventId changes
  useEffect(() => {
    const fetchEvent = async () => {
      if (selectedEventId && modalOpen) {
        const { data: event } = await supabase
          .from("events")
          .select("*")
          .eq("id", selectedEventId)  // ⚠️ WICHTIG: "id" nicht "external_id"!
          .single();

        if (event) {
          setSelectedEvent(event);
        }
      } else {
        setSelectedEvent(null);
      }
    };

    fetchEvent();
  }, [selectedEventId, modalOpen]);

  // Wrapper to open modal and fetch event
  const openEvent = (eventId: string) => {
    openEventModal(eventId);
  };

  // Wrapper to close modal and clear event
  const closeEvent = () => {
    closeEventModal();
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Helmet mit SEO... */}
      <Navbar />

      <main>
        <HeroSection />

        {/* Sandiger Hintergrund für alle Event-Sektionen */}
        <div className="bg-[#F5F0E8]">
          {/* Sektion 1: Verpasse nicht an diesem Wochenende - Karussell */}
          <ErrorBoundary>
            <CleanGridSection
              title="Verpasse nicht an diesem Wochenende:"
              sourceFilter="myswitzerland"
              filterParam="source=myswitzerland"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 2: Familien-Abenteuer - Karussell */}
          <ErrorBoundary>
            <SideBySideSection
              title="Familien-Abenteuer:"
              tagFilter="familie-freundlich"
              filterParam="tags=familie-freundlich"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 3: Wärmende Indoor-Erlebnisse - Karussell */}
          <ErrorBoundary>
            <CleanGridSection
              title="Wärmende Indoor-Erlebnisse:"
              tagFilter="mistwetter"
              filterParam="tags=mistwetter"
              onEventClick={openEvent}
              maxEvents={10}
            />
          </ErrorBoundary>

          {/* Sektion 4: Die Schweizer Top Erlebnisse - Karussell */}
          <ErrorBoundary>
            <EliteExperiencesSection onEventClick={openEvent} />
          </ErrorBoundary>
        </div>
      </main>

      {/* Global Event Detail Modal with URL sync */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={closeEvent}
        />
      )}
    </div>
  );
};

export default Index;
```

---

## 🎨 Die 4 Homepage-Sektionen im Detail

### 1. Verpasse nicht an diesem Wochenende (CleanGridSection)
- **Komponente:** `CleanGridSection`
- **Filter:** `sourceFilter="myswitzerland"`
- **Design:** Karussell mit 3 vollen Karten, sandiger Hintergrund
- **Events:** MySwitzerland Events mit `relevance_score >= 50`

### 2. Familien-Abenteuer (SideBySideSection)
- **Komponente:** `SideBySideSection`
- **Filter:** `tagFilter="familie-freundlich"`
- **Design:** Side-by-Side Karten (55% Bild, 45% Content)
- **Events:** Events mit Tag "familie-freundlich"

### 3. Wärmende Indoor-Erlebnisse (CleanGridSection)
- **Komponente:** `CleanGridSection`
- **Filter:** `tagFilter="mistwetter"`
- **Design:** Karussell mit 3 vollen Karten, sandiger Hintergrund
- **Events:** Events mit Tag "mistwetter"

### 4. Die Schweizer Top Erlebnisse (EliteExperiencesSection)
- **Komponente:** `EliteExperiencesSection`
- **Filter:** `tags contains "must-see"` (⚠️ NICHT "elite"!)
- **Design:** 2x2 Grid, weiße Karten mit Pagination
- **Events:** Premium Events mit Tag "must-see" und `relevance_score >= 50`

---

## ⚠️ Häufige Fehler & Lösungen

### Problem: "Sektion verschwindet / Events werden nicht geladen"

**FALSCH (alte schwarze Version):**
```tsx
import WeekendSection from "@/components/WeekendSection";
import DynamicEventSection from "@/components/DynamicEventSection";

<WeekendSection onEventClick={openEvent} />
<DynamicEventSection
  title="Familien-Abenteuer:"
  tagFilter="familie-freundlich"
  ...
/>
```

**RICHTIG (aktuelles sandiges Design):**
```tsx
import CleanGridSection from "@/components/CleanGridSection";
import SideBySideSection from "@/components/SideBySideSection";

<CleanGridSection
  title="Verpasse nicht an diesem Wochenende:"
  sourceFilter="myswitzerland"
  ...
/>
<SideBySideSection
  title="Familien-Abenteuer:"
  tagFilter="familie-freundlich"
  ...
/>
```

### Problem: "EliteExperiencesSection zeigt keine Events"

**Ursache:** Sucht nach falschem Tag

**FALSCH:**
```tsx
.contains("tags", ["elite"])  // ❌ Keine Events mit diesem Tag!
```

**RICHTIG:**
```tsx
.contains("tags", ["must-see"])  // ✅ Korrekt!
```

### Problem: "Modal öffnet nicht / 406 Fehler"

**Ursache:** Falsche Query

**FALSCH:**
```tsx
.eq("external_id", selectedEventId)  // ❌ Sections übergeben internal ID!
```

**RICHTIG:**
```tsx
.eq("id", selectedEventId)  // ✅ Korrekt!
```

---

## 🔧 Komponenten-Details

### CleanGridSection.tsx
- **Pfad:** `/src/components/CleanGridSection.tsx`
- **Design:** 3er Karussell, sandiger Hintergrund (#F5F0E8)
- **Karten:** Full-Width Cards mit Overlay-Text
- **Features:** BuzzTracker, QuickHideButton, Mini-Map Tooltips
- **Blacklist:** Filtert unerwünschte Events (Schafe, Hop-on-Hop-off, etc.)

### SideBySideSection.tsx
- **Pfad:** `/src/components/SideBySideSection.tsx`
- **Design:** Side-by-Side Layout (55% Bild links, 45% Content rechts)
- **Karten:** Weiße Karten mit Shadow, h-[280px]
- **Features:** BuzzTracker, QuickHideButton, Mini-Map Tooltips

### EliteExperiencesSection.tsx
- **Pfad:** `/src/components/EliteExperiencesSection.tsx`
- **Design:** 2x2 Grid mit Pagination
- **Karten:** Weiße Side-by-Side Karten, h-[280px]
- **Query:** `tags contains "must-see"` + `relevance_score >= 50`
- **Features:** BuzzTracker, QuickHideButton, "Must-See" Badge

---

## 📦 Backup-Dateien

Falls du jemals die Komponenten wiederherstellen musst:

1. **Index.tsx Backup:** Siehe Code oben in diesem Dokument
2. **CleanGridSection.tsx:** `/src/components/CleanGridSection.tsx` (aktuell im Repo)
3. **SideBySideSection.tsx:** `/src/components/SideBySideSection.tsx` (aktuell im Repo)
4. **EliteExperiencesSection.tsx:** `/src/components/EliteExperiencesSection.tsx` (aktuell im Repo)

---

## ✅ Checkliste: "Ist mein Design korrekt?"

- [ ] Sandiger Hintergrund (#F5F0E8) für alle Event-Sektionen?
- [ ] Sektion 1 verwendet `CleanGridSection` mit `sourceFilter="myswitzerland"`?
- [ ] Sektion 2 verwendet `SideBySideSection` mit `tagFilter="familie-freundlich"`?
- [ ] Sektion 3 verwendet `CleanGridSection` mit `tagFilter="mistwetter"`?
- [ ] Sektion 4 verwendet `EliteExperiencesSection`?
- [ ] EliteExperiencesSection sucht nach Tag `"must-see"` (nicht "elite")?
- [ ] Modal query verwendet `.eq("id", selectedEventId)` (nicht "external_id")?
- [ ] Keine schwarzen Event-Karten (DynamicEventSection/WeekendSection)?

**Wenn alle Checkboxen ✅ sind, ist dein Design korrekt!**

---

## 🚨 Was tun wenn Events verschwinden?

1. **NICHT zurück zu DynamicEventSection/WeekendSection wechseln!**
2. Prüfe ob Events in der Datenbank existieren:
   - Sektion 1: Events mit `source="myswitzerland"` und `relevance_score >= 50`
   - Sektion 2: Events mit Tag "familie-freundlich"
   - Sektion 3: Events mit Tag "mistwetter"
   - Sektion 4: Events mit Tag "must-see" und `relevance_score >= 50`
3. Prüfe ob `hide_from_homepage=false` gesetzt ist
4. Prüfe ob Events `image_url` haben (null = wird nicht angezeigt)
5. Prüfe Browser Console auf Fehler

---

**✅ Dieses Dokument ist die Referenz für das korrekte Homepage-Design!**
**❌ Verwende NIEMALS die alten DynamicEventSection/WeekendSection Komponenten!**
