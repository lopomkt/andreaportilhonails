
import React, { useState, useMemo, useEffect } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------- DayLoader ----------
const DayLoader: React.FC = () => (
  <div className="w-full flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400"></div>
  </div>
);

// ---------- EmptyState ----------
const EmptyState: React.FC = () => (
  <div className="py-10 text-center text-gray-600 text-sm">
    Nenhum agendamento para este dia.
  </div>
);

// ---------- DayHeader ----------
interface DayHeaderProps {
  selectedDate: Date;
  setSelectedDate: (date: Date | ((prev: Date) => Date)) => void;
}
const DayHeader: React.FC<DayHeaderProps> = ({ selectedDate, setSelectedDate }) => {
  // Normalização robusta para evitar bugs de fuso
  const normalizedDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(12, 0, 0, 0);
    return d;
  }, [selectedDate]);

  // Responsividade
  const isMobile = window.innerWidth < 640;

  return (
    <div className="flex items-center justify-between gap-2 mb-3 w-full">
      <Button
        size="icon"
        variant="outline"
        aria-label="Dia anterior"
        onClick={() => setSelectedDate(prev => {
          const d = new Date(prev);
          d.setHours(12, 0, 0, 0);
          return addDays(d, -1);
        })}
      >
        <ArrowLeft className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      </Button>
      <div className="flex-1 min-w-0 text-center text-body font-medium truncate select-none px-1">
        {isMobile
          ? format(normalizedDate, "EEEE',' dd/MM", { locale: ptBR })
          : format(normalizedDate, "EEEE',' dd/MM/yyyy", { locale: ptBR })
        }
      </div>
      <Button
        size="icon"
        variant="outline"
        aria-label="Próximo dia"
        onClick={() => setSelectedDate(prev => {
          const d = new Date(prev);
          d.setHours(12, 0, 0, 0);
          return addDays(d, 1);
        })}
      >
        <ArrowRight className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      </Button>
    </div>
  );
};

// ---------- AppointmentList ----------
interface AppointmentListProps {
  appointments: Appointment[];
  onSuggestedTimeSelect?: (date: Date, time: string) => void;
}
const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, onSuggestedTimeSelect }) => (
  <div className="flex flex-col gap-3 w-full">
    {appointments.map(appt => (
      <div
        key={appt.id}
        className={cn(
          "bg-white border rounded-lg p-4 max-w-full min-w-0 shadow hover:shadow-md transition-shadow cursor-pointer",
          appt.status === "confirmed"
            ? "border-green-200"
            : appt.status === "pending"
            ? "border-amber-200"
            : "border-red-200"
        )}
        onClick={() => onSuggestedTimeSelect && 
          onSuggestedTimeSelect(
            new Date(appt.date),
            format(new Date(appt.date), "HH:mm")
          )
        }
      >
        <div className="flex flex-col md:flex-row md:justify-between gap-2">
          <div>
            <div className="font-semibold text-base truncate">{appt.client?.name || "Cliente"}</div>
            <div className="text-xs text-muted-foreground truncate">{appt.service?.name || "Serviço"}</div>
          </div>
          <div>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded",
              appt.status === "confirmed"
                ? "bg-green-100 text-green-800"
                : appt.status === "pending"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            )}>
              {appt.status === "confirmed"
                ? "Confirmado"
                : appt.status === "pending"
                ? "Pendente"
                : "Cancelado"
              }
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {format(new Date(appt.date), "HH:mm")}
            {appt.endTime && (
              <> - {format(new Date(appt.endTime), "HH:mm")}</>
            )}
          </span>
        </div>
        {appt.notes && (
          <div className="mt-1 text-xs italic text-gray-600">{appt.notes}</div>
        )}
      </div>
    ))}
  </div>
);

// ---------- Main DayView ----------
export interface DayViewProps {
  date: Date;
  onDaySelect?: (date: Date) => void;
  onSuggestedTimeSelect?: (date: Date, time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  onDaySelect,
  onSuggestedTimeSelect
}) => {
  // Normalização segura da data selecionada
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  });

  const { getAppointmentsForDate, loading } = useSupabaseData();

  // Quando selectedDate ou data externa muda, normaliza e dispara navegação
  useEffect(() => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    setSelectedDate(normalized);
  }, [date]);

  // Sempre que selectedDate mudar, navegação sincroniza para fora se onDaySelect for passado
  useEffect(() => {
    if (onDaySelect) onDaySelect(selectedDate);
  }, [selectedDate]);

  // Extrai agendamentos do hook/context e filtra apenas do dia normalizado
  const appointments = useMemo(() => {
    return getAppointmentsForDate(selectedDate) || [];
  }, [getAppointmentsForDate, selectedDate]);

  // Responsividade: impede overflow e quebra
  return (
    <div className="w-full max-w-2xl mx-auto px-2 pt-4 flex flex-col min-h-[250px]">
      {/* Header e navegação */}
      <DayHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* Loader */}
      {loading && <DayLoader />}

      {/* Lista de agendamentos ou estado vazio */}
      {!loading && (
        appointments.length > 0
          ? <AppointmentList 
              appointments={appointments} 
              onSuggestedTimeSelect={onSuggestedTimeSelect}
            />
          : <EmptyState />
      )}
    </div>
  );
};
