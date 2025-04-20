
import { useState, Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayView } from "@/components/calendar/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { AppointmentFormWrapper } from "@/components/AppointmentFormWrapper";
import { useLocation, useNavigate } from "react-router-dom";

const LoadingView = () => <div className="flex items-center justify-center p-8">
    <div className="animate-pulse space-y-4 w-full">
      <div className="h-4 bg-accent rounded w-3/4"></div>
      <div className="space-y-3">
        <div className="h-20 bg-accent rounded"></div>
        <div className="h-20 bg-accent rounded"></div>
        <div className="h-20 bg-accent rounded"></div>
      </div>
    </div>
  </div>;

export default function CalendarPage() {
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse date from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        // Check if date is valid
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
          // If coming from month view, switch to day view
          if (searchParams.get('view') === 'day') {
            setCalendarView('day');
          }
        }
      } catch (e) {
        console.error('Invalid date in URL', e);
      }
    }
  }, [location]);
  
  const handleDaySelect = (date: Date) => {
    setCurrentDate(date);
    // When selecting a day from month view, change to day view
    if (calendarView === "month") {
      setCalendarView("day");
      
      // Update URL to reflect the selected date and view
      const searchParams = new URLSearchParams();
      searchParams.set('date', date.toISOString().split('T')[0]);
      searchParams.set('view', 'day');
      navigate(`/calendario?${searchParams.toString()}`);
    }
  };
  
  const handleViewChange = (value: string) => {
    toast({
      title: "Carregando...",
      description: `Atualizando visualização do calendário`,
      duration: 1000
    });

    // Add a small delay to ensure smooth transition
    setTimeout(() => {
      setCalendarView(value as "day" | "week" | "month");
      
      // Update URL to reflect the selected view
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('view', value);
      navigate(`/calendario?${searchParams.toString()}`);
    }, 100);
  };
  
  return <div className="p-4 space-y-6 animate-fade-in px-[5px]">
      <Card className="border-rose-100 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-bold text-rose-700 text-xl">Calendário</CardTitle>
            <CardDescription className="text-sm">Gerencie seus Agendamentos</CardDescription>
          </div>
          
          <Button className="bg-rose-500 text-white shadow-soft hover:bg-rose-600" onClick={() => setOpenAppointmentDialog(true)}>
            <CalendarClock className="mr-2 h-4 w-4" />
            {isMobile ? "Agendar" : "Novo Agendamento"}
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue={calendarView} value={calendarView} onValueChange={handleViewChange}>
            <div className="border-b px-6">
              <TabsList className="w-full justify-start h-14 bg-transparent border-b-0">
                <TabsTrigger value="day" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
                  Dia
                </TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
                  Semana
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
                  Mês
                </TabsTrigger>
              </TabsList>
            </div>
            
            <Suspense fallback={<LoadingView />}>
              <TabsContent value="day" className="m-0">
                <DayView date={currentDate} />
              </TabsContent>
              <TabsContent value="week" className="m-0">
                <WeekView date={currentDate} onDaySelect={handleDaySelect} />
              </TabsContent>
              <TabsContent value="month" className="m-0">
                <MonthView date={currentDate} onDaySelect={handleDaySelect} />
              </TabsContent>
            </Suspense>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Appointment Dialog */}
      <Dialog open={openAppointmentDialog} onOpenChange={setOpenAppointmentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">💅</span>
              Novo Agendamento
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento
            </DialogDescription>
          </DialogHeader>
          <AppointmentFormWrapper>
            <AppointmentForm onSuccess={() => setOpenAppointmentDialog(false)} />
          </AppointmentFormWrapper>
        </DialogContent>
      </Dialog>
    </div>;
}
