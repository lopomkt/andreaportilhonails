
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Users, Clock, DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { format, subMonths, addMonths, isSameMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/formatters";
import { Expense } from "@/types";

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    appointments,
    services,
    expenses,
    clients,
    addExpense,
    deleteExpense,
    calculatedMonthlyRevenue
  } = useData();
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);

  // Example data for the monthly appointments chart
  const [monthlyData, setMonthlyData] = useState([
    {
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
      appointments: 40,
      cancellations: 4
    }, {
      name: 'Ago',
      appointments: 45,
      cancellations: 3
    }, {
      name: 'Set',
      appointments: 62,
      cancellations: 5
    }, {
      name: 'Out',
      appointments: 68,
      cancellations: 7
    }, {
      name: 'Nov',
      appointments: 71,
      cancellations: 4
    }, {
      name: 'Dez',
      appointments: 78,
      cancellations: 6
    }
  ]);

  // Service time statistics
  const [serviceTimeData, setServiceTimeData] = useState([
    {
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
    }
  ]);

  // Calculate monthly data for financial reports
  const currentDate = new Date();
  
  // Calculate financials
  const [financeData, setFinanceData] = useState<any[]>([]);
  
  useEffect(() => {
    // Create monthly data for last 6 months
    const monthlyFinanceData = Array(3).fill(0).map((_, i) => {
      const monthDate = subMonths(currentDate, i);
      const monthName = format(monthDate, "MMM", {
        locale: ptBR
      });
      const monthRevenue = appointments.filter(appt => {
        const date = new Date(appt.date);
        return isSameMonth(date, monthDate) && appt.status !== "canceled";
      }).reduce((sum, appt) => sum + appt.price, 0);
      const monthExpenses = expenses.filter(exp => {
        const date = new Date(exp.date);
        return isSameMonth(date, monthDate);
      }).reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      };
    }).reverse();
    
    setFinanceData(monthlyFinanceData);
  }, [appointments, expenses, currentDate]);

  // Calculate real service times from appointments
  useEffect(() => {
    if (services.length > 0 && appointments.length > 0) {
      const serviceTimesMap = new Map();
      
      appointments.forEach(appt => {
        if (appt.status === "confirmed" && appt.endTime) {
          const service = services.find(s => s.id === appt.serviceId);
          if (service) {
            const startTime = new Date(appt.date);
            const endTime = new Date(appt.endTime);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
            
            if (!serviceTimesMap.has(service.id)) {
              serviceTimesMap.set(service.id, {
                name: service.name,
                totalMinutes: 0,
                count: 0
              });
            }
            
            const data = serviceTimesMap.get(service.id);
            data.totalMinutes += durationMinutes;
            data.count += 1;
          }
        }
      });
      
      // Calculate averages and format
      const calculatedServiceTimes = Array.from(serviceTimesMap.values()).map(({ name, totalMinutes, count }) => {
        const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;
        let avgTimeFormatted;
        
        if (avgMinutes >= 60) {
          const hours = Math.floor(avgMinutes / 60);
          const minutes = avgMinutes % 60;
          avgTimeFormatted = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
        } else {
          avgTimeFormatted = `${avgMinutes} min`;
        }
        
        return { name, avgTime: avgTimeFormatted };
      });
      
      if (calculatedServiceTimes.length > 0) {
        setServiceTimeData(calculatedServiceTimes);
      }
    }
  }, [services, appointments]);

  // Current month calculations
  const currentMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, currentDate) && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);
  
  const currentMonthExpenses = expenses.filter(exp => {
    const date = new Date(exp.date);
    return isSameMonth(date, currentDate);
  }).reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate next month's projected revenue
  const nextMonth = addMonths(currentDate, 1);
  const projectedRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, nextMonth) && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);

  // Previous month calculations
  const prevMonth = subMonths(currentDate, 1);
  const prevMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, prevMonth) && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);

  // Calculate month-over-month changes
  const revenueChange = prevMonthRevenue > 0 ? (currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100 : 100;

  const handleAddExpense = () => {
    setActiveExpense(null);
    setShowExpenseForm(true);
  };
  
  const handleCloseForm = () => {
    setShowExpenseForm(false);
    setActiveExpense(null);
  };
  
  const handleDeleteExpense = (expense: Expense) => {
    if (window.confirm(`Tem certeza que deseja excluir a despesa "${expense.name}"?`)) {
      deleteExpense(expense.id);
    }
  };
  
  const handleEditExpense = (expense: Expense) => {
    setActiveExpense(expense);
    setShowExpenseForm(true);
  };
  
  const handlePrevMonth = () => {
    setSelectedMonth(prevDate => subMonths(prevDate, 1));
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(nextDate => addMonths(nextDate, 1));
  };

  return <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>
        <Button onClick={handleAddExpense} className="gap-1">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Receita (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthRevenue)}
            </div>
            <div className="flex items-center mt-1">
              <div className={`text-xs ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {revenueChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {Math.abs(revenueChange).toFixed(1)}% em relação ao mês anterior
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de gastos registrados
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Lucro (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthRevenue - currentMonthExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita menos despesas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
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
                {serviceTimeData.length > 0 ? (
                  serviceTimeData.map((service, index) => (
                    <div key={index} className="py-3 flex justify-between items-center">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">{service.avgTime}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-center text-muted-foreground">
                    Sem dados disponíveis sobre tempos de serviço
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Receitas Previstas</CardTitle>
              <CardDescription>Próximo mês: {format(nextMonth, "MMMM yyyy", { locale: ptBR })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(projectedRevenue)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Baseado nos agendamentos confirmados para o próximo mês
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Receita vs Despesas (Últimos 3 meses)</CardTitle>
            </CardHeader>
            <CardContent className="mx-0 px-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeData} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={value => new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                      style: "currency",
                      currency: "BRL"
                    }).format(value)} />
                    <Tooltip formatter={value => [formatCurrency(value as number), ""]} />
                    <Bar dataKey="revenue" name="Receita" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Despesas" fill="#ea384c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro" fill="#65a30d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Receitas</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financeData} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={value => new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                      style: "currency",
                      currency: "BRL"
                    }).format(value)} />
                    <Tooltip formatter={value => [formatCurrency(value as number), ""]} />
                    <Line type="monotone" dataKey="revenue" name="Receita" stroke="#9b87f5" strokeWidth={2} dot={{
                      r: 4
                    }} activeDot={{
                      r: 6
                    }} />
                    <Line type="monotone" dataKey="profit" name="Lucro" stroke="#65a30d" strokeWidth={2} dot={{
                      r: 4
                    }} activeDot={{
                      r: 6
                    }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Registro de Despesas</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  &lt;
                </Button>
                <span className="text-sm">
                  {format(selectedMonth, "MMMM yyyy", {
                    locale: ptBR
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  &gt;
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                    <div>Descrição</div>
                    <div>Data</div>
                    <div>Valor</div>
                    <div>Tipo</div>
                    <div className="text-right">Ações</div>
                  </div>
                  <div className="divide-y">
                    {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonth)).map(expense => <div key={expense.id} className="grid grid-cols-5 gap-4 p-4">
                          <div className="truncate">{expense.name}</div>
                          <div>{format(new Date(expense.date), "dd/MM/yyyy")}</div>
                          <div>{formatCurrency(expense.amount)}</div>
                          <div>
                            {expense.isRecurring ? <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                Recorrente
                              </span> : <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                                Único
                              </span>}
                          </div>
                          <div className="flex justify-end space-x-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Ações</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteExpense(expense)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>)}
                    {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonth)).length === 0 && <div className="p-4 text-center text-muted-foreground">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                        Nenhuma despesa registrada para este mês.
                      </div>}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{activeExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm onCancel={handleCloseForm} onSuccess={handleCloseForm} expense={activeExpense} />
        </DialogContent>
      </Dialog>
    </div>;
};

export default ReportsPage;
