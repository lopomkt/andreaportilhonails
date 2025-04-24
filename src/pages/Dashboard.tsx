import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, BadgeDollarSign, Wallet, Users } from "lucide-react";
import { addDays, startOfMonth, endOfMonth, isAfter, isBefore, isToday } from "date-fns";
import { useState, useEffect } from "react";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { MotivationalMessage } from "@/components/dashboard/MotivationalMessage";
import { SuggestedTimeSlots } from "@/components/dashboard/SuggestedTimeSlots";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentsByWeek } from "@/components/AppointmentsByWeek";

export default function Dashboard() {
  const {
    dashboardStats,
    getAppointmentsForDate,
    calculateDailyRevenue,
    appointments,
    services
  } = useData();
  
  const todayAppointments = getAppointmentsForDate(new Date());
  const todayRevenue = todayAppointments.filter(appt => appt.status === "confirmed").reduce((total, appt) => total + appt.price, 0);
  
  const [suggestedSlots, setSuggestedSlots] = useState<{
    time: Date;
    duration: number;
  }[]>([]);

  const openQuickAppointment = () => {
    const quickAppointmentButton = document.getElementById('quick-appointment-button');
    if (quickAppointmentButton) {
      quickAppointmentButton.click();
    }
  };

  useEffect(() => {
    const calculateAvailableSlots = () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const todayAppointments = getAppointmentsForDate(today).filter(appt => appt.status !== 'canceled');
      const tomorrowAppointments = getAppointmentsForDate(tomorrow).filter(appt => appt.status !== 'canceled');
      const businessHoursStart = 8;
      const businessHoursEnd = 19;
      const avgServiceDuration = 90;

      const findGapsInDay = (dayDate: Date, dayAppointments: any[]) => {
        const sortedAppointments = [...dayAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const slots: {
          time: Date;
          duration: number;
        }[] = [];
        let startTime: Date;
        if (isToday(dayDate)) {
          startTime = new Date();
          startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0);
        } else {
          startTime = new Date(dayDate);
          startTime.setHours(businessHoursStart, 0, 0, 0);
        }
        const endTime = new Date(dayDate);
        endTime.setHours(businessHoursEnd, 0, 0, 0);
        if (startTime > endTime) return [];
        if (sortedAppointments.length === 0) {
          const duration = (endTime.getTime() - startTime.getTime()) / (60 * 1000);
          if (duration >= avgServiceDuration) {
            slots.push({
              time: startTime,
              duration: duration
            });
          }
          return slots;
        }
        const firstAppt = sortedAppointments[0];
        const firstApptTime = new Date(firstAppt.date);
        if (firstApptTime > startTime) {
          const duration = (firstApptTime.getTime() - startTime.getTime()) / (60 * 1000);
          if (duration >= avgServiceDuration) {
            slots.push({
              time: startTime,
              duration: duration
            });
          }
        }
        for (let i = 0; i < sortedAppointments.length - 1; i++) {
          const currentEnd = new Date(sortedAppointments[i].date);
          if (sortedAppointments[i].endTime) {
            currentEnd.setTime(new Date(sortedAppointments[i].endTime).getTime());
          } else {
            currentEnd.setMinutes(currentEnd.getMinutes() + 60);
          }
          const nextStart = new Date(sortedAppointments[i + 1].date);
          if (nextStart > currentEnd) {
            const duration = (nextStart.getTime() - currentEnd.getTime()) / (60 * 1000);
            if (duration >= avgServiceDuration) {
              slots.push({
                time: currentEnd,
                duration: duration
              });
            }
          }
        }
        const lastAppt = sortedAppointments[sortedAppointments.length - 1];
        const lastApptEnd = new Date(lastAppt.date);
        if (lastAppt.endTime) {
          lastApptEnd.setTime(new Date(lastAppt.endTime).getTime());
        } else {
          lastApptEnd.setMinutes(lastApptEnd.getMinutes() + 60);
        }
        if (lastApptEnd < endTime) {
          const duration = (endTime.getTime() - lastApptEnd.getTime()) / (60 * 1000);
          if (duration >= avgServiceDuration) {
            slots.push({
              time: lastApptEnd,
              duration: duration
            });
          }
        }
        return slots;
      };

      const todaySlots = findGapsInDay(today, todayAppointments);
      const tomorrowSlots = findGapsInDay(tomorrow, tomorrowAppointments);
      const allSlots = [...todaySlots, ...tomorrowSlots].sort((a, b) => {
        if (Math.abs(a.duration - avgServiceDuration) !== Math.abs(b.duration - avgServiceDuration)) {
          return Math.abs(a.duration - avgServiceDuration) - Math.abs(b.duration - avgServiceDuration);
        }
        return a.time.getTime() - b.time.getTime();
      });
      setSuggestedSlots(allSlots.slice(0, 3));
    };
    calculateAvailableSlots();
  }, [appointments, getAppointmentsForDate]);

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
    const avgValue = uniqueClientIds.size > 0 ? totalRevenue / uniqueClientIds.size : 0;
    return avgValue;
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

  const averageClientValue = calculateAverageClientValue();
  const projectedRevenue = calculateProjectedRevenue();

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
          title="Total do Mês" 
          value={formatCurrency(dashboardStats.monthRevenue)}
          icon={DollarSign}
          description="faturamento até o momento"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
        
        <AppointmentsByWeek appointments={appointments} />
      </div>

      {suggestedSlots.length > 0 && (
        <SuggestedTimeSlots slots={suggestedSlots} onSlotClick={openQuickAppointment} />
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard
          title="Média por Cliente"
          value={formatCurrency(averageClientValue)}
          icon={Wallet}
          description="ticket médio"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
        
        <StatsCard
          title="Receita Prevista"
          value={projectedRevenue > 0 ? formatCurrency(projectedRevenue) : "Sem previsões ainda 📅"}
          icon={Users}
          description="agendamentos pendentes até o fim do mês"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
      </div>

      {/* Footer */}
      <footer className="bg-[#E7A1B0] text-white py-3 w-full text-center mt-8 text-sm font-medium rounded-t-lg bottom-0">
        CRM criado para Andrea Portilho – Nails Designer
      </footer>
    </div>
  );
}
