import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if user is logged in or popup was already shown
    if (user || hasShown) return;

    // ONLY show if user has added favorites (otherwise don't bother them)
    if (favorites.length === 0) return;

    // Check localStorage to avoid showing too often
    const lastShown = localStorage.getItem("exitIntentLastShown");
    if (lastShown) {
      const daysSinceLastShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < 14) return; // Only show once every 2 weeks (was 7 days)
    }

    // Wait for user to be engaged first (30 seconds on site - longer than before)
    const engagementTimer = setTimeout(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        // Only trigger if mouse REALLY leaves viewport (y <= 0)
        // This prevents triggering when hovering over navbar which is ~64px high
        if (e.clientY <= 0 && !hasShown) {
          setIsOpen(true);
          setHasShown(true);
          localStorage.setItem("exitIntentLastShown", Date.now().toString());
        }
      };

      document.addEventListener("mouseleave", handleMouseLeave);

      // Clean up after 3 minutes (if user hasn't left yet, don't bother them)
      const cleanupTimer = setTimeout(() => {
        document.removeEventListener("mouseleave", handleMouseLeave);
      }, 180000);

      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave);
        clearTimeout(cleanupTimer);
      };
    }, 30000);

    return () => clearTimeout(engagementTimer);
  }, [user, hasShown]);

  const handleSignUp = () => {
    setIsOpen(false);
    navigate("/auth");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl italic text-center">
            Noch nicht überzeugt?
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Mit einem Account verpasst du keine Events mehr
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Favoriten dauerhaft speichern</h4>
                <p className="text-sm text-muted-foreground">Verliere deine Events nie wieder</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Trips planen & speichern</h4>
                <p className="text-sm text-muted-foreground">Organisiere deine Event-Wochenenden</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Event-Benachrichtigungen</h4>
                <p className="text-sm text-muted-foreground">Verpasse keine neuen Highlights</p>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="text-center pt-2 pb-2">
            <p className="text-xs text-muted-foreground">
              Kostenlos · Keine Kreditkarte · Jederzeit kündbar
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleSignUp}
              className="w-full h-10 text-sm font-medium"
              variant="default"
            >
              Kostenlos registrieren
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full h-10 text-sm"
            >
              Weiter ohne Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
