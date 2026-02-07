import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, ChevronUp, ChevronDown, MapPin, QrCode, FileText, Map, Briefcase } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTripPlanner } from '@/contexts/TripPlannerContext';
import { EventDetailModal } from '@/components/EventDetailModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScrollToTop } from '@/hooks/useScrollToTop';

// Event interface
interface Event {
  id: string;
  title: string;
  image_url?: string;
  location?: string;
  address_city?: string;
  external_id?: string;
  category_main_id?: string;
  latitude?: number;
  longitude?: number;
  short_description?: string;
  description?: string;
  venue_name?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  price_from?: number;
  ticket_url?: string;
  url?: string;
  buzz_score?: number;
}

// Timeline time points
const TIME_POINTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '20:00'];

// Helper: format duration
const formatDuration = (minutes: number): string => {
  if (!minutes) return '2h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

// Empty State Component - Simple illustration without timeline
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {/* Event Card Illustration with Briefcase */}
    <div className="w-full max-w-sm mb-8 opacity-50">
      <div className="border-2 border-slate-600 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-stretch h-24">
          {/* Image left */}
          <div className="w-32 bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0" />
          {/* Text right with briefcase */}
          <div className="flex-1 p-4 relative">
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-2.5 bg-gray-200 rounded w-16" />
            {/* Briefcase - bottom right, highlighted */}
            <div className="absolute bottom-3 right-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-slate-700 rounded-full opacity-30 animate-pulse" />
                <div className="relative bg-slate-700 text-white p-2 rounded-full">
                  <Briefcase size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
      Noch keine Events für diesen Tag
    </h3>
    <p className="text-gray-500 text-center max-w-md mb-6">
      Klicke auf das Koffersymbol bei einem Event, um es zu deiner Reise hinzuzufügen.
    </p>
    <Link
      to="/eventlist1"
      className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      <Map size={18} />
      Zu den Events
    </Link>
  </div>
);

