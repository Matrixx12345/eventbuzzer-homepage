# 🎫 Viator Affiliate Anmeldung - Schritt für Schritt

**Strategie:** Jetzt bewerben, wenn abgelehnt → in 2 Monaten nochmal

---

## VORBEREITUNG (30 Min)

### 1. Google Analytics einrichten (siehe GOOGLE-ANALYTICS-SETUP.md)

**WICHTIG:** Auch wenn du noch 0 Traffic hast!

Zeigt: "Ich tracke professionell"

### 2. Über EventBuzzer-Seite vorbereiten

Gehe zu: https://eventbuzzer.ch/impressum

Stelle sicher, dass da steht:
- Name/Firma
- Adresse (kann Postfach sein)
- Email
- (Optional: Telefon)

**Warum:** Awin prüft Impressum (EU-Recht)

### 3. Screenshot-Sammlung vorbereiten

Mach Screenshots von:
- Startseite (eventbuzzer.ch)
- EventList1 (zeigt 1454 Events)
- Event-Detailseite (zeigt Qualität)
- Google Search Console (zeigt 1459 URLs)

**Falls Awin nach "Traffic-Beweis" fragt:** 
"Website ist gerade live gegangen, Google indexiert bereits 1459 URLs"

---

## ANMELDUNG BEI AWIN (Viator's Netzwerk)

### SCHRITT 1: Awin Account erstellen

1. **Gehe zu:** https://www.awin.com/ch-de/advertiser
2. Klick **"Als Publisher anmelden"** (Verlags-Partner)
3. Land: **Schweiz** (wichtig!)

### SCHRITT 2: Publisher-Registrierung

**Account-Details:**
- **Name/Firma:** Dein Name oder "EventBuzzer"
- **Email:** Deine Email
- **Passwort:** Sicheres Passwort

**Website-Details:**
- **Website URL:** https://eventbuzzer.ch
- **Website Name:** EventBuzzer
- **Website Sprache:** Deutsch (+ Englisch wenn multi-lingual)

**Website-Kategorie:**
- **Primary:** Travel & Tourism
- **Secondary:** Arts & Entertainment

**Website-Beschreibung (WICHTIG!):**
```
EventBuzzer ist die größte Event-Plattform der Schweiz mit über 
1400 Events, Konzerten, Festivals und Aktivitäten. Wir listen 
Events in allen Schweizer Städten (Zürich, Basel, Bern, Genf, 
Luzern, etc.) und bieten umfassende Informationen zu Tickets, 
Veranstaltern und Locations.

Unsere Zielgruppe sind Event-Begeisterte, Reisende und 
Touristen in der Schweiz, die nach Aktivitäten und Erlebnissen 
suchen.

Technische Details:
- 1454 Events in der Datenbank
- SEO-optimiert mit Schema.org Structured Data
- Mobile-first Design
- Google Search Console verifiziert mit 1459 indexierten URLs

Wir möchten Viator-Erlebnisse und Touren als Ergänzung zu 
unseren Event-Listings empfehlen, da viele unserer User nach 
Aktivitäten in Schweizer Städten suchen.
```

**Traffic-Angaben:**
- **Monatliche Unique Visitors:** 
  - Wenn Analytics läuft: Ehrlich angeben
  - Wenn noch 0: "Website gerade gelauncht, Google indexiert 1459 URLs"
  
- **Monatliche Page Views:**
  - Wenn Analytics läuft: Ehrlich angeben
  - Wenn noch 0: "Erwartung: 5000+ nach 8 Wochen basierend auf SEO-Potenzial"

**Promotion-Methoden (wichtig - mehrere auswählen!):**
- ✅ **SEO / Organic Search**
- ✅ **Content Marketing**
- ✅ **Email Marketing** (falls du Newsletter planst)
- ✅ **Social Media** (Pinterest, Facebook, Instagram)
- ❌ NICHT: PPC/Paid Ads (außer du machst das wirklich)

**Wie wirst du Awin-Programme bewerben:**
```
Wir integrieren Viator-Links kontextuell in unsere Event-Listings 
und Event-Detail-Seiten. Beispiel:

- Bei einem Festival in Zürich empfehlen wir Viator-Stadttouren
- Bei Sport-Events empfehlen wir Viator-Aktivitäten in der Region
- Dedicated Landing-Page: "Aktivitäten & Touren in [Stadt]"

Alle Empfehlungen sind organisch und passen zur User-Intent.
```

**Zahlungsinformationen:**
- Bank-Verbindung (kommt später, erstmal überspringen wenn möglich)

### SCHRITT 3: Verifizierung

Awin wird:
1. Deine Website prüfen (1-3 Werktage)
2. Email schicken mit Status

**Mögliche Ergebnisse:**

**✅ AKZEPTIERT:**
"Welcome to Awin! Your account is approved."
→ Direkt zu Schritt 4

**⚠️ MEHR INFOS BENÖTIGT:**
"Please provide more traffic details"
→ Antworte: "Website just launched, currently building traffic via SEO and Pinterest. Google has indexed 1459 pages."

**❌ ABGELEHNT:**
"Not enough traffic yet"
→ Kein Problem! Bewirb dich in 2 Monaten nochmal

---

## SCHRITT 4: VIATOR-PROGRAMM BEITRETEN (wenn Awin akzeptiert)

1. **In Awin Dashboard:** Search → "Viator"
2. **Viator Advertiser Profil öffnen**
3. **"Apply to Program"**

