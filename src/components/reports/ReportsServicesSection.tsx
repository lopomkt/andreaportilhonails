
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, Scissors } from "lucide-react";
import { format, subDays, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";
import { useAppointments } from "@/context/AppointmentContext";
import { useServices } from "@/context/ServiceContext";

interface ReportsServicesSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

interface ServiceSummary {
  id: string;
  name: string;
  quantity: number;
  totalRevenue: number;
}

export function ReportsServicesSection({ selectedMonth, selectedYear }: ReportsServicesSectionProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Get data from contexts
  const { appointments } = useAppointments();
  const { services } = useServices();
  
  // Calculate service metrics for the selected month
  const serviceMetrics = useMemo(() => {
    // Create date bounds for selected month
    const targetDate = new Date(selectedYear, selectedMonth);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    
    // Filter appointments for the selected month
    const monthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { 
        start: monthStart, 
        end: monthEnd 
      }) && appointment.status !== "canceled";
    });
    
    // Group by service and calculate metrics
    const serviceMap = new Map<string, ServiceSummary>();
    
    monthAppointments.forEach(appointment => {
      if (!appointment.serviceId) return;
      
      const service = services.find(s => s.id === appointment.serviceId);
      if (!service) return;
      
      const existing = serviceMap.get(service.id);
      if (existing) {
        existing.quantity += 1;
        existing.totalRevenue += appointment.price;
      } else {
        serviceMap.set(service.id, {
          id: service.id,
          name: service.name,
          quantity: 1,
          totalRevenue: appointment.price
        });
      }
    });
    
    // Convert to array and sort by revenue (descending)
    const serviceArray = Array.from(serviceMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
      
    return serviceArray;
    
  }, [appointments, services, selectedMonth, selectedYear]);
  
  // Function to calculate comparison with previous period
  const getPreviousPeriodComparison = (serviceId: string) => {
    if (!date) return null;
    
    // Calculate comparison period (e.g., same range but in the previous month)
    const currentDay = date.getDate();
    const previousPeriodEnd = subDays(date, currentDay);
    const previousPeriodStart = subDays(previousPeriodEnd, currentDay - 1);
    
    // Filter appointments for the comparison period
    const previousPeriodAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, {
        start: previousPeriodStart,
        end: previousPeriodEnd
      }) && appointment.status !== "canceled" && appointment.serviceId === serviceId;
    });
    
    // Calculate metrics for the comparison period
    const previousRevenue = previousPeriodAppointments.reduce((sum, app) => sum + app.price, 0);
    
    // Find the current period revenue for this service
    const currentService = serviceMetrics.find(s => s.id === serviceId);
    if (!currentService || previousRevenue === 0) return null;
    
    // Calculate percentage difference
    const percentDiff = ((currentService.totalRevenue - previousRevenue) / previousRevenue) * 100;
    
    return {
      percentDiff: Math.round(percentDiff),
      isIncrease: percentDiff >= 0,
      startDate: format(previousPeriodStart, "dd/MM"),
      endDate: format(previousPeriodEnd, "dd/MM")
    };
  };
  
  const comparisonDate = date ? format(date, "dd/MM/yyyy") : "";
  const previousPeriodStart = date ? format(subDays(date, date.getDate()), "dd/MM/yyyy") : "";
  const previousPeriodEnd = date ? format(subDays(date, 1), "dd/MM/yyyy") : "";

  return (
    <div className="space-y-6">
      {/* Services performance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Desempenho por Serviço
        </h3>
        
        {/* Date comparison selector */}
        <div className="flex flex-col items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <div className="text-xs text-muted-foreground">
            {date && (
              <>Comparando com o período de {previousPeriodStart} até {previousPeriodEnd}</>
            )}
          </div>
        </div>
      </div>
      
      {/* Services table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
                <TableHead className="text-right">Total Gerado</TableHead>
                <TableHead className="text-right">Comparativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceMetrics.length > 0 ? (
                serviceMetrics.map((service, index) => {
                  const comparison = date ? getPreviousPeriodComparison(service.id) : null;
                  
                  return (
                    <TableRow key={service.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-right">{service.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(service.totalRevenue)}</TableCell>
                      <TableCell className="text-right">
                        {comparison ? (
                          <span className={comparison.isIncrease ? "text-green-600" : "text-red-600"}>
                            {comparison.isIncrease ? "↑" : "↓"} {Math.abs(comparison.percentDiff)}% em relação a {comparison.startDate} a {comparison.endDate}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sem dados para comparação</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Não há serviços registrados para este período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Services comparison placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo com Período Anterior</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[200px]">
          {serviceMetrics.length > 0 && date ? (
            <div className="space-y-4">
              {serviceMetrics.slice(0, 3).map(service => {
                const comparison = getPreviousPeriodComparison(service.id);
                if (!comparison) return null;
                
                return (
                  <div key={`detail-${service.id}`} className="flex justify-between items-center border-b pb-2">
                    <div className="font-medium">{service.name}</div>
                    <div className={comparison.isIncrease ? "text-green-600" : "text-red-600"}>
                      {comparison.isIncrease ? "+" : "-"}{Math.abs(comparison.percentDiff)}% 
                      <span className="text-muted-foreground text-sm ml-2">
                        (Período: {comparison.startDate} - {comparison.endDate})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground h-full">
              <p>Selecione uma data para ver comparativos detalhados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
