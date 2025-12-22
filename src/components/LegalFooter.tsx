import { Link } from "react-router-dom";

const LegalFooter = () => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Link
        to="/impressum"
        className="px-4 py-2 text-xs text-gray-600 bg-white/70 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:bg-white/90 transition-all"
      >
        Rechtliches / Impressum
      </Link>
    </div>
  );
};

export default LegalFooter;
