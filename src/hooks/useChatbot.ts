import { useState, useEffect } from "react";

const CHATBOT_DISMISSED_KEY = "eventbuzzer_chatbot_dismissed";

export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // 4-Sekunden-Delay für das automatische Öffnen
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const openChatbot = () => {
    setIsOpen(true);
  };

  const closeChatbot = () => {
    setIsOpen(false);
    setHasBeenDismissed(true);
    sessionStorage.setItem(CHATBOT_DISMISSED_KEY, "true");
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
    hasBeenDismissed,
    openChatbot,
    closeChatbot,
    toggleChatbot,
  };
};
