import { ChevronDown } from "lucide-react";

const ScrollIndicator = () => {
  const handleClick = () => {
    window.scrollTo({ 
      top: window.innerHeight - 100, 
      behavior: 'smooth' 
    });
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center w-20 h-10 bg-white/40 backdrop-blur-md rounded-full border border-white/30 shadow-lg hover:bg-white/50 transition-all duration-300 cursor-pointer"
      aria-label="Nach unten scrollen"
    >
      <ChevronDown 
        size={24} 
        strokeWidth={2.5}
        className="text-stone-600 animate-bounce"
      />
    </button>
  );
};

export default ScrollIndicator;
