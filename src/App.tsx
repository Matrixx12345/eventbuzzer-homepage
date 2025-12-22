import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Index from "./pages/Index";
import EventDetail from "./pages/EventDetail";
import Favorites from "./pages/Favorites";
import Listings from "./pages/Listings";
import Impressum from "./pages/Impressum";
import SupabaseTest from "./pages/SupabaseTest";
import AdminUpload from "./pages/AdminUpload";
import AdminRatings from "./pages/AdminRatings";
import AdminSpeedTagging from "./pages/AdminSpeedTagging";
import NotFound from "./pages/NotFound";
import LegalFooter from "./components/LegalFooter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FavoritesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/event/:slug" element={<EventDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/supabase-test" element={<SupabaseTest />} />
            <Route path="/admin-upload" element={<AdminUpload />} />
            <Route path="/admin/ratings" element={<AdminRatings />} />
            <Route path="/admin/speed-tagging" element={<AdminSpeedTagging />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <LegalFooter />
        </BrowserRouter>
      </TooltipProvider>
    </FavoritesProvider>
  </QueryClientProvider>
);

export default App;
