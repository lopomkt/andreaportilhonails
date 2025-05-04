import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Wallet, ScissorsSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/formatters";

export default function ReportsPage() {
  // State for active tab management
  const [activeTab, setActiveTab] = useState<"financeiro" | "servicos">("financeiro");
  
  // State for month/year selection
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // State for service comparison date
  const [comparisonDate, setComparisonDate] = useState<Date | undefined>(new Date());
  
  // Generate months for select dropdown
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR })
  }));
  
  // Generate years (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: currentYear - i,
    label: `${currentYear - i}`
  }));

  // Sample data for expense list (to be replaced with real data in step 2)
  const expensesSample = [
    { name: "Produtos para Cabelo", value: 150.00, date: "01/05/2025" },
    { name: "Material de Limpeza", value: 75.50, date: "05/05/2025" },
    { name: "Aluguel", value: 1200.00, date: "10/05/2025" },
  ];
  
  // Sample data for services (to be replaced with real data in step 2)
  const servicesSample = [
    { name: "Unhas Decoradas", qty: 12, total: 600.00 },
    { name: "Corte Feminino", qty: 8, total: 400.00 },
    { name: "Hidratação", qty: 5, total: 250.00 },
    { name: "Coloração", qty: 3, total: 300.00 },
  ];
  
  // Render the Finance tab content
  const FinanceTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Cards Resumo (linha superior) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {/* // Dados serão conectados via DataContext na Etapa 2 */}
              {formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {/* // Dados serão conectados via DataContext na Etapa 2 */}
              0
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {/* // Dados serão conectados via DataContext na Etapa 2 */}
              {formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Receita Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {/* // Dados serão conectados via DataContext na Etapa 2 */}
              {formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de Receita Mensal */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Evolução de Receita Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[280px] bg-muted rounded-2xl p-4 flex items-center justify-center">
            {/* // Gráfico será inserido aqui na Etapa 2 */}
            <p className="text-muted-foreground">Gráfico de evolução mensal será exibido aqui</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Despesas */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow>
                  <TableHead className="font-bold">Nome</TableHead>
                  <TableHead className="font-bold">Valor</TableHead>
                  <TableHead className="font-bold">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* // Placeholder visual – não usar dados reais aqui */}
                {expensesSample.map((expense, index) => (
                  <TableRow key={index} className={index % 2 === 1 ? "bg-muted" : ""}>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{formatCurrency(expense.value)}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                  </TableRow>
                ))}
                {expensesSample.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhuma despesa registrada para o período selecionado
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

  // Render the Services tab content
  const ServicesTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Desempenho por Serviço</h2>
        
        <div className="w-full md:w-auto">
          <Calendar
            mode="single"
            selected={comparisonDate}
            onSelect={setComparisonDate}
            className="rounded-md border shadow-md"
          />
        </div>
      </div>
      
      {comparisonDate && (
        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="text-sm">
            {/* // Lógica de comparação automática será implementada manualmente após Etapa 2 */}
            Comparando com o período de 01/04/2025 até 04/04/2025
          </p>
        </div>
      )}
      
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScissorsSquare className="h-5 w-5" />
            Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow>
                  <TableHead className="font-bold">Serviço</TableHead>
                  <TableHead className="font-bold">Qtd Vendida</TableHead>
                  <TableHead className="font-bold">Total Gerado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* // Placeholder visual – não usar dados reais aqui */}
                {servicesSample.map((service, index) => (
                  <TableRow key={index} className={index % 2 === 1 ? "bg-muted" : ""}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.qty}</TableCell>
                    <TableCell>{formatCurrency(service.total)}</TableCell>
                  </TableRow>
                ))}
                {servicesSample.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhum serviço no período selecionado
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

  return (
    <div className="space-y-6 px-4 md:px-6 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[120px]">
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
        </div>
      </div>

      <Tabs defaultValue="financeiro" onValueChange={(value) => setActiveTab(value as "financeiro" | "servicos")} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6" role="tablist">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>
        
        <div role="tabpanel" aria-label="Conteúdo do painel financeiro">
          {activeTab === 'financeiro' && <FinanceTab />}
        </div>
        
        <div role="tabpanel" aria-label="Conteúdo do painel de serviços">
          {activeTab === 'servicos' && <ServicesTab />}
        </div>
      </Tabs>
    </div>
  );
}
