import { X } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface QuickHideButtonProps {
  externalId: string;
  onHide: () => void;
}

export const QuickHideButton = ({ externalId, onHide }: QuickHideButtonProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const { error } = await externalSupabase
      .from("events")
      .update({ hide_from_homepage: true })
      .eq("external_id", externalId);

    if (!error) {
      onHide();
      toast.success("Event von Startseite ausgeblendet");
    } else {
      console.error("Error hiding event:", error);
      toast.error("Fehler beim Ausblenden");
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      onClick={handleHide}
      className="absolute bottom-3 right-3 z-20 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 opacity-60 hover:opacity-100 transition-opacity"
      title="Von Startseite ausblenden"
    >
      <X className="h-3 w-3" />
    </button>
  );
};

export default QuickHideButton;
