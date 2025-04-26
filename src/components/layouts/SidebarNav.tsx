
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Scissors, 
  BarChart2, 
  Settings,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home
  },
  {
    title: "Calendário",
    href: "/calendario",
    icon: Calendar
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users
  },
  {
    title: "Serviços",
    href: "/servicos",
    icon: Scissors
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart2
  },
  {
    title: "Funcionalidades",
    href: "/funcionalidades",
    icon: Settings
  }
];

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  return (
    <div className="flex flex-col space-y-1 overflow-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              isCollapsed ? "justify-center" : ""
            )
          }
        >
          <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-0" : "mr-2")} />
          {!isCollapsed && <span>{item.title}</span>}
        </NavLink>
      ))}
    </div>
  );
}
