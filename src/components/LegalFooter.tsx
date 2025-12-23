import { Link } from "react-router-dom";

const LegalFooter = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border/30 bg-background/50">
      <div className="container mx-auto flex justify-center">
        <Link
          to="/impressum"
          className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Rechtliches / Impressum
        </Link>
      </div>
    </footer>
  );
};

export default LegalFooter;
