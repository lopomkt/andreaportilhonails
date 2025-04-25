
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CalendarX, Settings, Trophy } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const FunctionalitiesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const functionalitiesCategories = [
    {
      title: "Motivos de Cancelamento",
      description: "Gerencie os motivos padrão para cancelamentos",
      icon: CalendarX,
      path: "/funcionalidades/motivos-cancelamento"
    }, 
    {
      title: "Regras de Ausência",
      description: "Configure bloqueios de horários e dias de folga",
      icon: Settings,
      path: "/funcionalidades/ausencias"
    }, 
    {
      title: "Mensagens para WhatsApp",
      description: "Configure templates de mensagens para clientes",
      icon: MessageSquare,
      path: "/funcionalidades/mensagens"
    }, 
    {
      title: "Ranking de Clientes",
      description: "Visualize seus melhores clientes por diferentes métricas",
      icon: Trophy,
      path: "/funcionalidades/ranking-clientes"
    }
  ];

  return <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Funcionalidades</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {functionalitiesCategories.map((category, idx) => <Card key={idx} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(category.path)}>
            <CardHeader className="flex flex-row items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>)}
      </div>
    </div>;
};

export default FunctionalitiesPage;
