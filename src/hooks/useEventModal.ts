import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const useEventModal = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store the path where modal was opened
  const [returnPath, setReturnPath] = useState<string>("/");

  // Check URL on mount for direct /event/:id links
  useEffect(() => {
    const match = location.pathname.match(/^\/event\/(.+)$/);
    if (match && !isOpen) {
      const eventId = match[1];
      setSelectedEventId(eventId);
      setIsOpen(true);
      // When opening from direct URL, return to home
      setReturnPath("/");
    }
  }, [location.pathname]);

  const openEvent = useCallback((eventId: string) => {
    // Store current path before opening modal
    setReturnPath(location.pathname + location.search);
    setSelectedEventId(eventId);
    setIsOpen(true);
    // Update URL without navigation
    window.history.pushState(null, "", `/event/${eventId}`);
  }, [location.pathname, location.search]);

  const closeEvent = useCallback(() => {
    setIsOpen(false);
    setSelectedEventId(null);
    // Navigate back to the original path
    window.history.pushState(null, "", returnPath);
  }, [returnPath]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/event\/(.+)$/);
      if (match) {
        // Navigated to an event URL
        setSelectedEventId(match[1]);
        setIsOpen(true);
      } else {
        // Navigated away from event
        setIsOpen(false);
        setSelectedEventId(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Content swap: change event without closing modal
  const swapEvent = useCallback((eventId: string) => {
    console.log("useEventModal.swapEvent called with:", eventId);
    setSelectedEventId(eventId);
    window.history.replaceState(null, "", `/event/${eventId}`);
  }, []);

  return {
    selectedEventId,
    isOpen,
    openEvent,
    closeEvent,
    swapEvent,
  };
};
