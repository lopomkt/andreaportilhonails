
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { CalendarClock, CalendarDays, UserMinus, DollarSign, Clock, BadgeDollarSign, Wallet, Users, CalendarCheck, MessageSquare, CakeSlice, MoveVertical } from "lucide-react";
import { format, isToday, differenceInDays, addDays, startOfMonth, endOfMonth, isAfter, isBefore, isSameMonth, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Appointment, Client } from "@/types";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ClientTag } from "@/components/ClientTag";
import { MessageTemplateEditor } from "@/components/MessageTemplateEditor";
import { ClientRanking } from "@/components/ClientRanking";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { ServiceTimeStatistics } from "@/components/ServiceTimeStatistics";
import { AppointmentsByWeek } from "@/components/AppointmentsByWeek";
import { supabase } from "@/integrations/supabase/client";
import { formatAvailableTime } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Dashboard() {
  const {
    dashboardStats,
    getAppointmentsForDate,
    getTopClients,
    calculateNetProfit,
    calculateDailyRevenue,
    getRevenueData,
    clients,
    generateWhatsAppLink,
    appointments
  } = useData();
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [birthdayClients, setBirthdayClients] = useState<Client[]>([]);
  const navigate = useNavigate();
  const todayAppointments = getAppointmentsForDate(new Date());
  const topClients = getTopClients(3);
  const todaySortedAppointments = [...todayAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstAppointment = todaySortedAppointments.length > 0 ? todaySortedAppointments[0] : null;
  useEffect(() => {
    const currentMonth = getMonth(new Date());
    const clientsWithBirthdaysThisMonth = clients.filter(client => {
      if (!client.birthdate) return false;
      const birthdate = new Date(client.birthdate);
      return getMonth(birthdate) === currentMonth;
    });
    clientsWithBirthdaysThisMonth.sort((a, b) => {
      const dateA = new Date(a.birthdate || "");
      const dateB = new Date(b.birthdate || "");
      return dateA.getDate() - dateB.getDate();
    });
    setBirthdayClients(clientsWithBirthdaysThisMonth);
  }, [clients]);
  const inactiveClients = clients.filter(client => {
    if (!client.lastAppointment) return true;
    const lastAppointmentDate = new Date(client.lastAppointment);
    const today = new Date();
    const days = differenceInDays(today, lastAppointmentDate);
    return days > 30;
  }).slice(0, 3);
  const todayRevenue = todayAppointments.filter(appt => appt.status === "confirmed").reduce((total, appt) => total + appt.price, 0);
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
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };
  const [motivationalMessage, setMotivationalMessage] = useState<string>("");
  useEffect(() => {
    const fetchMotivationalMessage = async () => {
      try {
        const {
          data: lastViewed,
          error: lastViewedError
        } = await supabase.from('ultima_mensagem_vista').select('*').eq('id', 'andrea').single();
        if (lastViewedError) throw lastViewedError;
        const now = new Date();
        const lastViewedTime = new Date(lastViewed.data_visualizacao);
        const hoursSinceLastView = (now.getTime() - lastViewedTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastView >= 24) {
          const {
            data: newMessage,
            error: messageError
          } = await supabase.from('mensagens_motivacionais').select('*').order('random()').limit(1).single();
          if (messageError) throw messageError;
          await supabase.from('ultima_mensagem_vista').update({
            mensagem_id: newMessage.id,
            data_visualizacao: now.toISOString()
          }).eq('id', 'andrea');
          setMotivationalMessage(newMessage.mensagem);
        } else {
          const {
            data: message,
            error: messageError
          } = await supabase.from('mensagens_motivacionais').select('mensagem').eq('id', lastViewed.mensagem_id).single();
          if (messageError) throw messageError;
          setMotivationalMessage(message.mensagem);
        }
      } catch (error) {
        console.error('Error fetching motivational message:', error);
      }
    };
    fetchMotivationalMessage();
  }, []);
  const sendBirthdayWish = async (client: Client) => {
    try {
      const message = `Olá ${client.name}! 🎂✨ A *Nail Studio Andrea* deseja um Feliz Aniversário para você! Que seu dia seja maravilhoso e repleto de alegrias. Como presente especial, temos um desconto exclusivo esperando por você no seu próximo atendimento. 💅💖`;
      const whatsAppLink = await generateWhatsAppLink({
        client,
        message
      });
      if (whatsAppLink) {
        window.open(whatsAppLink, '_blank');
      }
    } catch (error) {
      console.error("Error sending birthday wish:", error);
    }
  };
  const openQuickAppointment = () => {
    const quickAppointmentButton = document.getElementById('quick-appointment-button');
    if (quickAppointmentButton) {
      quickAppointmentButton.click();
    }
  };
  const navigateToCalendarDay = () => {
    navigate("/calendario");
  };
  const navigateToInactiveClients = () => {
    navigate("/clientes?filter=inactive");
  };
  const averageClientValue = calculateAverageClientValue();
  const projectedRevenue = calculateProjectedRevenue();
  const [suggestedSlots, setSuggestedSlots] = useState<{
    time: Date;
    duration: number;
  }[]>([]);

  const [showReorderingModal, setShowReorderingModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // This would normally be controlled by your auth system

  useEffect(() => {
    const calculateAvailableSlots = () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const todayAppointments = getAppointmentsForDate(today).filter(appt => appt.status !== 'canceled');
      const tomorrowAppointments = getAppointmentsForDate(tomorrow).filter(appt => appt.status !== 'canceled');
      const businessHoursStart = 8; // 8 AM
      const businessHoursEnd = 19; // 7 PM
      const avgServiceDuration = 90; // 1.5 hours in minutes

      const findGapsInDay = (dayDate: Date, dayAppointments: Appointment[]) => {
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

  const handleReorderCards = () => {
    setShowReorderingModal(true);
    // In a real implementation, you would open a modal with drag-drop functionality
    // and update the configuration in the database
  };
  
  return <div className="space-y-6 animate-fade-in p-2 md:p-4 px-[7px] py-0">
      {/* Line 1: Welcome Card */}
      <Card className="bg-gradient-to-r from-rose-500 to-rose-400 text-white border-0 shadow-premium">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h1 className="text-2xl font-bold">{getCurrentTimeOfDay()}, Andrea 💖</h1>
              <p className="mt-1 opacity-90">
                {todayAppointments.length > 0 ? `Você tem ${todayAppointments.length} agendamento${todayAppointments.length !== 1 ? 's' : ''} hoje` : "Você não tem agendamentos hoje"}
              </p>
              
              {firstAppointment && firstAppointment.client && <div className="mt-2">
                  <p className="text-white/90 text-sm">
                    Primeiro cliente: <span className="font-semibold">{firstAppointment.client.name}</span> às {format(new Date(firstAppointment.date), 'HH:mm')}
                  </p>
                  <p className="text-white/90 text-sm mt-1">
                    Faturamento previsto hoje: <span className="font-semibold">{formatCurrency(todayRevenue)}</span>
                  </p>
                </div>}
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
              <Button className="bg-white text-rose-600 hover:bg-rose-50 shadow-soft w-full md:w-auto" onClick={() => navigate("/calendario")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver Calendário
              </Button>
              <Button className="bg-rose-600 text-white hover:bg-rose-700 shadow-soft w-full md:w-auto" onClick={openQuickAppointment}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line 2: Motivational Message */}
      {motivationalMessage && <Card className="bg-rose-50 border-rose-100 shadow-soft">
          <CardContent className="p-6 text-center py-[16px] px-[10px]">
            <p className="text-rose-700 text-lg font-medium italic">
              "{motivationalMessage}"
            </p>
          </CardContent>
        </Card>}

      {/* Line 3: Today's Appointments + Weekly View */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="bg-white border-rose-100 shadow-soft cursor-pointer hover:bg-rose-50 transition-colors" onClick={navigateToCalendarDay}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-rose-700 flex items-center text-base font-bold">
              <CalendarCheck className="mr-2 h-4 w-4 text-rose-600" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <p className="text-xs text-muted-foreground">agendamentos</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(todayRevenue)}</div>
                <p className="text-xs text-muted-foreground">faturamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <AppointmentsByWeek appointments={appointments} />
      </div>

      {/* Line 4: Suggested Time Slots */}
      {suggestedSlots.length > 0 && <Card className="bg-white border-rose-100 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-rose-700 flex items-center text-base font-bold">
              <Clock className="mr-2 h-4 w-4 text-rose-600" />
              Horários Sugeridos para Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedSlots.map((slot, idx) => <div key={idx} className="p-2 bg-rose-50 rounded-md border border-rose-100 flex justify-between items-center cursor-pointer hover:bg-rose-100 transition-colors" onClick={openQuickAppointment}>
                  <div>
                    <p className="font-medium flex items-center">
                      💡 {isToday(slot.time) ? 'Hoje' : 'Amanhã'} às {format(slot.time, 'HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Encaixe de {formatAvailableTime(slot.duration)}
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-rose-600">
                          <CalendarClock className="h-4 w-4 mr-1" /> Agendar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clique para agendar neste horário</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      {/* Line 5: Birthdays */}
      {birthdayClients.length > 0 && <Card className="bg-white border-rose-100 shadow-soft overflow-hidden">
          <div className="bg-[#D8A39D]/20 p-2 flex items-center justify-between">
            <div className="flex items-center">
              <CakeSlice className="h-5 w-5 mr-2 text-[#D8A39D]" />
              <h3 className="font-medium text-base">🎂 Temos aniversariantes este mês!</h3>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {birthdayClients.map(client => <div key={client.id} className="inline-flex items-center bg-rose-50 px-3 py-1 rounded-full">
                  <span className="font-medium mr-1">{client.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.birthdate ? format(new Date(client.birthdate), 'dd/MM') : ''}
                  </span>
                </div>)}
              
              <Button variant="outline" size="sm" onClick={() => birthdayClients.length > 0 && sendBirthdayWish(birthdayClients[0])} className="ml-auto bg-rose-500 text-white hover:bg-rose-600 border-none">
                <MessageSquare className="mr-1 h-4 w-4" />
                Enviar parabéns no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Line 6: Monthly Total + Net Profit */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard title="Total do Mês" value={formatCurrency(dashboardStats.monthRevenue)} icon={DollarSign} description="faturamento até o momento" className="bg-white border-rose-100 shadow-soft" iconClassName="text-rose-500" />
        
        <StatsCard title="Lucro Líquido" value={formatCurrency(calculateNetProfit())} icon={BadgeDollarSign} description="faturamento - despesas" className="bg-white border-rose-100 shadow-soft" iconClassName="text-rose-500" />
      </div>

      {/* Line 7: Average per Client + Expected Revenue */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard title="Média por Cliente" value={formatCurrency(averageClientValue)} icon={Wallet} description="ticket médio" className="bg-white border-rose-100 shadow-soft" iconClassName="text-rose-500" />
        
        <StatsCard title="Receita Prevista" value={projectedRevenue > 0 ? formatCurrency(projectedRevenue) : "Sem previsões ainda 📅"} icon={Users} description="agendamentos pendentes até o fim do mês" className="bg-white border-rose-100 shadow-soft" iconClassName="text-rose-500" />
      </div>

      <FinancialDashboard />
      
      <MessageTemplateEditor />

      {isAdmin && (
        <div className="fixed bottom-4 right-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleReorderCards} 
                  className="rounded-full w-12 h-12 p-0 bg-rose-500 hover:bg-rose-600 text-white shadow-lg"
                >
                  <MoveVertical className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reordenar Cards</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
  onClick
}: StatsCardProps) {
  return <Card className={className} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-rose-700">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent className={onClick ? "cursor-pointer" : ""}>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>;
}

interface InactiveClientCardProps {
  client: Client;
}

function InactiveClientCard({
  client
}: InactiveClientCardProps) {
  const {
    generateWhatsAppLink
  } = useData();
  const handleWhatsAppClick = async () => {
    const message = `Olá ${client.name} 💅✨ Estamos com saudades! Faz mais de 30 dias desde seu último atendimento. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai adorar! 💖`;
    const whatsappData = {
      client,
      message
    };
    const whatsappLink = await generateWhatsAppLink(whatsappData);
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    }
  };
  const daysSinceLastAppointment = client.lastAppointment ? differenceInDays(new Date(), new Date(client.lastAppointment)) : 0;
  return <Card className="overflow-hidden shadow-soft border border-rose-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="border-2 border-rose-100">
            <AvatarFallback className="bg-rose-100 text-rose-700">
              {client.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium flex items-center">
              {client.name}
              <ClientTag type="inactive" showLabel={false} />
            </h3>
            <p className="text-xs text-muted-foreground">
              {client.lastAppointment ? <>
                  Último atendimento: {daysSinceLastAppointment} dias atrás
                </> : "Sem atendimentos anteriores"}
            </p>
          </div>
        </div>
        <Button className="w-full gap-1 mt-2 text-white border-rose-200 bg-rose-500 hover:bg-rose-600 shadow-soft" onClick={handleWhatsAppClick} disabled={!client.phone}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Enviar WhatsApp
        </Button>
      </CardContent>
    </Card>;
}
