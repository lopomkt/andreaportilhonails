
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataProvider } from "@/context/DataContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { CRMContent } from "@/components/CRMContent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100">
          <Sonner />
          <LoginScreen />
          <CRMContent />
        </div>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
