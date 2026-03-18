import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import VehicleDetail from "./pages/VehicleDetail.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ListVehicle from "./pages/ListVehicle.tsx";
import DealerDashboard from "./pages/DealerDashboard.tsx";
import BulkUpload from "./pages/BulkUpload.tsx";
import DealerAnalytics from "./pages/DealerAnalytics.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/list-vehicle" element={<ListVehicle />} />
            <Route path="/dealer" element={<DealerDashboard />} />
            <Route path="/dealer/bulk-upload" element={<BulkUpload />} />
            <Route path="/dealer/analytics" element={<DealerAnalytics />} />
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/edit-vehicle/:id" element={<ListVehicle />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;