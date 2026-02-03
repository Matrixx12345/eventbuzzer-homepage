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

      <main className="mx-auto px-[15px] py-8">
        {/* Header */}
        <div className="mb-8">
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
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((day) => {
              const dayEvents = plannedEventsByDay[day] || [];
              return (
                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Tag {day}</h3>
                    <span className="text-xs text-gray-500">{dayEvents.length} Event{dayEvents.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Timeline + Events OR Empty State */}
                  {dayEvents.length > 0 ? (
                    <div className="relative pt-12">
                      {/* Vertical Timeline Line - centered through dots */}
                      <div className="absolute left-[66px] top-12 bottom-0 w-0.5 bg-gray-300 z-0" />

                      <div className="space-y-4 relative z-10">
                        {dayEvents.map((pe, index) => (
                          <div key={pe.eventId} className="relative flex items-center gap-3 group">
                            {/* Time Label - LEFT */}
                            <div className="flex-shrink-0 w-12 text-right text-xs font-semibold text-gray-600 self-center">
                              {TIME_POINTS[index] || '—'}
                            </div>

                            {/* Timeline Dot - MIDDLE - centered */}
                            <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gray-400 z-10 self-center" />

                            {/* Event Card - RIGHT */}
                            <div
                              onClick={() => handleEventClick(pe.event)}
                              className="flex-1 p-2 rounded-lg border-2 border-gray-500 bg-white hover:border-gray-600 transition-all cursor-pointer flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {pe.event.image_url && (
                                  <img
                                    src={pe.event.image_url}
                                    alt={pe.event.title}
                                    className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{pe.event.title}</p>
                                  {(pe.event.location || pe.event.address_city) && (
                                    <p className="text-xs text-gray-900 truncate">{pe.event.location || pe.event.address_city}</p>
                                  )}
                                  {pe.duration && (
                                    <div className="mt-1">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-xs text-gray-700 font-medium border border-gray-200">
                                        {pe.duration >= 90 ? (
                                          pe.duration % 60 > 0 ? `${Math.floor(pe.duration / 60)}h ${pe.duration % 60} min` : `${Math.floor(pe.duration / 60)} Stunden`
                                        ) : (
                                          `${pe.duration} min`
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons - Right side */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeEventFromTrip(pe.eventId);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  title="Entfernen"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (index > 0) {
                                      const newEvents = [...dayEvents];
                                      [newEvents[index - 1], newEvents[index]] = [newEvents[index], newEvents[index - 1]];
                                      setPlannedEventsByDay({ ...plannedEventsByDay, [day]: newEvents });
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                                  title="Nach oben"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (index < dayEvents.length - 1) {
                                      const newEvents = [...dayEvents];
                                      [newEvents[index], newEvents[index + 1]] = [newEvents[index + 1], newEvents[index]];
                                      setPlannedEventsByDay({ ...plannedEventsByDay, [day]: newEvents });
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                                  title="Nach unten"
                                >
                                  <ChevronDown size={16} />
                                </button>
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
