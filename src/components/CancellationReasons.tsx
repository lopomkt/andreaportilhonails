import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertCircle, PieChartIcon } from "lucide-react";
import { useData } from "@/context/DataProvider";
import { useState, useEffect } from "react";

// Types
interface CancellationReason {
  name: string;
  value: number;
  color: string;
}

// Colors for the pie chart
const COLORS = ["#B76E79", "#E5989B", "#FFB4A2", "#FFCDB2", "#9D5F5C"];

// Standard cancellation reasons
export const cancellationReasons = ["Cliente desmarcou", "Cliente não apareceu", "Remarcado", "Problema pessoal", "Outros"];
export function CancellationReasons() {
  const {
    appointments
  } = useData();
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [totalCancellations, setTotalCancellations] = useState(0);
  useEffect(() => {
    // Get all canceled appointments
    const canceledAppointments = appointments.filter(app => app.status === "canceled");
    setTotalCancellations(canceledAppointments.length);
    if (canceledAppointments.length === 0) {
      setReasons([]);
      return;
    }

    // Count cancellation reasons
    const reasonCounts: Record<string, number> = {};
    canceledAppointments.forEach(app => {
      const reason = app.cancellationReason || "Sem motivo informado";
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Convert to array format for chart
    const reasonsArray: CancellationReason[] = Object.entries(reasonCounts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
    setReasons(reasonsArray);
  }, [appointments]);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="bg-white p-3 shadow-lg rounded-lg border border-rose-100">
          <p className="font-medium">{data.name}</p>
          <p className="text-rose-600">
            {data.value} cancelamento{data.value !== 1 ? 's' : ''}
          </p>
          <p className="text-muted-foreground text-sm">
            {(data.value / totalCancellations * 100).toFixed(1)}% do total
          </p>
        </div>;
    }
    return null;
  };
  return;
}