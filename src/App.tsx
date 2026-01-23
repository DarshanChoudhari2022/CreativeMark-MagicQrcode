import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import ReviewLanding from "./pages/ReviewLanding";
import CampaignDetails from "./pages/CampaignDetails";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import QRDesigner from "./pages/QRDesigner";
import NFCManagement from "./pages/NFCManagement";
import Locations from "./pages/Locations";
import AdminPanel from "./pages/AdminPanel";
import ReviewManagement from "./pages/Reviews";
import ServiceRequest from "./pages/ServiceRequest";

const queryClient = new QueryClient();

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/create-campaign" element={<CreateCampaign />} />
            <Route path="/campaign/:campaignId" element={<CampaignDetails />} />
            <Route path="/review/:campaignId" element={<ReviewLanding />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/qr-designer" element={<QRDesigner />} />
            <Route path="/nfc-management" element={<NFCManagement />} />
            <Route path="/reviews" element={<ReviewManagement />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/request-service" element={<ServiceRequest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
