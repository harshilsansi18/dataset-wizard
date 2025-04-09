
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { useEffect } from "react";

import Navbar from "@/components/navigation/Navbar";
import AIChatbot from "@/components/AIChatbot";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import Validation from "./pages/Validation";
import Comparison from "./pages/Comparison";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { initDatabaseConnection } from "./services/api";

// Create a new queryClient instance
const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize database connection from localStorage if available
  useEffect(() => {
    initDatabaseConnection();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/datasets" element={<Datasets />} />
                <Route path="/validation" element={<Validation />} />
                <Route path="/comparison" element={<Comparison />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <AIChatbot />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