const TripPlannerPage: React.FC = () => {
  useScrollToTop();
  const {
    plannedEventsByDay,
    setPlannedEventsByDay,
    activeDay,
    setActiveDay,
    totalDays,
    setTotalDays,
    totalEventCount,
    removeEventFromTrip,
    addDay,
    clearTrip,
    isInTrip,
    addEventToDay,
  } = useTripPlanner();

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Day switcher dropdown state
  const [openDaySwitcher, setOpenDaySwitcher] = useState<string | null>(null);
  const daySwitcherRef = useRef<HTMLDivElement>(null);

  // Current day's events
  const currentDayEvents = useMemo(
    () => plannedEventsByDay[activeDay] || [],
    [plannedEventsByDay, activeDay]
  );

  // Move event up in order
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const events = [...(plannedEventsByDay[activeDay] || [])];
    [events[index - 1], events[index]] = [events[index], events[index - 1]];
    setPlannedEventsByDay({
      ...plannedEventsByDay,
      [activeDay]: events
    });
  }, [plannedEventsByDay, activeDay, setPlannedEventsByDay]);

  // Move event down in order
  const handleMoveDown = useCallback((index: number) => {
    const dayEvents = plannedEventsByDay[activeDay] || [];
    if (index >= dayEvents.length - 1) return;
    const events = [...dayEvents];
    [events[index], events[index + 1]] = [events[index + 1], events[index]];
    setPlannedEventsByDay({
      ...plannedEventsByDay,
      [activeDay]: events
    });
  }, [plannedEventsByDay, activeDay, setPlannedEventsByDay]);

  // Move event to a different day
  const moveEventToDay = useCallback((eventId: string, fromDay: number, toDay: number) => {
    if (fromDay === toDay) return;

    const fromDayEvents = [...(plannedEventsByDay[fromDay] || [])];
    const eventToMove = fromDayEvents.find(pe => pe.eventId === eventId);

    if (!eventToMove) return;

    const updatedFromDayEvents = fromDayEvents.filter(pe => pe.eventId !== eventId);
    const toDayEvents = [...(plannedEventsByDay[toDay] || []), eventToMove];

    setPlannedEventsByDay({
      ...plannedEventsByDay,
      [fromDay]: updatedFromDayEvents,
      [toDay]: toDayEvents,
    });

    toast.success(`Event zu Tag ${toDay} verschoben`);
  }, [plannedEventsByDay, setPlannedEventsByDay]);

  // Close day switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (daySwitcherRef.current && !daySwitcherRef.current.contains(event.target as Node)) {
        setOpenDaySwitcher(null);
      }
    };

    if (openDaySwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDaySwitcher]);

  // Generate Google Maps URL with all events
  const generateGoogleMapsUrl = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay).flat();
    const validEvents = allEvents.filter(pe => pe?.event?.latitude && pe?.event?.longitude);

    if (validEvents.length < 2) return '';

    const [first, ...rest] = validEvents;
    const last = rest.pop();
    const waypoints = rest.map(pe => `${pe.event.latitude},${pe.event.longitude}`).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${first?.event.latitude},${first?.event.longitude}&destination=${last?.event.latitude},${last?.event.longitude}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    url += '&travelmode=driving';

    return url;
  }, [plannedEventsByDay]);

  // Export to Google Maps
  const handleExportToGoogleMaps = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay).flat();
    if (allEvents.length < 2) {
      toast.error('Mindestens 2 Events für Route erforderlich');
      return;
    }
    const url = generateGoogleMapsUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }, [plannedEventsByDay, generateGoogleMapsUrl]);

  // Show QR Code
  const handleShowQRCode = useCallback(() => {
    const url = generateGoogleMapsUrl();
    if (!url) {
      toast.error('Mindestens 2 Events für QR-Code erforderlich');
      return;
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, '_blank');
  }, [generateGoogleMapsUrl]);

  // Export PDF with TripPlannerModal design
  const handleExportPDF = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay || {}).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    if (validEvents.length < 2) {
      toast.error('Mindestens 2 Events erforderlich');
      return;
    }

    const url = generateGoogleMapsUrl();
    if (!url) {
      toast.error('Route konnte nicht generiert werden');
      return;
    }

    // Generate QR code URL (200x200 for PDF)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

    // Helper to truncate description at first sentence
    const truncateAtFirstSentence = (text: string): string => {
      if (!text) return '';
      const match = text.match(/^[^.!?]*[.!?]/);
      return match ? match[0] : text;
    };

    // Group events by day from plannedEventsByDay structure
    const daysCount = totalDays || 1;

    // Generate HTML for all days with timeline layout
    const daysHTML = Array.from({ length: daysCount }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      const dayLabel = `Tag ${dayNumber}`;
      const dayEvents = plannedEventsByDay?.[dayNumber] || [];
      const validDayEvents = dayEvents.filter(pe => pe && pe.event);

      if (validDayEvents.length === 0) return '';

      return `
        <div class="day-section">
          <div class="day-title">${dayLabel}</div>
          ${validDayEvents.map((pe) => {
            const shortDesc = pe.event.short_description || pe.event.description || '';
            const truncatedDesc = truncateAtFirstSentence(shortDesc);
            const location = pe.event.address_city || pe.event.location || 'Location';
            const imageUrl = pe.event.image_url || '';
            const time = pe.startTime || '09:00';
            const durationFormatted = formatDuration(pe.duration);

            return `
              <div class="event-item">
                <!-- Zone 1: Thumbnail (4:3) -->
                <div class="event-thumb">
                  ${imageUrl ? `<img src="${imageUrl}" alt="${pe.event.title}">` : ''}
                </div>
                <!-- Zone 2: Zeit (für Screen - wird in Print oben angezeigt) -->
                <div class="event-time">
                  <div>${time}</div>
                </div>
                <!-- Zone 3: Trennlinie -->
                <div class="event-separator"></div>
                <!-- Zone 4: Textblock mit Zeit oben (Print) -->
                <div class="event-content">
                  <div class="event-time-header">${time}</div>
                  <div class="event-title-line">${pe.event.title} | ${location}</div>
                  ${truncatedDesc ? `<div class="event-description">${truncatedDesc}</div>` : ''}
                  <div class="event-duration">${durationFormatted}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Trip Planner - EventBuzzer</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #1f2937;
              background: #f9f9f9;
              line-height: 1.6;
            }

            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              padding: 75px;
              border-radius: 8px;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            }

            /* HEADER */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 50px;
              gap: 30px;
            }

            .logo-text {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 40px;
              font-weight: 400;
              color: #1f2937;
              margin: 0;
              letter-spacing: 4px;
              flex: 1;
            }

            /* QR Container - Rechts */
            .qr-container {
              display: flex;
              flex-direction: row;
              align-items: flex-start;
              gap: 5px;
              flex-shrink: 0;
              margin-right: 20px;
              height: 90px;
            }

            .qr-code {
              width: 90px;
              height: 90px;
              border: none;
              border-radius: 0px;
              display: block;
              flex-shrink: 0;
            }

            .qr-text {
              text-align: left;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 90px;
              gap: 0;
              padding: 0;
              margin: 0;
            }

            .qr-text strong {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 14px;
              font-weight: 400;
              color: #1f2937;
              line-height: 1.1;
              letter-spacing: 0.3px;
              display: block;
              white-space: normal;
              margin: 0;
              padding: 0;
            }

            .qr-text span {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.2;
              letter-spacing: 0.2px;
              display: block;
              white-space: normal;
              margin: 0;
              padding: 0;
            }

            /* DAYS CONTAINER */
            .days-container {
              display: flex;
              flex-direction: column;
              gap: 28px;
            }

            /* DAY SECTION */
            .day-section {
              border: 2px solid #9ca3af;
              border-radius: 15px;
              padding: 28px;
              page-break-inside: avoid;
              background: white;
            }

            .day-title {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 24px;
              font-weight: 400;
              color: #1f2937;
              margin: 0 0 24px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            /* EVENT ITEMS - 4 Zonen */
            .event-item {
              display: flex;
              gap: 14px;
              margin-bottom: 20px;
              align-items: stretch;
            }

            .event-item:last-child {
              margin-bottom: 0;
            }

            /* Zone 1: Thumbnail */
            .event-thumb {
              flex-shrink: 0;
              width: 80px;
              height: 60px;
              border-radius: 12px;
              overflow: hidden;
              background: #e5e7eb;
            }

            .event-thumb img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }

            /* Zone 2: Zeit */
            .event-time {
              flex-shrink: 0;
              width: 50px;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              padding-right: 8px;
            }

            .event-time div {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 14px;
              font-weight: 400;
              color: #1f2937;
              line-height: 1;
              letter-spacing: 0.3px;
            }

            /* Zone 3: Trennlinie */
            .event-separator {
              width: 2.5px;
              background: #d1d5db;
              flex-shrink: 0;
              margin: 0 10px;
            }

            /* Zone 4: Textblock */
            .event-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .event-title-line {
              font-family: Georgia, 'Playfair Display', serif;
              font-size: 18px;
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 6px;
              line-height: 1.3;
              letter-spacing: 0.3px;
            }

            .event-description {
              font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 3px;
              line-height: 1.4;
              letter-spacing: 0.2px;
            }

            .event-duration {
              font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
              font-size: 12px;
              color: #9ca3af;
              line-height: 1.3;
              letter-spacing: 0.1px;
            }

            /* FOOTER */
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 10px;
            }

            /* Hide subtext in screen version, show only in print */
            .logo-subtext {
              display: none;
            }

            /* Zeit über Titel im Print - initially hidden */
            .event-time-header {
              display: none;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
                background: white;
                line-height: 1.6;
              }

              .container {
                width: 212.5mm;
                margin: 0 auto;
                padding: 6mm;
                max-width: 100%;
                background: white;
                box-shadow: none;
                border-radius: 0;
                box-sizing: border-box;
              }

              /* HEADER */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10mm;
                gap: 10mm;
              }

              .logo-text {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 20pt;
                font-weight: 400;
                color: #1f2937;
                margin: 0 0 0.5mm 0;
                letter-spacing: 2pt;
                flex: 1;
              }

              .logo-subtext {
                display: block;
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 9pt;
                color: #aaa;
                letter-spacing: 0.3pt;
              }

              /* QR Container - Exact sizing for print */
              .qr-container {
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                gap: 5mm;
                flex-shrink: 0;
                width: auto;
                height: auto;
              }

              .qr-code {
                width: 25mm;
                height: 25mm;
                border: none;
                display: block;
                flex-shrink: 0;
              }

              .qr-text {
                text-align: left;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 25mm;
                gap: 0;
              }

              .qr-text strong {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 11pt;
                font-weight: 400;
                color: #1f2937;
                line-height: 1.2;
                letter-spacing: 0.2pt;
                display: block;
                margin: 0;
                padding: 0;
              }

              .qr-text span {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 10pt;
                color: #6b7280;
                line-height: 1.3;
                letter-spacing: 0.1pt;
                display: block;
                margin: 0;
                padding: 0;
              }

              /* DAYS CONTAINER */
              .days-container {
                display: flex;
                flex-direction: column;
                gap: 10mm;
              }

              /* DAY SECTION - Super schmal Padding für 25% mehr Platz */
              .day-section {
                width: 100%;
                border: 1pt solid #d1d5db;
                border-radius: 6pt;
                padding: 6mm;
                margin: 0 0 8mm 0;
                page-break-inside: avoid;
                background: white;
                box-sizing: border-box;
              }

              .day-title {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 14pt;
                font-weight: 400;
                color: #1f2937;
                margin: 0 0 5mm 0;
                letter-spacing: 1pt;
                text-transform: uppercase;
              }

              /* EVENT ITEMS - LAYOUT: Zeit-LINKS | Bild | TEXT-dominant */
              .event-item {
                display: flex;
                gap: 4mm;
                margin-bottom: 5mm;
                align-items: flex-start;
              }

              .event-item:last-child {
                margin-bottom: 0;
              }

              /* Spalte 1: Zeit - HIDDEN (wird oben in Text angezeigt) */
              .event-time {
                display: none !important;
              }

              .event-time div {
                display: none !important;
              }

              /* Zeit über Titel im Print */
              .event-time-header {
                display: block;
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 8pt;
                font-weight: 600;
                color: #999;
                line-height: 1;
                letter-spacing: 0pt;
                margin-bottom: 1mm;
              }

              /* Spalte 2: Thumbnail - NEBEN Zeit (links vom Text), klein */
              .event-thumb {
                flex-shrink: 0;
                width: 25mm;
                height: 18.75mm;
                border-radius: 3pt;
                overflow: hidden;
                background: #e5e7eb;
              }

              .event-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              }

              /* Spalte 3: Trennlinie - Minimal */
              .event-separator {
                display: none;
              }

              /* Spalte 4: Textblock - DOMINANT, das Hauptelement */
              .event-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
              }

              .event-title-line {
                font-family: Georgia, 'Playfair Display', serif;
                font-size: 9.5pt;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 1mm;
                line-height: 1.2;
                letter-spacing: 0.2pt;
              }

              .event-description {
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 8.5pt;
                color: #555;
                margin-bottom: 1mm;
                line-height: 1.4;
                letter-spacing: 0.1pt;
              }

              .event-duration {
                font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
                font-size: 8pt;
                color: #9ca3af;
                line-height: 1.3;
                letter-spacing: 0pt;
              }

              /* FOOTER - HIDDEN */
              .footer {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header with Logo and QR -->
            <div class="header">
              <div>
                <h1 class="logo-text">EventBuzzer</h1>
                <div class="logo-subtext">Geplant mit eventbuzzer.com</div>
              </div>
              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="Route QR Code" class="qr-code">
                <div class="qr-text">
                  <strong>Mit Handy scannen<br>für Google Maps</strong>
                  <span>Öffne die komplette Route<br>mit allen Zwischenstationen</span>
                </div>
              </div>
            </div>

            <!-- Days Container - all stacked vertically -->
            <div class="days-container">
              ${daysHTML}
            </div>

            <!-- Footer -->
            <div class="footer">
              Erstellt mit EventBuzzer Trip Planner • www.eventbuzzer.ch
            </div>
          </div>
        </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '', 'width=1400,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 1000);

      toast.success('PDF-Vorschau geöffnet. Speichern unter "Drucken" → "Als PDF speichern"');
    } else {
      toast.error('Popup-Fenster konnte nicht geöffnet werden');
    }
  }, [plannedEventsByDay, generateGoogleMapsUrl, totalDays]);

  // Save trip (just shows toast - data is already in localStorage via context)
  const handleSaveTrip = useCallback(() => {
    toast.success('Reise gespeichert!');
  }, []);

  // Toggle event in trip (for EventDetailModal)
  const handleToggleTrip = useCallback((event: Event) => {
    if (isInTrip(event.id)) {
      removeEventFromTrip(event.id);
      toast(`${event.title} aus der Reise entfernt`);
    } else {
      addEventToDay(event, activeDay);
      toast(`${event.title} zu Tag ${activeDay} hinzugefügt`);
    }
  }, [isInTrip, removeEventFromTrip, addEventToDay, activeDay]);

  // Open event detail modal
  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEvent(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <Helmet>
        <title>Mein Reiseplaner | EventBuzzer</title>
        <meta name="description" content="Plane deine Reise mit EventBuzzer. Organisiere Events nach Tagen und exportiere als PDF oder Google Maps Route." />
      </Helmet>

      <Navbar />

      <main className="mx-auto px-2 xl:px-4 py-8">
        {/* Header */}
        <div className="mb-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mein Reiseplaner</h1>
          <p className="text-gray-500">
            {totalEventCount === 0
              ? 'Füge Events hinzu, um deine Reise zu planen'
              : `${totalEventCount} Event${totalEventCount !== 1 ? 's' : ''} geplant`}
          </p>
        </div>

        {/* Content - All Days Grid */}
        {totalEventCount === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <EmptyState />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto">
            {[1, 2, 3].map((day) => {
              const dayEvents = plannedEventsByDay[day] || [];
              return (
                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full">
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Tag {day}</h3>
                    <span className="text-xs text-gray-500">{dayEvents.length} Event{dayEvents.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Timeline + Events OR Empty State */}
                  {dayEvents.length > 0 ? (
                    <div className="relative pt-[15px]">
                      <div className="space-y-3 md:space-y-4 relative z-10">
                        {dayEvents.map((pe, index) => (
                          <div key={pe.eventId} className="relative group">
                            {/* Time ABOVE card at all breakpoints */}
                            <div className="flex flex-col gap-1 md:w-[240px] md:mx-auto lg:w-auto lg:mx-0">
                              {/* Time Label */}
                              <div className="text-xs font-semibold text-gray-600 mb-1">
                                {TIME_POINTS[index] || '—'}
                              </div>

                              {/* Event Card - VERTICAL at all breakpoints, centered */}
                              <div
                                onClick={() => handleEventClick(pe.event)}
                                className="p-2 rounded-lg border border-gray-300 md:border-2 md:border-gray-500 bg-white hover:border-gray-400 md:hover:border-gray-600 transition-all cursor-pointer flex flex-col gap-2 w-full flex-shrink-0"
                              >
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                  {pe.event.image_url && (
                                    <img
                                      src={pe.event.image_url}
                                      alt={pe.event.title}
                                      className="w-full aspect-[3/1] rounded-md object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                      {pe.event.title}
                                    </p>
                                    {(pe.event.location || pe.event.address_city) && (
                                      <p className="text-[10px] md:text-xs text-gray-600 truncate">
                                        {pe.event.location || pe.event.address_city}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Duration + Action Buttons in same row */}
                                <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
                                  {/* Duration Badge */}
                                  {pe.duration && (
                                    <span className="inline-block px-1.5 py-0.5 md:px-2.5 rounded-full bg-gray-50 text-[10px] md:text-xs text-gray-600 font-medium border border-gray-200">
                                      {pe.duration >= 90 ? (
                                        pe.duration % 60 > 0 ? `${Math.floor(pe.duration / 60)}h ${pe.duration % 60}m` : `${Math.floor(pe.duration / 60)}h`
                                      ) : (
                                        `${pe.duration}m`
                                      )}
                                    </span>
                                  )}

                                  {/* Trash Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeEventFromTrip(pe.eventId);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-0.5 xl:p-1"
                                    title="Entfernen"
                                  >
                                    <Trash2 size={14} className="xl:w-4 xl:h-4" />
                                  </button>

                                  {/* Up Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (index > 0) {
                                        const newEvents = [...dayEvents];
                                        [newEvents[index - 1], newEvents[index]] = [newEvents[index], newEvents[index - 1]];
                                        setPlannedEventsByDay({ ...plannedEventsByDay, [day]: newEvents });
                                      }
                                    }}
                                    className="p-0.5 xl:p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                                    title="Nach oben"
                                  >
                                    <ChevronUp size={14} className="xl:w-4 xl:h-4" />
                                  </button>

                                  {/* Day Switcher - Simple Dot */}
                                  <div className="relative" ref={openDaySwitcher === pe.eventId ? daySwitcherRef : null}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDaySwitcher(openDaySwitcher === pe.eventId ? null : pe.eventId);
                                      }}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                                      title="Tag wechseln"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    </button>

                                    {/* Dropdown */}
                                    {openDaySwitcher === pe.eventId && (
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[60px]">
                                        {Array.from({ length: totalDays }, (_, i) => i + 1).map((targetDay) => (
                                          <button
                                            key={targetDay}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              moveEventToDay(pe.eventId, day, targetDay);
                                              setOpenDaySwitcher(null);
                                            }}
                                            className={cn(
                                              "w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors flex items-center justify-between",
                                              targetDay === day && "bg-blue-50 text-blue-700 font-medium"
                                            )}
                                          >
                                            <span>Tag {targetDay}</span>
                                            {targetDay === day && <span className="text-blue-600">✓</span>}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Down Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (index < dayEvents.length - 1) {
                                        const newEvents = [...dayEvents];
                                        [newEvents[index], newEvents[index + 1]] = [newEvents[index + 1], newEvents[index]];
                                        setPlannedEventsByDay({ ...plannedEventsByDay, [day]: newEvents });
                                      }
                                    }}
                                    className="p-0.5 xl:p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                                    title="Nach unten"
                                  >
                                    <ChevronDown size={14} className="xl:w-4 xl:h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {totalEventCount > 0 && (
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleSaveTrip}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Briefcase size={18} />
              <span className="text-sm font-medium">Speichern</span>
            </button>
            <button
              onClick={handleExportToGoogleMaps}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Map size={18} />
              <span className="text-sm font-medium">Google Maps</span>
            </button>
            <button
              onClick={handleShowQRCode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <QrCode size={18} />
              <span className="text-sm font-medium">QR-Code</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <FileText size={18} />
              <span className="text-sm font-medium">Als PDF</span>
            </button>
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={closeModal}
          plannedEventsByDay={plannedEventsByDay}
          activeDay={activeDay}
          onToggleTrip={handleToggleTrip}
        />
      )}
    </div>
  );
};

export default TripPlannerPage;
