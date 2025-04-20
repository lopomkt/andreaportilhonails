
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
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">Valor total dos agendamentos confirmados este mês</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Projetada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectedRevenue)}</div>
            <p className="text-xs text-muted-foreground">Valor estimado dos agendamentos futuros confirmados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageClientValue)}</div>
            <p className="text-xs text-muted-foreground">Valor médio gasto por cliente</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.status === "confirmed").length}
            </div>
            <p className="text-xs text-muted-foreground">Total de agendamentos confirmados</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Dia</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip formatter={(value) => [`R$${value}`, 'Receita']} />
                  <Legend />
                  <Bar dataKey="value" name="Receita" fill="#E5989B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Populares</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServices}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {topServices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`R$${value}`, 'Receita']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Serviços por Quantidade</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topServices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="count" name="Quantidade" fill="#B76E79" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
