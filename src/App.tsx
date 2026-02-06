import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { TripPlannerProvider } from "./contexts/TripPlannerContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import EventsNew from "./pages/EventsNew";
import EventDetail from "./pages/EventDetail";
import Favorites from "./pages/Favorites";
import Listings from "./pages/Listings";
import EventList1 from "./pages/EventList1";
import EventPlanner2 from "./pages/EventPlanner2";
import TripPlanner from "./pages/TripPlanner";
import TripPlanerNew from "./pages/TripPlanerNew";
import TripPlannerPage from "./pages/TripPlannerPage";
import Impressum from "./pages/Impressum";
import ErrorBoundary from "./components/ErrorBoundary";
import SupabaseTest from "./pages/SupabaseTest";
import AdminUpload from "./pages/AdminUpload";
import AdminRatings from "./pages/AdminRatings";
import AdminSpeedTagging from "./pages/AdminSpeedTagging";
import AdminBuzzBoost from "./pages/AdminBuzzBoost";
import AdminChatbot from "./pages/AdminChatbot";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import CityCategoryPage from "./pages/CityCategoryPage";
import LegalFooter from "./components/LegalFooter";
import GoogleAnalytics from "./components/GoogleAnalytics";
import ExitIntentPopup from "./components/ExitIntentPopup";
import PartnerUpload from "./pages/PartnerUpload";

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
              <Route path="/" element={<Index />} />
              <Route path="/event/:slug" element={<EventDetail />} />
              {/* SEO Category Pages */}
              <Route path="/kategorie/:slug" element={<CategoryPage />} />
              <Route path="/events/:city/:categorySlug" element={<CityCategoryPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/listings" element={<ErrorBoundary><Listings /></ErrorBoundary>} />
              <Route path="/eventlist1" element={<ErrorBoundary><EventList1 /></ErrorBoundary>} />
              {/* <Route path="/events-neu" element={<ErrorBoundary><EventsNew /></ErrorBoundary>} /> */}
              <Route path="/eventplanner2" element={<ErrorBoundary><EventPlanner2 /></ErrorBoundary>} />
              <Route path="/trip-planner" element={<ErrorBoundary><TripPlanner /></ErrorBoundary>} />
              <Route path="/trip-planer-neu" element={<ErrorBoundary><TripPlanerNew /></ErrorBoundary>} />
              <Route path="/reiseplaner" element={<ErrorBoundary><TripPlannerPage /></ErrorBoundary>} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/supabase-test" element={<SupabaseTest />} />
              <Route path="/admin-upload" element={<AdminUpload />} />
              <Route path="/admin/ratings" element={<AdminRatings />} />
              <Route path="/admin/speed-tagging" element={<AdminSpeedTagging />} />
              <Route path="/admin/buzz-boost" element={<AdminBuzzBoost />} />
              <Route path="/admin/chatbot" element={<AdminChatbot />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/partner" element={<PartnerUpload />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LegalFooter />
          </BrowserRouter>
        </TooltipProvider>
          </TripPlannerProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
