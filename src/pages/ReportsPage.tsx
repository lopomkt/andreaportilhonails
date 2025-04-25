
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Users, Clock, FileText, BarChart } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ServiceTimeStatistics } from '@/components/ServiceTimeStatistics';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
  }, {
    name: 'Jul',
    appointments: 62,
    cancellations: 5
  }, {
    name: 'Ago',
    appointments: 48,
    cancellations: 3
  }, {
    name: 'Set',
    appointments: 70,
    cancellations: 8
  }, {
    name: 'Out',
    appointments: 75,
    cancellations: 4
  }, {
    name: 'Nov',
    appointments: 85,
    cancellations: 6
  }, {
    name: 'Dez',
    appointments: 90,
    cancellations: 7
  }];

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      <div className="flex items-center mb-6">
        <BarChart2 className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="services" className="px-6">
              <FileText className="mr-2 h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="financial" className="px-6">
              <BarChart className="mr-2 h-4 w-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="services" className="space-y-6">
          {/* Monthly Appointments Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Agendamentos por Mês</CardTitle>
              <CardDescription>Comparativo entre agendamentos e cancelamentos</CardDescription>
            </CardHeader>
            <CardContent className="px-0 mx-0 my-0">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={monthlyData} margin={{
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
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Time Statistics */}
          <ServiceTimeStatistics />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <iframe 
            src="/financeiro" 
            className="w-full min-h-[calc(100vh-200px)]" 
            title="Relatório Financeiro"
          />
        </TabsContent>
      </Tabs>

      {/* Fallback message if no data is available */}
      {!monthlyData.length && (
        <div className="text-center py-10 bg-accent/10 rounded-lg mt-6">
          <p className="text-muted-foreground">Sem dados disponíveis para exibir relatórios.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
