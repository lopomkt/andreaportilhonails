
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types";

interface WelcomeCardProps {
  todayAppointments: Appointment[];
  todayRevenue: number;
  openQuickAppointment: () => void;
}

export function WelcomeCard({ todayAppointments, todayRevenue, openQuickAppointment }: WelcomeCardProps) {
  const currentHour = new Date().getHours();
  
  let greeting = "";
  if (currentHour < 12) {
    greeting = "Bom dia";
  } else if (currentHour < 18) {
    greeting = "Boa tarde";
  } else {
    greeting = "Boa noite";
  }

  return (
    <Card className="bg-gradient-to-r from-rose-50 to-rose-100 border-rose-100 shadow-soft">
      <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-rose-800">{greeting}, Andrea!</h2>
          <p className="text-rose-600">
            <span className="font-semibold">{todayAppointments.length}</span> agendamentos hoje • 
            <span className="font-semibold ml-1">{formatCurrency(todayRevenue)}</span> em receitas
          </p>
          <p className="text-rose-600 text-sm">{format(new Date(), "EEEE, dd 'de' MMMM", {locale: ptBR})}</p>
        </div>
        
        <Button 
          className="bg-rose-500 hover:bg-rose-600 transition-colors w-full md:w-auto"
          id="quick-appointment-button"
          onClick={openQuickAppointment}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </CardContent>
    </Card>
  );
}
