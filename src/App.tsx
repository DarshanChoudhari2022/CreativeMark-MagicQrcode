import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import ReviewLanding from "./pages/ReviewLanding";
import CampaignDetails from "./pages/CampaignDetails";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import QRDesigner from "./pages/QRDesigner";

import Locations from "./pages/Locations";
import AdminPanel from "./pages/AdminPanel";
import ReviewManagement from "./pages/Reviews";
import ServiceRequest from "./pages/ServiceRequest";

// Security
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES (No login needed) */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/review/:campaignId" element={<ReviewLanding />} />
            <Route path="/request-service" element={<ServiceRequest />} />

            {/* PROTECTED ROUTES (Login required) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
            <Route path="/create-campaign" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
            <Route path="/campaign/:campaignId" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/qr-designer" element={<ProtectedRoute><QRDesigner /></ProtectedRoute>} />

            <Route path="/reviews" element={<ProtectedRoute><ReviewManagement /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

            {/* CATCH ALL */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
