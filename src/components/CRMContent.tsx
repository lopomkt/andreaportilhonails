
import { useEffect, useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppointmentsModalProvider } from "@/context/AppointmentsModalContext";
import { AppointmentModal } from "@/components/AppointmentModal";

// Pages
import Dashboard from "@/pages/Dashboard";
import CalendarPage from "@/pages/CalendarPage";
import ClientsPage from "@/pages/ClientsPage";
import ServicesPage from "@/pages/ServicesPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import FunctionalitiesPage from "@/pages/FunctionalitiesPage";
import CancellationReasonsPage from "@/pages/funcionalidades/CancellationReasonsPage";
import AbsenceRulesPage from "@/pages/funcionalidades/AbsenceRulesPage";
import MessagesTemplatePage from "@/pages/funcionalidades/MessagesTemplatePage";
import ClientRankingPage from "@/pages/funcionalidades/ClientRankingPage";
import NotFound from "@/pages/NotFound";

export const CRMContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedAccess = localStorage.getItem("acessoAndrea");
      if (storedAccess) {
        try {
          const lastAccess = new Date(JSON.parse(storedAccess));
          const now = new Date();
          const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
          setIsAuthenticated(hoursDiff < 48);
        } catch (error) {
          console.error("Error parsing date from localStorage:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppointmentsModalProvider>
      <div id="crm-conteudo" className="min-h-dvh overflow-y-auto">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/servicos" element={<ServicesPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/funcionalidades" element={<FunctionalitiesPage />} />
            <Route path="/funcionalidades/motivos-cancelamento" element={<CancellationReasonsPage />} />
            <Route path="/funcionalidades/ausencias" element={<AbsenceRulesPage />} />
            <Route path="/funcionalidades/mensagens" element={<MessagesTemplatePage />} />
            <Route path="/funcionalidades/ranking-clientes" element={<ClientRankingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppButton />
          <AppointmentModal />
        </MainLayout>
      </div>
    </AppointmentsModalProvider>
  );
}
