
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, MessageCircle, ChevronLeft } from "lucide-react";
import { Client } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useData } from "@/context/DataContext";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { createDateWithNoon } from '@/lib/dateUtils';

// Badge mapping for top clients
const clientBadges = ["🥇", "🥈", "🥉"];

interface ClientWithRank extends Client {
  rank: number;
  badge: string | null;
  appointmentsCount: number;
  totalSpent: number;
}

type PeriodFilter = "current" | "last" | "last3" | "last6" | "year" | "all";

const ClientRankingPage: React.FC = () => {
  const { clients, appointments, generateWhatsAppLink } = useData();
  const [rankedClients, setRankedClients] = useState<ClientWithRank[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("current");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate date ranges based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate = createDateWithNoon(now.getFullYear(), now.getMonth());
    let endDate = createDateWithNoon(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case "current":
        startDate = startOfMonth(createDateWithNoon(now.getFullYear(), now.getMonth()));
        endDate = endOfMonth(startDate);
        break;
      case "last":
        startDate = startOfMonth(subMonths(createDateWithNoon(now.getFullYear(), now.getMonth()), 1));
        endDate = endOfMonth(startDate);
        break;
      case "last3":
        startDate = startOfMonth(subMonths(createDateWithNoon(now.getFullYear(), now.getMonth()), 3));
        endDate = now;
        break;
      case "last6":
        startDate = startOfMonth(subMonths(createDateWithNoon(now.getFullYear(), now.getMonth()), 6));
        endDate = now;
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 12, 0, 0, 0);
        endDate = now;
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        startDate.setHours(12, 0, 0, 0);
        endDate = now;
        break;
    }
    
    return { startDate, endDate };
  }, [period]);

  // Memoized filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const appointmentDate = new Date(appt.date);
      return appt.status === "confirmed" && 
        isWithinInterval(appointmentDate, { start: dateRange.startDate, end: dateRange.endDate });
    });
  }, [appointments, dateRange]);

  // Calculate client stats
  useEffect(() => {
    setLoading(true);
    
    try {
      // Count appointments per client and calculate total spent
      const clientStats: Record<string, { count: number, spent: number }> = {};
      
      filteredAppointments.forEach(appt => {
        if (appt.clientId) {
          // Initialize if client not in stats yet
          if (!clientStats[appt.clientId]) {
            clientStats[appt.clientId] = { count: 0, spent: 0 };
          }
          clientStats[appt.clientId].count += 1;
          clientStats[appt.clientId].spent += appt.price;
        }
      });
      
      // Map clients with ranking
      const rankedClientsList = clients
        .filter(client => clientStats[client.id])
        .map(client => ({
          ...client,
          rank: 0, // Will be assigned after sorting
          badge: null,
          totalSpent: clientStats[client.id]?.spent || 0,
          appointmentsCount: clientStats[client.id]?.count || 0
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, isMobile ? 10 : 20) // Show top 10 clients on mobile, 20 on desktop
        .map((client, index) => ({
          ...client,
          rank: index + 1,
          badge: index < 3 ? clientBadges[index] : null
        }));
      
      setRankedClients(rankedClientsList);
    } catch (error) {
      console.error("Error calculating client ranking:", error);
      toast({
        title: "Erro ao carregar ranking",
        description: "Não foi possível carregar o ranking de clientes. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [clients, filteredAppointments, isMobile, toast]);

  const handleSendWhatsApp = useCallback(async (client: Client) => {
    try {
      // Create a special message for the ranked client
      const message = {
        client,
        message: `Olá ${client.name}! 👑 Queria te parabenizar por ser uma das minhas clientes mais especiais! Como agradecimento pela sua preferência, vou te dar 10% de desconto no seu próximo atendimento. Quando quiser agendar, é só me avisar! 💕`
      };
      
      const whatsappLink = await generateWhatsAppLink(message);
      if (whatsappLink) {
        window.open(whatsappLink, '_blank');
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem WhatsApp. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [generateWhatsAppLink, toast]);

  const getPeriodLabel = useCallback(() => {
    switch (period) {
      case "current": return "Mês Atual";
      case "last": return "Mês Anterior";
      case "last3": return "Últimos 3 Meses";
      case "last6": return "Últimos 6 Meses";
      case "year": return "Este Ano";
      case "all": return "Todo Período";
      default: return "";
    }
  }, [period]);

  return (
    <div className="container mx-auto p-3 md:p-4 relative">
      {/* Back button for mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 p-1 h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-xl text-rose-700 mt-4 md:mt-0">
            <Trophy className="mr-2 h-5 w-5" />
            Ranking de Clientes
          </CardTitle>
          <CardDescription>
            As clientes que mais investiram nos seus cuidados durante {getPeriodLabel().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês Atual</SelectItem>
                <SelectItem value="last">Mês Anterior</SelectItem>
                <SelectItem value="last3">Últimos 3 Meses</SelectItem>
                <SelectItem value="last6">Últimos 6 Meses</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="all">Todo Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              {!isMobile && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Agendamentos</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedClients.length > 0 ? (
                      rankedClients.map(client => (
                        <TableRow key={client.id} className="hover:bg-rose-50">
                          <TableCell className="font-medium">{client.rank}º</TableCell>
                          <TableCell>
                            {client.badge && <span className="text-xl">{client.badge}</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2 border border-rose-100">
                                <AvatarFallback className="bg-rose-100 text-rose-700">
                                  {client.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-rose-600">
                            {formatCurrency(client.totalSpent)}
                          </TableCell>
                          <TableCell className="text-right">
                            {client.appointmentsCount}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-rose-200 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleSendWhatsApp(client)}
                            >
                              <MessageCircle className="mr-1 h-3 w-3" />
                              Mensagem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <Trophy className="h-12 w-12 text-rose-200 mx-auto mb-2" />
                          <p className="text-muted-foreground">Ainda não há dados suficientes para gerar o ranking</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Mobile View - Card Layout */}
              {isMobile && (
                <div className="grid grid-cols-1 gap-3">
                  {rankedClients.length > 0 ? (
                    rankedClients.map((client) => (
                      <Card key={client.id} className="overflow-hidden border-rose-100 hover:border-rose-300 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex flex-col items-center justify-center w-8 mr-2">
                                <span className="font-bold text-rose-700">{client.rank}º</span>
                                {client.badge && <span className="text-lg">{client.badge}</span>}
                              </div>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2 border border-rose-100">
                                  <AvatarFallback className="bg-rose-100 text-rose-700">
                                    {client.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm line-clamp-1">{client.name}</p>
                                  <p className="text-xs text-muted-foreground">{client.appointmentsCount} agendamentos</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-rose-600">{formatCurrency(client.totalSpent)}</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-1 h-7 px-2 py-0 text-xs border-rose-200 text-rose-600"
                                onClick={() => handleSendWhatsApp(client)}
                              >
                                <MessageCircle className="mr-1 h-3 w-3" />
                                WhatsApp
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="h-12 w-12 text-rose-200 mx-auto mb-2" />
                      <p className="text-muted-foreground">Sem dados para gerar o ranking</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientRankingPage;
