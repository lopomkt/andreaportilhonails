
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useEffect, useState, useMemo } from "react";
import { Appointment, Service } from "@/types";
import { useDashboardStats } from "@/hooks/useDashboardStats";

interface ServiceTimeStats {
  serviceId: string;
  serviceName: string;
  averageTime: number; // in minutes
  scheduledTime: number; // in minutes
  appointmentCount: number;
}

export function ServiceTimeStatistics() {
  const { appointments, services } = useData();
  const { serviceTimeStats } = useDashboardStats();
  
  // Format minutes to hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    }
    
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };
  
  // Calculate time difference indicator
  const getTimeDifferenceClass = (average: number, scheduled: number) => {
    const diff = average - scheduled;
    if (diff > 10) return "text-red-600"; // Taking longer than scheduled
    if (diff < -10) return "text-green-600"; // Taking less time than scheduled
    return "text-amber-600"; // Close to scheduled time
  };
  
  const getTimeDifferenceIcon = (average: number, scheduled: number) => {
    const diff = average - scheduled;
    if (diff > 10) return "⏰"; // Taking longer than scheduled
    if (diff < -10) return "✅"; // Taking less time than scheduled
    return "👌"; // Close to scheduled time
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl text-rose-700">
          <Clock className="mr-2 h-5 w-5" />
          Estatística de Tempo por Serviço
        </CardTitle>
        <CardDescription>
          Tempo médio real de execução comparado ao programado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serviceTimeStats && serviceTimeStats.length > 0 ? (
          <div className="space-y-4">
            {serviceTimeStats.map((stat) => (
              <div 
                key={stat.serviceId} 
                className="p-4 rounded-xl bg-rose-50 border border-rose-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{stat.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Baseado em {stat.appointmentCount} atendimento{stat.appointmentCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Tempo programado</p>
                    <p className="font-medium">{formatTime(stat.scheduledTime)}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-rose-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {getTimeDifferenceIcon(stat.averageTime, stat.scheduledTime)}
                    </span>
                    <div>
                      <p className="text-sm font-medium">Tempo médio real</p>
                      <p className={`font-bold ${getTimeDifferenceClass(stat.averageTime, stat.scheduledTime)}`}>
                        {formatTime(stat.averageTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">Diferença</p>
                    <p className={`font-medium ${getTimeDifferenceClass(stat.averageTime, stat.scheduledTime)}`}>
                      {stat.averageTime > stat.scheduledTime ? '+' : ''}
                      {formatTime(stat.averageTime - stat.scheduledTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-rose-200 mb-2" />
            <p className="text-muted-foreground">Ainda não há dados suficientes para calcular as estatísticas de tempo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
