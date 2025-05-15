
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { Appointment } from '@/types';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, isSameDay, getDay } from 'date-fns';
import { createDateWithNoon, formatTimeDuration, calculatePercentageChange, getDayOfWeekDistribution, getHourDistribution } from '@/lib/dateUtils';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

interface ReportsServicesSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsServicesSection({ selectedMonth, selectedYear }: ReportsServicesSectionProps) {
  const { appointments, services } = useData();
  const [serviceStats, setServiceStats] = useState<{ name: string; value: number; count: number; timeTotalMinutes: number; percentChange: string }[]>([]);
  const [comparisonDate, setComparisonDate] = useState<Date | undefined>(subMonths(createDateWithNoon(selectedYear, selectedMonth), 1));
  const [useCustomComparison, setUseCustomComparison] = useState<boolean>(false);

  // Use useMemo for filtered appointments - current period
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    // Filter appointments for the selected month and year
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, {
          start: monthStart,
          end: monthEnd
        }) && 
        appointment.status === 'confirmed';
    });
  }, [appointments, selectedMonth, selectedYear]);
  
  // Use useMemo for previous period appointments (for comparison)
  const previousPeriodAppointments = useMemo(() => {
    if (!appointments || !comparisonDate) return [];
    
    const comparisonMonthStart = startOfMonth(comparisonDate);
    const comparisonMonthEnd = endOfMonth(comparisonMonthStart);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, {
          start: comparisonMonthStart,
          end: comparisonMonthEnd
        }) && 
        appointment.status === 'confirmed';
    });
  }, [appointments, comparisonDate]);
  
  useEffect(() => {
    if (!useCustomComparison) {
      setComparisonDate(subMonths(createDateWithNoon(selectedYear, selectedMonth), 1));
    }
  }, [selectedMonth, selectedYear, useCustomComparison]);
  
  // Handle custom comparison date change
  const handleComparisonDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setComparisonDate(date);
      setUseCustomComparison(true);
    }
  }, []);
  
  useEffect(() => {
    if (filteredAppointments.length > 0 && services) {
      const currentStats = calculateServiceStats(filteredAppointments);
      const previousStats = calculateServiceStats(previousPeriodAppointments);
      
      const combinedStats = currentStats.map(currentStat => {
        const previousStat = previousStats.find(prev => prev.name === currentStat.name);
        const prevValue = previousStat ? previousStat.value : 0;
        const prevCount = previousStat ? previousStat.count : 0;
        
        return {
          ...currentStat,
          percentChange: calculatePercentageChange(currentStat.value, prevValue),
          countPercentChange: calculatePercentageChange(currentStat.count, prevCount)
        };
      });
      
      setServiceStats(combinedStats);
    } else {
      setServiceStats([]);
    }
  }, [filteredAppointments, previousPeriodAppointments, services]);

  // Memoized calculation of service stats
  const calculateServiceStats = useMemo(() => (appointmentsData: Appointment[]) => {
    const serviceRevenue: { [key: string]: { value: number; count: number; name: string; timeTotalMinutes: number } } = {};

    appointmentsData.forEach(appointment => {
      if (!appointment.service) return;

      const serviceId = appointment.service.id;
      const serviceName = appointment.service.name;
      const price = appointment.price || 0;
      
      // Calculate service time based on service duration or scheduled end time
      let durationMinutes = appointment.service.durationMinutes || 60;
      if (appointment.endTime) {
        const startTime = new Date(appointment.date);
        const endTime = new Date(appointment.endTime);
        durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      if (!serviceRevenue[serviceId]) {
        serviceRevenue[serviceId] = { 
          value: 0, 
          count: 0, 
          name: serviceName,
          timeTotalMinutes: 0
        };
      }

      serviceRevenue[serviceId].value += price;
      serviceRevenue[serviceId].count += 1;
      serviceRevenue[serviceId].timeTotalMinutes += durationMinutes;
    });

    // Convert the serviceRevenue object to an array for recharts
    const serviceStatsArray = Object.entries(serviceRevenue).map(([, data]) => ({
      name: data.name,
      value: data.value,
      count: data.count,
      timeTotalMinutes: data.timeTotalMinutes,
      percentChange: "0%" // This will be calculated later
    }));

    // Sort services by revenue in descending order
    serviceStatsArray.sort((a, b) => b.value - a.value);

    return serviceStatsArray;
  }, []);

  // Day of week distribution data
  const dayOfWeekData = useMemo(() => {
    if (!filteredAppointments.length) return [];
    
    const dayDistribution = getDayOfWeekDistribution(filteredAppointments);
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return dayNames.map((day, index) => ({
      name: day,
      count: dayDistribution[index]
    }));
  }, [filteredAppointments]);
  
  // Hour distribution data
  const hourDistributionData = useMemo(() => {
    if (!filteredAppointments.length) return [];
    
    const hourDistribution = getHourDistribution(filteredAppointments);
    return hourDistribution.map((count, hour) => ({
      hour: `${hour}:00`,
      count
    })).filter(item => item.count > 0);
  }, [filteredAppointments]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const comparisonMonthName = comparisonDate ? format(comparisonDate, 'MMMM yyyy', { locale: ptBR }) : '';
  const currentMonthName = format(createDateWithNoon(selectedYear, selectedMonth), 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Receita por Serviço</CardTitle>
          <div className="flex space-x-2 items-center">
            <span className="text-sm text-muted-foreground">Comparando com:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !comparisonDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {comparisonDate ? (
                    format(comparisonDate, "MMMM yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar mês</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="month"
                  locale={ptBR}
                  selected={comparisonDate}
                  onSelect={handleComparisonDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
          {serviceStats.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="text-sm font-semibold mb-2">Comparativo: {currentMonthName} vs. {comparisonMonthName}</div>
                <ul className="space-y-2">
                  {serviceStats.map((service, index) => (
                    <li key={index} className="py-1 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{service.name}</span>
                        <span className={cn(
                          "text-xs font-medium",
                          service.percentChange.startsWith('+') ? "text-green-500" : 
                          service.percentChange.startsWith('-') ? "text-red-500" : ""
                        )}>
                          {service.percentChange}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{service.count} agendamentos ({formatTimeDuration(service.timeTotalMinutes)})</span>
                        <span>{formatCurrency(service.value)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">Nenhum dado de serviço disponível.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {dayOfWeekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Agendamentos" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-4">Nenhum dado disponível.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            {hourDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Agendamentos" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-4">Nenhum dado disponível.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
