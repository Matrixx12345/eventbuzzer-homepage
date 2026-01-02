import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { streamChat } from "@/services/chatService";
import { toast } from "sonner";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
}

interface ChatbotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const QUIZ_OPTIONS = [
  { id: "solo", label: "Solo-Inspiration" },
  { id: "family", label: "Familien-Erlebnisse" },
  { id: "friends", label: "Zeit mit Freunden" },
  { id: "couple", label: "Erlebnisse zu zweit" },
];

const ChatbotPopup = ({ isOpen, onClose, onOpen }: ChatbotPopupProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi! 👋 Schreib mir einfach, was du vorhast, oder wir finden es gemeinsam über ein kurzes Quiz heraus? ✨",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageToAI = async (userContent: string) => {
    setIsLoading(true);
    
    // Convert messages to API format
    const apiMessages = messages.map(m => ({
      role: m.role === "bot" ? "assistant" as const : "user" as const,
      content: m.content
    }));
    apiMessages.push({ role: "user" as const, content: userContent });

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "bot" && assistantContent.startsWith(chunk.slice(0, 10) || chunk)) {
          // Update existing bot message
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        // Check if we already added an assistant message
        if (last?.role === "bot" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        // Add new bot message
        return [...prev, { role: "bot", content: assistantContent }];
      });
    };

    await streamChat({
      messages: apiMessages,
      onDelta: updateAssistantMessage,
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        toast.error(error);
        setMessages(prev => [...prev, { 
          role: "bot", 
          content: "Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es nochmal! 🙏" 
        }]);
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");

    await sendMessageToAI(messageToSend);
  };

  const handleQuizOptionClick = async (optionId: string) => {
    if (isLoading) return;
    
    const option = QUIZ_OPTIONS.find((o) => o.id === optionId);
    const label = option?.label || "Überrasche mich!";
    
    setMessages((prev) => [...prev, { role: "user", content: label }]);
    
    const prompt = optionId === "surprise" 
      ? "Überrasche mich mit einem tollen Event-Vorschlag! Ich bin für alles offen."
      : `Ich suche nach ${label}. Was kannst du mir empfehlen?`;
    
    await sendMessageToAI(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div
      className={`fixed right-0 top-20 z-50 transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "translate-x-[calc(100%-24px)]"
      }`}
    >
      {/* Chevron Handle - visible when collapsed */}
      <button
        onClick={onOpen}
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-16 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-l-lg border border-r-0 border-gray-200/50 shadow-lg transition-opacity duration-300 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-white hover:shadow-xl"
        }`}
      >
        <ChevronLeft className="h-6 w-6 text-gray-700" />
      </button>

      {/* Main Panel */}
      <div className="w-[360px] max-w-[calc(100vw-1rem)] flex flex-col rounded-l-2xl overflow-hidden shadow-2xl border border-r-0 border-white/20">
        {/* Frosted Glass Background */}
        <div className="absolute inset-0 bg-white/75 backdrop-blur-xl rounded-l-2xl" />
        
        {/* Content */}
        <div className="relative flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
            <h2 className="font-serif text-lg text-gray-800">
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
          <div className="p-3 space-y-1.5 border-b border-gray-200/50">
            {QUIZ_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuizOptionClick(option.id)}
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-center rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.label}
              </button>
            ))}
            
            {/* Surprise Option */}
            <button
              onClick={() => handleQuizOptionClick("surprise")}
              disabled={isLoading}
              className="w-full py-1.5 px-4 text-center text-gray-500 hover:text-gray-700 text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              Noch unschlüssig? Lass dich überraschen
              <Sparkles className="h-3 w-3" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="overflow-y-auto p-3 space-y-2 max-h-[180px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    message.role === "user"
                      ? "bg-orange-500 text-white rounded-br-md"
                      : "bg-white/80 text-gray-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-white/80 text-gray-800 rounded-2xl rounded-bl-md shadow-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Schreibe eine Nachricht..."
                disabled={isLoading}
                className="flex-1 bg-white/80 border-gray-200/50 rounded-xl focus-visible:ring-orange-500/50 text-sm h-9"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 h-9"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPopup;
