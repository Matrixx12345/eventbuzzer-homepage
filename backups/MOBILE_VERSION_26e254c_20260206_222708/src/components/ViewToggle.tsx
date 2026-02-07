import { List, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "map";

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ mode, onModeChange }: ViewToggleProps) => {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => onModeChange("list")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          mode === "list"
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
        )}
      >
        <List size={16} />
        <span className="hidden sm:inline">Liste</span>
      </button>
      <button
        onClick={() => onModeChange("map")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          mode === "map"
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
        )}
      >
        <Map size={16} />
        <span className="hidden sm:inline">Karte</span>
      </button>
    </div>
  );
};

export default ViewToggle;
