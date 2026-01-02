import { useState, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
}

interface ChatbotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizStart?: () => void;
}

const QUIZ_OPTIONS = [
  { id: "solo", label: "Solo-Inspiration" },
  { id: "family", label: "Familien-Erlebnisse" },
  { id: "friends", label: "Zeit mit Freunden" },
  { id: "couple", label: "Erlebnisse zu zweit" },
];

const ChatbotPopup = ({ isOpen, onClose, onQuizStart }: ChatbotPopupProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi! Schreib mir einfach, was du vorhast, oder wir finden es gemeinsam über ein kurzes Quiz heraus? ✨",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isQuizMode, setIsQuizMode] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // TODO: Hier später AI-Integration
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Danke für deine Nachricht! Diese Funktion wird bald verfügbar sein. 🎉",
        },
      ]);
    }, 1000);
  };

  const handleQuizOptionClick = (optionId: string) => {
    const option = QUIZ_OPTIONS.find((o) => o.id === optionId);
    if (option) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: option.label },
      ]);
      // TODO: Quiz-Logik hier
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: `Super Wahl! Ich suche passende ${option.label} für dich... 🔍`,
          },
        ]);
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Panel */}
      <div className="fixed right-4 top-20 bottom-4 w-[380px] max-w-[calc(100vw-2rem)] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-in slide-in-from-right-5 duration-300">
        {/* Frosted Glass Background */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
            <h2 className="font-serif text-xl text-gray-800">
              Was möchtest du erleben?
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-200/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quiz Options */}
          <div className="p-4 space-y-2 border-b border-gray-200/50">
            {QUIZ_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuizOptionClick(option.id)}
                className="w-full py-3 px-4 text-center rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                {option.label}
              </button>
            ))}
            
            {/* Surprise Option */}
            <button
              onClick={() => handleQuizOptionClick("surprise")}
              className="w-full py-2 px-4 text-center text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1 transition-colors"
            >
              Noch unschlüssig? Lass dich überraschen
              <Sparkles className="h-3 w-3" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    message.role === "user"
                      ? "bg-orange-500 text-white rounded-br-md"
                      : "bg-white/80 text-gray-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Schreibe eine Nachricht..."
                className="flex-1 bg-white/80 border-gray-200/50 rounded-xl focus-visible:ring-orange-500/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Tab (when closed) */}
      {!isOpen && (
        <button
          onClick={() => {}}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md px-2 py-4 rounded-l-lg shadow-lg border border-r-0 border-gray-200/50 z-50 hover:bg-white transition-colors"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3 rotate-90" />
            Wizard
          </span>
        </button>
      )}
    </>
  );
};

export default ChatbotPopup;
