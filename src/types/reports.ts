
export interface ReportFilters {
  month: number;
  year: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  projectedRevenue: number;
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  revenue: number;
  averageDuration: number;
  cancelationRate: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  appointmentCount: number;
}
