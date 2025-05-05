
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, Scissors } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";

interface ReportsServicesSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsServicesSection({ selectedMonth, selectedYear }: ReportsServicesSectionProps) {
  // Placeholder data - will be replaced with real data in the next phase
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const placeholderServices = [
    { name: "Manicure Simples", quantity: 15, totalRevenue: 750 },
    { name: "Pedicure", quantity: 12, totalRevenue: 840 },
    { name: "Unhas Decoradas", quantity: 8, totalRevenue: 640 },
    { name: "Manutenção", quantity: 20, totalRevenue: 1200 },
    { name: "Esmaltação em Gel", quantity: 10, totalRevenue: 700 },
  ];
  
  const comparisonDate = date ? format(date, "dd/MM/yyyy") : "";
  const previousPeriodStart = "01/04/2025";
  const previousPeriodEnd = "04/04/2025";

  return (
    <div className="space-y-6">
      {/* Services performance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Desempenho por Serviço
        </h3>
        
        {/* Date comparison selector */}
        <div className="flex flex-col items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <div className="text-xs text-muted-foreground">
            {/* // comparativo com mês anterior será implementado manualmente após esta etapa */}
            Comparando com o período de {previousPeriodStart} até {previousPeriodEnd}
          </div>
        </div>
      </div>
      
      {/* Services table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
                <TableHead className="text-right">Total Gerado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderServices.map((service, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-right">{service.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(service.totalRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Services comparison placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo com Período Anterior</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground">
          <p>Comparativo com mês anterior será implementado manualmente após esta etapa</p>
        </CardContent>
      </Card>
    </div>
  );
}
