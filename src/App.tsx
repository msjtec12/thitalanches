import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import CustomerOrder from "./pages/CustomerOrder";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { BrandingProvider } from "@/components/BrandingProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OrderProvider>
        <CartProvider>
          <BrandingProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<CustomerOrder />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BrandingProvider>
        </CartProvider>
      </OrderProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
