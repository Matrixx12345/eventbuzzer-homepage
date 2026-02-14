import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { TripPlannerProvider } from "./contexts/TripPlannerContext";
import { AuthProvider } from "./contexts/AuthContext";
import EventDetail from "./pages/EventDetail";
import Favorites from "./pages/Favorites";
import EventList1 from "./pages/EventList1";
import EventPlanner2 from "./pages/EventPlanner2";
import TripPlannerPage from "./pages/TripPlannerPage";
import Impressum from "./pages/Impressum";
import ErrorBoundary from "./components/ErrorBoundary";
import SupabaseTest from "./pages/SupabaseTest";
import AdminUpload from "./pages/AdminUpload";
import AdminRatings from "./pages/AdminRatings";
import AdminSpeedTagging from "./pages/AdminSpeedTagging";
import AdminBuzzBoost from "./pages/AdminBuzzBoost";
import AdminChatbot from "./pages/AdminChatbot";
import AdminHoneypot from "./pages/AdminHoneypot";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import CityCategoryPage from "./pages/CityCategoryPage";
import LegalFooter from "./components/LegalFooter";
import GoogleAnalytics from "./components/GoogleAnalytics";
import ExitIntentPopup from "./components/ExitIntentPopup";
import PartnerUpload from "./pages/PartnerUpload";
import MobileBottomNav from "./components/MobileBottomNav";
import Honeypot from "./pages/Honeypot";
import MagazinLanding from "./pages/MagazinLanding";
import MagazinArticle from "./pages/MagazinArticle";
import TourArticle from "./pages/TourArticle";
import ShowAllBasel from "./pages/ShowAllBasel";
import FetchAndInsertBasel from "./pages/FetchAndInsertBasel";
import ShowEventSchema from "./pages/ShowEventSchema";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <TripPlannerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <GoogleAnalytics />
            <ExitIntentPopup />
            <Routes>
              <Route path="/" element={<ErrorBoundary><EventList1 /></ErrorBoundary>} />
              {/* Magazin (replaces old Highlights) */}
              <Route path="/magazin" element={<MagazinLanding />} />
              {/* Tour Articles (Day tours) */}
              <Route path="/magazin/ein-tag-in-basel" element={<TourArticle slug="ein-tag-in-basel" />} />
              <Route path="/en/magazine/day-in-basel" element={<TourArticle slug="day-in-basel" lang="en" />} />
              {/* Regular Magazine Articles */}
              <Route path="/magazin/:slug" element={<MagazinArticle />} />
              <Route path="/en/magazine" element={<MagazinLanding lang="en" />} />
              <Route path="/en/magazine/:slug" element={<MagazinArticle lang="en" />} />
              <Route path="/highlights" element={<Navigate to="/magazin" replace />} />
              <Route path="/event/:slug" element={<EventDetail />} />
              {/* SEO Category Pages */}
              <Route path="/kategorie/:slug" element={<CategoryPage />} />
              <Route path="/events/:city/:categorySlug" element={<CityCategoryPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/eventlist1" element={<ErrorBoundary><EventList1 /></ErrorBoundary>} />
              <Route path="/eventplanner2" element={<ErrorBoundary><EventPlanner2 /></ErrorBoundary>} />
              <Route path="/reiseplaner" element={<ErrorBoundary><TripPlannerPage /></ErrorBoundary>} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/supabase-test" element={<SupabaseTest />} />
              <Route path="/admin-upload" element={<AdminUpload />} />
              <Route path="/admin/ratings" element={<AdminRatings />} />
              <Route path="/admin/speed-tagging" element={<AdminSpeedTagging />} />
              <Route path="/admin/buzz-boost" element={<AdminBuzzBoost />} />
              <Route path="/admin/chatbot" element={<AdminChatbot />} />
              <Route path="/admin/honeypot" element={<AdminHoneypot />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/partner" element={<PartnerUpload />} />

              {/* Temporary: Basel tools */}
              <Route path="/show-schema" element={<ShowEventSchema />} />
              <Route path="/fetch-basel" element={<FetchAndInsertBasel />} />
              <Route path="/show-all-basel" element={<ShowAllBasel />} />

              {/* HONEYPOT ROUTES 🍯 - Fallen für böse Bots */}
              {/* Diese Routen sind in robots.txt verboten */}
              {/* Brave Bots (Google, Bing) besuchen sie NICHT */}
              {/* Böse Bots ignorieren robots.txt → werden geloggt! */}
              <Route path="/honeypot" element={<Honeypot />} />
              <Route path="/secret-admin" element={<Honeypot />} />
              <Route path="/wp-admin/*" element={<Honeypot />} />
              <Route path="/hidden-data" element={<Honeypot />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LegalFooter />
            <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
          </TripPlannerProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
