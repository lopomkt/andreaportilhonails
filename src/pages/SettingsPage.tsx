
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, Bell, Lock, UserCog } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const settingsCategories = [
    {
      title: "Perfil",
      description: "Gerenciar dados pessoais e do salão",
      icon: UserCog,
      path: "/configuracoes/perfil"
    },
    {
      title: "Mensagens Automáticas",
      description: "Configurar templates de mensagens para clientes",
      icon: MessageSquare,
      path: "/configuracoes/mensagens"
    },
    {
      title: "Notificações",
      description: "Configurar alertas e notificações do sistema",
      icon: Bell,
      path: "/configuracoes/notificacoes"
    },
    {
      title: "Segurança",
      description: "Gerenciar senha e configurações de segurança",
      icon: Lock,
      path: "/configuracoes/seguranca"
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, idx) => (
          <Card 
            key={idx}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(category.path)}
          >
            <CardHeader className="flex flex-row items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
