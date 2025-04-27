
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  BarChart2, 
  Settings 
} from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  
  const routes = [
    { title: "Dashboard", href: "/", icon: <BarChart2 className="w-5 h-5" /> },
    { title: "Calendário", href: "/calendario", icon: <Calendar className="w-5 h-5" /> },
    { title: "Clientes", href: "/clientes", icon: <Users className="w-5 h-5" /> },
    { title: "Serviços", href: "/servicos", icon: <Scissors className="w-5 h-5" /> },
    { title: "Financeiro", href: "/financeiro", icon: <DollarSign className="w-5 h-5" /> },
    { title: "Configurações", href: "/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden">
      <div className="grid h-full grid-cols-6 mx-auto">
        {routes.map((route) => {
          const isActive = location.pathname === route.href;
          return (
            <Link
              key={route.href}
              to={route.href}
              className={cn(
                "flex flex-col items-center justify-center",
                isActive ? "text-primary" : "text-gray-500 hover:text-primary"
              )}
            >
              {route.icon}
              <span className="text-xs mt-1">{route.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
