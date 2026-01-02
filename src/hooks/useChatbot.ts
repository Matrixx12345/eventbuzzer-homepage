import { useState, useEffect } from "react";

const CHATBOT_DISMISSED_KEY = "eventbuzzer_chatbot_dismissed";

export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the chatbot in this session
    const dismissed = sessionStorage.getItem(CHATBOT_DISMISSED_KEY);
    if (dismissed) {
      setHasBeenDismissed(true);
      return;
    }

    // Auto-open immediately on first visit
    setIsOpen(true);

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
