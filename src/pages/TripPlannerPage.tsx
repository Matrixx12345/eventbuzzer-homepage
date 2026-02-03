import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, ChevronUp, ChevronDown, MapPin, QrCode, FileText, Map, Briefcase } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTripPlanner } from '@/contexts/TripPlannerContext';
import { EventDetailModal } from '@/components/EventDetailModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

// Empty State Component - zeigt echte Event-Karte mit Timeline
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {/* Timeline with Real Event Card Example */}
    <div className="w-full max-w-lg mb-8">
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-1 bg-blue-900" />

        {/* Time Slot - Example Event */}
        <div className="flex items-start gap-4 mb-4">
          {/* Time + Dot */}
          <div className="flex flex-col items-center w-12 flex-shrink-0 relative z-10">
            <span className="text-xs text-gray-500 font-semibold mb-2">11:00</span>
            <div className="w-4 h-4 rounded-full bg-blue-900 border-2 border-white shadow-sm" />
          </div>

          {/* Event Card - Like EventList1 (Horizontal) */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex gap-4 items-start">
              {/* Image left */}
              <div className="w-24 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md flex-shrink-0 flex items-center justify-center">
                <MapPin size={24} className="text-gray-500" />
              </div>

              {/* Content right */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">Event Beispiel</h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                  <MapPin size={12} />
                  Bern
                </p>
                <p className="text-xs text-gray-500">2 Stunden</p>
              </div>

              {/* Briefcase button */}
              <div className="flex-shrink-0">
                <button className="relative p-2.5 rounded-full bg-blue-900 text-white hover:bg-blue-950 transition-colors">
                  <Briefcase size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
      Dein Reiseplaner ist noch leer
    </h3>
    <p className="text-gray-600 text-center max-w-md mb-8">
      Klicke auf das Koffersymbol bei einem Event, um es zu deiner Reise hinzuzufügen.
    </p>
    <Link
      to="/eventlist1"
      className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      <Map size={18} />
      Zu den Events
    </Link>
  </div>
);

const TripPlannerPage: React.FC = () => {
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

  // Current day's events
  const currentDayEvents = useMemo(
    () => plannedEventsByDay[activeDay] || [],
    [plannedEventsByDay, activeDay]
  );

  // Move event up in order
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const events = [...currentDayEvents];
    [events[index - 1], events[index]] = [events[index], events[index - 1]];
    setPlannedEventsByDay({
      ...plannedEventsByDay,
      [activeDay]: events
    });
  }, [currentDayEvents, plannedEventsByDay, activeDay, setPlannedEventsByDay]);

  // Move event down in order
  const handleMoveDown = useCallback((index: number) => {
    if (index >= currentDayEvents.length - 1) return;
    const events = [...currentDayEvents];
    [events[index], events[index + 1]] = [events[index + 1], events[index]];
    setPlannedEventsByDay({
      ...plannedEventsByDay,
      [activeDay]: events
    });
  }, [currentDayEvents, plannedEventsByDay, activeDay, setPlannedEventsByDay]);

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

  // Export PDF
  const handleExportPDF = useCallback(() => {
    const allEvents = Object.values(plannedEventsByDay).flat();
    const validEvents = allEvents.filter(pe => pe && pe.event);

    if (validEvents.length < 2) {
      toast.error('Mindestens 2 Events erforderlich');
      return;
    }

    const url = generateGoogleMapsUrl();
    const qrCodeUrl = url ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}` : '';

    // Helper to truncate description at first sentence
    const truncateAtFirstSentence = (text: string): string => {
      if (!text) return '';
      const match = text.match(/^[^.!?]*[.!?]/);
      return match ? match[0] : text;
    };

    // Generate HTML for all days
    const daysHTML = Array.from({ length: totalDays }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      const dayLabel = `Tag ${dayNumber}`;
      const dayEvents = plannedEventsByDay[dayNumber] || [];

      if (dayEvents.length === 0) return '';

      return `
        <div style="margin-bottom: 32px;">
          <h3 style="font-family: Georgia, serif; font-size: 18px; color: #1f2937; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
            ${dayLabel}
          </h3>
          ${dayEvents.map((pe, index) => {
            const shortDesc = pe.event.short_description || pe.event.description || '';
            const truncatedDesc = truncateAtFirstSentence(shortDesc);
            const location = pe.event.address_city || pe.event.location || '';
            const imageUrl = pe.event.image_url || '';

            return `
              <div style="display: flex; gap: 16px; margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                ${imageUrl ? `<img src="${imageUrl}" alt="${pe.event.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">` : ''}
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">${index + 1}. ${pe.event.title}</div>
                  ${location ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📍 ${location}</div>` : ''}
                  ${truncatedDesc ? `<div style="font-size: 12px; color: #9ca3af;">${truncatedDesc}</div>` : ''}
                  <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">⏱️ ${formatDuration(pe.duration)}</div>
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
          <title>Mein Reiseplaner - EventBuzzer</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1f2937; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .logo { font-family: Georgia, serif; font-size: 28px; letter-spacing: 2px; }
            .logo-subtext { font-size: 12px; color: #9ca3af; }
            .qr-section { text-align: center; }
            .qr-section img { width: 100px; height: 100px; }
            .qr-text { font-size: 10px; color: #6b7280; margin-top: 4px; }
            @media print {
              body { margin: 20mm; }
              .container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="logo">EventBuzzer</div>
                <div class="logo-subtext">Geplant mit eventbuzzer.com</div>
              </div>
              ${qrCodeUrl ? `
                <div class="qr-section">
                  <img src="${qrCodeUrl}" alt="QR Code">
                  <div class="qr-text">Scan für Google Maps Route</div>
                </div>
              ` : ''}
            </div>
            ${daysHTML}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }, [plannedEventsByDay, totalDays, generateGoogleMapsUrl]);

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mein Reiseplaner</h1>
          <p className="text-gray-500">
            {totalEventCount === 0
              ? 'Füge Events hinzu, um deine Reise zu planen'
              : `${totalEventCount} Event${totalEventCount !== 1 ? 's' : ''} geplant`}
          </p>
        </div>

        {/* Day Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-1 p-3 border-b border-gray-100 overflow-x-auto">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const dayEventCount = (plannedEventsByDay[day] || []).length;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap',
                    activeDay === day
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Tag {day}
                  {dayEventCount > 0 && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      activeDay === day ? 'bg-blue-800' : 'bg-gray-300'
                    )}>
                      {dayEventCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Add Day Button */}
            {totalDays < 4 && (
              <button
                onClick={addDay}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tag hinzufügen"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {totalEventCount === 0 ? (
              <EmptyState />
            ) : currentDayEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">Keine Events für Tag {activeDay}</p>
                <p className="text-sm">Füge Events über die Event-Seite hinzu oder wechsle zu einem anderen Tag.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentDayEvents.map((pe, index) => (
                  <div
                    key={pe.eventId}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleEventClick(pe.event)}
                  >
                    {/* Order Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Image */}
                    {pe.event.image_url && (
                      <img
                        src={pe.event.image_url}
                        alt={pe.event.title}
                        className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{pe.event.title}</h3>
                      {(pe.event.address_city || pe.event.location) && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={12} />
                          {pe.event.address_city || pe.event.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDuration(pe.duration)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          index === 0 ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                        )}
                        title="Nach oben"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index >= currentDayEvents.length - 1}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          index >= currentDayEvents.length - 1 ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                        )}
                        title="Nach unten"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => removeEventFromTrip(pe.eventId)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Entfernen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - All same color */}
        {totalEventCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleSaveTrip}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-950 transition-colors"
            >
              <Briefcase size={18} />
              <span className="text-sm font-medium">Speichern</span>
            </button>
            <button
              onClick={handleExportToGoogleMaps}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-950 transition-colors"
            >
              <Map size={18} />
              <span className="text-sm font-medium">Google Maps</span>
            </button>
            <button
              onClick={handleShowQRCode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-950 transition-colors"
            >
              <QrCode size={18} />
              <span className="text-sm font-medium">QR-Code</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-950 transition-colors"
            >
              <FileText size={18} />
              <span className="text-sm font-medium">Als PDF</span>
            </button>
          </div>
        )}

        {/* Clear Trip */}
        {totalEventCount > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (confirm('Möchtest du wirklich alle Events aus deinem Reiseplaner entfernen?')) {
                  clearTrip();
                  toast.success('Reiseplaner geleert');
                }
              }}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Reiseplaner leeren
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
