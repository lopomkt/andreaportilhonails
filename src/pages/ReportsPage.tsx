
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsFinanceSection } from "@/components/reports/ReportsFinanceSection";
import { ReportsServicesSection } from "@/components/reports/ReportsServicesSection";
import { MonthYearFilter } from "@/components/reports/filters/MonthYearFilter";
import { createDateWithNoon, normalizeDateNoon } from "@/lib/dateUtils";

export default function ReportsPage() {
  // Current month and year for filters
  const currentDate = normalizeDateNoon(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Handle month and year changes
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };
  
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6 px-4 md:px-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        
        <MonthYearFilter 
          selectedMonth={selectedMonth} 
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
          <ReportsFinanceSection 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4">
          <ReportsServicesSection 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
