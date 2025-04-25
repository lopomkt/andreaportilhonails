
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Calendar, ChevronLeft, ChevronRight, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart } from 'recharts';
import { ServiceTimeStatistics } from '@/components/ServiceTimeStatistics';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, addMonths, isSameMonth, startOfMonth, endOfMonth, addDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '@/context/DataContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/ExpenseForm';
import { Expense } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

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
  const [financialMonth, setFinancialMonth] = useState(new Date());
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);

  // Calculate monthly data
  const currentDate = new Date();
  const prevMonth = subMonths(currentDate, 1);
  const nextMonth = addMonths(currentDate, 1);

  // Create monthly data for last 12 months
  const monthlyData = Array(12).fill(0).map((_, i) => {
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

  // Create data for last 3 months only
  const last3MonthsData = monthlyData.slice(-3);

  // Calculate total revenue, expenses and profit
  const totalRevenue = appointments.filter(appt => appt.status !== "canceled").reduce((sum, appt) => sum + appt.price, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Current month calculations
  const currentMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, currentDate) && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);
  const currentMonthExpenses = expenses.filter(exp => {
    const date = new Date(exp.date);
    return isSameMonth(date, currentDate);
  }).reduce((sum, exp) => sum + exp.amount, 0);

  // Previous month calculations
  const prevMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, prevMonth) && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);

  // Next month calculations (predicted revenue)
  const nextMonthStart = startOfMonth(nextMonth);
  const nextMonthEnd = endOfMonth(nextMonth);
  const nextMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return date >= nextMonthStart && date <= nextMonthEnd && appt.status !== "canceled";
  }).reduce((sum, appt) => sum + appt.price, 0);

  // Calculate month-over-month changes
  const revenueChange = prevMonthRevenue > 0 ? (currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100 : 100;

  // Create monthly data for the selected financial month
  const getFinancialMonthData = () => {
    return {
      revenue: appointments.filter(appt => {
        const date = new Date(appt.date);
        return isSameMonth(date, financialMonth) && appt.status !== "canceled";
      }).reduce((sum, appt) => sum + appt.price, 0),
      expenses: expenses.filter(exp => {
        const date = new Date(exp.date);
        return isSameMonth(date, financialMonth);
      }).reduce((sum, exp) => sum + exp.amount, 0)
    };
  };

  const financialData = getFinancialMonthData();

  // Example data for the monthly appointments chart
  const appointmentsMonthlyData = Array(12).fill(0).map((_, i) => {
    const monthDate = subMonths(currentDate, 11 - i);
    const monthName = format(monthDate, "MMM", {
      locale: ptBR
    });
    
    const appointmentCount = appointments.filter(appt => {
      const date = new Date(appt.date);
      return isSameMonth(date, monthDate) && appt.status !== "canceled";
    }).length;
    
    const cancellations = appointments.filter(appt => {
      const date = new Date(appt.date);
      return isSameMonth(date, monthDate) && appt.status === "canceled";
    }).length;
    
    return {
      name: monthName,
      appointments: appointmentCount,
      cancellations
    };
  });

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

  const handleFinancialPrevMonth = () => {
    setFinancialMonth(prevDate => subMonths(prevDate, 1));
  };
  
  const handleFinancialNextMonth = () => {
    setFinancialMonth(nextDate => addMonths(nextDate, 1));
  };

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
              Serviços
            </TabsTrigger>
            <TabsTrigger value="financial" className="px-6">
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
                  <RechartsBarChart data={appointmentsMonthlyData} margin={{
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
          <div className="flex justify-between items-center">
            <h2 className="font-bold mx-[15px] text-xl">Gestão Financeira</h2>
            <Button onClick={handleAddExpense} className="gap-1 mx-[15px]">
              <DollarSign className="h-4 w-4" />
              Nova Despesa
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Financial Month Selector */}
            <Card className="bg-primary/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Receita ({format(financialMonth, "MMMM yyyy", { locale: ptBR })})
                </CardTitle>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={handleFinancialPrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                    <VisuallyHidden>Mês anterior</VisuallyHidden>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleFinancialNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                    <VisuallyHidden>Próximo mês</VisuallyHidden>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.revenue)}
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
                  Despesas ({format(financialMonth, "MMMM yyyy", { locale: ptBR })})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.expenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de gastos registrados
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Lucro ({format(financialMonth, "MMMM yyyy", { locale: ptBR })})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.revenue - financialData.expenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita menos despesas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Predicted Revenue Card */}
          <Card className="mb-4 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg">Receitas Previstas ({format(nextMonth, "MMMM yyyy", { locale: ptBR })})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(nextMonthRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Baseado em {appointments.filter(a => {
                    const date = new Date(a.date);
                    return date >= nextMonthStart && date <= nextMonthEnd && a.status !== "canceled";
                  }).length} agendamentos confirmados</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Revenue vs Expenses Chart (Last 3 Months) */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita vs Despesas (Últimos 3 meses)</CardTitle>
                </CardHeader>
                <CardContent className="mx-0 px-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={last3MonthsData} margin={{
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
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue Evolution */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal de Receitas</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={last3MonthsData} margin={{
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
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>Registro de Despesas</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                      <VisuallyHidden>Mês anterior</VisuallyHidden>
                    </Button>
                    <span className="text-sm">
                      {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                      <VisuallyHidden>Próximo mês</VisuallyHidden>
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
                        {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonth)).map(expense => (
                          <div key={expense.id} className="grid grid-cols-5 gap-4 p-4">
                            <div className="truncate">{expense.name}</div>
                            <div>{format(new Date(expense.date), "dd/MM/yyyy")}</div>
                            <div>{formatCurrency(expense.amount)}</div>
                            <div>
                              {expense.isRecurring ? (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                  Recorrente
                                </span>
                              ) : (
                                <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                                  Único
                                </span>
                              )}
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
                          </div>
                        ))}
                        {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonth)).length === 0 && (
                          <div className="p-4 text-center text-muted-foreground">
                            <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                            Nenhuma despesa registrada para este mês.
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialog for adding/editing expenses */}
          <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{activeExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
              </DialogHeader>
              <ExpenseForm 
                onCancel={handleCloseForm} 
                onSuccess={handleCloseForm} 
                expense={activeExpense}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Fallback message if no data is available */}
      {!appointmentsMonthlyData.length && (
        <div className="text-center py-10 bg-accent/10 rounded-lg mt-6">
          <p className="text-muted-foreground">Sem dados disponíveis para exibir relatórios.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
