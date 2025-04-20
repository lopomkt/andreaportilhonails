
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Calendar, Activity, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useData } from "@/context/DataContext";
import { useEffect, useState } from "react";
import { Appointment, Service } from "@/types";

// Colors for the charts
const COLORS = ["#B76E79", "#E5989B", "#FFB4A2", "#FFCDB2", "#E5E5E5"];
interface ServiceRevenue {
  name: string;
  value: number;
  count: number;
}
export function FinancialDashboard() {
  const {
    appointments,
    services,
    calculateDailyRevenue,
    getRevenueData
  } = useData();
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  const [averageClientValue, setAverageClientValue] = useState(0);
  const [topServices, setTopServices] = useState<ServiceRevenue[]>([]);
  useEffect(() => {
    // Calculate current month's revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const confirmedAppointments = appointments.filter(appt => appt.status === "confirmed" && new Date(appt.date) >= firstDayOfMonth && new Date(appt.date) <= now);
    const revenue = confirmedAppointments.reduce((sum, appt) => sum + appt.price, 0);
    setCurrentMonthRevenue(revenue);

    // Calculate projected revenue (confirmed future appointments)
    const futureAppointments = appointments.filter(appt => appt.status === "confirmed" && new Date(appt.date) > now);
    const projected = futureAppointments.reduce((sum, appt) => sum + appt.price, 0);
    setProjectedRevenue(projected);

    // Calculate average client value
    const clientsWithAppointments = new Set(appointments.map(appt => appt.clientId));
    const avgValue = clientsWithAppointments.size > 0 ? revenue / clientsWithAppointments.size : 0;
    setAverageClientValue(avgValue);

    // Calculate top services by revenue
    const serviceRevenue = calculateServiceRevenue(appointments, services);
    setTopServices(serviceRevenue);
  }, [appointments, services]);

  // Helper function to calculate service revenue
  const calculateServiceRevenue = (appointments: Appointment[], services: Service[]): ServiceRevenue[] => {
    // Create a map of service revenues
    const serviceMap: Record<string, ServiceRevenue> = {};

    // Only count confirmed appointments
    const confirmedAppointments = appointments.filter(appt => appt.status === "confirmed");

    // Calculate revenue for each service
    confirmedAppointments.forEach(appt => {
      if (!serviceMap[appt.serviceId]) {
        const service = services.find(s => s.id === appt.serviceId);
        serviceMap[appt.serviceId] = {
          name: service?.name || "Desconhecido",
          value: 0,
          count: 0
        };
      }
      serviceMap[appt.serviceId].value += appt.price;
      serviceMap[appt.serviceId].count += 1;
    });

    // Convert to array and sort by revenue
    return Object.values(serviceMap).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  // Get revenue data for charts
  const revenueData = getRevenueData();
  return <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Receita do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +2% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Prevista
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projectedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos agendamentos confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Cliente
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageClientValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por cliente neste mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Agendamentos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(appt => new Date(appt.date) > new Date() && appt.status !== "canceled").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmados e pendentes
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita Diária</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      tick={{fontSize: 12}}
                    />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#B76E79" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Sem dados de receita para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Serviços Mais Lucrativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {topServices.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topServices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Sem dados de serviços para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
