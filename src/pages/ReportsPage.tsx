
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportsFinanceSection } from "@/components/reports/ReportsFinanceSection";
import { ReportsServicesSection } from "@/components/reports/ReportsServicesSection";

export default function ReportsPage() {
  // Current month and year for filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Generate months for select
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i, 1).toLocaleString("pt-BR", { month: "long" })
  }));
  
  // Generate years (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: currentDate.getFullYear() - i,
    label: `${currentDate.getFullYear() - i}`
  }));

  return (
    <div className="space-y-6 px-4 md:px-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        
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
                  {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
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
        </div>
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
