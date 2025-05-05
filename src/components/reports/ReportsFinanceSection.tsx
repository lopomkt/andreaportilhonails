
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useAppointments } from "@/context/AppointmentContext";
import { useExpenses } from "@/context/ExpenseContext";
import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  format, 
  isBefore, 
  isSameMonth, 
  isSameYear,
  isAfter,
  startOfDay,
  endOfDay 
} from "date-fns";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ReportsFinanceSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsFinanceSection({ selectedMonth, selectedYear }: ReportsFinanceSectionProps) {
  // Get appointments and expenses from contexts
  const { appointments } = useAppointments();
  const { expenses } = useExpenses();
  
  // Filter appointments for selected month and calculate metrics
  const filteredData = useMemo(() => {
    const targetDate = new Date(selectedYear, selectedMonth);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    
    // Filter appointments for selected month
    const monthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
    });
    
    // Calculate total revenue (all appointments not canceled)
    const totalRevenue = monthAppointments
      .filter(app => app.status !== "canceled")
      .reduce((sum, app) => sum + app.price, 0);
    
    // Calculate expected revenue (future appointments)
    const now = new Date();
    const expectedRevenue = monthAppointments
      .filter(app => app.status === "confirmed" && isAfter(new Date(app.date), now))
      .reduce((sum, app) => sum + app.price, 0);
    
    // Filter expenses for selected month
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isSameMonth(expenseDate, targetDate) && isSameYear(expenseDate, targetDate);
    });
    
    // Calculate total expenses
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;
    
    // Daily revenue data for chart
    const dailyRevenueData = [];
    const daysInMonth = monthEnd.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      const dayRevenue = monthAppointments
        .filter(app => {
          const appDate = new Date(app.date);
          return isWithinInterval(appDate, { start: dayStart, end: dayEnd }) && 
                 app.status !== "canceled";
        })
        .reduce((sum, app) => sum + app.price, 0);
      
      dailyRevenueData.push({
        name: format(currentDate, "dd"),
        revenue: dayRevenue
      });
    }
    
    return {
      totalRevenue,
      expectedRevenue,
      totalExpenses,
      netProfit,
      monthExpenses,
      dailyRevenueData
    };
  }, [appointments, expenses, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Finance summary cards */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(filteredData.totalRevenue)}
              </div>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Esperada no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(filteredData.expectedRevenue)}
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(filteredData.totalExpenses)}
              </div>
              <BarChart className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Líquido do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(filteredData.netProfit)}
              </div>
              <PiggyBank className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart with real data */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.dailyRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart
                data={filteredData.dailyRevenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Bar dataKey="revenue" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="min-h-[280px] bg-muted rounded-2xl p-4 flex items-center justify-center text-muted-foreground">
              <p>Sem dados de receita para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses table */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden md:table-cell">Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.monthExpenses.length > 0 ? (
                  filteredData.monthExpenses.map((expense, index) => (
                    <TableRow key={expense.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="hidden md:table-cell">{expense.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Não há despesas registradas para este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
