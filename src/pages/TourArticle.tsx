import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { ARTICLES, getArticleBySlug, getArticleByEnSlug } from "@/config/articles";
import Navbar from "@/components/Navbar";
import { ChevronRight, Clock, MapPin, QrCode, FileText } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  image_url?: string;
  description?: string;
  price_from?: number;
  address_city?: string;
  venue_name?: string;
  [key: string]: any;
}

interface TourStop {
  title: string;
  time: string; // e.g. "2 Stunden"
  price: string; // e.g. "CHF 28"
  description: string;
  travelToNext: string; // e.g. "10 Min. mit dem Bus zu Villa Wenkenhof"
  event?: Event;
  isIntro?: boolean; // "Altstadt Basel" intro section
}

function parseTourStops(markdown: string): { intro: string; stops: TourStop[]; practicalInfo: string } {
  const lines = markdown.split("\n");
  let intro = "";
  const stops: TourStop[] = [];
  let practicalInfo = "";
  let currentStop: TourStop | null = null;
  let inPracticalInfo = false;
  let introFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect "Praktische Infos" section
    if (line.startsWith("## Praktische Infos")) {
      if (currentStop) stops.push(currentStop);
      currentStop = null;
      inPracticalInfo = true;
      continue;
    }

    if (inPracticalInfo) {
      practicalInfo += line + "\n";
      continue;
    }

    // Detect h2 headings
    if (line.startsWith("## ")) {
      if (currentStop) stops.push(currentStop);

      const title = line.replace("## ", "").trim();

      // "Altstadt Basel" is an intro section, not a stop
      if (title.includes("Altstadt")) {
        currentStop = {
          title,
          time: "",
          price: "",
          description: "",
          travelToNext: "",
          isIntro: true,
        };
        continue;
      }

      currentStop = {
        title,
        time: "",
        price: "",
        description: "",
        travelToNext: "",
      };
      introFound = true;
      continue;
    }

    // Before first heading = intro
    if (!introFound && !currentStop) {
      intro += line + "\n";
      continue;
    }

    if (!currentStop) continue;

    // Parse time pill line: ⏱️ **2 Stunden** | 🎟️ CHF 28
    if (line.includes("⏱️")) {
      const timeMatch = line.match(/⏱️\s*\*\*([^*]+)\*\*/);
      if (timeMatch) currentStop.time = timeMatch[1].trim();

      // Extract price (everything after the first |)
      const priceParts = line.split("|").slice(1).map(p => p.trim());
      if (priceParts.length > 0) {
        currentStop.price = priceParts
          .map(p => p.replace(/🎟️|☕|🆓|🍰|🚢|🍷|🍽️|🗼|🎫/g, "").trim())
          .join(" | ");
      }
      continue;
    }

    // Parse travel lines: *→ 10 Min. mit dem Bus...*
    if (line.startsWith("*→") || line.startsWith("*→")) {
      currentStop.travelToNext = line.replace(/^\*→\s*/, "").replace(/\*$/, "").trim();
      continue;
    }

    // Regular description lines
    if (line.trim() && currentStop) {
      if (currentStop.description) currentStop.description += " ";
      // Strip markdown bold
      currentStop.description += line.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    }
  }

  if (currentStop) stops.push(currentStop);

  return { intro: intro.trim(), stops, practicalInfo: practicalInfo.trim() };
}

