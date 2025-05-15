
// ATENÇÃO: O botão QuickAppointment foi removido DEFINITIVAMENTE
// Nunca reimporte AppointmentModalOpener ou QuickAppointmentModal

import { useState, useEffect, useCallback } from "react";
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
import { createDateWithNoon } from "@/lib/dateUtils";

export default function CalendarPage() {
  const { openModal } = useAppointmentsModal();
  const { fetchBlockedDates, fetchAppointments, refetchAppointments } = useData();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Initialize with current date at noon to avoid timezone issues
    const now = new Date();
    return createDateWithNoon(now.getFullYear(), now.getMonth(), now.getDate());
  });
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
          // Set time to noon (12:00) to avoid timezone issues
          parsedDate.setHours(12, 0, 0, 0);
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

  // Initial data fetch
  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchBlockedDates(), fetchAppointments()]);
      } catch (error) {
        console.error("Error loading calendar data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do calendário",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCalendarData();
  }, [fetchBlockedDates, fetchAppointments, toast]);

  // Fixed handleDaySelect to use the date directly without re-normalizing
  const handleDaySelect = useCallback((date: Date) => {
    // Date already should be normalized with noon time (12:00), use it directly
    setCurrentDate(date);
    
    // Get the source view - if coming from month view, switch to day view
    const isFromMonthView = calendarView === "month";
    
    // Update view mode and localStorage if coming from month view
    if (isFromMonthView) {
      setCalendarView("day");
      localStorage.setItem('calendarViewMode', 'day');
    }
    
    // Update URL with the selected date and view
    const formattedDate = date.toISOString().split('T')[0];
    const searchParams = new URLSearchParams();
    searchParams.set('date', formattedDate);
    searchParams.set('view', isFromMonthView ? 'day' : calendarView);
    navigate(`/calendario?${searchParams.toString()}`);
    
    // Force a refresh of appointments
    refetchAppointments();
  }, [calendarView, navigate, refetchAppointments]);
  
  useEffect(() => {
    refetchAppointments();
  }, [currentDate, refetchAppointments]);
  
  const handleViewChange = useCallback((value: string) => {
    setIsLoading(true);
    toast({
      title: "Carregando...",
      description: "Atualizando visualização do calendário",
      duration: 1000
    });

    setTimeout(() => {
      const viewMode = value as "day" | "week" | "month";
      setCalendarView(viewMode);
      localStorage.setItem('calendarViewMode', value);
      
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('view', value);
      searchParams.set('date', currentDate.toISOString().split('T')[0]);
      navigate(`/calendario?${searchParams.toString()}`);
      setIsLoading(false);
    }, 100);
  }, [location.search, currentDate, navigate, toast]);

  // Handle the suggested time selection by opening the appointment modal
  const handleSuggestedTimeSelect = useCallback((date: Date, timeString: string) => {
    // Create a new date object with the selected time, ensuring noon base
    const selectedDateTime = createDateWithNoon(
      date.getFullYear(),
      date.getMonth(), 
      date.getDate()
    );
    
    // Then set the specific hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Open the modal with this date/time
    openModal(null, selectedDateTime);
  }, [openModal]);

  const handleBlockedDateSuccess = async () => {
    setOpenBlockedDateDialog(false);
    setIsLoading(true);
    
    try {
      // Refresh both blocked dates and appointments
      await Promise.all([
        fetchBlockedDates(),
        refetchAppointments()
      ]);
      
      toast({
        title: "Horário bloqueado",
        description: "O horário foi bloqueado com sucesso"
      });
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados do calendário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
            onSuccess={handleBlockedDateSuccess}
            initialDate={currentDate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
