
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  BarChart2, 
  Settings,
  X 
} from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const location = useLocation();
  
  const routes = [
    { title: "Dashboard", href: "/", icon: <BarChart2 className="w-5 h-5" /> },
    { title: "Calendário", href: "/calendario", icon: <Calendar className="w-5 h-5" /> },
    { title: "Clientes", href: "/clientes", icon: <Users className="w-5 h-5" /> },
    { title: "Serviços", href: "/servicos", icon: <Scissors className="w-5 h-5" /> },
    { title: "Financeiro", href: "/financeiro", icon: <DollarSign className="w-5 h-5" /> },
    { title: "Configurações", href: "/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Menu</div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {routes.map((route) => {
              const isActive = location.pathname === route.href;
              return (
                <li key={route.href}>
                  <Link
                    to={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md",
                      isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {route.icon}
                    <span className="ml-3">{route.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
