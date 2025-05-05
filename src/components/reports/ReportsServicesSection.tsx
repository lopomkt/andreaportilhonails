
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppointments } from "@/context/AppointmentContext";
import { formatCurrency } from "@/lib/formatters";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { CheckCircle, Users, XCircle } from "lucide-react";
import { Appointment, Service } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServices } from "@/context/ServiceContext";

interface ReportsServicesSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

interface ServiceReportData {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
  lastMonthCount: number;
  lastMonthRevenue: number;
  percentChangeCount: number;
  percentChangeRevenue: number;
}

export function ReportsServicesSection({ selectedMonth, selectedYear }: ReportsServicesSectionProps) {
  const { appointments } = useAppointments();
  const { services } = useServices();
  
  const serviceMetrics = useMemo(() => {
    const currentDate = new Date(selectedYear, selectedMonth);
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    
    // For comparison with last month
    const lastMonthDate = subMonths(currentDate, 1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);
    
    // Current month appointments
    const currentMonthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: currentMonthStart, end: currentMonthEnd });
    });
    
    // Last month appointments
    const lastMonthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: lastMonthStart, end: lastMonthEnd });
    });
    
    // Process metrics for current month
    const serviceDataMap = new Map<string, ServiceReportData>();
    
    // Process services from current month
    services.forEach(service => {
      const currentMonthServiceAppointments = currentMonthAppointments.filter(
        app => app.serviceId === service.id && app.status !== "canceled"
      );
      
      const currentMonthCount = currentMonthServiceAppointments.length;
      const currentMonthRevenue = currentMonthServiceAppointments.reduce(
        (sum, app) => sum + app.price, 0
      );
      
      // Process last month data for comparison
      const lastMonthServiceAppointments = lastMonthAppointments.filter(
        app => app.serviceId === service.id && app.status !== "canceled"
      );
      
      const lastMonthCount = lastMonthServiceAppointments.length;
      const lastMonthRevenue = lastMonthServiceAppointments.reduce(
        (sum, app) => sum + app.price, 0
      );
      
      // Calculate percent changes
      const percentChangeCount = lastMonthCount > 0 
        ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100 
        : (currentMonthCount > 0 ? 100 : 0);
        
      const percentChangeRevenue = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : (currentMonthRevenue > 0 ? 100 : 0);
      
      // Only include services that have appointments
      if (currentMonthCount > 0 || lastMonthCount > 0) {
        serviceDataMap.set(service.id, {
          serviceId: service.id,
          name: service.name,
          count: currentMonthCount,
          revenue: currentMonthRevenue,
          lastMonthCount,
          lastMonthRevenue,
          percentChangeCount,
          percentChangeRevenue
        });
      }
    });
    
    // Convert map to array and sort by revenue (descending)
    return Array.from(serviceDataMap.values())
      .sort((a, b) => b.revenue - a.revenue);
    
  }, [appointments, services, selectedMonth, selectedYear]);
  
  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const currentDate = new Date(selectedYear, selectedMonth);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const monthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
    });
    
    const totalAppointments = monthAppointments.length;
    const completedAppointments = monthAppointments.filter(app => app.status === "completed").length;
    const canceledAppointments = monthAppointments.filter(app => app.status === "canceled").length;
    
    const totalClients = new Set(
      monthAppointments
        .filter(app => app.clientId)
        .map(app => app.clientId)
    ).size;
    
    return {
      totalAppointments,
      completedAppointments,
      canceledAppointments,
      totalClients
    };
  }, [appointments, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Service metrics summary cards */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agendamentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {summaryMetrics.completedAppointments}
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {summaryMetrics.canceledAppointments}
              </div>
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {summaryMetrics.totalClients}
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Realizados no Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead className="hidden md:table-cell">Comparativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceMetrics.length > 0 ? (
                  serviceMetrics.map((service, index) => (
                    <TableRow key={service.serviceId} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.count}</TableCell>
                      <TableCell>{formatCurrency(service.revenue)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col text-xs">
                          <span className={service.percentChangeRevenue > 0 ? "text-green-600" : service.percentChangeRevenue < 0 ? "text-red-600" : "text-gray-500"}>
                            {service.percentChangeRevenue > 0 ? "↑" : service.percentChangeRevenue < 0 ? "↓" : "→"} 
                            {Math.abs(service.percentChangeRevenue).toFixed(0)}% em receita
                          </span>
                          <span className="text-muted-foreground">
                            {format(subMonths(new Date(selectedYear, selectedMonth), 1), "MMMM")}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Não há dados de serviços para este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
