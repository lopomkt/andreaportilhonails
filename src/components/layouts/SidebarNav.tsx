
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, BarChart, Settings, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  isCollapsed: boolean;
}

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: Home,
  },
  {
    path: '/calendario',
    label: 'Calendário',
    icon: Calendar,
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: Users,
  },
  {
    path: '/servicos',
    label: 'Serviços',
    icon: Settings,
  },
  {
    path: '/relatorios',
    label: 'Relatórios',
    icon: BarChart,
  },
  {
    path: '/ranking-clientes',
    label: 'Ranking de Clientes',
    icon: Trophy,
  },
  {
    path: '/funcionalidades',
    label: 'Funcionalidades',
    icon: Settings,
  },
];

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  return (
    <nav className="flex flex-col h-full">
      <div className="px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center text-sm font-medium py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 mr-2" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
