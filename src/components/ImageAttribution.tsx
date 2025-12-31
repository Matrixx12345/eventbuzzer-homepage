import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageAttributionProps {
  author?: string | null;
  license?: string | null;
  /** Always visible (for detail pages) or only on hover (for cards) */
  alwaysVisible?: boolean;
  className?: string;
}

/**
 * A small info button that shows image attribution (author & license) in a tooltip.
 * Only renders if at least one of author or license is provided.
 */
const ImageAttribution = ({
  author,
  license,
  alwaysVisible = false,
  className = "",
}: ImageAttributionProps) => {
  // Don't render if no attribution data
  if (!author && !license) return null;

  const attributionText = [
    author && `Bild: ${author}`,
    license && `(${license})`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`
            absolute bottom-2 right-2 p-1 rounded-full 
            bg-black/20 backdrop-blur-md 
            text-white/80 hover:text-white hover:bg-black/40 
            transition-all duration-200 z-10
            ${alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
            ${className}
          `}
          onClick={(e) => e.preventDefault()}
          aria-label="Bildnachweis anzeigen"
        >
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg max-w-[250px]"
      >
        {attributionText}
      </TooltipContent>
    </Tooltip>
  );
};

export default ImageAttribution;