export default function TourArticle({ lang = "de", slug: propSlug }: { lang?: string; slug?: string }) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = propSlug || paramSlug;
  const [content, setContent] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const article = useMemo(() => {
    if (!slug) return undefined;
    return lang === "en" ? getArticleByEnSlug(slug) : getArticleBySlug(slug);
  }, [slug, lang]);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const contentPath =
          lang === "en"
            ? `/articles/en/${article?.slugEn}.md`
            : `/articles/${article?.slug}.md`;

        const response = await fetch(contentPath);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        }

        if (article?.eventIds && article.eventIds.length > 0) {
          const { data, error } = await externalSupabase
            .from("events")
            .select("*")
            .in("id", article.eventIds);

          if (!error && data) {
            const orderedEvents = article.eventIds
              .map(id => data.find(e => String(e.id) === id))
              .filter(Boolean) as Event[];
            setEvents(orderedEvents);
          }
        }
      } catch (err) {
        console.error("Error loading tour:", err);
      } finally {
        setLoading(false);
      }
    };

    if (article) loadContent();
  }, [article, lang]);

  if (!article) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  const { intro, stops, practicalInfo } = parseTourStops(content);

  // Match events to stops sequentially (skip intro stops)
  let eventIdx = 0;
  const stopsWithEvents = stops.map(stop => {
    if (stop.isIntro) return stop;
    if (eventIdx < events.length) {
      return { ...stop, event: events[eventIdx++] };
    }
    return stop;
  });

  // Generate Google Maps route URL from all events with coordinates
  const generateGoogleMapsUrl = () => {
    const validEvents = events.filter(e => e.latitude && e.longitude);
    if (validEvents.length < 2) return '';
    const [first, ...rest] = validEvents;
    const last = rest.pop();
    const waypoints = rest.map(e => `${e.latitude},${e.longitude}`).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${first.latitude},${first.longitude}&destination=${last?.latitude},${last?.longitude}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    url += '&travelmode=transit';
    return url;
  };

  const handleShowQRCode = () => {
    const url = generateGoogleMapsUrl();
    if (!url) { toast.error('Nicht genug Standorte für QR-Code'); return; }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, '_blank');
  };

  const handleExportPDF = () => {
    const validEvents = events.filter(e => e.latitude && e.longitude);
    if (validEvents.length < 2) { toast.error('Nicht genug Events für PDF'); return; }
    const mapsUrl = generateGoogleMapsUrl();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapsUrl)}`;

    const truncate = (text: string) => {
      if (!text) return '';
      const match = text.match(/^[^.!?]*[.!?]/);
      return match ? match[0] : text;
    };

    const stopsHTML = stopsWithEvents.filter(s => !s.isIntro).map((stop) => {
      const ev = stop.event;
      const addr = [ev?.address_street, ev?.address_zip && ev?.address_city ? `${ev.address_zip} ${ev.address_city}` : ev?.address_city].filter(Boolean).join(', ');
      return `
        <div class="event-item">
          <div class="event-thumb">${ev?.image_url ? `<img src="${ev.image_url}" alt="${stop.title}">` : ''}</div>
          <div class="event-separator"></div>
          <div class="event-content">
            <div class="event-time-header">${stop.time || ''}</div>
            <div class="event-title-line">${stop.title}${addr ? ` | ${addr}` : ''}</div>
            ${stop.description ? `<div class="event-description">${truncate(stop.description)}</div>` : ''}
            ${stop.price ? `<div class="event-duration">${stop.price}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${article.title} - EventBuzzer</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; background: #f9f9f9; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 75px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; gap: 30px; }
        .logo-text { font-family: Georgia, 'Playfair Display', serif; font-size: 40px; font-weight: 400; color: #1f2937; margin: 0; letter-spacing: 4px; flex: 1; }
        .logo-subtext { display: none; }
        .qr-container { display: flex; flex-direction: row; align-items: flex-start; gap: 5px; flex-shrink: 0; margin-right: 20px; height: 90px; }
        .qr-code { width: 90px; height: 90px; border: none; display: block; flex-shrink: 0; }
        .qr-text { text-align: left; display: flex; flex-direction: column; justify-content: space-between; height: 90px; }
        .qr-text strong { font-family: Georgia, serif; font-size: 14px; font-weight: 400; color: #1f2937; line-height: 1.1; }
        .qr-text span { font-family: Georgia, serif; font-size: 12px; color: #6b7280; line-height: 1.2; }
        .tour-title { font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #1f2937; margin: 0 0 24px 0; letter-spacing: 1px; }
        .day-section { border: 2px solid #9ca3af; border-radius: 15px; padding: 28px; }
        .event-item { display: flex; gap: 14px; margin-bottom: 20px; align-items: stretch; page-break-inside: avoid; }
        .event-item:last-child { margin-bottom: 0; }
        .event-thumb { flex-shrink: 0; width: 80px; height: 60px; border-radius: 12px; overflow: hidden; background: #e5e7eb; }
        .event-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .event-separator { width: 2.5px; background: #d1d5db; flex-shrink: 0; margin: 0 10px; }
        .event-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .event-time-header { font-family: Georgia, serif; font-size: 12px; font-weight: 600; color: #999; margin-bottom: 2px; }
        .event-title-line { font-family: Georgia, serif; font-size: 18px; font-weight: 500; color: #1f2937; margin-bottom: 6px; line-height: 1.3; }
        .event-description { font-size: 13px; color: #6b7280; margin-bottom: 3px; line-height: 1.4; }
        .event-duration { font-size: 12px; color: #9ca3af; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .container { width: 212.5mm; margin: 0 auto; padding: 6mm; max-width: 100%; box-shadow: none; border-radius: 0; }
          .header { margin-bottom: 10mm; gap: 10mm; }
          .logo-text { font-size: 20pt; letter-spacing: 2pt; }
          .logo-subtext { display: block; font-size: 9pt; color: #aaa; }
          .qr-container { gap: 5mm; height: auto; }
          .qr-code { width: 25mm; height: 25mm; }
          .qr-text { height: 25mm; }
          .qr-text strong { font-size: 11pt; }
          .qr-text span { font-size: 10pt; }
          .tour-title { font-size: 14pt; margin-bottom: 5mm; }
          .day-section { border: none; border-radius: 0; padding: 0; }
          .event-item { gap: 4mm; margin-bottom: 5mm; page-break-inside: avoid; }
          .event-thumb { width: 25mm; height: 18.75mm; border-radius: 3pt; }
          .event-separator { display: none; }
          .event-time-header { font-size: 8pt; margin-bottom: 1mm; }
          .event-title-line { font-size: 9.5pt; font-weight: 700; margin-bottom: 1mm; }
          .event-description { font-size: 8.5pt; margin-bottom: 1mm; }
          .event-duration { font-size: 8pt; }
          .footer { display: none !important; }
        }
      </style></head><body><div class="container">
        <div class="header">
          <div><h1 class="logo-text">EventBuzzer</h1><div class="logo-subtext">Geplant mit eventbuzzer.com</div></div>
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="Route QR Code" class="qr-code">
            <div class="qr-text"><strong>Mit Handy scannen<br>für Google Maps</strong><span>Öffne die komplette Route<br>mit allen Zwischenstationen</span></div>
          </div>
        </div>
        <h2 class="tour-title">${article.title}</h2>
        <div class="day-section">${stopsHTML}</div>
        <div class="footer">Erstellt mit EventBuzzer Magazin • www.eventbuzzer.ch</div>
      </div></body></html>`;

    const printWindow = window.open('', '', 'width=1400,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 1000);
      toast.success('PDF-Vorschau geöffnet. Speichern unter "Drucken" → "Als PDF speichern"');
    } else {
      toast.error('Popup-Fenster konnte nicht geöffnet werden');
    }
  };

  return (
    <>
      <Helmet>
        <title>{article.title} | EventBuzzer</title>
        <meta name="description" content={article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:image" content={article.heroImage} />
        <link rel="canonical" href={`/${lang === "en" ? "en/magazine" : "magazin"}/${slug}`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-[#f8f6f1]">
        {/* Hero Section */}
        <div className="relative w-full h-[500px] overflow-hidden">
          <img
            src={article.heroImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <p className="text-amber-300 text-sm font-medium tracking-widest uppercase mb-3">
              {lang === "en" ? "Day Tour Basel" : "Tagestour Basel"}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 max-w-3xl">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span>{article.readingTime} {lang === "en" ? "min read" : "Min. Lesezeit"}</span>
              <span>|</span>
              <span>{stopsWithEvents.filter(s => !s.isIntro).length} Stops</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a href={lang === "en" ? "/en/magazine" : "/magazin"} className="hover:text-foreground transition-colors">
              {lang === "en" ? "Magazine" : "Magazin"}
            </a>
            <ChevronRight size={12} />
            <span className="text-foreground">{article.title}</span>
          </div>
        </div>

        {/* Intro */}
        {intro && (
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <p className="text-lg text-muted-foreground leading-relaxed">{intro}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {stopsWithEvents.map((stop, idx) => {
            const isLast = idx === stopsWithEvents.length - 1;

            // Intro section (like "Altstadt Basel")
            if (stop.isIntro) {
              return (
                <div key={idx} className="relative pl-12 md:pl-16 mb-8">
                  {/* Timeline dot - centered on card */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center z-10">
                    <MapPin size={16} className="text-amber-700" />
                  </div>
                  {/* Connector line */}
                  <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-[2px] bg-amber-300" />

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h2 className="text-xl font-serif font-bold text-amber-900 mb-2">{stop.title}</h2>
                    <p className="text-sm text-amber-800/80">{stop.description}</p>
                  </div>
                </div>
              );
            }

            const event = stop.event;

            // Build full address: street, PLZ city
            const addressParts: string[] = [];
            if (event?.address_street?.trim()) addressParts.push(event.address_street.trim());
            if (event?.address_zip?.trim() && event?.address_city?.trim()) {
              addressParts.push(`${event.address_zip.trim()} ${event.address_city.trim()}`);
            } else if (event?.address_city?.trim()) {
              addressParts.push(event.address_city.trim());
            }
            const fullAddress = addressParts.join(", ");

            return (
              <div key={idx} className="relative pl-12 md:pl-16">
                {/* Connector line (not on last item) */}
                {!isLast && (
                  <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-[2px] bg-amber-300" />
                )}

                {/* Card wrapper - relative for dot centering */}
                <div className="relative mb-4">
                  {/* Timeline dot with number - centered vertically on card */}
                  <div className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-600 text-white flex items-center justify-center z-10 font-bold text-sm">
                    {idx + 1 - stopsWithEvents.filter((s, i) => i < idx && s.isIntro).length}
                  </div>

                  {/* Stop Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Photo */}
                    {event?.image_url && (
                      <div className="md:w-2/5 h-[220px] md:h-auto overflow-hidden flex-shrink-0">
                        <img
                          src={event.image_url}
                          alt={stop.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col">
                      {/* Time pill */}
                      {stop.time && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 font-medium mb-2">
                          <Clock size={14} />
                          <span>{stop.time}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-lg md:text-xl font-serif font-bold text-gray-900 mb-1">
                        {stop.title}
                      </h2>

                      {/* Full address: street, PLZ city */}
                      {fullAddress && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {fullAddress}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4 flex-1">
                        {stop.description}
                      </p>

                      {/* Price */}
                      {stop.price && (
                        <div className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2 inline-block">
                          {stop.price}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                {/* Travel connector */}
                {stop.travelToNext && !isLast && (
                  <div className="relative pl-4 pb-6 pt-2">
                    <div className="flex items-center gap-2 text-xs text-amber-700/70 italic">
                      <span>→</span>
                      <span>{stop.travelToNext}</span>
                    </div>
                  </div>
                )}

                {/* Spacing if no travel info */}
                {!stop.travelToNext && !isLast && <div className="pb-6" />}
              </div>
            );
          })}
        </div>

        {/* Praktische Infos */}
        {practicalInfo && (
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                {lang === "en" ? "Practical Information" : "Praktische Infos"}
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                {practicalInfo.split("\n").filter(l => l.trim()).map((line, i) => (
                  <p key={i}>{line.replace(/^-\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1")}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation to other articles */}
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h3 className="text-xl font-serif font-bold mb-6 text-gray-900">
            {lang === "en" ? "More in Magazine" : "Mehr im Magazin"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARTICLES.filter(a => a.slug !== article.slug)
              .slice(0, 2)
              .map(a => (
                <a
                  key={a.slug}
                  href={lang === "en" ? `/en/magazine/${a.slugEn}` : `/magazin/${a.slug}`}
                  className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <h4 className="font-serif font-bold group-hover:text-amber-700 transition-colors">
                    {lang === "en" ? a.titleEn : a.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {lang === "en" ? a.descriptionEn : a.description}
                  </p>
                </a>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="container mx-auto px-4 pb-12 max-w-3xl">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleShowQRCode}
              className="flex flex-col items-center justify-center w-36 h-20 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <QrCode size={20} className="mb-1" />
              <span className="text-xs font-medium text-center leading-tight">{lang === "en" ? "QR Code for\nGoogle Maps" : "QR-Code für\nGoogle Maps"}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex flex-col items-center justify-center w-36 h-20 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              <FileText size={20} className="mb-1" />
              <span className="text-xs font-medium text-center leading-tight">{lang === "en" ? "Export\nas PDF" : "Tour als\nPDF speichern"}</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
