
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { useData } from "@/context/DataContext";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Users, FileText, Trash2, Edit, AlertCircle } from "lucide-react";
import { format, subMonths, addMonths, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Expense } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const COLORS = ["#9b87f5", "#c026d3", "#e879f9", "#f0abfc", "#f5d0fe"];

export default function FinancePage() {
  const {
    appointments,
    services,
    expenses,
    clients,
    addExpense,
    deleteExpense,
  } = useData();
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  
  // Month/year selection
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Use dashboard stats with selected month and year
  const dashboardStats = useDashboardStats(selectedMonth, selectedYear);
  const selectedMonthDate = new Date(selectedYear, selectedMonth, 1);
  
  // Calculate monthly data
  const prevMonth = subMonths(selectedMonthDate, 1);

  // Create monthly data for last 6 months
  const monthlyData = Array(6).fill(0).map((_, i) => {
    const monthDate = subMonths(selectedMonthDate, i);
    const monthName = format(monthDate, "MMM", {
      locale: ptBR
    });
    
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthRevenue = appointments.filter(appt => {
      const date = new Date(appt.date);
      const isInMonth = date >= monthStart && date <= monthEnd;
      return isInMonth && appt.status === "confirmed";
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

  // Calculate service popularity from confirmed appointments
  const serviceStats = services.map(service => {
    const filteredAppointments = appointments.filter(appt => {
      const date = new Date(appt.date);
      const isInMonth = isSameMonth(date, selectedMonthDate);
      return isInMonth && appt.serviceId === service.id && appt.status === "confirmed";
    });
    
    const count = filteredAppointments.length;
    const revenue = filteredAppointments.reduce((sum, appt) => sum + appt.price, 0);
    
    return {
      id: service.id,
      name: service.name,
      count,
      revenue
    };
  });

  // Sort by revenue
  const topServices = [...serviceStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Calculate month's revenue, expenses and profit
  const currentMonthRevenue = dashboardStats.monthStats.revenue;
  const currentMonthExpenses = expenses.filter(exp => {
    const date = new Date(exp.date);
    return isSameMonth(date, selectedMonthDate);
  }).reduce((sum, exp) => sum + exp.amount, 0);
  const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;

  // Previous month calculations
  const prevMonthDate = subMonths(selectedMonthDate, 1);
  const prevMonthRevenue = appointments.filter(appt => {
    const date = new Date(appt.date);
    return isSameMonth(date, prevMonthDate) && appt.status === "confirmed";
  }).reduce((sum, appt) => sum + appt.price, 0);

  // Calculate month-over-month changes
  const revenueChange = prevMonthRevenue > 0 ? (currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100 : 100;
  
  // Get expected revenue (future confirmed appointments)
  const expectedRevenue = dashboardStats.calculateExpectedRevenue();

  // Generate months for select
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR })
  }));
  
  // Generate years (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: currentYear - i,
    label: `${currentYear - i}`
  }));

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

  return (
    <div className="space-y-6 animate-fade-in px-4 md:px-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="font-bold text-2xl">Gestão Financeira</h2>
        
        <div className="flex gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleAddExpense} className="gap-1">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-2">
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
              {formatCurrency(currentMonthProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita menos despesas
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Prevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(expectedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Agendamentos futuros confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita vs Despesas (Últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent className="mx-0 px-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{
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
                  <LineChart data={monthlyData} margin={{
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

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topServices} cx="50%" cy="50%" labelLine={false} label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent
                    }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return percent > 0.05 ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text> : null;
                    }} outerRadius={80} fill="#8884d8" dataKey="count">
                        {topServices.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value, name, props) => [`${value} atendimentos`, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => <div key={service.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: COLORS[index % COLORS.length]
                      }} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {service.count} atendimentos
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-2 bg-secondary rounded-full w-full">
                          <div className="h-2 rounded-full" style={{
                        width: `${service.revenue / (topServices[0]?.revenue || 1) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }} />
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {formatCurrency(service.revenue)}
                        </span>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Registro de Despesas</CardTitle>
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
                    {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonthDate)).map(expense => <div key={expense.id} className="grid grid-cols-5 gap-4 p-4">
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
                    {expenses.filter(expense => isSameMonth(new Date(expense.date), selectedMonthDate)).length === 0 && <div className="p-4 text-center text-muted-foreground">
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
          <ExpenseForm 
            expense={activeExpense}
            onClose={handleCloseForm}
            onSave={(expense) => {
              setShowExpenseForm(false);
              setActiveExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
