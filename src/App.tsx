
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataProvider } from "@/context/DataProvider";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { CRMContent } from "@/components/CRMContent";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar autenticação através do localStorage
        const storedAccess = localStorage.getItem("acessoAndrea");
        if (storedAccess) {
          const lastAccess = new Date(JSON.parse(storedAccess));
          const now = new Date();
          const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
          setIsAuthenticated(hoursDiff < 48);
        } else {
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    // Verificar também a sessão do Supabase
    const checkSupabaseSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking Supabase session:", error);
        }
        // Não alteramos o estado de autenticação aqui, pois usamos a verificação do localStorage
      } catch (error) {
        console.error("Error checking Supabase session:", error);
      }
    };

    checkAuth();
    checkSupabaseSession();
    
    const interval = setInterval(checkAuth, 1000); // Regular check
    window.addEventListener("storage", checkAuth);
    
    // Escutar mudanças na autenticação do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
    });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkAuth);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
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
              {!isAuthenticated ? (
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