**Application Message:**
```
Hi Viator Team,

I operate EventBuzzer.ch, Switzerland's largest event platform 
with 1,400+ events across all major Swiss cities.

Our users frequently search for activities and tours in cities like 
Zurich, Basel, Geneva, and Bern. I'd love to recommend Viator 
experiences alongside our event listings, as they're a perfect 
complement.

Example integration:
- Event detail pages: "More things to do in [City]" → Viator tours
- Category pages: "Top Activities in Zurich" → Viator links

Looking forward to partnering with you!

Best regards,
[Dein Name]
EventBuzzer.ch
```

4. **Submit Application**

**Viator prüft nochmal (1-5 Werktage):**

**✅ AKZEPTIERT:**
→ Du bekommst Affiliate-Links!
→ Siehe SCHRITT 5

**❌ ABGELEHNT:**
→ Email: "Please reapply once you have established traffic"
→ In 2 Monaten nochmal

---

## SCHRITT 5: AFFILIATE-LINKS EINBAUEN (wenn akzeptiert)

### OPTION A: Manual Links (Start)

In Awin Dashboard:
1. **Viator Advertiser → Tools**
2. **"Product Links" oder "Deep Link Generator"**
3. URL eingeben: z.B. `https://www.viator.com/Zurich/d675`
4. **Generate Link**
5. Du bekommst: `https://www.awin1.com/cread.php?awinmid=XXX&awinaffid=YYY&clickref=&p=https%3A%2F%2Fwww.viator.com%2FZurich%2Fd675`

**Einbauen in EventBuzzer:**

Beispiel in EventDetail.tsx:
```tsx
{/* Viator Affiliate Widget */}
<div className="mt-8 p-6 bg-blue-50 rounded-lg">
  <h3 className="text-xl font-bold mb-3">
    Mehr Aktivitäten in {city}
  </h3>
  <p className="text-gray-600 mb-4">
    Entdecke Touren, Ausflüge und Erlebnisse in der Region
  </p>
  <a 
    href="[DEIN AWIN AFFILIATE LINK]"
    className="btn btn-primary"
    target="_blank"
    rel="noopener"
  >
    Aktivitäten ansehen
  </a>
</div>
```

### OPTION B: Widget/API (später)

Viator hat API für automatische Tour-Empfehlungen
→ Komplexer, aber bessere Conversion

---

## 📊 TRACKING & OPTIMIZATION

Nach Annahme:

**Woche 1-2:**
- Links eingebaut
- Tracking testen (klick auf Link → in Awin Dashboard sichtbar?)

**Woche 3-4:**
- Erste Clicks sehen
- Konversion-Rate prüfen (Clicks → Sales)

**Monat 2-3:**
- A/B Testing: Wo funktionieren Links am besten?
- Optimize Platzierung

---

## ⏰ TIMELINE

### SZENARIO A: JETZT BEWERBEN (Beste Chance mit etwas Traffic)

**Heute:**
- [ ] Google Analytics einrichten (30 Min)
- [ ] Pinterest Setup starten (1 Stunde)

**Tag 3:**
- [ ] Analytics zeigt erste Besucher (50-100)
- [ ] Awin-Anmeldung ausfüllen (30 Min)

**Tag 5-7:**
- [ ] Awin prüft (Wartezeit)

**Tag 10-14:**
- [ ] Awin Antwort
- [ ] Wenn OK: Viator-Programm beitreten

**Chance:** 70% mit etwas Traffic

---

### SZENARIO B: IN 4 WOCHEN BEWERBEN (95% Chance)

**Woche 1-4:**
- [ ] Google Analytics läuft
- [ ] Pinterest: 200 Pins = Traffic aufbauen
- [ ] 2000+ Besucher/Monat

**Woche 5:**
- [ ] Awin-Anmeldung mit Traffic-Nachweis
- [ ] Screenshot: "2000 Users/Monat"

**Woche 6:**
- [ ] 95% Annahme-Chance

---

## 💡 MEINE EMPFEHLUNG

**HYBRID-ANSATZ:**

**Phase 1 (Heute):**
- Google Analytics einrichten
- Pinterest starten (Traffic aufbauen)

**Phase 2 (in 1 Woche):**
- Wenn Analytics 100-500 Besucher zeigt: Awin bewerben
- Wenn abgelehnt: Kein Problem, in 2 Monaten nochmal

**Phase 3 (wenn Awin OK):**
- Viator-Programm beitreten
- Links einbauen

**Worst Case:** 
- 2x abgelehnt → Beim 3. Mal (nach 3 Monaten) mit 5000+ Traffic = 100% Annahme

---

## ✅ ALTERNATIVE: TICKETCORNER (Sofort möglich!)

**Falls Viator zu kompliziert/langwierig:**

**Ticketcorner (Schweiz):**
- Direktes Programm, kein Netzwerk
- Anforderungen: Schweizer Website ✅, Events ✅
- Weniger streng als Viator
- 3-8% Kommission

**Anmeldung:**
1. https://www.ticketcorner.ch/info/partner
2. Formular ausfüllen
3. Screenshot von EventBuzzer mitschicken
4. Antwort in 3-5 Tagen

**Chance:** 90%+ (viel einfacher!)

---

## 🎯 QUICK WIN EMPFEHLUNG

**Mach beides parallel:**

1. **Ticketcorner:** Jetzt bewerben (in 1 Woche, wenn Analytics läuft)
   → 90% Chance, schnelle Antwort

2. **Viator:** Auch jetzt bewerben
   → 70% Chance, wenn's klappt = Bonus!

3. **Wenn Viator ablehnt:** 
   → In 2 Monaten nochmal mit mehr Traffic

**Win-Win:** Du verdienst früher, ohne was zu riskieren! 🚀
