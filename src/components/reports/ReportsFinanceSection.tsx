
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ReportsFinanceSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsFinanceSection({ selectedMonth, selectedYear }: ReportsFinanceSectionProps) {
  // Placeholder data - will be replaced with real data in the next phase
  const placeholderData = {
    totalRevenue: 5000,
    expectedRevenue: 8000,
    expenses: 2500,
    netProfit: 2500,
    expensesList: [
      { category: "Material de Consumo", value: 800, date: "05/05/2025", observations: "Produtos para manicure" },
      { category: "Aluguel", value: 1200, date: "01/05/2025", observations: "Aluguel do espaço" },
      { category: "Energia", value: 300, date: "10/05/2025", observations: "Conta de luz" },
      { category: "Água", value: 200, date: "15/05/2025", observations: "Conta de água" },
    ]
  };

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
                {formatCurrency(placeholderData.totalRevenue)}
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
                {formatCurrency(placeholderData.expectedRevenue)}
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
                {formatCurrency(placeholderData.expenses)}
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
                {formatCurrency(placeholderData.netProfit)}
              </div>
              <PiggyBank className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[280px] bg-muted rounded-2xl p-4 flex items-center justify-center text-muted-foreground">
            {/* // gráfico será integrado com dados reais na próxima etapa */}
            <p>Gráfico será integrado com dados reais na próxima etapa</p>
          </div>
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
                {placeholderData.expensesList.map((expense, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatCurrency(expense.value)}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{expense.observations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
