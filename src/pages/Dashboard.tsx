
// AVISO: Componente QuickAppointmentButton removido permanentemente por padrão do projeto.

import { useData } from "@/context/DataContext";
import { useEffect } from "react";
import { format } from "date-fns";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { MotivationalMessage } from "@/components/dashboard/MotivationalMessage";
import { SuggestedTimeSlots } from "@/components/dashboard/SuggestedTimeSlots";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentsByWeek } from "@/components/AppointmentsByWeek";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { RevenueStats } from "@/components/dashboard/RevenueStats";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { useTimeSlotsCalculation } from "@/hooks/dashboard/useTimeSlotsCalculation";
import { CalendarRange } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Dashboard() {
  const {
    getAppointmentsForDate,
    appointments,
    clients
  } = useData();
  
  // Get dashboardStats from the dedicated hook with all the corrected values
  const { 
    dashboardStats,
    revenueData,
    averageClientValue,
    avgClientsPerDay,
    todayStats,
    projectedRevenue,
    monthlyAppointmentsCount,
    availableTimeSlots
  } = useDashboardStats();
  
  const { openModal } = useAppointmentsModal();
  const navigate = useNavigate();
  
  const todayAppointments = getAppointmentsForDate(new Date());
  const todayRevenue = todayAppointments.filter(appt => appt.status === "confirmed").reduce((total, appt) => total + appt.price, 0);
  
  const navigateToCalendarDay = () => {
    navigate(`/calendario?date=${format(new Date(), 'yyyy-MM-dd')}&view=day`);
  };
  
  const navigateToCalendarWeek = () => {
    navigate(`/calendario?date=${format(new Date(), 'yyyy-MM-dd')}&view=week`);
  };
  
  // Use the hook for calculating time slots
  const { suggestedSlots } = useTimeSlotsCalculation(getAppointmentsForDate);

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4 px-[7px] py-0 min-h-dvh flex flex-col">
      <WelcomeCard 
        todayAppointments={todayAppointments}
        todayRevenue={todayRevenue}
      />
      
      <MotivationalMessage />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard 
          title="Agendamentos Hoje" 
          value={`${todayAppointments.length} agendamentos`}
          description={`Faturamento: ${formatCurrency(todayRevenue)}`}
          icon={CalendarRange}
          className="bg-white border-rose-100 shadow-soft cursor-pointer"
          iconClassName="text-rose-500"
          onClick={navigateToCalendarDay}
        />
        
        <AppointmentsByWeek 
          appointments={appointments} 
          onClick={navigateToCalendarWeek}
        />
      </div>

      {suggestedSlots && suggestedSlots.length > 0 && (
        <SuggestedTimeSlots slots={suggestedSlots} />
      )}

      <BirthdaysCard clients={clients} />

      <RevenueStats
        monthlyAppointmentsCount={monthlyAppointmentsCount}
        dashboardStats={dashboardStats}
        projectedRevenue={projectedRevenue}
        averageClientValue={averageClientValue}
        avgClientsPerDay={avgClientsPerDay}
      />

      <DashboardFooter />
    </div>
  );
}
