import { LayoutGrid, Map as MapIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "map" | "match";

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onMapClick?: () => void;
  onChatbotOpen?: () => void;
  className?: string;
}

const ViewModeSwitcher = ({ currentMode, onModeChange, onMapClick, onChatbotOpen, className }: ViewModeSwitcherProps) => {
  const modes: Array<{
    id: ViewMode;
    label: string;
    icon: React.ElementType;
    description: string;
  }> = [
    {
      id: "grid",
      label: "Liste",
      icon: LayoutGrid,
      description: "Klassische Listenansicht",
    },
    {
      id: "map",
      label: "Karte",
      icon: MapIcon,
      description: "Kartenansicht mit Pins",
    },
    {
      id: "match",
      label: "Match",
      icon: Sparkles,
      description: "Swipe-Modus wie Tinder",
    },
  ];

  return (
    <div className={cn("flex items-center gap-1 bg-muted/50 p-1 rounded-lg", className)}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (mode.id === "map" && onMapClick) {
                onMapClick();
              } else {
                onModeChange(mode.id);
              }
            }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 min-h-[48px] min-w-[48px] cursor-pointer touch-manipulation",
              mode.id === "match" && "hidden md:flex",
              isActive
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            )}
            aria-label={mode.description}
            title={mode.description}
          >
            <Icon
              size={20}
              className={cn(
                "transition-all duration-200",
                isActive ? "scale-110" : "scale-100"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={cn(
              "text-xs md:text-sm font-medium",
              isActive ? "font-semibold" : "font-normal"
            )}>
              {mode.label}
            </span>
          </button>
        );
      })}

      {/* AI Chatbot Button - Mobile only */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChatbotOpen?.();
        }}
        className="flex md:hidden items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 min-h-[48px] min-w-[48px] cursor-pointer touch-manipulation text-muted-foreground hover:text-foreground hover:bg-white/50"
        aria-label="AI Planer öffnen"
        title="AI Planer öffnen"
      >
        <span className="text-lg">✨</span>
        <span className="text-xs md:text-sm font-medium">
          AI
        </span>
      </button>
    </div>
  );
};

export default ViewModeSwitcher;
