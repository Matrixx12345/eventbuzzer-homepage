import { cn } from "@/lib/utils";

type FilterOption = "all" | "upcoming" | "recently-added" | "this-weekend";

interface FavoritesFilterBarProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

const filterOptions: { id: FilterOption; label: string }[] = [
  { id: "all", label: "All Saved" },
  { id: "upcoming", label: "Upcoming" },
  { id: "recently-added", label: "Recently Added" },
  { id: "this-weekend", label: "This Weekend" },
];

const FavoritesFilterBar = ({ activeFilter, onFilterChange }: FavoritesFilterBarProps) => {
  return (
    <div className="sticky top-16 z-40 backdrop-blur-xl bg-white/70 border-b border-white/40 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeFilter === option.id
                  ? "bg-neutral-900 text-white"
                  : "bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavoritesFilterBar;
export type { FilterOption };
