
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataProvider } from "@/context/DataProvider";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { CRMContent } from "@/components/CRMContent";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedAccess = localStorage.getItem("acessoAndrea");
      if (storedAccess) {
        const lastAccess = new Date(storedAccess);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
        setIsAuthenticated(hoursDiff < 48);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1000); // Regular check
    window.addEventListener("storage", checkAuth);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100">
            <Toaster />
            {!isAuthenticated ? <LoginScreen /> : <CRMContent />}
          </div>
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
};

export default App;
