
import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsFinanceSection } from "@/components/reports/ReportsFinanceSection";
import { ReportsServicesSection } from "@/components/reports/ReportsServicesSection";
import { MonthYearFilter } from "@/components/reports/filters/MonthYearFilter";
import { normalizeDateNoon } from "@/lib/dateUtils";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export default function ReportsPage() {
  const { handleError } = useErrorHandler();
  
  // Current month and year for filters with safe initialization
  const currentDate = useMemo(() => normalizeDateNoon(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Handle month and year changes with validation
  const handleMonthChange = (month: number) => {
    try {
      if (month >= 0 && month <= 11) {
        setSelectedMonth(month);
      } else {
        throw new Error('Mês inválido selecionado');
      }
    } catch (error) {
      handleError(error, 'Erro ao alterar mês');
    }
  };
  
  const handleYearChange = (year: number) => {
    try {
      const currentYear = new Date().getFullYear();
      if (year >= 2020 && year <= currentYear + 1) {
        setSelectedYear(year);
      } else {
        throw new Error('Ano inválido selecionado');
      }
    } catch (error) {
      handleError(error, 'Erro ao alterar ano');
    }
  };

  // Reset to current month/year on component mount
  useEffect(() => {
    const current = normalizeDateNoon(new Date());
    setSelectedMonth(current.getMonth());
    setSelectedYear(current.getFullYear());
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 animate-fade-in overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Relatórios</h2>
        
        <div className="w-full sm:w-auto">
          <MonthYearFilter 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
          />
        </div>
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4 w-full">
          <ReportsFinanceSection 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4 w-full">
          <ReportsServicesSection 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
