import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Event } from '@/hooks/useEventData';

// Planned event structure
export interface PlannedEvent {
  eventId: string;
  event: Event;
  duration: number; // in minutes
  startTime?: string; // e.g. "09:00"
}

// Events organized by day number
export type PlannedEventsByDay = Record<number, PlannedEvent[]>;

interface TripPlannerContextType {
  plannedEventsByDay: PlannedEventsByDay;
  setPlannedEventsByDay: React.Dispatch<React.SetStateAction<PlannedEventsByDay>>;
  addEventToDay: (event: Event, day?: number) => void;
  removeEventFromTrip: (eventId: string) => void;
  activeDay: number;
  setActiveDay: (day: number) => void;
  totalDays: number;
  setTotalDays: (days: number) => void;
  totalEventCount: number;
  isInTrip: (eventId: string) => boolean;
  clearTrip: () => void;
  addDay: () => void;
}

const TripPlannerContext = createContext<TripPlannerContextType | undefined>(undefined);

export const useTripPlanner = () => {
  const context = useContext(TripPlannerContext);
  if (!context) {
    throw new Error('useTripPlanner must be used within a TripPlannerProvider');
  }
  return context;
};

const STORAGE_KEY = 'eventbuzzer_trip_planner';
const MAX_DAYS = 4;

interface StoredTripData {
  plannedEventsByDay: PlannedEventsByDay;
  activeDay: number;
  totalDays: number;
}

export const TripPlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plannedEventsByDay, setPlannedEventsByDay] = useState<PlannedEventsByDay>({
    1: [],
    2: [],
  });
  const [activeDay, setActiveDay] = useState<number>(1);
  const [totalDays, setTotalDays] = useState<number>(2);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredTripData = JSON.parse(stored);
        if (parsed.plannedEventsByDay && typeof parsed.plannedEventsByDay === 'object') {
          setPlannedEventsByDay(parsed.plannedEventsByDay);
        }
        if (typeof parsed.activeDay === 'number') {
          setActiveDay(parsed.activeDay);
        }
        if (typeof parsed.totalDays === 'number') {
          setTotalDays(Math.min(parsed.totalDays, MAX_DAYS));
        }
      }
    } catch (error) {
      console.error('Error loading trip planner from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const data: StoredTripData = {
        plannedEventsByDay,
        activeDay,
        totalDays,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving trip planner to localStorage:', error);
    }
  }, [plannedEventsByDay, activeDay, totalDays]);

  // Calculate total event count across all days
  const totalEventCount = useMemo(() => {
    return Object.values(plannedEventsByDay).reduce((sum, events) => sum + events.length, 0);
  }, [plannedEventsByDay]);

  // Check if an event is already in any day
  const isInTrip = useCallback((eventId: string): boolean => {
    return Object.values(plannedEventsByDay).some(events =>
      events.some(pe => pe.eventId === eventId)
    );
  }, [plannedEventsByDay]);

  // Add event to a specific day (defaults to activeDay)
  const addEventToDay = useCallback((event: Event, day?: number) => {
    const targetDay = day ?? activeDay;

    // Don't add if already in trip
    if (isInTrip(event.id)) {
      return;
    }

    // Smart duration: museums get 150 min, others 120 min
    const isMuseum = event.title.toLowerCase().includes('museum') ||
                     event.title.toLowerCase().includes('galerie');
    const duration = isMuseum ? 150 : 120;

    setPlannedEventsByDay(prev => ({
      ...prev,
      [targetDay]: [
        ...(prev[targetDay] || []),
        {
          eventId: event.id,
          event,
          duration,
        }
      ]
    }));
  }, [activeDay, isInTrip]);

  // Remove event from all days
  const removeEventFromTrip = useCallback((eventId: string) => {
    setPlannedEventsByDay(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(dayKey => {
        const day = Number(dayKey);
        updated[day] = updated[day].filter(pe => pe.eventId !== eventId);
      });
      return updated;
    });
  }, []);

  // Clear all planned events
  const clearTrip = useCallback(() => {
    setPlannedEventsByDay({
      1: [],
      2: [],
    });
    setActiveDay(1);
    setTotalDays(2);
  }, []);

  // Add a new day (max 4)
  const addDay = useCallback(() => {
    if (totalDays < MAX_DAYS) {
      const newDay = totalDays + 1;
      setTotalDays(newDay);
      setPlannedEventsByDay(prev => ({
        ...prev,
        [newDay]: []
      }));
    }
  }, [totalDays]);

  const value: TripPlannerContextType = {
    plannedEventsByDay,
    setPlannedEventsByDay,
    addEventToDay,
    removeEventFromTrip,
    activeDay,
    setActiveDay,
    totalDays,
    setTotalDays,
    totalEventCount,
    isInTrip,
    clearTrip,
    addDay,
  };

  return (
    <TripPlannerContext.Provider value={value}>
      {children}
    </TripPlannerContext.Provider>
  );
};
