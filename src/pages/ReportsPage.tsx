
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
import { ServiceTimeStatistics } from "@/components/ServiceTimeStatistics";

const COLORS = ["#9b87f5", "#c026d3", "#e879f9", "#f0abfc", "#f5d0fe"];

export default function ReportsPage() {
  const { appointments, services, expenses } = useData();
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
  }, [services, getFilteredAppointments]);
  
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
        revenue,
        count: monthAppointments.length
      });
    }
    
    return data;
  }, [appointments, selectedYear, selectedMonth]);
  
  // Calculate distribution by weekday
  const weekdayData = React.useMemo(() => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayCounts = Array(7).fill(0);
    
    appointments
      .filter(appointment => appointment.status === 'confirmed')
      .forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        const weekday = appointmentDate.getDay();
        weekdayCounts[weekday]++;
      });
    
    return weekdays.map((day, index) => ({
      day,
      count: weekdayCounts[index]
    }));
  }, [appointments]);
  
  // Calculate popular hours
  const popularHoursData = React.useMemo(() => {
    const hourCounts = Array(24).fill(0);
    
    appointments
      .filter(appointment => appointment.status === 'confirmed')
      .forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        const hour = appointmentDate.getHours();
        hourCounts[hour]++;
      });
    
    return hourCounts
      .map((count, hour) => ({
        hour: `${hour}h`,
        count
      }))
      .filter((item, hour) => hour >= 6 && hour <= 20); // Only business hours
  }, [appointments]);
  
  // Calculate monthly expense total
  const monthlyExpenseTotal = React.useMemo(() => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const endDate = endOfMonth(startDate);
    
    return expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      if (isWithinInterval(expenseDate, { start: startDate, end: endDate })) {
        return sum + expense.amount;
      }
      return sum;
    }, 0);
  }, [expenses, selectedMonth, selectedYear]);
  
  // Calculate profit
  const monthlyProfit = dashboardStats.monthStats.revenue - monthlyExpenseTotal;
  
  // Calculate expected revenue for future appointments
  const expectedRevenue = React.useMemo(() => {
    const now = new Date();
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    
    if (now > monthEnd) return 0; // Past month
    
    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointment.status === 'confirmed' && 
               appointmentDate > now && 
               appointmentDate <= monthEnd;
      })
      .reduce((sum, appointment) => sum + appointment.price, 0);
  }, [appointments, selectedMonth, selectedYear]);
  
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
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
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

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

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

          <ServiceTimeStatistics />

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Dia da Semana</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekdayData}
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
                    data={popularHoursData}
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

          <div className="bg-muted py-2 text-center text-xs text-muted-foreground">
            ANALISE OS DADOS COM ATENÇÃO - CRM ANDREA PORTILHO NAILS.
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Despesa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <button className="bg-rose-500 text-white px-4 py-2 rounded">
                  Adicionar
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Lucro do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyProfit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Receita ({formatCurrency(dashboardStats.monthStats.revenue)}) - 
                  Despesas ({formatCurrency(monthlyExpenseTotal)})
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Prevista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(expectedRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Agendamentos futuros confirmados até o fim do mês
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted py-2 text-center text-xs text-muted-foreground">
            ANALISE OS DADOS COM ATENÇÃO - CRM ANDREA PORTILHO NAILS.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
