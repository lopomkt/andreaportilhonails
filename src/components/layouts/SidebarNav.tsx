
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  Calendar,
  Users,
  Scissors,
  DollarSign,
  BarChart2,
  Settings,
  Menu as MenuIcon,
  ChevronRight,
  ChevronLeft,
  PinIcon,
  Pin,
  PinOff
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SidebarNavProps {
  isCollapsed: boolean;
}

export default function SidebarNav({ isCollapsed: propIsCollapsed }: SidebarNavProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(propIsCollapsed || false);
  const [isPinned, setIsPinned] = useLocalStorage<boolean>("sidebar-pinned", false);
  const [isHovered, setIsHovered] = useState(false);

  const routes = [
    { title: "Dashboard", href: "/", icon: <BarChart2 className="w-5 h-5" /> },
    { title: "Calendário", href: "/calendario", icon: <Calendar className="w-5 h-5" /> },
    { title: "Clientes", href: "/clientes", icon: <Users className="w-5 h-5" /> },
    { title: "Serviços", href: "/servicos", icon: <Scissors className="w-5 h-5" /> },
    { title: "Financeiro", href: "/financeiro", icon: <DollarSign className="w-5 h-5" /> },
    { title: "Configurações", href: "/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  // Auto expand on hover for desktop
  const handleMouseEnter = () => {
    if (!isMobile && isCollapsed && !isPinned) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isHovered && !isPinned) {
      setIsHovered(false);
    }
  };

  // Effect to handle collapsing based on pinned state (desktop only)
  useEffect(() => {
    if (!isMobile) {
      setIsCollapsed(!isPinned);
    }
  }, [isPinned, isMobile]);

  // Update local isCollapsed state when prop changes
  useEffect(() => {
    setIsCollapsed(propIsCollapsed);
  }, [propIsCollapsed]);

  // Desktop menu state
  const isExpanded = !isCollapsed || (isHovered && !isPinned) || isPinned;

  // Mobile always shows the full menu when open
  const showFullMenu = isMobile || isExpanded;

  return (
    <aside
      className={cn(
        "h-screen flex flex-col transition-all duration-300 ease-in-out border-r border-border bg-background relative",
        isCollapsed && !isHovered ? "w-[70px]" : "w-[240px]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b">
        <div className={cn("transition-opacity", !showFullMenu && "opacity-0 invisible", showFullMenu && "opacity-100 visible")}>
          <Logo className="w-32" />
        </div>
        {!showFullMenu && (
          <div className="flex justify-center w-full">
            <MenuIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {!isMobile && showFullMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className="ml-auto"
          >
            {isPinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex px-3 py-2 gap-2 items-center border-b">
        <MenuIcon className="w-5 h-5 text-muted-foreground" />
        {showFullMenu && <span className="font-medium">Menu</span>}
        {!isMobile && showFullMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className="ml-auto"
          >
            {isPinned ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {routes.map(route => {
            const isActive = location.pathname === route.href;
            return (
              <li key={route.href}>
                <Link
                  to={route.href}
                  className={cn(
                    "flex items-center px-2 py-2.5 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {route.icon}
                  {showFullMenu && <span className="ml-3">{route.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        {showFullMenu ? (
          <div className="font-medium text-sm text-center text-muted-foreground">
            BeautySoft &copy; 2025
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-sm font-medium text-muted-foreground">BS</span>
          </div>
        )}
      </div>
    </aside>
  );
}
