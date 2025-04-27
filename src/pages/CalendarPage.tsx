
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { BlockedDateForm } from "@/components/BlockedDateForm";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarViewTabs } from "@/components/calendar/CalendarViewTabs";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { useData } from "@/context/DataProvider";

export default function CalendarPage() {
  const { openModal } = useAppointmentsModal();
  const { fetchBlockedDates, fetchAppointments } = useData();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [openBlockedDateDialog, setOpenBlockedDateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">(() => {
    const savedView = localStorage.getItem('calendarViewMode');
    return (savedView === "day" || savedView === "week" || savedView === "month") 
      ? savedView 
      : "week";
  });
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    const viewParam = searchParams.get('view');
    
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
          
          if (viewParam && (viewParam === 'day' || viewParam === 'week' || viewParam === 'month')) {
            setCalendarView(viewParam);
            localStorage.setItem('calendarViewMode', viewParam);
          }
        }
      } catch (e) {
        console.error('Invalid date in URL', e);
      }
    }
  }, [location]);

  const handleDaySelect = (date: Date) => {
    const selectedDate = new Date(date);
    setCurrentDate(selectedDate);
    
    if (calendarView === "month") {
      setCalendarView("day");
      localStorage.setItem('calendarViewMode', 'day');
      
      const searchParams = new URLSearchParams();
      searchParams.set('date', selectedDate.toISOString().split('T')[0]);
      searchParams.set('view', 'day');
      navigate(`/calendario?${searchParams.toString()}`);
    }
  };
  
  const handleViewChange = (value: string) => {
    setIsLoading(true);
    toast({
      title: "Carregando...",
      description: "Atualizando visualização do calendário",
      duration: 1000
    });

    setTimeout(() => {
      setCalendarView(value as "day" | "week" | "month");
      localStorage.setItem('calendarViewMode', value);
      
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('view', value);
      navigate(`/calendario?${searchParams.toString()}`);
      setIsLoading(false);
    }, 100);
  };

  // Handle the suggested time selection by opening the appointment modal
  const handleSuggestedTimeSelect = (date: Date, timeString: string) => {
    // Create a new date object with the selected time
    const selectedDateTime = new Date(date);
    const [hours, minutes] = timeString.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Open the modal with this date/time
    openModal(null, selectedDateTime);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in overflow-y-auto">
      <Card className="border-rose-100 shadow-soft">
        <CalendarHeader
          isLoading={isLoading}
          isMobile={isMobile}
          onOpenBlockedDateDialog={() => setOpenBlockedDateDialog(true)}
        />
        
        <CardContent className="p-0">
          <CalendarViewTabs
            calendarView={calendarView}
            currentDate={currentDate}
            onDaySelect={handleDaySelect}
            onViewChange={handleViewChange}
            onSuggestedTimeSelect={handleSuggestedTimeSelect}
          />
        </CardContent>
      </Card>
      
      {/* Blocked Date Dialog */}
      <Dialog open={openBlockedDateDialog} onOpenChange={setOpenBlockedDateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">🔒</span>
              Bloquear Horário
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para bloquear um horário
            </DialogDescription>
          </DialogHeader>
          <BlockedDateForm 
            onSuccess={() => {
              setOpenBlockedDateDialog(false);
              
              // Refresh both appointments and blocked dates
              fetchBlockedDates();
              fetchAppointments(); // We don't need to await or use the return value here
              
              toast({
                title: "Horário bloqueado",
                description: "O horário foi bloqueado com sucesso"
              });
            }}
            initialDate={currentDate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
