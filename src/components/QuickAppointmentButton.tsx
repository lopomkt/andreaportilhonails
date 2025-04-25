
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
    if (open) {
      try {
        const storedDate = localStorage.getItem('defaultAppointmentDate');
        if (storedDate) {
          const parsedDate = new Date(storedDate);
          if (!isNaN(parsedDate.getTime())) {
            setInitialDate(parsedDate);
          }
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
  
  // Ensure the button remains visible
  useEffect(() => {
    const button = document.querySelector('.fixed.bottom-6.right-6') as HTMLElement;
    if (!button) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          button.style.visibility = 'visible';
          button.style.opacity = '1';
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Button
        id="quick-appointment-button"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-premium p-0 bg-rose-500 hover:bg-rose-600 transition-all duration-300 z-50"
        onClick={() => setOpen(true)}
        aria-label="Novo agendamento rápido"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">💅</span>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentFormWrapper>
            <AppointmentForm 
              onSuccess={() => setOpen(false)}
              initialDate={initialDate}
            />
          </AppointmentFormWrapper>
        </DialogContent>
      </Dialog>
    </>
  );
}
