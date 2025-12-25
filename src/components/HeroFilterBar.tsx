import { useNavigate } from "react-router-dom";

// 6 Filter - verlinken zu Kategorien oder Stimmungsfiltern
const categoryFilters = [
  // Kategorien (categorySlug wird genutzt)
  { display: "Musik", type: "category", value: "musik-party" },
  { display: "Kunst", type: "category", value: "kunst-kultur" },
  { display: "Ausflüge", type: "category", value: "natur-ausfluege" },
  { display: "Märkte", type: "category", value: "maerkte-stadtfeste" },
  // Stimmungsfilter (quickFilter wird genutzt)
  { display: "Romantik", type: "quickFilter", value: "romantik" },
  { display: "Mit Kind", type: "quickFilter", value: "mit-kind" },
];

const HeroFilterBar = () => {
  const navigate = useNavigate();

  const handleFilterClick = (filter: typeof categoryFilters[0]) => {
    if (filter.type === "category") {
      navigate(`/listings?category=${filter.value}`);
    } else {
      navigate(`/listings?quickFilter=${filter.value}`);
    }
  };

  return (
    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-10 w-full px-4">
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 rounded-3xl lg:rounded-full px-6 md:px-10 lg:px-16 py-4 md:py-5 shadow-2xl mx-auto w-auto max-w-[92%] md:max-w-[85%] lg:max-w-[75%]">
        {/* Grid: 3x2 on mobile/tablet, single row on desktop */}
        <div className="grid grid-cols-3 lg:flex lg:flex-row items-center justify-center gap-2 md:gap-3 lg:gap-8">
          {categoryFilters.map((filter) => (
            <button
              key={filter.display}
              onClick={() => handleFilterClick(filter)}
              className="
                w-full lg:min-w-[120px] px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium
                border border-white/60 transition-all duration-300
                flex items-center justify-center
                bg-white/90 text-foreground/90 
                hover:bg-white hover:shadow-lg hover:scale-105
                backdrop-blur-sm whitespace-nowrap
              "
            >
              {filter.display}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
