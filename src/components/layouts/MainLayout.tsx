
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarNav } from "@/components/layouts/SidebarNav";
import { MobileNav } from "@/components/layouts/MobileNav";
import {
  PanelLeft,
  PanelRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataProvider } from "@/context/DataContext";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { QuickAppointmentButton } from "@/components/QuickAppointmentButton";
import { ClientProvider } from "@/context/ClientContext";
import { AppointmentProvider } from "@/context/AppointmentContext";
import { ServiceProvider } from "@/context/ServiceContext";

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Collapse sidebar when route changes (when a menu item is clicked)
  useEffect(() => {
    setIsMobileNavOpen(false); // Close mobile nav when route changes
    
    // On mobile devices, collapse the sidebar when navigating
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
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
                    isCollapsed ? "w-[60px]" : "w-[240px]"
                  )}
                >
                  <div className="py-4 px-2 flex justify-end">
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="p-1.5 rounded-lg hover:bg-accent"
                    >
                      {isCollapsed ? (
                        <PanelRight className="h-4 w-4" />
                      ) : (
                        <PanelLeft className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <SidebarNav isCollapsed={isCollapsed} />
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
                    <Outlet />
                  </div>
                </main>

                <WhatsAppButton />
                <QuickAppointmentButton />
              </div>
            </div>
          </DataProvider>
        </ServiceProvider>
      </AppointmentProvider>
    </ClientProvider>
  );
}
