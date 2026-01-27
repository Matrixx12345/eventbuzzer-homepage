# EventBuzzer Business Plan & Roadmap 🚀

## Inhaltsverzeichnis
1. [Vision & Ziel](#vision--ziel)
2. [Monetarisierungs-Strategien](#monetarisierungs-strategien)
3. [Phase 1: Foundation (Monat 1-3)](#phase-1-foundation-monat-1-3)
4. [Phase 2: Trip-Planer MVP (Monat 4-6)](#phase-2-trip-planer-mvp-monat-4-6)
5. [Phase 3: Optimierung (Monat 7-12)](#phase-3-optimierung-monat-7-12)
6. [Phase 4: Europa Expansion (Jahr 2)](#phase-4-europa-expansion-jahr-2)
7. [Exit-Strategy](#exit-strategy)
8. [Finanz-Prognosen](#finanz-prognosen)

---

## Vision & Ziel

**Mission:** Die #1 Plattform für Event-Wochenenden in der Schweiz (später Europa)

**USP (Unique Selling Point):**
Einzige Plattform die Events + Hotels + Transport + Restaurants unter einem Dach plant → "Airbnb für Event-Wochenenden"

**Ziele:**
- **Kurz-term (12 Monate):** 50k-100k Besucher/Monat, 3k-8k€ Umsatz/Monat
- **Mittel-term (24 Monate):** 200k+ Besucher/Monat, 10k-25k€ Umsatz/Monat
- **Lang-term:** Verkauf für 300k-800k€ ODER weiter skalieren nach Europa

---

## Monetarisierungs-Strategien

### Option 1: Affiliate-Marketing (Basis)
**Was:** Links zu Ticketverkäufern, Hotels, Transport
**Provision:** 5€-15€ pro Event-Ticket, 3-5% für Hotels
**Aufwand:** Niedrig (Integration einmalig)
**Verdienst bei 50k Besuchern/Monat:** 500€ - 2.000€

**Affiliate-Partner:**
- ✅ Ticketcorner (Schweizer Events)
- ✅ Viator (Touren & Aktivitäten, 8-10%)
- ✅ GetYourGuide (Touren & Aktivitäten, 8-12%)
- ✅ Booking.com (Hotels, 25-50% Provision = 3-5€ pro Buchung)
- ✅ Hotels.com (Hotels, 4-6%)
- ✅ Expedia (Hotels, 3-5%)
- ✅ TheFork.ch (Restaurants, 2-5€ pro Reservation)
- ✅ Omio/Trainline (Zugtickets, 3-5%)

### Option 2: Trip-Planer (HAUPT-STRATEGIE) 🎯
**Was:** User plant Event-Wochenende → Website schlägt Event + Hotel + Zug + Restaurant vor
**Provision:** 25€-50€ pro komplettem Trip
**Aufwand:** Mittel (2-4 Wochen Entwicklung)
**Verdienst bei 50k Besuchern/Monat:** 3.000€ - 12.000€

**Beispiel-Rechnung:**
```
Event-Ticket (150€) → 12€ Provision (8%)
Hotel (200€) → 6€ Provision (3%)
Zug (100€) → 3€ Provision (3%)
Restaurant (80€) → 4€ Provision (5%)
= 25€ pro Trip!

Bei 100 Trips/Monat = 2.500€
Bei 500 Trips/Monat = 12.500€
Bei 1000 Trips/Monat = 25.000€
```

### Option 3: Premium Listings für Veranstalter (später)
**Was:** Veranstalter zahlen für Top-Platzierung
**Preis:** 49€-199€/Monat pro Veranstalter
**Aufwand:** Hoch (Sales-Team nötig)
**Verdienst:** 1.000€ - 4.000€/Monat (bei 20-30 Kunden)

### Option 4: Featured Events / Werbeplätze (später)
**Was:** Startseite, Newsletter, Social Media Promotion
**Preis:** 100€-500€ pro Kampagne
**Aufwand:** Mittel (ab 20k+ Newsletter-Abonnenten)
**Verdienst:** 500€ - 2.000€/Monat

### Option 5: Eigene Ticket-Verkäufe (langfristig)
**Was:** Wie Eventbrite - eigenes Ticketing-System
**Provision:** 5-10% pro Ticket
**Aufwand:** Sehr hoch (Zahlungsabwicklung, Support)
**Verdienst:** 5.000€ - 20.000€/Monat (bei großem Volume)

---

## Phase 1: Foundation (Monat 1-3)

**Status:** ✅ Fast komplett (Woche 4)

### Ziele:
- 5.000 - 10.000 Besucher/Monat
- 100€ - 500€ Umsatz/Monat
- Google Indexierung vollständig
- Pinterest Marketing aktiv

### Tasks:

#### ✅ DONE - Technical SEO
- [x] Sitemap generieren (1459 URLs)
- [x] robots.txt optimieren
- [x] Meta-Tags (Title, Description)
- [x] Schema.org Markup (Event, LocalBusiness)
- [x] Google Search Console (100% indexiert)
- [x] Google Analytics 4 (G-M1X3YZQ25G)
- [x] Pinterest Website-Verifizierung

#### 🔄 IN PROGRESS - Pinterest Marketing
- [x] Pinterest Account erstellen
- [x] 9 Boards erstellen (kategorie-basiert)
- [ ] 100 Pins hochladen (CSV-Upload)
- [ ] Wöchentlich 50-100 neue Pins (Automatisierung mit Tailwind)

#### 📋 TODO - Affiliate Setup
- [ ] Ticketcorner Affiliate beantragen (JETZT möglich, 0-2000 Besucher)
- [ ] Booking.com Partner-Programm: https://www.booking.com/affiliate-program
- [ ] Viator Affiliate (über Awin, ab 5k Besuchern besser)
- [ ] GetYourGuide Affiliate (ab 10k Besuchern)
- [ ] TheFork.ch Partner-Programm
- [ ] Affiliate-Links in Events integrieren

#### 📋 TODO - Content
- [ ] 10 Blog-Posts: "Top Events in [Stadt] 2026"
- [ ] Social Media Setup (Instagram, evtl. TikTok)
- [ ] Newsletter-Anmeldung einbauen

---

## Phase 2: Trip-Planer MVP (Monat 4-6)

**Ziele:**
- 15.000 - 30.000 Besucher/Monat
- 500€ - 2.000€ Umsatz/Monat
- Trip-Planer LIVE
- 5-10x höhere Provision pro User

### Step-by-Step Entwicklung:

#### Schritt 1: Booking.com Integration (Woche 1)
```typescript
// 1. Bei Booking.com Partner-Programm anmelden
// 2. Affiliate-ID erhalten
// 3. API oder Deep Links integrieren

// Beispiel Deep Link:
const hotelUrl = `https://www.booking.com/searchresults.html?
  city=Zürich&
  checkin=2026-03-21&
  checkout=2026-03-22&
  aid=[DEINE_AFFILIATE_ID]`;
```

**Schritte:**
1. Auf https://www.booking.com/affiliate-program registrieren
2. Affiliate-ID in `.env` speichern
3. Hotel-Suche Komponente bauen
4. Deep Links zu Booking.com generieren

#### Schritt 2: Trip-Planer UI (Woche 2)
```typescript
// EventDetailPage erweitern mit:

<TripPlannerCard event={event}>
  <EventInfo />

  <HotelRecommendations
    city={event.city}
    date={event.date}
    affiliateId={BOOKING_AFFILIATE_ID}
  />

  <TransportLinks
    from="Benutzer-Standort"
    to={event.city}
    date={event.date}
  />

  <RestaurantRecommendations
    city={event.city}
    nearVenue={event.location}
  />
</TripPlannerCard>
```

**UI Design:**
```
┌─────────────────────────────────────┐
│ 🎫 Ed Sheeran Konzert               │
│ 21. März 2026, Zürich               │
│ [Tickets ab 89 CHF →]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📍 PLANE DEINEN EVENT-TRIP          │
├─────────────────────────────────────┤
│ 🏨 Hotels in Zürich                 │
│   - Hotel Central: ab 120 CHF      │
│   - Hotel Limmathof: ab 95 CHF     │
│   [Mehr Hotels ansehen →]           │
├─────────────────────────────────────┤
│ 🚆 Anreise nach Zürich              │
│   Von Basel: ab 35 CHF              │
│   Von Bern: ab 25 CHF               │
│   [SBB Tickets →]                   │
├─────────────────────────────────────┤
│ 🍽️ Restaurants in der Nähe          │
│   - Ristorante XYZ (20% Rabatt)    │
│   - Steakhouse ABC                  │
│   [Tisch reservieren →]             │
└─────────────────────────────────────┘
```

#### Schritt 3: Hotel-API Integration (Woche 2-3)
**Option A: Booking.com API** (braucht Genehmigung)
**Option B: Deep Links** (sofort möglich)

Für Start: **Deep Links verwenden** (keine API-Keys nötig!)

```typescript
// components/HotelRecommendations.tsx
export function HotelRecommendations({ city, date, affiliateId }) {
  const checkin = format(date, 'yyyy-MM-dd');
  const checkout = format(addDays(date, 1), 'yyyy-MM-dd');

  const bookingUrl = `https://www.booking.com/searchresults.html?` +
    `ss=${encodeURIComponent(city)}&` +
    `checkin=${checkin}&` +
    `checkout=${checkout}&` +
    `aid=${affiliateId}`;

  return (
    <div>
      <h3>🏨 Hotels in {city}</h3>
      <p>Finde das perfekte Hotel für dein Event-Wochenende</p>
      <Button href={bookingUrl} target="_blank">
        Hotels ansehen & buchen
      </Button>
    </div>
  );
}
```

#### Schritt 4: Transport-Links (Woche 3)
```typescript
// SBB Deep Links (keine Affiliate, aber Service)
const sbbUrl = `https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?` +
  `nach=${encodeURIComponent(city)}&` +
  `datum=${format(date, 'dd.MM.yyyy')}`;

// Alternative: Omio (hat Affiliate-Programm)
const omioUrl = `https://www.omio.com/search?` +
  `departureStationName=Basel&` +
  `arrivalStationName=${encodeURIComponent(city)}&` +
  `date=${format(date, 'yyyy-MM-dd')}&` +
  `affiliate_id=[DEINE_ID]`;
```

#### Schritt 5: Restaurant-Integration (Woche 4)
```typescript
// TheFork.ch Affiliate
const theforkUrl = `https://www.thefork.ch/suche?` +
  `cityName=${encodeURIComponent(city)}&` +
  `date=${format(date, 'yyyy-MM-dd')}&` +
  `affiliate=[DEINE_ID]`;
```

#### Schritt 6: Testing & Launch (Woche 4)
- [ ] Trip-Planer bei 10-20 Events testen
- [ ] Analytics tracking für Conversion Rate
- [ ] User-Feedback sammeln
- [ ] Roll-out auf alle Events

---

## Phase 3: Optimierung (Monat 7-12)

**Ziele:**
- 50.000 - 100.000 Besucher/Monat
- 3.000€ - 8.000€ Umsatz/Monat
- Conversion Rate optimieren
- Content-Marketing

### Tasks:

#### Content-Marketing
- [ ] **20-30 Blog-Posts:** "Perfektes Event-Wochenende in [Stadt]"
  - Beispiel: "Ed Sheeran in Zürich: Hotels, Restaurants & Anreise-Tipps"
  - SEO-optimiert für Long-Tail Keywords
  - Interne Verlinkung zu Events + Trip-Planer

- [ ] **Social Media Content:**
  - Instagram: Event-Tips, Behind-the-Scenes
  - TikTok: "Event-Wochenende für 150 CHF" (Viral-Potential)
  - Pinterest: Weiter 100-200 Pins/Woche

- [ ] **Newsletter:**
  - Wöchentlich "Top Events diese Woche"
  - Ziel: 1.000 - 5.000 Abonnenten
  - Newsletter-Ads später (50€-200€ pro Platzierung)

#### Conversion-Optimierung
- [ ] A/B Testing für Trip-Planer UI
- [ ] Heatmaps (Hotjar) - wo klicken User?
- [ ] User-Feedback Pop-ups
- [ ] Trust-Signale (5.000+ gebuchte Trips, etc.)

#### Mehr Affiliate-Partner
- [ ] Viator Affiliate (wenn 5k+ Besucher)
- [ ] GetYourGuide Affiliate (wenn 10k+ Besucher)
- [ ] Hotels.com, Expedia, Agoda
- [ ] Car Rental (Europcar, Hertz) für Event-Trips

---

## Phase 4: Europa Expansion (Jahr 2)

**Ziele:**
- 200.000+ Besucher/Monat
- 10.000€ - 25.000€ Umsatz/Monat
- 4-5 Länder aktiv

### Länder-Strategie:

#### Priorität 1: Deutschland 🇩🇪
- **Warum:** 10x größerer Markt als Schweiz
- **Cities:** Berlin, München, Hamburg, Köln, Frankfurt
- **Events:** 50.000+ Events/Jahr
- **Timeline:** Monat 13-15

#### Priorität 2: Österreich 🇦🇹
- **Warum:** Deutschsprachig, ähnliche Kultur
- **Cities:** Wien, Salzburg, Innsbruck
- **Events:** 10.000+ Events/Jahr
- **Timeline:** Monat 16-18

#### Priorität 3: Italien 🇮🇹 / Frankreich 🇫🇷
- **Warum:** Touristen-Ziele, hohe Hotel-Provisionen
- **Cities:** Mailand, Paris, Lyon, Marseille
- **Timeline:** Monat 19-24

### Technical Setup:
```typescript
// Multi-Language Support
// i18next integration

const languages = ['de', 'en', 'fr', 'it'];

// URL Structure:
eventbuzzer.ch/de/events/zurich
eventbuzzer.ch/en/events/zurich
eventbuzzer.ch/fr/events/zurich
```

---

## Exit-Strategy

### Wann verkaufen?

**Optimaler Zeitpunkt:** 18-30 Monate nach Start

**Voraussetzungen für guten Verkaufspreis:**
- ✅ 100.000+ Besucher/Monat (organisch)
- ✅ 5.000€ - 10.000€ Umsatz/Monat (stabil)
- ✅ Wachstum: +20-30% pro Monat
- ✅ Einzigartiger USP (Trip-Planer)
- ✅ Mehrere Traffic-Quellen (SEO, Pinterest, Social)
- ✅ Clean Code, gut dokumentiert
- ✅ Automatisierte Prozesse

### Verkaufskanäle:

#### 1. Flippa.com
- **Für:** Websites mit 1k-10k€/Monat Umsatz
- **Bewertung:** 20-40x Monthly Profit
- **Verkaufspreis:** 100k€ - 300k€
- **Gebühr:** 15% (oder 2.500€ Fixpreis)

#### 2. Empire Flippers
- **Für:** Premium-Websites mit 5k-50k€/Monat
- **Bewertung:** 30-50x Monthly Profit
- **Verkaufspreis:** 200k€ - 800k€
- **Gebühr:** 15% (aber bessere Käufer)

#### 3. Private Equity / Strategen
- **Für:** Websites mit 10k€+ Umsatz/Monat
- **Bewertung:** 50-100x Monthly Profit
- **Käufer:** Ticketcorner, Eventbrite, Booking.com, etc.
- **Verkaufspreis:** 500k€ - 2M€

### Verkaufs-Vorbereitung:

**3-6 Monate vor Verkauf:**
- [ ] Alle Prozesse dokumentieren
- [ ] Finanzen sauber aufbereitet (Profit & Loss)
- [ ] Google Analytics exportieren (Beweis für Traffic)
- [ ] Code aufräumen, kommentieren
- [ ] Business-Plan schreiben
- [ ] Wachstums-Strategie für Käufer
- [ ] Alle Verträge (Hosting, Domains, Affiliate) überprüfen

**Verkaufs-Dokumente:**
1. **P&L Statement** (24 Monate)
2. **Traffic Report** (Google Analytics)
3. **Revenue Report** (Affiliate-Einnahmen)
4. **SEO Report** (Rankings, Keywords)
5. **Technical Documentation** (Code, APIs, Hosting)
6. **Growth Opportunities** (Was der Käufer noch machen kann)

---

## Finanz-Prognosen

### Konservatives Szenario (Alleine, ohne Kapital)

| Monat | Besucher | Umsatz | Gewinn | Notizen |
|-------|----------|--------|--------|---------|
| 1-3 | 5k - 10k | 100€ - 500€ | 50€ - 400€ | SEO + Pinterest Basis |
| 4-6 | 15k - 30k | 500€ - 2k€ | 400€ - 1.8k€ | Trip-Planer MVP |
| 7-9 | 30k - 50k | 1.5k€ - 4k€ | 1.3k€ - 3.8k€ | Content + Social |
| 10-12 | 50k - 100k | 3k€ - 8k€ | 2.8k€ - 7.8k€ | Optimierung |
| 13-18 | 100k - 200k | 6k€ - 15k€ | 5.7k€ - 14.7k€ | Europa Start |
| 19-24 | 200k - 400k | 12k€ - 30k€ | 11.5k€ - 29.5k€ | Multi-Country |

**Total nach 24 Monaten:** 150k€ - 400k€ Gesamtumsatz

### Optimistisches Szenario (Mit Marketing-Budget)

| Monat | Besucher | Umsatz | Gewinn | Notizen |
|-------|----------|--------|--------|---------|
| 1-3 | 10k - 20k | 500€ - 1.5k€ | 300€ - 1.2k€ | + Google Ads |
| 4-6 | 30k - 60k | 2k€ - 5k€ | 1.5k€ - 4.5k€ | + Facebook Ads |
| 7-9 | 60k - 120k | 5k€ - 12k€ | 4k€ - 11k€ | Viral-Content |
| 10-12 | 120k - 250k | 10k€ - 25k€ | 9k€ - 24k€ | Influencer |
| 13-18 | 250k - 500k | 20k€ - 50k€ | 19k€ - 49k€ | Europa Expansion |
| 19-24 | 500k - 1M | 40k€ - 100k€ | 38k€ - 98k€ | Skalierung |

**Total nach 24 Monaten:** 800k€ - 2M€ Gesamtumsatz

### Break-Even Analyse

**Monatliche Kosten (Minimum):**
- Hosting (Vercel): 20€
- Supabase: 25€
- Domain: 2€
- Tools (Analytics, etc.): 10€
- **Total: ~60€/Monat**

**Break-Even:** Ab Monat 1 möglich (bei 100€+ Umsatz)

---

## Nächste Schritte (Diese Woche)

### Priorität 1: Pinterest CSV generieren & hochladen
- [x] Script fertig
- [ ] 100 Pins als CSV
- [ ] Upload auf Pinterest
- [ ] Conversion tracking

### Priorität 2: Booking.com Affiliate
- [ ] Bei Partner-Programm anmelden
- [ ] Affiliate-ID erhalten
- [ ] Erste Deep Links testen

### Priorität 3: Traffic beobachten
- [ ] Google Analytics täglich checken
- [ ] Pinterest Analytics beobachten
- [ ] Erste Conversions tracken

---

## Wichtige Links & Ressourcen

### Affiliate-Programme:
- **Booking.com:** https://www.booking.com/affiliate-program
- **Viator (via Awin):** https://www.awin.com
- **GetYourGuide:** https://partner.getyourguide.com
- **TheFork:** https://www.thefork.ch/partner
- **Omio:** https://www.omio.com/affiliate-program

### Verkaufsplattformen:
- **Flippa:** https://flippa.com
- **Empire Flippers:** https://empireflippers.com
- **FE International:** https://feinternational.com

### Tools:
- **Google Analytics:** https://analytics.google.com (G-M1X3YZQ25G)
- **Google Search Console:** https://search.google.com/search-console
- **Pinterest Analytics:** https://analytics.pinterest.com
- **Tailwind (Pinterest Automation):** https://www.tailwindapp.com

---

## FAQ

### Wann English-Version?
**Antwort:** Phase 3-4 (Monat 7-12)
- Erst wenn du 30k+ Besucher/Monat hast (dann lohnt es sich)
- Fokus: Touristen (Hotels haben höhere Provisionen für Touristen!)
- Start mit wichtigsten Seiten (Homepage, Top Events)
- Dann automatische Übersetzung für alle Events

### Warum kein Google AdSense?
**Antwort:**
- Verdienst: 0,50€ - 2€ pro 1000 Besucher (sehr wenig)
- Ruiniert User Experience (nervige Banner)
- Affiliate ist 10-20x profitabler
- Lenkt von deinen Events ab

### Wie viel Zeit pro Woche?
**Antwort:**
- **Monat 1-3:** 10-15h/Woche (SEO, Pinterest, Content)
- **Monat 4-6:** 20-25h/Woche (Trip-Planer entwickeln)
- **Monat 7+:** 10h/Woche (Optimierung, Content)

### Wann ersten Gewinn?
**Antwort:**
- **Monat 1:** Wahrscheinlich 50€-200€ (Break-Even)
- **Monat 3:** 300€-800€ (kleine Gewinne)
- **Monat 6:** 1.000€-3.000€ (spürbar)
- **Monat 12:** 3.000€-10.000€ (lukrativ)

---

**Letzte Aktualisierung:** 27. Januar 2026
**Status:** Phase 1 fast komplett (90%), Phase 2 in Planung
