
import { formatCurrency } from "@/lib/formatters";
import { BadgeDollarSign, DollarSign, Wallet, Users } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface RevenueStatsProps {
  monthlyAppointmentsCount: number;
  dashboardStats: {
    monthRevenue: number;
  };
  projectedRevenue: number;
  averageClientValue: number;
  avgClientsPerDay: number;
}

export const RevenueStats = ({
  monthlyAppointmentsCount,
  dashboardStats,
  projectedRevenue,
  averageClientValue,
  avgClientsPerDay,
}: RevenueStatsProps) => {
  return (
    <>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard
          title="Total do Mês"
          value={`${monthlyAppointmentsCount} agendamentos`}
          icon={DollarSign}
          description={`Faturamento: ${formatCurrency(dashboardStats.monthRevenue)}`}
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
        
        <StatsCard
          title="Receita Prevista"
          value={projectedRevenue > 0 ? formatCurrency(projectedRevenue) : "Sem previsões ainda 📅"}
          icon={BadgeDollarSign}
          description="agendamentos confirmados até o fim do mês"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatsCard
          title="Ticket Médio"
          value={formatCurrency(averageClientValue)}
          icon={Wallet}
          description="valor médio por cliente"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
        
        <StatsCard
          title="Média de Clientes por Dia"
          value={`${avgClientsPerDay} clientes`}
          icon={Users}
          description="média diária de atendimentos confirmados"
          className="bg-white border-rose-100 shadow-soft"
          iconClassName="text-rose-500"
        />
      </div>
    </>
  );
};
