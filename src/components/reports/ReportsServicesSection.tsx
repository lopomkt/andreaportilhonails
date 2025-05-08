import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { Appointment } from '@/types';
import { format } from 'date-fns';

export function ReportsServicesSection() {
  const { appointments, services } = useData();
  const [serviceStats, setServiceStats] = useState<{ name: string; value: number; count: number }[]>([]);

  useEffect(() => {
    if (appointments && services) {
      const confirmedAppointments = appointments.filter(appointment => appointment.status === 'confirmed');
      setServiceStats(calculateServiceStats(confirmedAppointments));
    }
  }, [appointments, services]);

  // Add a helper function to ensure dates are processed correctly
  const processDateString = (dateValue: string | Date): string => {
    if (dateValue instanceof Date) {
      return format(dateValue, 'yyyy-MM-dd');
    }
    return dateValue;
  };

  const calculateServiceStats = (appointmentsData: Appointment[]) => {
    const serviceRevenue: { [key: string]: { value: number; count: number; name: string } } = {};

    appointmentsData.forEach(appointment => {
      if (!appointment.service) return;

      const serviceId = appointment.service.id;
      const serviceName = appointment.service.name;
      const price = appointment.price || 0;

      if (!serviceRevenue[serviceId]) {
        serviceRevenue[serviceId] = { value: 0, count: 0, name: serviceName };
      }

      serviceRevenue[serviceId].value += price;
      serviceRevenue[serviceId].count += 1;
    });

    // Convert the serviceRevenue object to an array for recharts
    const serviceStatsArray = Object.entries(serviceRevenue).map(([, data]) => ({
      name: data.name,
      value: data.value,
      count: data.count,
    }));

    // Sort services by revenue in descending order
    serviceStatsArray.sort((a, b) => b.value - a.value);

    return serviceStatsArray;
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita por Serviço</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {serviceStats.length > 0 ? (
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
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-4">Nenhum dado de serviço disponível.</div>
        )}
        <ul>
          {serviceStats.map((service, index) => (
            <li key={index} className="py-1">
              {service.name}: {formatCurrency(service.value)} ({service.count} agendamentos)
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
