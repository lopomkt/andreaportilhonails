
import React, { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarNav } from "@/components/layouts/SidebarNav";
import { MobileNav } from "@/components/layouts/MobileNav";
import { PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataProvider } from "@/context/DataContext";
import { ClientProvider } from "@/context/ClientContext";
import { AppointmentProvider } from "@/context/AppointmentContext";
import { ServiceProvider } from "@/context/ServiceContext";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Alterado para false para manter a barra lateral sempre visível
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Removemos o colapso automático da sidebar quando a rota muda
  // Mantemos apenas o fechamento do menu móvel
  useEffect(() => {
    setIsMobileNavOpen(false); // Close mobile nav when route changes
  }, [location.pathname]);

  return (
    <ClientProvider>
      <AppointmentProvider>
        <ServiceProvider>
          <DataProvider>
            <div className="flex min-h-screen w-full flex-col">
              <MobileNav 
                isOpen={isMobileNavOpen} 
                setIsOpen={setIsMobileNavOpen} 
              />
              <div className="flex flex-1">
                {/* Sidebar for desktop */}
                <aside
                  className={cn(
                    "hidden lg:flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
                    "w-[240px]" // Sempre expandida, removido o toggle baseado em isCollapsed
                  )}
                >
                  <SidebarNav isCollapsed={false} />
                </aside>

                {/* Main content */}
                <main className="flex-1 flex flex-col">
                  <div className="lg:hidden flex-0 border-b p-2 flex justify-between items-center">
                    <button
                      onClick={() => setIsMobileNavOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-accent"
                    >
                      <PanelRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 px-0 py-0 overflow-auto">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </DataProvider>
        </ServiceProvider>
      </AppointmentProvider>
    </ClientProvider>
  );
}
