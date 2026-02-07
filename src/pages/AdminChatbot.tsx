import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import ChatbotPopup from "@/components/ChatbotPopup";
import { useChatbot } from "@/hooks/useChatbot";
import { useAuth } from "@/contexts/AuthContext";

// Admin emails allowed to access admin pages
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

const AdminChatbot = () => {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const { isOpen, closeChatbot, openChatbot } = useChatbot();

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Zurück zur Startseite</span>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-2">Event Chatbot</h1>
          <p className="text-muted-foreground mb-8">
            Teste den AI-Chatbot für Event-Empfehlungen
          </p>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Der Chatbot hilft Besuchern, passende Events zu finden basierend auf ihren
              Interessen und Präferenzen.
            </p>
            <p className="text-sm text-muted-foreground">
              Klicke auf den Button unten rechts, um den Chatbot zu öffnen.
            </p>
          </div>
        </div>
      </div>

      {/* Chatbot Popup */}
      <ChatbotPopup isOpen={isOpen} onClose={closeChatbot} onOpen={openChatbot} />
    </div>
  );
};

export default AdminChatbot;
