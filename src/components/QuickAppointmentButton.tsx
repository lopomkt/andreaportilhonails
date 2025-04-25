
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentFormWrapper } from "./AppointmentFormWrapper";

export function QuickAppointmentButton() {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    // Quando o modal é aberto, verificamos se há uma data armazenada no localStorage
    if (open) {
      try {
        const storedDate = localStorage.getItem('defaultAppointmentDate');
        if (storedDate) {
          const parsedDate = new Date(storedDate);
          if (!isNaN(parsedDate.getTime())) {
            setInitialDate(parsedDate);
          }
          // Limpar após uso
          localStorage.removeItem('defaultAppointmentDate');
        } else {
          setInitialDate(undefined);
        }
      } catch (error) {
        console.error("Erro ao analisar a data armazenada:", error);
        setInitialDate(undefined);
      }
    }
  }, [open]);

  // Expose method to open the dialog through window object
  useEffect(() => {
    // Create a global function that can be called from anywhere
    window.openQuickAppointmentModal = (defaultDate?: Date) => {
      if (defaultDate) {
        localStorage.setItem('defaultAppointmentDate', defaultDate.toISOString());
      } else {
        localStorage.removeItem('defaultAppointmentDate');
      }
      setOpen(true);
    };
    return () => {
      // Clean up when component unmounts
      delete window.openQuickAppointmentModal;
    };
  }, []);
  
  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-10"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <span className="mr-2">💅</span>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentFormWrapper>
            <AppointmentForm onSuccess={() => setOpen(false)} initialDate={initialDate} />
          </AppointmentFormWrapper>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Adicionar a declaração global do tipo para TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
