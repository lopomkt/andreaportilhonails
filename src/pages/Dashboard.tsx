import { useData } from "@/context/DataContext";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, isAfter, isBefore, format } from "date-fns";
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

export default function Dashboard() {
  const {
    dashboardStats,
    getAppointmentsForDate,
    appointments,
    clients
  } = useData();
  
  const navigate = useNavigate();
  
  const todayAppointments = getAppointmentsForDate(new Date());
  const todayRevenue = todayAppointments.filter(appt => appt.status === "confirmed").reduce((total, appt) => total + appt.price, 0);
  
  const openQuickAppointment = (defaultDate?: Date) => {
    const quickAppointmentButton = document.getElementById('quick-appointment-button');
    
    if (defaultDate) {
      localStorage.setItem('defaultAppointmentDate', defaultDate.toISOString());
    } else {
      localStorage.removeItem('defaultAppointmentDate');
    }
    
    if (quickAppointmentButton) {
      quickAppointmentButton.click();
    }
  };
  
  const navigateToCalendarDay = () => {
    navigate(`/calendario?date=${format(new Date(), 'yyyy-MM-dd')}&view=day`);
  };
  
  const navigateToCalendarWeek = () => {
    navigate(`/calendario?date=${format(new Date(), 'yyyy-MM-dd')}&view=week`);
  };

  const calculateAverageClientValue = () => {
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);
    const confirmedAppointments = appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return appt.status === "confirmed" && isAfter(apptDate, firstDayOfMonth) && isBefore(apptDate, lastDayOfMonth);
    });
    const uniqueClientIds = new Set(confirmedAppointments.map(appt => appt.clientId));
    const totalRevenue = confirmedAppointments.reduce((sum, appt) => sum + appt.price, 0);
    return uniqueClientIds.size > 0 ? totalRevenue / uniqueClientIds.size : 0;
  };

  const calculateProjectedRevenue = () => {
    const now = new Date();
    const lastDayOfMonth = endOfMonth(now);
    const pendingAppointments = appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return appt.status === "pending" && isAfter(apptDate, now) && isBefore(apptDate, lastDayOfMonth);
    });
    return pendingAppointments.reduce((sum, appt) => sum + appt.price, 0);
  };

  const calculateAverageClientsPerDay = () => {
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);
    const confirmedAppointments = appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return appt.status === "confirmed" && isAfter(apptDate, firstDayOfMonth) && isBefore(apptDate, lastDayOfMonth);
    });

    const daysWithAppointments = new Set(
      confirmedAppointments.map(appt => format(new Date(appt.date), 'yyyy-MM-dd'))
    ).size;

    return daysWithAppointments > 0 ? Math.round(confirmedAppointments.length / daysWithAppointments) : 0;
  };

  const { suggestedSlots } = useTimeSlotsCalculation(getAppointmentsForDate);

  const avgClientsPerDay = calculateAverageClientsPerDay();
  const averageClientValue = calculateAverageClientValue();
  const projectedRevenue = calculateProjectedRevenue();
  const monthlyAppointmentsCount = appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    return appt.status === "confirmed" && 
           isAfter(apptDate, startOfMonth(new Date())) && 
           isBefore(apptDate, endOfMonth(new Date()));
  }).length;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4 px-[7px] py-0 min-h-dvh flex flex-col">
      <WelcomeCard 
        todayAppointments={todayAppointments}
        todayRevenue={todayRevenue}
        openQuickAppointment={openQuickAppointment}
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

      {suggestedSlots.length > 0 && (
        <SuggestedTimeSlots slots={suggestedSlots} onSlotClick={openQuickAppointment} />
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
