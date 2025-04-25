
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentFormWrapper } from "./AppointmentFormWrapper";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function QuickAppointmentButton() {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  
  // Effect to handle default appointment date from localStorage
  useEffect(() => {
    if (open) {
      try {
        const storedDate = localStorage.getItem('defaultAppointmentDate');
        if (storedDate) {
          const parsedDate = new Date(storedDate);
          // Check if date is valid
          if (!isNaN(parsedDate.getTime())) {
            setInitialDate(parsedDate);
          }
          // Clean up localStorage after retrieving
          localStorage.removeItem('defaultAppointmentDate');
        } else {
          setInitialDate(undefined);
        }
      } catch (error) {
        console.error("Erro ao analisar a data armazenada:", error);
        setInitialDate(undefined);
      }
    }
  }, [open]); // Dependency on 'open' to execute when modal is opened

  // Effect to handle button visibility
  useEffect(() => {
    const button = document.querySelector('.fixed.bottom-6.right-6') as HTMLElement;
    if (!button) return;
    
    const updateButtonVisibility = (isHidden: boolean) => {
      if (isHidden) {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      } else {
        setTimeout(() => {
          button.style.opacity = '1';
          button.style.visibility = 'visible';
        }, 300);
      }
    };
    
    // Update based on current open state
    updateButtonVisibility(open);
    
    // Observer for other modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const body = document.body;
          const isModalOpen = body.getAttribute('aria-hidden') === 'true';
          updateButtonVisibility(isModalOpen);
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, [open]);
  
  return (
    <>
      <Button
        id="quick-appointment-button"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-premium p-0 bg-rose-500 hover:bg-rose-600 transition-all duration-300"
        onClick={() => setOpen(true)}
        style={{ 
          zIndex: 100,
          transition: 'opacity 0.3s ease, visibility 0.3s ease'
        }}
        aria-label="Novo agendamento rápido"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
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
