import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, Send, Sparkles, Loader2, MapPin, Calendar, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { streamChat } from "@/services/chatService";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getNearestPlace } from "@/utils/swissPlaces";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
}

interface ChatbotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

type WizardStep = "mission" | "time" | "location" | "chat";

const MISSION_OPTIONS = [
  { id: "solo", label: "Solo-Inspiration" },
  { id: "family", label: "Familien-Erlebnisse" },
  { id: "friends", label: "Zeit mit Freunden" },
  { id: "couple", label: "Erlebnisse zu zweit" },
];

const TIME_OPTIONS = [
  { id: "today", label: "Heute" },
  { id: "tomorrow", label: "Morgen" },
  { id: "weekend", label: "Wochenende" },
  { id: "pick", label: "📅 Kalender" },
];

const RADIUS_OPTIONS = [
  { id: "10", label: "+ 10 km" },
  { id: "25", label: "+ 25 km" },
  { id: "all", label: "Ganze Schweiz" },
];

const CITY_OPTIONS = [
  { id: "zurich", label: "Zürich" },
  { id: "basel", label: "Basel" },
  { id: "bern", label: "Bern" },
  { id: "genf", label: "Genf" },
  { id: "luzern", label: "Luzern" },
  { id: "lausanne", label: "Lausanne" },
];

// Time keywords for hybrid input matching
const TIME_KEYWORDS = [
  { keywords: ["heute", "today"], id: "today" },
  { keywords: ["morgen", "tomorrow"], id: "tomorrow" },
  { keywords: ["wochenende", "samstag", "sonntag", "weekend"], id: "weekend" },
  { keywords: ["nächsten", "nächste", "kommenden", "kommende"], id: "weekend" },
];

