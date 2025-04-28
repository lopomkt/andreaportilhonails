import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, MessageCircle } from "lucide-react";
import { Client, ClientWithRank } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useData } from "@/context/DataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Badge mapping for top clients
const clientBadges = ["🥇", "🥈", "🥉"];

type PeriodFilter = "current" | "last" | "last3" | "last6" | "year" | "all";

export function ClientRanking() {
  const { clients, appointments, generateWhatsAppLink } = useData();
  const [topClients, setTopClients] = useState<ClientWithRank[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("current");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setLoading(true);
    
    try {
      // Calculate date ranges based on selected period
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (period) {
        case "current":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "last":
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case "last3":
          startDate = startOfMonth(subMonths(now, 3));
          endDate = now;
          break;
        case "last6":
          startDate = startOfMonth(subMonths(now, 6));
          endDate = now;
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case "all":
          startDate = new Date(0); // Beginning of time
          endDate = now;
          break;
      }
      
      // Get confirmed appointments for the selected period
      const filteredAppointments = appointments.filter(appt => {
        const appointmentDate = new Date(appt.date);
        return appt.status === "confirmed" && 
          isWithinInterval(appointmentDate, { start: startDate, end: endDate });
      });
      
      // Calculate total spent per client during this period
      const clientSpending: Record<string, number> = {};
      
      filteredAppointments.forEach(appt => {
        if (appt.clientId) {
          if (!clientSpending[appt.clientId]) {
            clientSpending[appt.clientId] = 0;
          }
          clientSpending[appt.clientId] += appt.price;
        }
      });
      
      // Map clients with ranking
      const clientsWithSpending = clients
        .filter(client => clientSpending[client.id])
        .map(client => ({
          ...client,
          rank: 0, // Will be assigned after sorting
          badge: null as string | null,
          appointmentCount: 0,
          totalSpent: clientSpending[client.id] || 0,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, isMobile ? 10 : 20) // Top 10 clients on mobile, 20 on desktop
        .map((client, index) => ({
          ...client,
          rank: index + 1,
          badge: index < 3 ? clientBadges[index] : null
        }));
      
      setTopClients(clientsWithSpending);
      setLoading(false);
    } catch (error) {
      console.error("Error calculating client ranking:", error);
      toast({
        title: "Erro ao carregar ranking",
        description: "Não foi possível calcular o ranking de clientes. Tente novamente.",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [clients, appointments, period, toast, isMobile]);
  
  const handleSendWhatsApp = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Create a special message for the ranked client
      const whatsappLink = await generateWhatsAppLink({
        phone: client.phone,
        message: `Olá ${client.name}! 👑 Queria te parabenizar por ser uma das minhas clientes mais especiais! Como agradecimento pela sua preferência, vou te dar 10% de desconto no seu próximo atendimento. Quando quiser agendar, é só me avisar! 💕`,
        clientName: client.name
      });
      if (whatsappLink) {
        window.open(whatsappLink, '_blank');
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem WhatsApp. Verifique a conexão.",
        variant: "destructive"
      });
    }
  };
  
  const getPeriodLabel = () => {
    switch (period) {
      case "current": return "Mês Atual";
      case "last": return "Mês Anterior";
      case "last3": return "Últimos 3 Meses";
      case "last6": return "Últimos 6 Meses";
      case "year": return "Este Ano";
      case "all": return "Todo Período";
      default: return "";
    }
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl text-rose-700">
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
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            {!isMobile && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pos.</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.length > 0 ? (
                    topClients.map(client => (
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
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={(e) => handleSendWhatsApp(client, e)}
                          >
                            <MessageCircle className="mr-1 h-3 w-3" />
                            Mensagem
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
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
              <div className="grid grid-cols-1 gap-2">
                {topClients.length > 0 ? (
                  topClients.slice(0, 5).map((client) => (
                    <Card key={client.id} className="overflow-hidden border-rose-100">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex flex-col items-center justify-center w-8 mr-2">
                              <span className="font-bold text-rose-600">{client.rank}º</span>
                              {client.badge && <span className="text-lg">{client.badge}</span>}
                            </div>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{client.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-rose-600">{formatCurrency(client.totalSpent)}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-1 h-7 px-2 py-0 text-xs border-rose-200 text-rose-600"
                              onClick={(e) => handleSendWhatsApp(client, e)}
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
  );
}
