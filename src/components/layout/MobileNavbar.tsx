
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, LayoutDashboard, Users, Scissors, BarChart2, Settings, ChevronLeft, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [{
  label: "Dashboard",
  icon: LayoutDashboard,
  href: "/"
}, {
  label: "Agenda",
  icon: Calendar,
  href: "/calendario"
}, {
  label: "Clientes",
  icon: Users,
  href: "/clientes"
}, {
  label: "Serviços",
  icon: Scissors,
  href: "/servicos"
}, {
  label: "Relatórios",
  icon: BarChart2,
  href: "/relatorios"
}, {
  label: "Ranking de Clientes",
  icon: Trophy,
  href: "/ranking-clientes"
}, {
  label: "Funcionalidades",
  icon: Settings,
  href: "/funcionalidades"
}];

export function MobileNavbar() {
  // The mobile navbar is no longer needed as requested
  return null;
}

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  return <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-white sticky top-0 left-0">
      <div className="p-6">
        <h1 className="text-xl font-heading font-bold text-primary">
          Andrea Portilho
        </h1>
        <p className="text-sm text-muted-foreground">Nail Designer</p>
      </div>

      <div className="flex-1 px-4 space-y-1">
        {navItems.map(item => <Button key={item.href} variant="ghost" className={cn("w-full justify-start gap-2 py-6 px-4", (currentPath === item.href || item.href.includes('calendario') && currentPath.includes('calendario')) && "bg-primary/10 text-primary")} onClick={() => navigate(item.href)}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Button>)}
      </div>

      <div className="border-t p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Nail CRM v1.0 • {new Date().getFullYear()}
        </p>
      </div>
    </div>;
}

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on main routes
  const mainRoutes = ['/', '/calendario', '/clientes', '/servicos', '/financeiro', '/relatorios', '/ranking-clientes', '/funcionalidades'];
  if (mainRoutes.includes(location.pathname)) {
    return null;
  }
  return <Button variant="ghost" size="icon" className="fixed top-20 left-4 z-50 bg-white/80 backdrop-blur-sm border shadow-sm rounded-full h-10 w-10" onClick={() => navigate(-1)}>
      <ChevronLeft className="h-5 w-5" />
      <span className="sr-only">Voltar</span>
    </Button>;
}

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/calendario":
        return "Agenda";
      case "/clientes":
        return "Clientes";
      case "/servicos":
        return "Serviços";
      case "/relatorios":
        return "Relatórios";
      case "/ranking-clientes":
        return "Ranking de Clientes";
      case "/funcionalidades":
        return "Funcionalidades";
      case "/funcionalidades/motivos-cancelamento":
        return "Motivos de Cancelamento";
      case "/funcionalidades/ausencias":
        return "Regras de Ausência";
      case "/funcionalidades/mensagens":
        return "Mensagens para WhatsApp";
      default:
        return "Nail CRM";
    }
  };
  
  return <div className="border-b bg-background sticky top-0 z-10">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Calendar className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[280px]">
            <SheetHeader>
              <SheetTitle className="text-left font-heading">
                Andrea Portilho
              </SheetTitle>
              <p className="text-sm text-muted-foreground text-left">Nail Designer</p>
            </SheetHeader>
            <div className="py-4">
              {navItems.map(item => <Button key={item.href} variant="ghost" className={cn("w-full justify-start gap-2 my-1", (location.pathname === item.href || item.href.includes('calendario') && location.pathname.includes('calendario')) && "bg-muted text-primary")} onClick={() => navigate(item.href)}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>)}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center">
          <h1 className="ml-4 font-bold font-heading tracking-tight lg:text-2xl text-xl">
            {getPageTitle()}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-sm text-rose-600 font-medium mr-2 hidden md:block">
            Andrea Portilho | Nail Designer
          </div>
          <div className="hidden md:flex items-center text-sm text-muted-foreground mr-2">
            {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
          })}
          </div>
        </div>
      </div>
    </div>;
}

export function MainLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <DesktopSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 relative">
            <BackButton />
            <div className="container mx-auto p-4 px-0 bg-slate-50">{children}</div>
          </main>
        </div>
      </div>
    </div>;
}
