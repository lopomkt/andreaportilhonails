// I'll update the ReportsPage.tsx with filters and month/year selection
// The page structure will remain the same, but with added filtering functionality
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/lib/formatters";

const COLORS = ["#9b87f5", "#c026d3", "#e879f9", "#f0abfc", "#f5d0fe"];

export default function ReportsPage() {
  const { appointments, services } = useData();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Use the hook with selected month and year
  const dashboardStats = useDashboardStats(selectedMonth, selectedYear);
  
  // Filter appointments by selected month and status
  const getFilteredAppointments = (status?: string) => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const endDate = endOfMonth(startDate);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const isInTimeframe = isWithinInterval(appointmentDate, { start: startDate, end: endDate });
      
      if (status) {
        return isInTimeframe && appointment.status === status;
      }
      
      return isInTimeframe;
    });
  };
  
  // Create data for services chart (confirmed appointments)
  const serviceData = React.useMemo(() => {
    const confirmedAppointments = getFilteredAppointments('confirmed');
    const serviceMap = new Map();
    
    confirmedAppointments.forEach(appointment => {
      const serviceId = appointment.serviceId;
      const serviceName = services.find(s => s.id === serviceId)?.name || 'Unknown';
      
      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          name: serviceName,
          count: 0,
          value: 0
        });
      }
      
      const service = serviceMap.get(serviceId);
      service.count += 1;
      service.value += appointment.price;
    });
    
    return Array.from(serviceMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 services
  }, [services, selectedMonth, selectedYear]);
  
  // Create data for cancellations chart
  const cancellationData = React.useMemo(() => {
    const cancelledAppointments = getFilteredAppointments('canceled');
    const reasonMap = new Map();
    
    cancelledAppointments.forEach(appointment => {
      const reason = appointment.cancellationReason || 'Sem motivo';
      
      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, {
          name: reason,
          count: 0
        });
      }
      
      reasonMap.get(reason).count += 1;
    });
    
    return Array.from(reasonMap.values())
      .sort((a, b) => b.count - a.count);
  }, [selectedMonth, selectedYear]);

  // Historical revenue data for last 6 months
  const revenueHistoryData = React.useMemo(() => {
    const data = [];
    const currentDate = new Date(selectedYear, selectedMonth, 1);
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentDate, i);
      const month = format(monthDate, 'MMM', { locale: ptBR });
      const year = monthDate.getFullYear();
      const monthNumber = monthDate.getMonth();
      
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointment.status === 'confirmed' && 
          isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      });
      
      const revenue = monthAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
      
      data.push({
        month,
        year,
        revenue
      });
    }
    
    return data;
  }, [appointments, selectedYear, selectedMonth]);
  
  // Generate months for select
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR })
  }));
  
  // Generate years (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: currentYear - i,
    label: `${currentYear - i}`
  }));

  return (
    <div className="space-y-6 px-4 md:px-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        
        <div className="flex gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats.monthStats.revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.monthStats.count}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.monthStats.count > 0 ? 
                formatCurrency(dashboardStats.monthStats.revenue / dashboardStats.monthStats.count) : 
                formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="cancelations">Cancelamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChartContainer
                config={{
                  revenue: {
                    label: "Receita",
                    color: "#9b87f5",
                  }
                }}
                title={`Receita (${format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: ptBR })})`}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("pt-BR", {
                          notation: "compact",
                          compactDisplay: "short",
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Receita",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Receita"
                      fill="#9b87f5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: "Dom", count: 5 },
                        { day: "Seg", count: 10 },
                        { day: "Ter", count: 15 },
                        { day: "Qua", count: 12 },
                        { day: "Qui", count: 18 },
                        { day: "Sex", count: 20 },
                        { day: "Sáb", count: 25 },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Atendimentos"
                        fill="#9b87f5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horários Mais Populares</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { hour: "8h", count: 5 },
                        { hour: "9h", count: 8 },
                        { hour: "10h", count: 12 },
                        { hour: "11h", count: 10 },
                        { hour: "12h", count: 5 },
                        { hour: "13h", count: 7 },
                        { hour: "14h", count: 15 },
                        { hour: "15h", count: 18 },
                        { hour: "16h", count: 14 },
                        { hour: "17h", count: 9 },
                        { hour: "18h", count: 6 },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Atendimentos"
                        fill="#9b87f5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChartContainer
                config={{
                  services: {
                    label: "Serviços",
                    color: "#9b87f5",
                  }
                }}
                title="Distribuição de receita por serviço"
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return percent > 0.05 ? (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Receita",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceData.map((service, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {service.count} atendimentos
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-2 bg-secondary rounded-full w-full">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(service.value / (serviceData[0]?.value || 1)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {formatCurrency(service.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Cancelamento</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChartContainer
                config={{
                  cancellations: {
                    label: "Cancelamentos",
                    color: "#e11d48",
                  }
                }}
                title="Motivos de cancelamento"
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={cancellationData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Quantidade"
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Cancelamento</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Confirmados", value: 75 },
                        { name: "Cancelados", value: 25 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#9b87f5" />
                      <Cell fill="#e11d48" />
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
