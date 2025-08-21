
// ATENÇÃO: O botão QuickAppointment foi removido DEFINITIVAMENTE
// Nunca reimporte AppointmentModalOpener ou QuickAppointmentModal

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataProvider } from "@/context/DataProvider";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { CRMContent } from "@/components/CRMContent";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-rose-50">
        <div className="w-16 h-16 border-t-4 border-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="min-h-dvh bg-gradient-to-br from-rose-50 to-rose-100 overflow-y-auto">
              <Toaster />
              {!user ? (
                <Routes>
                  <Route path="*" element={<LoginScreen />} />
                </Routes>
              ) : (
                <CRMContent />
              )}
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
};

export default App;
