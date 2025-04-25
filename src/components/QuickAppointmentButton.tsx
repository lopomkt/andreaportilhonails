
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentFormWrapper } from "./AppointmentFormWrapper";

export function QuickAppointmentButton() {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    // Hide button when a modal is open
    const updateButtonVisibility = () => {
      const button = document.querySelector('.fixed.bottom-6.right-6') as HTMLElement;
      if (button) {
        if (open) {
          button.style.opacity = '0';
          button.style.visibility = 'hidden';
        } else {
          setTimeout(() => {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
          }, 300);
        }
      }
    };
    
    updateButtonVisibility();
    
    // Also listen for other modals that might open
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const body = document.body;
          const isModalOpen = body.getAttribute('aria-hidden') === 'true';
          const button = document.querySelector('.fixed.bottom-6.right-6') as HTMLElement;
          
          if (button) {
            if (isModalOpen) {
              button.style.opacity = '0';
              button.style.visibility = 'hidden';
            } else {
              setTimeout(() => {
                button.style.opacity = '1';
                button.style.visibility = 'visible';
              }, 300);
            }
          }
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
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {open && (
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
                defaultDate={localStorage.getItem('defaultAppointmentDate')}
              />
            </AppointmentFormWrapper>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
