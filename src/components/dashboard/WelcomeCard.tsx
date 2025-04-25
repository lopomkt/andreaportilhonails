
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Appointment } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface WelcomeCardProps {
  todayAppointments: Appointment[];
  todayRevenue: number;
  openQuickAppointment: () => void;
}

export const WelcomeCard = ({ todayAppointments, todayRevenue, openQuickAppointment }: WelcomeCardProps) => {
  const navigate = useNavigate();
  const firstAppointment = todayAppointments.length > 0 ? 
    [...todayAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null;

  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleOpenQuickAppointment = () => {
    openQuickAppointment();
  };

  const handleViewCalendar = () => {
    navigate("/calendario");
  };

  return (
    <Card className="bg-gradient-to-r from-rose-500 to-rose-400 text-white border-0 shadow-premium">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h1 className="text-2xl font-bold">{getCurrentTimeOfDay()}, Andrea 💖</h1>
            <p className="mt-1 opacity-90">
              {todayAppointments.length > 0 ? 
                `Você tem ${todayAppointments.length} agendamento${todayAppointments.length !== 1 ? 's' : ''} hoje` : 
                "Você não tem agendamentos hoje"}
            </p>
            
            {firstAppointment && firstAppointment.client && (
              <div className="mt-2">
                <p className="text-white/90 text-sm">
                  Primeiro cliente: <span className="font-semibold">{firstAppointment.client.name}</span> às {format(new Date(firstAppointment.date), 'HH:mm')}
                </p>
                <p className="text-white/90 text-sm mt-1">
                  Faturamento previsto hoje: <span className="font-semibold">{formatCurrency(todayRevenue)}</span>
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
            <Button 
              className="bg-white text-rose-600 hover:bg-rose-50 shadow-soft w-full md:w-auto" 
              onClick={handleViewCalendar}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Ver Calendário
            </Button>
            <Button 
              className="bg-rose-600 text-white hover:bg-rose-700 shadow-soft w-full md:w-auto" 
              onClick={handleOpenQuickAppointment}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
