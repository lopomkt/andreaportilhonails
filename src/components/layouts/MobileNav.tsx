
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Scissors, 
  BarChart2, 
  Settings,
  Home,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
