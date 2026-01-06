import { useState, useEffect } from "react";

// Kein sessionStorage mehr - Chatbot öffnet bei JEDEM Seitenbesuch nach 4 Sekunden
export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 4-Sekunden-Delay für das automatische Öffnen - IMMER
    const timer = setTimeout(() => {
      console.log("[Chatbot] Auto-opening after 4 seconds");
      setIsOpen(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const openChatbot = () => {
    setIsOpen(true);
  };

  const closeChatbot = () => {
    setIsOpen(false);
  };

  const toggleChatbot = () => {
    if (isOpen) {
      closeChatbot();
    } else {
      openChatbot();
    }
  };

  return {
    isOpen,
    hasBeenDismissed: false, // Immer false da keine Persistenz mehr
    openChatbot,
    closeChatbot,
    toggleChatbot,
  };
};
