
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from "@/components/auth/LogoutButton";

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/calendario', label: 'Calendário' },
    { path: '/clientes', label: 'Clientes' },
    { path: '/servicos', label: 'Serviços' },
    { path: '/relatorios', label: 'Relatórios' },
    { path: '/ranking-clientes', label: 'Ranking de Clientes' },
    { path: '/funcionalidades', label: 'Funcionalidades' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-white shadow-xl flex flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="font-semibold text-lg">Menu</div>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 hover:bg-accent"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar menu</span>
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </div>
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
}
