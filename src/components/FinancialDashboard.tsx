
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Calendar, Activity, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency, formatMinutesToHumanTime } from "@/lib/formatters";
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
    const confirmedAppointments = (appointments || []).filter(appt => appt.status === "confirmed" && new Date(appt.date) >= firstDayOfMonth && new Date(appt.date) <= now);
    const revenue = confirmedAppointments.reduce((sum, appt) => sum + appt.price, 0);
    setCurrentMonthRevenue(revenue);

    // Calculate projected revenue (confirmed future appointments)
    const futureAppointments = (appointments || []).filter(appt => appt.status === "confirmed" && new Date(appt.date) > now);
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
  
  // Fix: Return JSX content instead of void
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Dashboard Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Placeholder for financial dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Projetada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(projectedRevenue)}</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