const ChatbotPopup = ({ isOpen, onClose, onOpen }: ChatbotPopupProps) => {
  const [step, setStep] = useState<WizardStep>("mission");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [selectedRadius, setSelectedRadius] = useState<string | null>(null);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi! 👋 Wähle deine Mission oder schreib mir direkt, was du suchst!",
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
    
    // Include wizard context in prompt - limited to 50 results
    const context = `[System-Hinweis: Maximal 50 Ergebnisse anzeigen. User sucht: Mission=${selectedMission || 'offen'}, Zeit=${selectedTime || 'flexibel'}, Ort=${locationInput || 'Schweiz'}, Radius=${selectedRadius || 'flexibel'}]`;
    const fullPrompt = `${context}\n\nUser: ${userContent}`;
    
    const apiMessages = messages.map(m => ({
      role: m.role === "bot" ? "assistant" as const : "user" as const,
      content: m.content
    }));
    apiMessages.push({ role: "user" as const, content: fullPrompt });

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "bot" && assistantContent.startsWith(chunk.slice(0, 10) || chunk)) {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        if (last?.role === "bot" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
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

  const handleMissionSelect = (missionId: string) => {
    const mission = MISSION_OPTIONS.find(m => m.id === missionId);
    setSelectedMission(missionId);
    setMessages(prev => [...prev, { role: "user", content: mission?.label || missionId }]);
    setStep("time");
  };

  const handleTimeSelect = (timeId: string) => {
    if (timeId === "pick") {
      setShowCalendar(true);
      return;
    }
    const time = TIME_OPTIONS.find(t => t.id === timeId);
    setSelectedTime(timeId);
    setMessages(prev => [...prev, { role: "user", content: time?.label || timeId }]);
    setStep("location");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setShowCalendar(false);
    const formattedDate = format(date, "d. MMMM yyyy", { locale: de });
    setSelectedTime("pick");
    setMessages(prev => [...prev, { role: "user", content: formattedDate }]);
    setStep("location");
  };

  const handleCitySelect = (cityLabel: string) => {
    setLocationInput(cityLabel);
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstützt");
      return;
    }
    
    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = getNearestPlace(position.coords.latitude, position.coords.longitude);
        setLocationInput(nearestCity);
        setIsLoadingGPS(false);
        toast.success(`Standort erkannt: ${nearestCity}`);
      },
      (error) => {
        setIsLoadingGPS(false);
        toast.error("Standort konnte nicht ermittelt werden");
        console.error("GPS Error:", error);
      },
      { timeout: 10000 }
    );
  };

  const handleLocationSubmit = async () => {
    if (!locationInput.trim() && !selectedRadius) return;
    
    const locationText = locationInput.trim() || "Schweiz";
    const radiusText = RADIUS_OPTIONS.find(r => r.id === selectedRadius)?.label || "";
    
    setMessages(prev => [...prev, { 
      role: "user", 
      content: `${locationText}${radiusText ? ` ${radiusText}` : ''}` 
    }]);
    
    setStep("chat");
    
    // Build the search prompt
    const missionLabel = MISSION_OPTIONS.find(m => m.id === selectedMission)?.label || selectedMission;
    let timeLabel = TIME_OPTIONS.find(t => t.id === selectedTime)?.label || selectedTime;
    if (selectedTime === "pick" && selectedDate) {
      timeLabel = format(selectedDate, "d. MMMM yyyy", { locale: de });
    }
    
    const searchPrompt = `Mission: ${missionLabel}, Zeit: ${timeLabel}, Ort: ${locationText}${radiusText ? ` (${radiusText})` : ''}`;
    
    await sendMessageToAI(searchPrompt);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const input = inputValue.toLowerCase().trim();

    // Step 1: Mission - try to match input to mission
    if (step === "mission") {
      const matchedMission = MISSION_OPTIONS.find(m => 
        input.includes(m.label.toLowerCase()) ||
        (m.id === "couple" && (input.includes("date") || input.includes("zweit") || input.includes("romantik") || input.includes("paar"))) ||
        (m.id === "friends" && (input.includes("freund") || input.includes("friend"))) ||
        (m.id === "family" && (input.includes("famili") || input.includes("kind"))) ||
        (m.id === "solo" && (input.includes("solo") || input.includes("allein")))
      );
      if (matchedMission) {
        setInputValue("");
        handleMissionSelect(matchedMission.id);
        return;
      }
      // No match - add as message and still proceed
      setMessages(prev => [...prev, { role: "user", content: inputValue }]);
      setInputValue("");
      return;
    }
    
    // Step 2: Time - try to match time keywords
    if (step === "time") {
      const matchedTime = TIME_KEYWORDS.find(t => 
        t.keywords.some(k => input.includes(k))
      );
      if (matchedTime) {
        setInputValue("");
        handleTimeSelect(matchedTime.id);
        return;
      }
      // Try to parse as a date-like string
      if (input.includes("samstag") || input.includes("sonntag")) {
        setInputValue("");
        handleTimeSelect("weekend");
        return;
      }
      // No match - add as message and show hint
      setMessages(prev => [...prev, { role: "user", content: inputValue }]);
      toast.info("Wähle eine Zeit-Option oder tippe z.B. 'Wochenende'");
      setInputValue("");
      return;
    }
    
    // Step 3: Location - treat as location input
    if (step === "location") {
      setLocationInput(inputValue);
      setInputValue("");
      // Auto-submit if it looks like a city
      const isCityMatch = CITY_OPTIONS.some(c => input.includes(c.label.toLowerCase()));
      if (isCityMatch || input.length >= 3) {
        // Wait a moment then submit
        setTimeout(() => handleLocationSubmit(), 100);
      }
      return;
    }

    // Chat step: Free AI request
    const userMessage: ChatMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");

    await sendMessageToAI(messageToSend);
  };

  const handleSurprise = async () => {
    if (isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: "Überrasche mich! ✨" }]);
    setStep("chat");
    await sendMessageToAI("Überrasche mich mit einem tollen Event-Vorschlag! Ich bin für alles offen.");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      if (step === "location" && locationInput.trim()) {
        handleLocationSubmit();
      } else {
        handleSendMessage();
      }
    }
  };

  const getPlaceholder = () => {
    switch (step) {
      case "mission":
        return "z.B. 'date', 'Familie', 'Freunde'...";
      case "time":
        return "z.B. 'nächsten Samstag', 'Wochenende'...";
      case "location":
        return "Stadt oder PLZ eingeben...";
      case "chat":
        return "Frag mich nach weiteren Events...";
      default:
        return "Nachricht eingeben...";
    }
  };

  return (
    <>
      {/* Chevron Handle - visible when collapsed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] w-8 h-20 flex items-center justify-center bg-white shadow-xl rounded-l-xl border border-r-0 border-gray-300 hover:bg-gray-50 hover:w-10 transition-all duration-200"
        >
          <ChevronLeft className="h-7 w-7 text-gray-600" />
        </button>
      )}

      {/* Main Panel - Dynamic Height */}
      <div
        className={`fixed right-0 top-16 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-[380px] max-w-[calc(100vw-1rem)] max-h-[80vh] flex flex-col rounded-l-2xl overflow-hidden shadow-2xl border border-r-0 border-white/20">
          {/* Frosted Glass Background */}
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xl rounded-l-2xl" />
          
          {/* Content - grows with content */}
          <div className="relative flex flex-col max-h-[80vh]">
            {/* Header - Fixed, no divider */}
            <div className="flex items-center justify-between p-5">
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

            {/* Step 1: Mission Selection */}
            {step === "mission" && (
              <div className="px-5 pb-3 space-y-3">
                {MISSION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleMissionSelect(option.id)}
                    disabled={isLoading}
                    className="w-full py-3 px-5 text-center rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {option.label}
                  </button>
                ))}
                
                <button
                  onClick={handleSurprise}
                  disabled={isLoading}
                  className="w-full py-2 px-4 text-center text-gray-500 hover:text-gray-700 text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
                >
                  Noch unschlüssig? Lass dich überraschen
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Step 2: Time Selection */}
            {step === "time" && (
              <div className="px-5 pb-3 space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Wann soll es losgehen?</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleTimeSelect(option.id)}
                      disabled={isLoading}
                      className="py-4 px-4 text-center rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Location Selection */}
            {step === "location" && (
              <div className="px-5 pb-3 space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Wo suchst du Erlebnisse?</span>
                </div>

                {/* GPS Button */}
                <button
                  onClick={handleGPSLocation}
                  disabled={isLoadingGPS}
                  className="w-full py-3 px-4 text-center rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingGPS ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  Meinen Standort nutzen
                </button>

                {/* City Tiles */}
                <div className="grid grid-cols-3 gap-2">
                  {CITY_OPTIONS.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.label)}
                      className={`py-2.5 px-2 text-center rounded-xl border text-xs font-medium transition-all ${
                        locationInput === city.label
                          ? "bg-[hsl(var(--wizard-accent))] text-white border-[hsl(var(--wizard-accent))]"
                          : "bg-white/40 hover:bg-white/60 border-gray-200/50 text-gray-700"
                      }`}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedRadius(selectedRadius === option.id ? null : option.id)}
                      className={`flex-1 py-2.5 px-3 text-center rounded-xl border text-xs font-medium transition-all ${
                        selectedRadius === option.id
                          ? "bg-[hsl(var(--wizard-accent))] text-white border-[hsl(var(--wizard-accent))]"
                          : "bg-white/40 hover:bg-white/60 border-gray-200/50 text-gray-700 backdrop-blur-sm"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <Button
                  onClick={handleLocationSubmit}
                  disabled={isLoading || !locationInput.trim()}
                  className="w-full bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-xl h-11"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Events finden"}
                </Button>
              </div>
            )}

            {/* Calendar Dialog */}
            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogContent className="sm:max-w-[350px] p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </DialogContent>
            </Dialog>

            {/* Chat Messages - Only when there are more than initial message */}
            {messages.length > 1 && (
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 max-h-[40vh]">
                {messages.slice(1).map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        message.role === "user"
                          ? "bg-[hsl(var(--wizard-accent))] text-white rounded-br-md"
                          : "bg-white/80 text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-white/80 text-gray-800 rounded-2xl rounded-bl-md shadow-sm px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area - ALWAYS visible */}
            <div className="p-5 pt-3">
              <div className="flex gap-3">
                <Input
                  value={step === "location" ? locationInput : inputValue}
                  onChange={(e) => step === "location" ? setLocationInput(e.target.value) : setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholder()}
                  disabled={isLoading}
                  className="flex-1 bg-white/80 border-gray-200/50 rounded-xl focus-visible:ring-[hsl(var(--wizard-accent))]/50 text-sm h-12"
                />
                <Button
                  onClick={step === "location" ? handleLocationSubmit : handleSendMessage}
                  disabled={(step === "location" ? !locationInput.trim() : !inputValue.trim()) || isLoading}
                  className="bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-xl px-4 h-12"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatbotPopup;
