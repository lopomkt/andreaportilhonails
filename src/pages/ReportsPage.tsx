import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Users, Clock, Link } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  // Example data for the monthly appointments chart
  const monthlyData = [{
    name: 'Jan',
    appointments: 65,
    cancellations: 5
  }, {
    name: 'Fev',
    appointments: 59,
    cancellations: 7
  }, {
    name: 'Mar',
    appointments: 80,
    cancellations: 3
  }, {
    name: 'Abr',
    appointments: 81,
    cancellations: 6
  }, {
    name: 'Mai',
    appointments: 56,
    cancellations: 4
  }, {
    name: 'Jun',
    appointments: 55,
    cancellations: 2
  }];

  // Example data for the service time statistics
  const serviceTimeData = [{
    name: 'Manicure',
    avgTime: '45 min'
  }, {
    name: 'Pedicure',
    avgTime: '50 min'
  }, {
    name: 'Alongamento',
    avgTime: '1h 30min'
  }, {
    name: 'Nail Art',
    avgTime: '1h 15min'
  }, {
    name: 'Spa Completo',
    avgTime: '2h'
  }];
  return <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <BarChart2 className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      {/* Monthly Appointments Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Agendamentos por Mês</CardTitle>
          <CardDescription>Comparativo entre agendamentos e cancelamentos</CardDescription>
        </CardHeader>
        <CardContent className="px-0 mx-0 my-0">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => [`${value}`, '']} labelFormatter={label => `Mês: ${label}`} />
                <Legend />
                <Bar dataKey="appointments" name="Agendamentos" fill="#B76E79" />
                <Bar dataKey="cancellations" name="Cancelamentos" fill="#EA384C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Service Time Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Estatística de Tempo por Serviço</CardTitle>
          <CardDescription>Tempo médio de cada tipo de serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {serviceTimeData.map((service, index) => <div key={index} className="py-3 flex justify-between items-center">
                <span className="font-medium">{service.name}</span>
                <span className="text-muted-foreground">{service.avgTime}</span>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* If no data is available, show a fallback message */}
      {!monthlyData.length && !serviceTimeData.length && <div className="text-center py-10 bg-accent/10 rounded-lg">
          <p className="text-muted-foreground">Sem dados disponíveis para exibir relatórios.</p>
        </div>}
    </div>;
};
export default ReportsPage;